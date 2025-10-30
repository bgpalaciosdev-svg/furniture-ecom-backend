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

    // Define columns with proper headers and widths
    worksheet.columns = [
      { header: 'Product Name', key: 'name', width: 35 },
      { header: 'SKU', key: 'sku', width: 18 },
      { header: 'Category', key: 'category', width: 22 },
      { header: 'Price ($)', key: 'price', width: 15 },
      { header: 'Stock Quantity', key: 'stock', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created Date', key: 'created_at', width: 20 },
      { header: 'Updated Date', key: 'updated_at', width: 20 }
    ];

    // Style the header row with enhanced formatting
    const headerRow = worksheet.getRow(1);
    headerRow.font = { 
      bold: true, 
      size: 12,
      color: { argb: 'FF000000' }
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    headerRow.alignment = { 
      vertical: 'middle', 
      horizontal: 'center' 
    };
    headerRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Add product data to worksheet with proper formatting
    products.forEach((product: any, index: number) => {
      const status = product.stock > 0 ? 'Active' : 'Inactive';
      const categoryName = product.category_id?.name || 'Uncategorized';
      
      const row = worksheet.addRow({
        name: product.name,
        sku: product.sku,
        category: categoryName,
        price: product.price,
        stock: product.stock,
        status: status,
        created_at: product.created_at,
        updated_at: product.updated_at
      });

      // Apply alternating row colors for better readability
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F8F8' }
        };
      }

      // Center align numeric and status columns
      row.getCell('stock').alignment = { horizontal: 'center' };
      row.getCell('status').alignment = { horizontal: 'center' };
      row.getCell('price').alignment = { horizontal: 'right' };
    });

    // Format price column as currency with proper alignment
    const priceColumn = worksheet.getColumn('price');
    priceColumn.numFmt = '$#,##0.00';
    priceColumn.alignment = { horizontal: 'right' };

    // Format stock column with center alignment
    const stockColumn = worksheet.getColumn('stock');
    stockColumn.alignment = { horizontal: 'center' };

    // Format status column with center alignment
    const statusColumn = worksheet.getColumn('status');
    statusColumn.alignment = { horizontal: 'center' };

    // Format date columns with proper date format
    const createdColumn = worksheet.getColumn('created_at');
    const updatedColumn = worksheet.getColumn('updated_at');
    createdColumn.numFmt = 'mm/dd/yyyy hh:mm AM/PM';
    updatedColumn.numFmt = 'mm/dd/yyyy hh:mm AM/PM';
    createdColumn.alignment = { horizontal: 'center' };
    updatedColumn.alignment = { horizontal: 'center' };

    // Add borders to all data cells for better structure
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row as it already has borders
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

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

