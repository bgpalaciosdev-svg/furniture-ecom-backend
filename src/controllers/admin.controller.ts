import { Request, Response, NextFunction } from "express";
import Order from "../db/models/order.model";
import Product from "../db/models/product.model";
import User from "../db/models/user.model";
import ExcelJS from "exceljs";
import { IOrder, IOrderItem } from "../types/order.type";
import { IProduct, IProductImage } from "../types/product.type";

// Get admin dashboard statistics
export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get counts and statistics
    const [totalOrders, totalProducts, totalCustomers, recentOrders] =
      await Promise.all([
        Order.countDocuments(),
        Product.countDocuments(),
        User.countDocuments({ role: "regular" }),
        Order.find()
          .sort({ created_at: -1 })
          .limit(10)
          .populate("customer_id")
          .populate("items.product_id"),
      ]);

    // Calculate revenue for the current month
    const currentMonthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          created_at: { $gte: currentMonthStart },
          status: { $in: ["confirmed", "processing", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    const revenue = monthlyRevenue[0]?.total || 0;

    // Get orders by status for quick overview
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Top selling products this month
    const topProducts = await Order.aggregate([
      {
        $match: {
          created_at: { $gte: currentMonthStart },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
    ]);

    res.status(200).json({
      total_orders: totalOrders,
      total_products: totalProducts,
      total_customers: totalCustomers,
      monthly_revenue: revenue,
      orders_by_status: ordersByStatus,
      top_products: topProducts,
      recent_orders: recentOrders.map((order) => ({
        id: order._id,
        customer: order.customer_id || {
          first_name: "Guest",
          last_name: "Customer",
        },
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        items_count: order.items.length,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Export orders to Excel
export const exportOrdersToExcel = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Fetch all orders with populated customer and product information
    const orders = await Order.find()
      .populate("customer_id", "first_name last_name email phone")
      .populate("items.product_id", "name")
      .sort({ created_at: -1 });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    // Define columns with proper headers and widths
    worksheet.columns = [
      { header: "Order Number", key: "orderNumber", width: 18 },
      { header: "Customer Email", key: "customerEmail", width: 30 },
      { header: "Customer Phone", key: "customerPhone", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Payment Method", key: "paymentMethod", width: 18 },
      { header: "Payment Status", key: "paymentStatus", width: 18 },
      { header: "Items Summary", key: "itemsSummary", width: 50 },
      { header: "Subtotal", key: "subtotal", width: 15 },
      { header: "Delivery Cost", key: "deliveryCost", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Shipping Address", key: "shippingAddress", width: 60 },
      { header: "Created Date", key: "createdAt", width: 20 },
      { header: "Updated Date", key: "updatedAt", width: 20 },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      bold: true,
      size: 12,
      color: { argb: "FF000000" },
    };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    headerRow.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // Add order data to worksheet
    orders.forEach(
      (
        order: IOrder & { customer_id?: { email?: string; phone?: string } },
        index: number,
      ) => {
        // Generate order number from order ID (last 6 characters)
        const orderNumber = `ORD-${order._id?.toString().slice(-6).toUpperCase() || ""}`;

        // Get customer information
        const customerEmail =
          order.customer_email || order.customer_id?.email || "Guest Customer";
        const customerPhone =
          order.customer_phone || order.customer_id?.phone || "N/A";

        // Create items summary
        const itemsSummary = order.items
          .map((item: IOrderItem & { product_id?: { name?: string } }) => {
            const productName =
              item.product_id?.name || item.name || "Unknown Product";
            return `${productName} (${item.quantity}x)`;
          })
          .join(", ");

        // Format shipping address
        const addr = order.shipping_address;
        const shippingAddress = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip_code}, ${addr.country}`;

        const row = worksheet.addRow({
          orderNumber,
          customerEmail,
          customerPhone,
          status: order.status,
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status,
          itemsSummary,
          subtotal: order.subtotal,
          deliveryCost: order.delivery_cost,
          total: order.total,
          shippingAddress,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        });

        // Apply alternating row colors
        if (index % 2 === 1) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8F8F8" },
          };
        }

        // Center align status columns
        row.getCell("status").alignment = { horizontal: "center" };
        row.getCell("paymentStatus").alignment = { horizontal: "center" };

        // Right align monetary values
        row.getCell("subtotal").alignment = { horizontal: "right" };
        row.getCell("deliveryCost").alignment = { horizontal: "right" };
        row.getCell("total").alignment = { horizontal: "right" };
      },
    );

    // Format monetary columns as currency
    const subtotalColumn = worksheet.getColumn("subtotal");
    const deliveryCostColumn = worksheet.getColumn("deliveryCost");
    const totalColumn = worksheet.getColumn("total");

    subtotalColumn.numFmt = "$#,##0.00";
    deliveryCostColumn.numFmt = "$#,##0.00";
    totalColumn.numFmt = "$#,##0.00";

    subtotalColumn.alignment = { horizontal: "right" };
    deliveryCostColumn.alignment = { horizontal: "right" };
    totalColumn.alignment = { horizontal: "right" };

    // Format date columns
    const createdColumn = worksheet.getColumn("createdAt");
    const updatedColumn = worksheet.getColumn("updatedAt");
    createdColumn.numFmt = "mm/dd/yyyy hh:mm AM/PM";
    updatedColumn.numFmt = "mm/dd/yyyy hh:mm AM/PM";
    createdColumn.alignment = { horizontal: "center" };
    updatedColumn.alignment = { horizontal: "center" };

    // Add borders to all data cells
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    });

    // Set response headers for Excel file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="orders.xlsx"');

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// Export products to Excel
export const exportProductsToExcel = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Fetch all products with category information
    const products = await Product.find()
      .populate("category_id", "name")
      .sort({ created_at: -1 });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Products");

    // Define columns with proper headers and widths
    worksheet.columns = [
      { header: "Image URL", key: "image_url", width: 50 },
      { header: "Product Name", key: "name", width: 35 },
      { header: "SKU", key: "sku", width: 18 },
      { header: "Category", key: "category", width: 22 },
      { header: "Price ($)", key: "price", width: 15 },
      { header: "Stock Quantity", key: "stock", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Created Date", key: "created_at", width: 20 },
      { header: "Updated Date", key: "updated_at", width: 20 },
    ];

    // Style the header row with enhanced formatting
    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      bold: true,
      size: 12,
      color: { argb: "FF000000" },
    };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    headerRow.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // Add product data to worksheet with proper formatting
    products.forEach(
      (
        product: IProduct & { category_id?: { name?: string } },
        index: number,
      ) => {
        const status =
          product.stock && product.stock > 0 ? "Active" : "Inactive";
        const categoryName = product.category_id?.name || "Uncategorized";

        // Get primary image URL or first image URL, or "No Image" if none exist
        let imageUrl = "No Image";
        if (product.images && product.images.length > 0) {
          // Look for primary image first
          const primaryImage = product.images.find(
            (img: IProductImage) => img.is_primary,
          );
          if (primaryImage) {
            imageUrl = primaryImage.url;
          } else {
            // Use first image if no primary is set
            imageUrl = product.images[0].url;
          }
        }

        const row = worksheet.addRow({
          name: product.name,
          sku: product.sku,
          category: categoryName,
          price: product.price,
          stock: product.stock,
          status: status,
          image_url: imageUrl,
          created_at: product.created_at,
          updated_at: product.updated_at,
        });

        // Apply alternating row colors for better readability
        if (index % 2 === 1) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8F8F8" },
          };
        }

        // Center align numeric and status columns
        row.getCell("stock").alignment = { horizontal: "center" };
        row.getCell("status").alignment = { horizontal: "center" };
        row.getCell("price").alignment = { horizontal: "right" };
      },
    );

    // Format price column as currency with proper alignment
    const priceColumn = worksheet.getColumn("price");
    priceColumn.numFmt = "$#,##0.00";
    priceColumn.alignment = { horizontal: "right" };

    // Format stock column with center alignment
    const stockColumn = worksheet.getColumn("stock");
    stockColumn.alignment = { horizontal: "center" };

    // Format status column with center alignment
    const statusColumn = worksheet.getColumn("status");
    statusColumn.alignment = { horizontal: "center" };

    // Format image URL column with left alignment for better readability
    const imageColumn = worksheet.getColumn("image_url");
    imageColumn.alignment = { horizontal: "left" };

    // Format date columns with proper date format
    const createdColumn = worksheet.getColumn("created_at");
    const updatedColumn = worksheet.getColumn("updated_at");
    createdColumn.numFmt = "mm/dd/yyyy hh:mm AM/PM";
    updatedColumn.numFmt = "mm/dd/yyyy hh:mm AM/PM";
    createdColumn.alignment = { horizontal: "center" };
    updatedColumn.alignment = { horizontal: "center" };

    // Add borders to all data cells for better structure
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Skip header row as it already has borders
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    });

    // Set response headers for Excel file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="products.xlsx"',
    );

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
