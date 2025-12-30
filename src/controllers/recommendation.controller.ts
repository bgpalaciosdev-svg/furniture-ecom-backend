import { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { SimpleRecommendationWorkflowService } from "../services/simple-recommendation-workflow.service";
import CustomerRecommendation from "../db/models/recommendation.model";
import {
  RecommendationType,
  RecommendationStatus,
} from "../types/recommendation.type";

// MongoDB filter type that supports query operators
interface RecommendationFilter {
  status?: RecommendationStatus;
  recommendation_type?: RecommendationType;
  priority_score?: {
    $gte?: number;
    $lte?: number;
  };
}

// MongoDB sort type
interface RecommendationSort {
  [key: string]: 1 | -1;
}

export class RecommendationController {
  private workflowService: SimpleRecommendationWorkflowService;

  constructor() {
    this.workflowService = new SimpleRecommendationWorkflowService();
  }

  /**
   * Generate recommendations for all customers or specific customers
   */
  generateRecommendations = asyncHandler(
    async (req: Request, res: Response) => {
      const {
        customer_ids,
        force_refresh = false,
        recommendation_types,
      } = req.body;

      try {
        const result = await this.workflowService.executeWorkflow({
          customer_ids,
          force_refresh,
          recommendation_types,
        });

        res.status(200).json({
          success: true,
          message: "Recommendations generated successfully",
          data: result,
        });
      } catch (error) {
        console.error("Error generating recommendations:", error);
        res.status(500).json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate recommendations",
        });
      }
    },
  );

  /**
   * Get all active recommendations with filtering and pagination
   */
  getRecommendations = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      recommendation_type,
      priority_min,
      priority_max,
      status = RecommendationStatus.ACTIVE,
      sort_by = "priority_score",
      sort_order = "desc",
    } = req.query;

    try {
      // Build filter query
      const filter: RecommendationFilter = {};

      if (status) {
        filter.status = status as RecommendationStatus;
      }

      if (recommendation_type) {
        filter.recommendation_type = recommendation_type as RecommendationType;
      }

      if (priority_min || priority_max) {
        filter.priority_score = {};
        if (priority_min) filter.priority_score.$gte = Number(priority_min);
        if (priority_max) filter.priority_score.$lte = Number(priority_max);
      }

      // Build sort query
      const sortQuery: RecommendationSort = {};
      sortQuery[sort_by as string] = sort_order === "desc" ? -1 : 1;

      // Execute query with pagination
      const skip = (Number(page) - 1) * Number(limit);

      const [recommendations, total] = await Promise.all([
        CustomerRecommendation.find(filter)
          .sort(sortQuery)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        CustomerRecommendation.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          recommendations,
          pagination: {
            current_page: Number(page),
            total_pages: Math.ceil(total / Number(limit)),
            total_items: total,
            items_per_page: Number(limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch recommendations",
      });
    }
  });

  /**
   * Get recommendations for a specific customer
   */
  getCustomerRecommendations = asyncHandler(
    async (req: Request, res: Response) => {
      const { customer_id } = req.params;
      const { status = RecommendationStatus.ACTIVE } = req.query;

      try {
        const recommendations = await CustomerRecommendation.find({
          customer_id,
          status,
        })
          .sort({ priority_score: -1 })
          .lean();

        res.status(200).json({
          success: true,
          data: {
            customer_id,
            recommendations,
          },
        });
      } catch (error) {
        console.error("Error fetching customer recommendations:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch customer recommendations",
        });
      }
    },
  );

  /**
   * Update recommendation status (mark as processed, dismissed, etc.)
   */
  updateRecommendationStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const { recommendation_id } = req.params;
      const { status, notes } = req.body;

      try {
        const recommendation = await CustomerRecommendation.findByIdAndUpdate(
          recommendation_id,
          {
            status,
            last_updated: new Date(),
            ...(notes && { "ai_analysis.personalization_notes": notes }),
          },
          { new: true },
        );

        if (!recommendation) {
          res.status(404).json({
            success: false,
            message: "Recommendation not found",
          });
          return;
        }

        res.status(200).json({
          success: true,
          message: "Recommendation status updated successfully",
          data: recommendation,
        });
      } catch (error) {
        console.error("Error updating recommendation status:", error);
        res.status(500).json({
          success: false,
          message: "Failed to update recommendation status",
        });
      }
    },
  );

  /**
   * Get recommendation analytics and insights
   */
  getRecommendationAnalytics = asyncHandler(
    async (req: Request, res: Response) => {
      try {
        // Get recommendation statistics
        const [
          totalRecommendations,
          activeRecommendations,
          processedRecommendations,
          recommendationsByType,
          priorityDistribution,
          recentActivity,
        ] = await Promise.all([
          CustomerRecommendation.countDocuments(),
          CustomerRecommendation.countDocuments({
            status: RecommendationStatus.ACTIVE,
          }),
          CustomerRecommendation.countDocuments({
            status: RecommendationStatus.PROCESSED,
          }),
          CustomerRecommendation.aggregate([
            { $group: { _id: "$recommendation_type", count: { $sum: 1 } } },
          ]),
          CustomerRecommendation.aggregate([
            {
              $bucket: {
                groupBy: "$priority_score",
                boundaries: [0, 25, 50, 75, 100],
                default: "other",
                output: { count: { $sum: 1 } },
              },
            },
          ]),
          CustomerRecommendation.find({ status: RecommendationStatus.ACTIVE })
            .sort({ generated_at: -1 })
            .limit(10)
            .select(
              "customer_id customer_name recommendation_type priority_score generated_at",
            )
            .lean(),
        ]);

        // Calculate average priority score
        const avgPriorityResult = await CustomerRecommendation.aggregate([
          { $group: { _id: null, avgPriority: { $avg: "$priority_score" } } },
        ]);
        const avgPriority = avgPriorityResult[0]?.avgPriority || 0;

        // Get top customers by recommendation count
        const topCustomers = await CustomerRecommendation.aggregate([
          { $match: { status: RecommendationStatus.ACTIVE } },
          {
            $group: {
              _id: "$customer_id",
              customer_name: { $first: "$customer_name" },
              recommendation_count: { $sum: 1 },
              avg_priority: { $avg: "$priority_score" },
              total_clv: {
                $first: "$customer_insights.customer_lifetime_value",
              },
            },
          },
          { $sort: { recommendation_count: -1 } },
          { $limit: 10 },
        ]);

        res.status(200).json({
          success: true,
          data: {
            overview: {
              total_recommendations: totalRecommendations,
              active_recommendations: activeRecommendations,
              processed_recommendations: processedRecommendations,
              average_priority_score: Math.round(avgPriority * 100) / 100,
            },
            recommendations_by_type: recommendationsByType,
            priority_distribution: priorityDistribution,
            top_customers: topCustomers,
            recent_activity: recentActivity,
          },
        });
      } catch (error) {
        console.error("Error fetching recommendation analytics:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch recommendation analytics",
        });
      }
    },
  );

  /**
   * Delete expired recommendations
   */
  cleanupExpiredRecommendations = asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const result = await CustomerRecommendation.deleteMany({
          expires_at: { $lt: new Date() },
          status: {
            $in: [RecommendationStatus.EXPIRED, RecommendationStatus.DISMISSED],
          },
        });

        res.status(200).json({
          success: true,
          message: `Cleaned up ${result.deletedCount} expired recommendations`,
          data: {
            deleted_count: result.deletedCount,
          },
        });
      } catch (error) {
        console.error("Error cleaning up expired recommendations:", error);
        res.status(500).json({
          success: false,
          message: "Failed to cleanup expired recommendations",
        });
      }
    },
  );

  /**
   * Get recommendation system status
   */
  getSystemStatus = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if OpenAI API key is configured
      const isAIConfigured = !!process.env.OPENAI_API_KEY;

      // Get last generation timestamp
      const lastGeneration = await CustomerRecommendation.findOne()
        .sort({ generated_at: -1 })
        .select("generated_at")
        .lean();

      // Count active recommendations expiring soon (within 24 hours)
      const expiringSoon = await CustomerRecommendation.countDocuments({
        status: RecommendationStatus.ACTIVE,
        expires_at: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      res.status(200).json({
        success: true,
        data: {
          ai_configured: isAIConfigured,
          last_generation: lastGeneration?.generated_at,
          recommendations_expiring_soon: expiringSoon,
          system_healthy: isAIConfigured && expiringSoon < 100, // Simple health check
        },
      });
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get system status",
      });
    }
  });
}
