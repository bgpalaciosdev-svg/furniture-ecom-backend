import express from "express";
import {
  getDashboard,
  exportProductsToExcel,
} from "../controllers/admin.controller";

const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/products/export", exportProductsToExcel);

export default router;

