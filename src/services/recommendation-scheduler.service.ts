import * as cron from "node-cron";
import { SimpleRecommendationWorkflowService } from "./simple-recommendation-workflow.service";
import CustomerRecommendation from "../db/models/recommendation.model";
import { RecommendationStatus } from "../types/recommendation.type";

// Type for workflow execution result
interface WorkflowExecutionResult {
  success: boolean;
  processed_customers: string[];
  failed_customers: { customer_id: string; error: string }[];
  total_recommendations_generated: number;
}

export class RecommendationSchedulerService {
  private workflowService: SimpleRecommendationWorkflowService;
  private isRunning: boolean = false;
  private scheduledTask: cron.ScheduledTask | null = null;

  constructor() {
    this.workflowService = new SimpleRecommendationWorkflowService();
  }

  /**
   * Start the recommendation scheduler
   * Runs every 2 days at 2:00 AM
   */
  start(): void {
    if (this.scheduledTask) {
      console.log("⚠️  Recommendation scheduler is already running");
      return;
    }

    // Schedule to run every 2 days at 2:00 AM
    // Cron pattern: "0 2 */2 * *" (minute hour day month dayOfWeek)
    this.scheduledTask = cron.schedule(
      "0 2 */2 * *",
      async () => {
        await this.executeScheduledRecommendationGeneration();
      },
      {
        timezone: "America/New_York", // Adjust timezone as needed
      },
    );

    console.log(
      "🕒 Recommendation scheduler started - will run every 2 days at 2:00 AM",
    );
  }

  /**
   * Stop the recommendation scheduler
   */
  stop(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = null;
      console.log("⏹️  Recommendation scheduler stopped");
    }
  }

  /**
   * Execute scheduled recommendation generation
   */
  private async executeScheduledRecommendationGeneration(): Promise<void> {
    if (this.isRunning) {
      console.log(
        "⚠️  Recommendation generation already in progress, skipping...",
      );
      return;
    }

    this.isRunning = true;
    console.log("🚀 Starting scheduled recommendation generation...");

    try {
      // First, mark expired recommendations
      await this.markExpiredRecommendations();

      // Clean up old processed/dismissed recommendations (older than 30 days)
      await this.cleanupOldRecommendations();

      // Generate new recommendations with force refresh
      const result = await this.workflowService.executeWorkflow({
        force_refresh: true, // Force refresh to generate new recommendations
      });

      console.log(
        "✅ Scheduled recommendation generation completed successfully",
      );
      console.log(
        `📊 Results: ${result.processed_customers.length} customers processed, ${result.total_recommendations_generated} recommendations generated`,
      );

      if (result.failed_customers.length > 0) {
        console.log(
          `⚠️  ${result.failed_customers.length} customers failed processing:`,
        );
        result.failed_customers.forEach((failure) => {
          console.log(`   - ${failure.customer_id}: ${failure.error}`);
        });
      }

      // Send notification to admins (if notification service exists)
      await this.notifyAdmins(result);
    } catch (error) {
      console.error("❌ Scheduled recommendation generation failed:", error);

      // Send error notification to admins
      await this.notifyAdminsOfError(error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Mark expired recommendations
   */
  private async markExpiredRecommendations(): Promise<void> {
    try {
      const result = await CustomerRecommendation.updateMany(
        {
          expires_at: { $lt: new Date() },
          status: RecommendationStatus.ACTIVE,
        },
        {
          status: RecommendationStatus.EXPIRED,
          last_updated: new Date(),
        },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `📅 Marked ${result.modifiedCount} recommendations as expired`,
        );
      }
    } catch (error) {
      console.error("Error marking expired recommendations:", error);
    }
  }

  /**
   * Clean up old recommendations
   */
  private async cleanupOldRecommendations(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await CustomerRecommendation.deleteMany({
        status: {
          $in: [
            RecommendationStatus.PROCESSED,
            RecommendationStatus.DISMISSED,
            RecommendationStatus.EXPIRED,
          ],
        },
        last_updated: { $lt: thirtyDaysAgo },
      });

      if (result.deletedCount > 0) {
        console.log(
          `🗑️  Cleaned up ${result.deletedCount} old recommendations`,
        );
      }
    } catch (error) {
      console.error("Error cleaning up old recommendations:", error);
    }
  }

  /**
   * Notify admins of successful generation
   */
  private async notifyAdmins(result: WorkflowExecutionResult): Promise<void> {
    try {
      // This would integrate with your notification service
      // For now, we'll just log the summary
      const summary = {
        timestamp: new Date().toISOString(),
        processed_customers: result.processed_customers.length,
        total_recommendations: result.total_recommendations_generated,
        failed_customers: result.failed_customers.length,
        success: true,
      };

      console.log("📧 Admin notification summary:", summary);

      // TODO: Integrate with actual notification service
      // await notificationService.sendAdminNotification({
      //   type: 'recommendation_generation_complete',
      //   data: summary
      // });
    } catch (error) {
      console.error("Error sending admin notification:", error);
    }
  }

  /**
   * Notify admins of generation error
   */
  private async notifyAdminsOfError(error: Error | unknown): Promise<void> {
    try {
      const errorSummary = {
        timestamp: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Unknown error",
        success: false,
      };

      console.log("🚨 Admin error notification:", errorSummary);

      // TODO: Integrate with actual notification service
      // await notificationService.sendAdminNotification({
      //   type: 'recommendation_generation_error',
      //   data: errorSummary
      // });
    } catch (notificationError) {
      console.error("Error sending error notification:", notificationError);
    }
  }

  /**
   * Manually trigger recommendation generation (for testing/admin use)
   */
  async triggerManualGeneration(
    forceRefresh: boolean = false,
  ): Promise<WorkflowExecutionResult> {
    if (this.isRunning) {
      throw new Error("Recommendation generation is already in progress");
    }

    console.log("🔧 Manually triggering recommendation generation...");

    this.isRunning = true;
    try {
      if (forceRefresh) {
        await this.markExpiredRecommendations();
      }

      const result = await this.workflowService.executeWorkflow({
        force_refresh: forceRefresh,
      });

      console.log("✅ Manual recommendation generation completed");
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isScheduled: boolean; isRunning: boolean; nextRun?: string } {
    return {
      isScheduled: !!this.scheduledTask,
      isRunning: this.isRunning,
      nextRun: this.scheduledTask ? "Next run scheduled" : undefined,
    };
  }

  /**
   * Update schedule (stop and restart with new schedule)
   */
  updateSchedule(cronExpression: string): void {
    this.stop();

    this.scheduledTask = cron.schedule(
      cronExpression,
      async () => {
        await this.executeScheduledRecommendationGeneration();
      },
      {
        timezone: "America/New_York",
      },
    );

    console.log(
      `🔄 Recommendation scheduler updated with new schedule: ${cronExpression}`,
    );
  }
}
