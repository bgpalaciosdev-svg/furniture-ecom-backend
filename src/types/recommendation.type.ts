import { IOrder } from "./order.type";

export interface ICustomerRecommendation {
  _id?: string;
  customer_id: string;
  customer_email?: string;
  customer_name?: string;
  recommendation_type: RecommendationType;
  priority_score: number;
  reasons: string[];
  suggested_actions: string[];
  customer_insights: {
    total_orders: number;
    total_spent: number;
    last_order_date?: Date;
    days_since_last_order?: number;
    average_order_value: number;
    favorite_categories: string[];
    purchase_frequency: string; // 'high', 'medium', 'low'
    customer_lifetime_value: number;
    churn_risk_score: number;
  };
  ai_analysis: {
    behavioral_pattern: string;
    engagement_level: string;
    predicted_next_purchase_window?: string;
    recommended_products?: string[];
    personalization_notes: string;
  };
  status: RecommendationStatus;
  generated_at: Date;
  expires_at: Date;
  last_updated: Date;
  created_at?: Date;
  updated_at?: Date;
}

export enum RecommendationType {
  CHURN_RISK = "churn_risk",
  WIN_BACK = "win_back",
  UPSELL = "upsell",
  CROSS_SELL = "cross_sell",
  LOYALTY_REWARD = "loyalty_reward",
  FIRST_TIME_BUYER = "first_time_buyer",
  HIGH_VALUE_INACTIVE = "high_value_inactive",
}

export enum RecommendationStatus {
  ACTIVE = "active",
  PROCESSED = "processed",
  EXPIRED = "expired",
  DISMISSED = "dismissed",
}

export interface CustomerBehaviorData {
  customer_id: string;
  orders: IOrder[];
  totalSpent: number;
  orderCount: number;
  lastOrderDate?: Date;
  daysSinceLastOrder?: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  favoriteCategories: { category: string; count: number; totalSpent: number }[];
  customerLifetimeValue: number;
  orderTrends: {
    monthlySpending: { month: string; amount: number }[];
    seasonalPatterns: string[];
  };
}

export interface RecommendationGenerationRequest {
  force_refresh?: boolean;
  customer_ids?: string[];
  recommendation_types?: RecommendationType[];
}
