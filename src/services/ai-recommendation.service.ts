import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import {
  CustomerBehaviorData,
  RecommendationType,
  RecommendationStatus,
  ICustomerRecommendation,
} from "../types/recommendation.type";

interface AIRecommendationResponse {
  recommendations: Array<{
    recommendation_type: string;
    priority_score: number;
    reasons: string[];
    suggested_actions: string[];
    customer_insights: {
      purchase_frequency: string;
      churn_risk_score: number;
      engagement_level: string;
    };
    ai_analysis: {
      behavioral_pattern: string;
      predicted_next_purchase_window: string;
      personalization_notes: string;
    };
  }>;
}

interface AIProductResponse {
  products: string[];
}

export class AIRecommendationService {
  private llm: ChatOpenAI;
  private outputParser: StringOutputParser;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini", // Cost-effective model for recommendations
      temperature: 0.3, // Lower temperature for more consistent recommendations
      maxTokens: 1500,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    this.outputParser = new StringOutputParser();
  }

  /**
   * Generate AI-powered customer recommendations
   */
  async generateRecommendations(
    behaviorData: CustomerBehaviorData,
  ): Promise<Partial<ICustomerRecommendation>[]> {
    try {
      // Create the analysis prompt
      const analysisPrompt = PromptTemplate.fromTemplate(`
        You are an expert e-commerce customer analyst for a furniture store. Analyze the following customer behavior data and provide actionable remarketing recommendations.

        Customer Data:
        - Customer ID: {customer_id}
        - Total Orders: {orderCount}
        - Total Spent: ${behaviorData.totalSpent}
        - Average Order Value: ${behaviorData.averageOrderValue}
        - Days Since Last Order: {daysSinceLastOrder}
        - Purchase Frequency: {purchaseFrequency} orders per month
        - Customer Lifetime Value: ${behaviorData.customerLifetimeValue}
        - Favorite Categories: {favoriteCategories}
        - Monthly Spending Trend: {monthlySpending}
        - Seasonal Patterns: {seasonalPatterns}

        Based on this data, provide recommendations in the following JSON format:
        {{
          "recommendations": [
            {{
              "recommendation_type": "churn_risk|win_back|upsell|cross_sell|loyalty_reward|first_time_buyer|high_value_inactive",
              "priority_score": 1-100,
              "reasons": ["reason1", "reason2", "reason3"],
              "suggested_actions": ["action1", "action2", "action3"],
              "customer_insights": {{
                "purchase_frequency": "high|medium|low",
                "churn_risk_score": 1-100,
                "engagement_level": "high|medium|low|dormant"
              }},
              "ai_analysis": {{
                "behavioral_pattern": "description of customer behavior pattern",
                "predicted_next_purchase_window": "timeframe prediction",
                "personalization_notes": "specific personalization recommendations"
              }}
            }}
          ]
        }}

        Guidelines:
        1. Generate 1-3 recommendations per customer based on their behavior
        2. Priority score should reflect urgency and potential impact
        3. Be specific with reasons and actions
        4. Consider furniture industry specifics (seasonal trends, room completion, lifecycle events)
        5. Focus on actionable insights that can drive sales

        Recommendation Types:
        - churn_risk: Customers likely to stop purchasing
        - win_back: Inactive customers to re-engage
        - upsell: Customers ready for higher-value purchases
        - cross_sell: Customers who might buy complementary items
        - loyalty_reward: High-value customers to retain
        - first_time_buyer: New customers needing nurturing
        - high_value_inactive: Valuable customers who've gone quiet
      `);

      // Create the chain
      const chain = RunnableSequence.from([
        analysisPrompt,
        this.llm,
        this.outputParser,
      ]);

      // Prepare input data
      const input = {
        customer_id: behaviorData.customer_id,
        orderCount: behaviorData.orderCount.toString(),
        totalSpent: behaviorData.totalSpent.toFixed(2),
        averageOrderValue: behaviorData.averageOrderValue.toFixed(2),
        daysSinceLastOrder:
          behaviorData.daysSinceLastOrder?.toString() || "N/A",
        purchaseFrequency: behaviorData.purchaseFrequency.toFixed(2),
        customerLifetimeValue: behaviorData.customerLifetimeValue.toFixed(2),
        favoriteCategories: behaviorData.favoriteCategories
          .slice(0, 3)
          .map((cat) => `${cat.category} ($${cat.totalSpent.toFixed(2)})`)
          .join(", "),
        monthlySpending: behaviorData.orderTrends.monthlySpending
          .slice(-6)
          .map((trend) => `${trend.month}: $${trend.amount.toFixed(2)}`)
          .join(", "),
        seasonalPatterns: behaviorData.orderTrends.seasonalPatterns.join(", "),
      };

      // Generate recommendations
      const result = await chain.invoke(input);

      // Parse the JSON response
      const parsedResult = this.parseAIResponse(result);

      if (
        !parsedResult ||
        !("recommendations" in parsedResult) ||
        !parsedResult.recommendations
      ) {
        throw new Error("Invalid AI response format");
      }

      // Transform AI recommendations to our format
      return parsedResult.recommendations.map(
        (rec: AIRecommendationResponse["recommendations"][0]) => ({
          customer_id: behaviorData.customer_id,
          recommendation_type: rec.recommendation_type as RecommendationType,
          priority_score: rec.priority_score,
          reasons: rec.reasons,
          suggested_actions: rec.suggested_actions,
          customer_insights: {
            total_orders: behaviorData.orderCount,
            total_spent: behaviorData.totalSpent,
            last_order_date: behaviorData.lastOrderDate,
            days_since_last_order: behaviorData.daysSinceLastOrder,
            average_order_value: behaviorData.averageOrderValue,
            favorite_categories: behaviorData.favoriteCategories
              .slice(0, 3)
              .map((cat) => cat.category),
            purchase_frequency: rec.customer_insights.purchase_frequency,
            customer_lifetime_value: behaviorData.customerLifetimeValue,
            churn_risk_score: rec.customer_insights.churn_risk_score,
          },
          ai_analysis: {
            behavioral_pattern: rec.ai_analysis.behavioral_pattern,
            engagement_level: rec.customer_insights.engagement_level,
            predicted_next_purchase_window:
              rec.ai_analysis.predicted_next_purchase_window,
            recommended_products: [], // Will be populated by product recommendation service
            personalization_notes: rec.ai_analysis.personalization_notes,
          },
          status: RecommendationStatus.ACTIVE,
          generated_at: new Date(),
          expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          last_updated: new Date(),
        }),
      );
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      throw error;
    }
  }

  /**
   * Generate product recommendations for a specific customer
   */
  async generateProductRecommendations(
    behaviorData: CustomerBehaviorData,
    recommendationType: RecommendationType,
  ): Promise<string[]> {
    try {
      const productPrompt = PromptTemplate.fromTemplate(`
        Based on the customer's purchase history and the recommendation type, suggest specific product categories or types that would be most relevant for remarketing.

        Customer Profile:
        - Favorite Categories: {favoriteCategories}
        - Average Order Value: ${behaviorData.averageOrderValue}
        - Seasonal Patterns: {seasonalPatterns}
        - Recent Purchase Trend: {recentTrend}

        Recommendation Type: {recommendationType}

        Provide 3-5 specific product suggestions in JSON format:
        {{
          "products": ["product_type_1", "product_type_2", "product_type_3"]
        }}

        Focus on furniture items that complement their purchase history and match the recommendation strategy.
      `);

      const chain = RunnableSequence.from([
        productPrompt,
        this.llm,
        this.outputParser,
      ]);

      const recentTrend =
        behaviorData.orderTrends.monthlySpending.length > 1
          ? behaviorData.orderTrends.monthlySpending
              .slice(-2)
              .reduce(
                (acc, curr, idx) =>
                  idx === 0 ? curr.amount : curr.amount - acc,
                0,
              ) > 0
            ? "increasing"
            : "decreasing"
          : "stable";

      const result = await chain.invoke({
        favoriteCategories: behaviorData.favoriteCategories
          .slice(0, 3)
          .map((cat) => cat.category)
          .join(", "),
        averageOrderValue: behaviorData.averageOrderValue.toFixed(2),
        seasonalPatterns: behaviorData.orderTrends.seasonalPatterns.join(", "),
        recentTrend,
        recommendationType,
      });

      const parsedResult = this.parseAIResponse(result);
      return parsedResult && "products" in parsedResult
        ? parsedResult.products
        : [];
    } catch (error) {
      console.error("Error generating product recommendations:", error);
      return [];
    }
  }

  /**
   * Parse AI response and handle potential JSON parsing errors
   */
  private parseAIResponse(
    response: string,
  ): AIRecommendationResponse | AIProductResponse | null {
    try {
      // Clean the response - remove any markdown formatting
      const cleanedResponse = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.error("Raw response:", response);

      // Try to extract JSON from the response using regex
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Failed to parse extracted JSON:", e);
        }
      }

      return null;
    }
  }

  /**
   * Validate that OpenAI API key is configured
   */
  validateConfiguration(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}
