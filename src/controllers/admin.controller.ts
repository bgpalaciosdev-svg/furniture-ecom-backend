import { Request, Response, NextFunction } from "express";
import Order from "../db/models/order.model";
import Product from "../db/models/product.model";
import User from "../db/models/user.model";
import ExcelJS from "exceljs";

// Get admin dashboard statistics
export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get counts and statistics
    const [
      totalOrders,
      totalProducts,
      totalCustomers,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: 'regular' }),
      Order.find()
        .sort({ created_at: -1 })
        .limit(10)
        .populate('customer_id')
        .populate('items.product_id')
    ]);

    // Calculate revenue for the current month
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          created_at: { $gte: currentMonthStart },
          status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    const revenue = monthlyRevenue[0]?.total || 0;

    // Get orders by status for quick overview
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top selling products this month
    const topProducts = await Order.aggregate([
      {
        $match: {
          created_at: { $gte: currentMonthStart }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product_id',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      }
    ]);

    res.status(200).json({
      total_orders: totalOrders,
      total_products: totalProducts,
      total_customers: totalCustomers,
      monthly_revenue: revenue,
      orders_by_status: ordersByStatus,
      top_products: topProducts,
      recent_orders: recentOrders.map(order => ({
        id: order._id,
        customer: order.customer_id || { first_name: 'Guest', last_name: 'Customer' },
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        items_count: order.items.length
      }))
    });
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
      .populate('category_id', 'name')
      .sort({ created_at: -1 });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    // Define columns
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created Date', key: 'created_at', width: 18 },
      { header: 'Updated Date', key: 'updated_at', width: 18 }
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add product data to worksheet
    products.forEach((product: any) => {
      const status = product.stock > 0 ? 'Active' : 'Inactive';
      const categoryName = product.category_id?.name || 'Uncategorized';
      
      worksheet.addRow({
        name: product.name,
        sku: product.sku,
        category: categoryName,
        price: product.price,
        stock: product.stock,
        status: status,
        created_at: product.created_at,
        updated_at: product.updated_at
      });
    });

    // Format price column as currency
    const priceColumn = worksheet.getColumn('price');
    priceColumn.numFmt = '$#,##0.00';

    // Format date columns
    const createdColumn = worksheet.getColumn('created_at');
    const updatedColumn = worksheet.getColumn('updated_at');
    createdColumn.numFmt = 'mm/dd/yyyy hh:mm';
    updatedColumn.numFmt = 'mm/dd/yyyy hh:mm';

    // Set response headers for Excel file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="products.xlsx"'
    );

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

