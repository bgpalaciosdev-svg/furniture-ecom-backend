import User from "../db/models/user.model";
import Order from "../db/models/order.model";
import Product from "../db/models/product.model";
import { CustomerBehaviorData } from "../types/recommendation.type";
import { OrderStatus, IOrder } from "../types/order.type";

export class CustomerBehaviorService {
  /**
   * Analyzes customer behavior and returns comprehensive data for AI processing
   */
  async analyzeCustomerBehavior(
    customerId: string,
  ): Promise<CustomerBehaviorData | null> {
    try {
      // Get customer orders
      const orders = await Order.find({
        customer_id: customerId,
        status: { $in: [OrderStatus.DELIVERED] },
      })
        .sort({ created_at: -1 })
        .lean();

      if (orders.length === 0) {
        return null; // No completed orders to analyze
      }

      // Calculate basic metrics
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
      const orderCount = orders.length;
      const lastOrderDate = orders[0].created_at
        ? new Date(orders[0].created_at)
        : new Date();
      const daysSinceLastOrder = Math.floor(
        (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const averageOrderValue = totalSpent / orderCount;

      // Calculate purchase frequency (orders per month)
      const firstOrderCreatedAt = orders[orders.length - 1].created_at;
      const firstOrderDate = firstOrderCreatedAt
        ? new Date(firstOrderCreatedAt)
        : new Date();
      const monthsActive = Math.max(
        1,
        (Date.now() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );
      const purchaseFrequency = orderCount / monthsActive;

      // Analyze favorite categories
      const categoryStats = new Map<
        string,
        { count: number; totalSpent: number }
      >();

      for (const order of orders) {
        for (const item of order.items) {
          // Get product category
          const product = await Product.findById(item.product_id)
            .select("category_id")
            .lean();
          if (product) {
            const categoryId = product.category_id;
            const existing = categoryStats.get(categoryId) || {
              count: 0,
              totalSpent: 0,
            };
            categoryStats.set(categoryId, {
              count: existing.count + item.quantity,
              totalSpent: existing.totalSpent + item.price * item.quantity,
            });
          }
        }
      }

      const favoriteCategories = Array.from(categoryStats.entries())
        .map(([category, stats]) => ({ category, ...stats }))
        .sort((a, b) => b.totalSpent - a.totalSpent);

      // Calculate monthly spending trends
      const monthlySpending = this.calculateMonthlySpending(orders);

      // Calculate customer lifetime value (simple prediction based on current trends)
      const customerLifetimeValue = this.calculateCLV(
        totalSpent,
        purchaseFrequency,
        daysSinceLastOrder,
      );

      // Detect seasonal patterns
      const seasonalPatterns = this.detectSeasonalPatterns(orders);

      return {
        customer_id: customerId,
        orders,
        totalSpent,
        orderCount,
        lastOrderDate,
        daysSinceLastOrder,
        averageOrderValue,
        purchaseFrequency,
        favoriteCategories,
        customerLifetimeValue,
        orderTrends: {
          monthlySpending,
          seasonalPatterns,
        },
      };
    } catch (error) {
      console.error(
        `Error analyzing customer behavior for ${customerId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get all customers for batch analysis
   */
  async getAllCustomersForAnalysis(): Promise<string[]> {
    try {
      // Get all customers who have made at least one order
      const customerIds = await Order.distinct("customer_id", {
        customer_id: { $exists: true, $ne: null },
        status: { $in: [OrderStatus.DELIVERED] },
      });

      return customerIds.filter((id) => id); // Remove any null/undefined values
    } catch (error) {
      console.error("Error getting customers for analysis:", error);
      return [];
    }
  }

  /**
   * Calculate monthly spending trends
   */
  private calculateMonthlySpending(
    orders: IOrder[],
  ): { month: string; amount: number }[] {
    const monthlyData = new Map<string, number>();

    orders.forEach((order) => {
      const date = new Date(order.created_at || Date.now());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + order.total);
    });

    return Array.from(monthlyData.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Simple CLV calculation
   */
  private calculateCLV(
    totalSpent: number,
    purchaseFrequency: number,
    daysSinceLastOrder: number,
  ): number {
    // Simple CLV = (Average Order Value) × (Purchase Frequency) × (Customer Lifespan)
    // We'll estimate lifespan based on engagement
    const engagementMultiplier =
      daysSinceLastOrder < 30
        ? 2.5
        : daysSinceLastOrder < 90
          ? 1.8
          : daysSinceLastOrder < 180
            ? 1.2
            : 0.8;

    const estimatedLifespanMonths = Math.max(
      12,
      purchaseFrequency * 24 * engagementMultiplier,
    );
    const monthlyValue =
      (totalSpent / Math.max(1, purchaseFrequency)) * (purchaseFrequency / 12);

    return monthlyValue * estimatedLifespanMonths;
  }

  /**
   * Detect seasonal purchasing patterns
   */
  private detectSeasonalPatterns(orders: IOrder[]): string[] {
    const seasonalData = {
      spring: 0, // Mar, Apr, May
      summer: 0, // Jun, Jul, Aug
      fall: 0, // Sep, Oct, Nov
      winter: 0, // Dec, Jan, Feb
    };

    orders.forEach((order) => {
      const month = new Date(order.created_at || Date.now()).getMonth();
      if (month >= 2 && month <= 4) seasonalData.spring += order.total;
      else if (month >= 5 && month <= 7) seasonalData.summer += order.total;
      else if (month >= 8 && month <= 10) seasonalData.fall += order.total;
      else seasonalData.winter += order.total;
    });

    // Find dominant seasons (above average spending)
    const totalSpending = Object.values(seasonalData).reduce(
      (sum, val) => sum + val,
      0,
    );
    const averageSeasonalSpending = totalSpending / 4;

    const patterns: string[] = [];
    Object.entries(seasonalData).forEach(([season, spending]) => {
      if (spending > averageSeasonalSpending * 1.2) {
        patterns.push(season);
      }
    });

    return patterns.length > 0 ? patterns : ["year-round"];
  }

  /**
   * Get customer basic info
   */
  async getCustomerInfo(customerId: string) {
    try {
      const customer = await User.findById(customerId)
        .select("first_name last_name email")
        .lean();
      return customer;
    } catch (error) {
      console.error(`Error getting customer info for ${customerId}:`, error);
      return null;
    }
  }
}
