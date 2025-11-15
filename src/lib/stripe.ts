import Stripe from "stripe";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover", // Use the latest API version
  typescript: true,
});

export default stripe;
