import { Request, Response, NextFunction } from "express";
import stripe from "../lib/stripe";
import Order from "../db/models/order.model";

// Create payment intent
export const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { amount, currency = "usd", order_data, customer_email } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ message: "Valid amount is required" });
      return;
    }

    if (!order_data) {
      res.status(400).json({ message: "Order data is required" });
      return;
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        order_type: "furniture_order",
        customer_email: customer_email || "guest",
        items_count: order_data.items?.length || 0,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store order data temporarily (you might want to use Redis for this in production)
    // For now, we'll return the client secret and expect the frontend to handle order creation

    res.status(200).json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount,
      currency,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    next(error);
  }
};

// Confirm payment and create order
export const confirmPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { payment_intent_id, order_data } = req.body;

    //If payment intent Id includes "financing" in its string, create the order with the financing id
    // No need to check for stripe payment intents
    if (payment_intent_id.includes("financing")) {
      const order = new Order({
        ...order_data,
        payment_method: "Stripe",
        payment_status: "completed",
        stripe_payment_intent_id: payment_intent_id,
        stripe_charge_id: undefined,
        payment_confirmed_at: new Date(),
      });

      await order.save();
      await order.populate(["customer_id", "items.product_id"]);

      res.status(200).json({
        success: true,
        order_id: order._id,
        payment_status: "succeeded",
        stripe_payment_intent_id: payment_intent_id,
      });
    }
    if (!payment_intent_id) {
      res.status(400).json({ message: "Payment intent ID is required" });
      return;
    }

    if (!order_data) {
      res.status(400).json({ message: "Order data is required" });
      return;
    }

    // Retrieve payment intent from Stripe to verify payment
    const paymentIntent =
      await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== "succeeded") {
      res.status(400).json({
        message: "Payment has not been completed successfully",
        payment_status: paymentIntent.status,
      });
      return;
    }

    // Get the charge ID if available (optional field)
    let stripeChargeId: string | undefined;
    try {
      // Retrieve charges separately if needed for tracking
      const charges = await stripe.charges.list({
        payment_intent: payment_intent_id,
        limit: 1,
      });
      stripeChargeId = charges.data[0]?.id;
    } catch (error) {
      // Charge ID is optional, so we continue without it
      console.warn("Could not retrieve charge ID:", error);
    }

    // Create order in database now that payment is confirmed
    const order = new Order({
      ...order_data,
      payment_method: "Stripe",
      payment_status: "completed",
      stripe_payment_intent_id: payment_intent_id,
      stripe_charge_id: stripeChargeId,
      payment_confirmed_at: new Date(),
    });

    await order.save();
    await order.populate(["customer_id", "items.product_id"]);

    res.status(200).json({
      success: true,
      order_id: order._id,
      payment_status: "succeeded",
      stripe_payment_intent_id: payment_intent_id,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    next(error);
  }
};

// Get payment status
export const getPaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { payment_intent_id } = req.params;

    if (!payment_intent_id) {
      res.status(400).json({ message: "Payment intent ID is required" });
      return;
    }

    const paymentIntent =
      await stripe.paymentIntents.retrieve(payment_intent_id);

    res.status(200).json({
      payment_intent_id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert back from cents
      currency: paymentIntent.currency,
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error getting payment status:", error);
    next(error);
  }
};
