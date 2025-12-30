"use strict";

import {
  ICustomerRecommendation,
  RecommendationType,
  RecommendationStatus,
} from "../../types/recommendation.type";
import mongoose from "../index";

const Schema = mongoose.Schema;

const CustomerInsightsSchema = new Schema({
  total_orders: {
    type: Number,
    required: true,
    default: 0,
  },
  total_spent: {
    type: Number,
    required: true,
    default: 0,
  },
  last_order_date: {
    type: Date,
    required: false,
  },
  days_since_last_order: {
    type: Number,
    required: false,
  },
  average_order_value: {
    type: Number,
    required: true,
    default: 0,
  },
  favorite_categories: [
    {
      type: String,
    },
  ],
  purchase_frequency: {
    type: String,
    enum: ["high", "medium", "low"],
    required: true,
  },
  customer_lifetime_value: {
    type: Number,
    required: true,
    default: 0,
  },
  churn_risk_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
  },
});

const AIAnalysisSchema = new Schema({
  behavioral_pattern: {
    type: String,
    required: true,
  },
  engagement_level: {
    type: String,
    enum: ["high", "medium", "low", "dormant"],
    required: true,
  },
  predicted_next_purchase_window: {
    type: String,
    required: false,
  },
  recommended_products: [
    {
      type: String,
      ref: "Product",
    },
  ],
  personalization_notes: {
    type: String,
    required: true,
  },
});

const CustomerRecommendationSchema = new Schema<ICustomerRecommendation>(
  {
    customer_id: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    customer_email: {
      type: String,
      required: false,
    },
    customer_name: {
      type: String,
      required: false,
    },
    recommendation_type: {
      type: String,
      enum: Object.values(RecommendationType),
      required: true,
      index: true,
    },
    priority_score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    reasons: [
      {
        type: String,
        required: true,
      },
    ],
    suggested_actions: [
      {
        type: String,
        required: true,
      },
    ],
    customer_insights: {
      type: CustomerInsightsSchema,
      required: true,
    },
    ai_analysis: {
      type: AIAnalysisSchema,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(RecommendationStatus),
      default: RecommendationStatus.ACTIVE,
      index: true,
    },
    generated_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

// Compound indexes for efficient querying
CustomerRecommendationSchema.index({ customer_id: 1, recommendation_type: 1 });
CustomerRecommendationSchema.index({ status: 1, priority_score: -1 });
CustomerRecommendationSchema.index({ generated_at: 1, expires_at: 1 });

// TTL index to automatically remove expired recommendations
CustomerRecommendationSchema.index(
  { expires_at: 1 },
  { expireAfterSeconds: 0 },
);

const CustomerRecommendation = mongoose.model(
  "CustomerRecommendation",
  CustomerRecommendationSchema,
);

export default CustomerRecommendation;
