import express from "express";
import {
  getDashboard,
  exportProductsToExcel,
  exportOrdersToExcel,
} from "../controllers/admin.controller";

const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/products/export", exportProductsToExcel);
router.get("/orders/export", exportOrdersToExcel);

export default router;

