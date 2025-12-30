import { Request, Response } from "express";
import { RecommendationSchedulerService } from "../services/recommendation-scheduler.service";
import { asyncHandler } from "../lib/asyncHandler";

// Initialize the recommendation scheduler service
const recommendationScheduler = new RecommendationSchedulerService();

// Get scheduler status
export const getSchedulerStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const status = recommendationScheduler.getStatus();

    res.status(200).json({
      success: true,
      data: status,
    });
  },
);

// Start the recommendation scheduler
export const startScheduler = asyncHandler(
  async (req: Request, res: Response) => {
    recommendationScheduler.start();

    res.status(200).json({
      success: true,
      message: "Recommendation scheduler started successfully",
      data: recommendationScheduler.getStatus(),
    });
  },
);

// Stop the recommendation scheduler
export const stopScheduler = asyncHandler(
  async (req: Request, res: Response) => {
    recommendationScheduler.stop();

    res.status(200).json({
      success: true,
      message: "Recommendation scheduler stopped successfully",
      data: recommendationScheduler.getStatus(),
    });
  },
);

// Manually trigger recommendation generation
export const triggerRecommendationGeneration = asyncHandler(
  async (req: Request, res: Response) => {
    const { force_refresh = false } = req.body;

    const result =
      await recommendationScheduler.triggerManualGeneration(force_refresh);

    res.status(200).json({
      success: true,
      message: "Recommendation generation triggered successfully",
      data: result,
    });
  },
);

// Update scheduler configuration
export const updateSchedulerConfig = asyncHandler(
  async (req: Request, res: Response) => {
    const { cron_expression } = req.body;

    if (!cron_expression) {
      res.status(400).json({
        success: false,
        message: "Cron expression is required",
      });
      return;
    }

    recommendationScheduler.updateSchedule(cron_expression);

    res.status(200).json({
      success: true,
      message: "Scheduler configuration updated successfully",
      data: recommendationScheduler.getStatus(),
    });
  },
);

// Export the scheduler instance for use in server initialization
export { recommendationScheduler };
