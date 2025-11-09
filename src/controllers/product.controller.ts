import { Request, Response, NextFunction } from "express";
import Product from "../db/models/product.model";
import Category from "../db/models/category.model";
import { IProductFilterQuery, IProductVariant } from "../types/product.type";

// Get all products with filtering and pagination
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "12",
      category,
      price_min,
      price_max,
      color,
      material,
      search,
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter query
    const filterQuery: IProductFilterQuery = {};

    if (category) {
      // Handle both single category and multiple categories (comma-separated)
      const categories = (category as string)
        .split(",")
        .map((cat) => cat.trim())
        .filter(Boolean);
      if (categories.length === 1) {
        filterQuery.category_id = categories[0];
      } else if (categories.length > 1) {
        filterQuery.category_id = { $in: categories };
      }
    }

    if (price_min || price_max) {
      filterQuery.price = {};
      if (price_min) filterQuery.price.$gte = parseFloat(price_min as string);
      if (price_max) filterQuery.price.$lte = parseFloat(price_max as string);
    }

    if (color) {
      filterQuery["variants.color"] = {
        $regex: color as string,
        $options: "i",
      };
    }

    if (material) {
      filterQuery["variants.material"] = {
        $regex: material as string,
        $options: "i",
      };
    }

    if (search) {
      filterQuery.$or = [
        { name: { $regex: search as string, $options: "i" } },
        { description: { $regex: search as string, $options: "i" } },
      ];
    }

    const [products, totalCount, categories] = await Promise.all([
      Product.find(filterQuery)
        .populate("category_id")
        .skip(skip)
        .limit(limitNumber)
        .sort({ created_at: -1 }),
      Product.countDocuments(filterQuery),
      Category.find().sort({ name: 1 }),
    ]);

    // Get available filter options
    const allProducts = await Product.find(filterQuery);
    const filters_available = {
      // Return empty arrays for colors and materials (UI hidden)
      colors: [],
      materials: [],
      price_range: {
        min: Math.min(...allProducts.map((p) => p.price)),
        max: Math.max(...allProducts.map((p) => p.price)),
      },
      categories: categories.map((cat) => ({
        id: cat._id,
        name: cat.name,
        count: allProducts.filter(
          (p) => p.category_id.toString() === cat._id?.toString(),
        ).length,
      })),
    };

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      products,
      pagination: {
        current_page: pageNumber,
        total_pages: totalPages,
        total_count: totalCount,
        has_next: pageNumber < totalPages,
        has_prev: pageNumber > 1,
      },
      filters_available,
    });
  } catch (error) {
    next(error);
  }
};

// Get single product by ID
export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate("category_id");

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json({
      product: {
        ...product.toObject(),
        category: product.category_id,
        stock: product.variants.reduce(
          (total, variant) => total + variant.stock,
          0,
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create new product
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, sku, category, price, description, variants, images, stock } =
      req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: sku });
    if (existingProduct) {
      res.status(400).json({
        success: false,
        message: `A product with SKU '${sku}' already exists. Please use a unique SKU.`,
      });
      return;
    }

    const product = new Product({
      name,
      sku,
      category_id: category,
      price,
      description,
      variants: variants || [],
      images: images || [],
      stock:
        variants && variants.length > 0
          ? variants.reduce(
              (total: number, variant: IProductVariant) =>
                total + (variant.stock || 0),
              0,
            )
          : stock || 0,
    });

    await product.save();
    await product.populate("category_id");

    res.status(201).json({
      id: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category_id,
      price: product.price,
      variants: product.variants,
      images: product.images,
    });
  } catch (error) {
    next(error);
  }
};

// Update product
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      category,
      price,
      description,
      variants,
      images,
      featured,
      stock,
    } = req.body;

    // Check if SKU already exists on another product
    const existingProduct = await Product.findOne({
      sku: sku,
      _id: { $ne: id },
    });
    if (existingProduct) {
      res.status(400).json({
        success: false,
        message: `Another product with SKU '${sku}' already exists. Please use a unique SKU.`,
      });
      return;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        sku,
        category_id: category,
        price,
        description,
        variants,
        images,
        featured,
        stock:
          stock !== undefined
            ? stock
            : variants && variants.length > 0
              ? variants.reduce(
                  (total: number, variant: IProductVariant) =>
                    total + (variant.stock || 0),
                  0,
                )
              : 0,
      },
      { new: true },
    ).populate("category_id");

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json({
      id: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category_id,
      price: product.price,
      description: product.description,
      variants: product.variants,
      images: product.images,
      featured: product.featured,
      stock: product.stock,
    });
  } catch (error) {
    next(error);
  }
};

// Delete product
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Search products
export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { q, category, filters } = req.query;

    const searchQuery: IProductFilterQuery = {};

    if (q) {
      searchQuery.$or = [
        { name: { $regex: q as string, $options: "i" } },
        { description: { $regex: q as string, $options: "i" } },
        { sku: { $regex: q as string, $options: "i" } },
      ];
    }

    if (category) {
      // Handle both single category and multiple categories (comma-separated)
      const categories = (category as string)
        .split(",")
        .map((cat) => cat.trim())
        .filter(Boolean);
      if (categories.length === 1) {
        searchQuery.category_id = categories[0];
      } else if (categories.length > 1) {
        searchQuery.category_id = { $in: categories };
      }
    }

    if (filters) {
      try {
        const parsedFilters = JSON.parse(filters as string);
        Object.assign(searchQuery, parsedFilters);
      } catch (error) {
        console.error("Error parsing filters:", error);
      }
    }

    const products = await Product.find(searchQuery)
      .populate("category_id")
      .limit(20)
      .sort({ name: 1 });

    // Generate search suggestions
    const suggestions =
      products.length > 0
        ? [...new Set(products.map((p) => p.name).slice(0, 5))]
        : [];

    res.status(200).json({
      products,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};

// Get product stock
export const getProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // For simplicity, assuming one location
    const locations = [
      {
        location: "Main Warehouse",
        stock: product.variants.reduce(
          (total, variant) => total + variant.stock,
          0,
        ),
        more_arriving: false,
      },
    ];

    res.status(200).json({ locations });
  } catch (error) {
    next(error);
  }
};

// Update product stock
export const updateProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { locations } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Update total stock (simplified - in real app you'd update variant stocks)
    if (locations && locations[0]) {
      product.stock = locations[0].stock;
      await product.save();
    }

    res.status(200).json({ locations });
  } catch (error) {
    next(error);
  }
};
