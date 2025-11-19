export interface IOrderItem {
  product_id: string;
  variant_id?: string;
  // Variant snapshot fields for historical accuracy
  variant_image?: string;
  variant_sku?: string;
  variant_attribute?: string;
  variation_type?: string;
  quantity: number;
  price: number;
  name: string;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface IOrderTimeline {
  status: string;
  timestamp: Date;
  notes?: string;
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export interface IOrder {
  _id?: string;
  customer_id?: string;
  customer_email?: string;
  customer_phone?: string;
  items: IOrderItem[];
  shipping_address: IAddress;
  billing_address: IAddress;
  payment_method: string;
  payment_status: string;
  status: OrderStatus;
  timeline: IOrderTimeline[];
  tracking_number?: string;
  estimated_delivery?: Date;
  subtotal: number;
  delivery_cost: number;
  distance_miles?: number;
  delivery_zone_validated?: boolean;
  tax?: number;
  total: number;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  payment_confirmed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}
