import express from "express";
import {
  getDashboard,
  exportProductsToExcel,
  exportOrdersToExcel,
} from "../controllers/admin.controller";
import {
  getSchedulerStatus,
  startScheduler,
  stopScheduler,
  triggerRecommendationGeneration,
  updateSchedulerConfig,
} from "../controllers/scheduler.controller";

const router = express.Router();

// Dashboard and exports
router.get("/dashboard", getDashboard);
router.get("/products/export", exportProductsToExcel);
router.get("/orders/export", exportOrdersToExcel);

// Recommendation scheduler management
router.get("/scheduler/status", getSchedulerStatus);
router.post("/scheduler/start", startScheduler);
router.post("/scheduler/stop", stopScheduler);
router.post("/scheduler/trigger", triggerRecommendationGeneration);
router.put("/scheduler/config", updateSchedulerConfig);

export default router;
