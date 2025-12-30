import { Router } from "express";
import { RecommendationController } from "../controllers/recommendation.controller";
import { authMiddleware } from "../middleware/authMiddleware";
import { checkAdmin } from "../middleware/isAdmin";

const router = Router();
const recommendationController = new RecommendationController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Admin-only routes for managing recommendations
router.use(checkAdmin); // All recommendation routes require admin access

// Generate recommendations
router.post("/generate", recommendationController.generateRecommendations);

// Get all recommendations with filtering and pagination
router.get("/", recommendationController.getRecommendations);

// Get recommendations for a specific customer
router.get(
  "/customer/:customer_id",
  recommendationController.getCustomerRecommendations,
);

// Update recommendation status
router.patch(
  "/:recommendation_id/status",
  recommendationController.updateRecommendationStatus,
);

// Get recommendation analytics
router.get("/analytics", recommendationController.getRecommendationAnalytics);

// Cleanup expired recommendations
router.delete(
  "/cleanup",
  recommendationController.cleanupExpiredRecommendations,
);

// Get system status
router.get("/system/status", recommendationController.getSystemStatus);

export default router;
