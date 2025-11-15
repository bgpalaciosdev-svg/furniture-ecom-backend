import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
} from "../controllers/payment.controller";

const router = express.Router();

router.post("/create-intent", createPaymentIntent);
router.post("/confirm", confirmPayment);
router.get("/status/:payment_intent_id", getPaymentStatus);

export default router;
