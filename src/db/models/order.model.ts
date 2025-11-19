"use strict";

import { IOrder, OrderStatus } from "../../types/order.type";
import mongoose from "../index";

const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
  product_id: {
    type: String,
    required: true,
    ref: "Product",
  },
  variant_id: {
    type: String,
    required: false,
  },
  // Variant snapshot fields for historical accuracy
  variant_image: {
    type: String,
    required: false,
  },
  variant_sku: {
    type: String,
    required: false,
  },
  variant_attribute: {
    type: String,
    required: false,
  },
  variation_type: {
    type: String,
    required: false,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const AddressSchema = new Schema({
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zip_code: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
    default: "US",
  },
});

const OrderTimelineSchema = new Schema({
  status: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    required: false,
  },
});

const OrderSchema = new Schema<IOrder>(
  {
    customer_id: {
      type: String,
      required: false,
      ref: "User",
    },
    customer_email: {
      type: String,
      required: false,
    },
    customer_phone: {
      type: String,
      required: false,
    },
    items: [OrderItemSchema],
    shipping_address: {
      type: AddressSchema,
      required: true,
    },
    billing_address: {
      type: AddressSchema,
      required: true,
    },
    payment_method: {
      type: String,
      required: true,
    },
    payment_status: {
      type: String,
      required: true,
      default: "pending",
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    timeline: [OrderTimelineSchema],
    tracking_number: {
      type: String,
      required: false,
    },
    estimated_delivery: {
      type: Date,
      required: false,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    delivery_cost: {
      type: Number,
      required: true,
      default: 0,
    },
    distance_miles: {
      type: Number,
      required: false,
    },
    delivery_zone_validated: {
      type: Boolean,
      required: false,
      default: false,
    },
    tax: {
      type: Number,
      required: false,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

const Order = mongoose.model("Order", OrderSchema);

export default Order;
