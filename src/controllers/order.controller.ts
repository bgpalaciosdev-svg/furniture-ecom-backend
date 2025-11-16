import { Request, Response, NextFunction } from "express";
import Order from "../db/models/order.model";
import Product from "../db/models/product.model";
import { OrderStatus } from "../types/order.type";

// Get all orders with filtering and pagination
export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "10",
      status,
      customer,
      date_from,
      date_to,
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter query
    interface OrderFilterQuery {
      status?: string;
      $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
      created_at?: { $gte?: Date; $lte?: Date };
    }

    const filterQuery: OrderFilterQuery = {};

    if (status) {
      filterQuery.status = status as string;
    }

    if (customer) {
      const customerStr = customer as string;
      filterQuery.$or = [
        { customer_email: { $regex: customerStr, $options: "i" } },
        { customer_phone: { $regex: customerStr, $options: "i" } },
      ];
    }

    if (date_from || date_to) {
      filterQuery.created_at = {};
      if (date_from)
        filterQuery.created_at.$gte = new Date(date_from as string);
      if (date_to) filterQuery.created_at.$lte = new Date(date_to as string);
    }

    const [orders, totalCount] = await Promise.all([
      Order.find(filterQuery)
        .skip(skip)
        .limit(limitNumber)
        .populate("customer_id")
        .sort({ created_at: -1 }),
      Order.countDocuments(filterQuery),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      orders,
      pagination: {
        current_page: pageNumber,
        total_pages: totalPages,
        total_count: totalCount,
        has_next: pageNumber < totalPages,
        has_prev: pageNumber > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single order by ID
export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("customer_id")
      .populate("items.product_id");

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json({
      order: {
        ...order.toObject(),
        customer: order.customer_id,
        shipping: order.shipping_address,
        billing: order.billing_address,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create new order
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      items,
      shipping_address,
      billing_address,
      payment_method,
      customer_id,
      customer_email,
      customer_phone,
      delivery_cost,
      distance_miles,
      delivery_zone_validated,
    } = req.body;

    // Validate delivery_cost is provided
    if (delivery_cost === undefined || delivery_cost === null) {
      res.status(400).json({
        message:
          "Delivery cost is required. Please validate your delivery address.",
      });
      return;
    }

    // Calculate subtotal from items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        res
          .status(400)
          .json({ message: `Product not found: ${item.product_id}` });
        return;
      }

      const itemTotal = item.quantity * item.price;
      subtotal += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price,
        name: product.name,
      });
    }

    // Use delivery_cost from frontend (distance-based calculation)
    // Total = subtotal + delivery_cost (no tax in backend)
    const total = subtotal + delivery_cost;

    const order = new Order({
      customer_id,
      customer_email,
      customer_phone,
      items: orderItems,
      shipping_address,
      billing_address,
      payment_method,
      payment_status: "pending",
      status: OrderStatus.PENDING,
      timeline: [
        {
          status: OrderStatus.PENDING,
          timestamp: new Date(),
          notes: "Order created",
        },
      ],
      subtotal,
      delivery_cost,
      distance_miles,
      delivery_zone_validated,
      total,
    });

    await order.save();
    await order.populate(["customer_id", "items.product_id"]);

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// Update order status
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Add to timeline
    order.timeline.push({
      status,
      timestamp: new Date(),
      notes,
    });

    order.status = status;

    // Set estimated delivery for shipped orders
    if (status === OrderStatus.SHIPPED && !order.estimated_delivery) {
      order.estimated_delivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      order.tracking_number = `TRK${Date.now()}`;
    }

    await order.save();

    res.status(200).json({
      status: order.status,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// Track order
export const trackOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json({
      order: {
        status: order.status,
        timeline: order.timeline,
        tracking_number: order.tracking_number,
        estimated_delivery: order.estimated_delivery,
      },
    });
  } catch (error) {
    next(error);
  }
};
