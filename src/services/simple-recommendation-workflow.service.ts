import { CustomerBehaviorService } from "./customer-behavior.service";
import { AIRecommendationService } from "./ai-recommendation.service";
import CustomerRecommendation from "../db/models/recommendation.model";
import {
  RecommendationGenerationRequest,
  RecommendationType,
} from "../types/recommendation.type";

// Simple workflow state interface
interface WorkflowState {
  customer_ids: string[];
  current_index: number;
  processed_customers: string[];
  failed_customers: { customer_id: string; error: string }[];
  total_recommendations_generated: number;
  force_refresh: boolean;
  recommendation_types?: RecommendationType[];
}

export class SimpleRecommendationWorkflowService {
  private customerBehaviorService: CustomerBehaviorService;
  private aiRecommendationService: AIRecommendationService;

  constructor() {
    this.customerBehaviorService = new CustomerBehaviorService();
    this.aiRecommendationService = new AIRecommendationService();
  }

  /**
   * Execute the recommendation workflow
   */
  async executeWorkflow(request: RecommendationGenerationRequest = {}) {
    console.log("🚀 Starting recommendation generation workflow...");

    // Validate AI service configuration
    if (!this.aiRecommendationService.validateConfiguration()) {
      throw new Error(
        "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.",
      );
    }

    // Initialize state
    let customerIds = request.customer_ids || [];
    if (!customerIds || customerIds.length === 0) {
      customerIds =
        await this.customerBehaviorService.getAllCustomersForAnalysis();
    }

    const state: WorkflowState = {
      customer_ids: customerIds,
      current_index: 0,
      processed_customers: [],
      failed_customers: [],
      total_recommendations_generated: 0,
      force_refresh: request.force_refresh || false,
      recommendation_types: request.recommendation_types,
    };

    console.log(`📊 Found ${customerIds.length} customers to analyze`);

    // Process each customer
    for (let i = 0; i < state.customer_ids.length; i++) {
      state.current_index = i;
      const customerId = state.customer_ids[i];

      if (!customerId) {
        continue;
      }

      console.log(
        `🔍 Processing customer ${i + 1}/${state.customer_ids.length}: ${customerId}`,
      );

      try {
        // Check if we should skip this customer
        if (!state.force_refresh) {
          const existingRecommendations = await CustomerRecommendation.find({
            customer_id: customerId,
            status: "active",
            expires_at: { $gt: new Date() },
          });

          if (existingRecommendations.length > 0) {
            console.log(
              `⏭️  Skipping customer ${customerId} - active recommendations exist`,
            );
            state.processed_customers.push(customerId);
            continue;
          }
        }

        // Analyze customer behavior
        console.log(`📈 Analyzing behavior for customer: ${customerId}`);
        const behaviorData =
          await this.customerBehaviorService.analyzeCustomerBehavior(
            customerId,
          );

        if (!behaviorData) {
          console.log(`⚠️  No behavior data found for customer: ${customerId}`);
          state.failed_customers.push({
            customer_id: customerId,
            error: "No behavior data available",
          });
          continue;
        }

        // Generate AI recommendations
        console.log(
          `🤖 Generating AI recommendations for customer: ${customerId}`,
        );
        const recommendations =
          await this.aiRecommendationService.generateRecommendations(
            behaviorData,
          );

        // Filter recommendations by type if specified
        const filteredRecommendations = state.recommendation_types
          ? recommendations.filter((rec) =>
              state.recommendation_types!.includes(rec.recommendation_type!),
            )
          : recommendations;

        if (filteredRecommendations.length === 0) {
          console.log(
            `⚠️  No recommendations generated for customer: ${customerId}`,
          );
          continue;
        }

        // Save recommendations
        console.log(
          `💾 Saving ${filteredRecommendations.length} recommendations for customer: ${customerId}`,
        );

        // Get customer info for the recommendations
        const customerInfo =
          await this.customerBehaviorService.getCustomerInfo(customerId);

        // Remove existing active recommendations if force refresh
        if (state.force_refresh) {
          await CustomerRecommendation.updateMany(
            { customer_id: customerId, status: "active" },
            { status: "expired" },
          );
        }

        // Save new recommendations
        const savedRecommendations = [];
        for (const recommendation of filteredRecommendations) {
          const newRecommendation = new CustomerRecommendation({
            ...recommendation,
            customer_email: customerInfo?.email,
            customer_name: customerInfo
              ? `${customerInfo.first_name} ${customerInfo.last_name || ""}`.trim()
              : undefined,
          });

          const saved = await newRecommendation.save();
          savedRecommendations.push(saved);
        }

        console.log(
          `✅ Saved ${savedRecommendations.length} recommendations for customer: ${customerId}`,
        );

        state.processed_customers.push(customerId);
        state.total_recommendations_generated += savedRecommendations.length;
      } catch (error) {
        console.error(`❌ Error processing customer ${customerId}:`, error);
        state.failed_customers.push({
          customer_id: customerId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Finalize workflow
    console.log("🎉 Recommendation workflow completed!");
    console.log(`📊 Summary:`);
    console.log(
      `   - Total customers processed: ${state.processed_customers.length}`,
    );
    console.log(
      `   - Total recommendations generated: ${state.total_recommendations_generated}`,
    );
    console.log(`   - Failed customers: ${state.failed_customers.length}`);

    if (state.failed_customers.length > 0) {
      console.log("❌ Failed customers:");
      state.failed_customers.forEach((failure) => {
        console.log(`   - ${failure.customer_id}: ${failure.error}`);
      });
    }

    return {
      success: true,
      processed_customers: state.processed_customers,
      failed_customers: state.failed_customers,
      total_recommendations_generated: state.total_recommendations_generated,
    };
  }
}
