import { Request, Response, NextFunction } from "express";
import { Banner, SaleSection, FeaturedProducts, Footer } from "../db/models/content.model";
import Product from "../db/models/product.model";

// Banner endpoints
export const getBanner = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const banner = await Banner.findOne({ active: true });
    
    if (!banner) {
      res.status(404).json({ message: "No active banner found" });
      return;
    }

    res.status(200).json({
      image_url: banner.image_url,
      title: banner.title,
      button_text: banner.button_text,
      button_link: banner.button_link
    });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { image_url, title, button_text, button_link } = req.body;

    const banner = await Banner.findOneAndUpdate(
      { active: true },
      {
        image_url,
        title,
        button_text,
        button_link,
        active: true
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      image_url: banner.image_url,
      title: banner.title,
      button_text: banner.button_text,
      button_link: banner.button_link
    });
  } catch (error) {
    next(error);
  }
};

// Sale section endpoints
export const getSaleSection = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const saleSection = await SaleSection.findOne({ active: true }).populate('products');

    if (!saleSection) {
      res.status(404).json({ message: "No active sale section found" });
      return;
    }

    res.status(200).json({
      image_url: saleSection.image_url,
      title: saleSection.title,
      description: saleSection.description,
      discount_text: saleSection.discount_text,
      products: saleSection.products
    });
  } catch (error) {
    next(error);
  }
};

export const updateSaleSection = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { image_url, title, description, discount_text, products } = req.body;

    const saleSection = await SaleSection.findOneAndUpdate(
      { active: true },
      {
        image_url,
        title,
        description,
        discount_text,
        products,
        active: true
      },
      { new: true, upsert: true }
    ).populate('products');

    res.status(200).json({
      image_url: saleSection.image_url,
      title: saleSection.title,
      description: saleSection.description,
      discount_text: saleSection.discount_text,
      products: saleSection.products
    });
  } catch (error) {
    next(error);
  }
};

// Featured products endpoints
export const getFeaturedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const featuredProducts = await FeaturedProducts.findOne().populate('product_ids');
    
    if (!featuredProducts) {
      res.status(404).json({ message: "No featured products found" });
      return;
    }

    res.status(200).json({
      products: featuredProducts.product_ids
    });
  } catch (error) {
    next(error);
  }
};

export const updateFeaturedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { product_ids } = req.body;

    const featuredProducts = await FeaturedProducts.findOneAndUpdate(
      {},
      { product_ids },
      { new: true, upsert: true }
    ).populate('product_ids');

    res.status(200).json({
      product_ids: featuredProducts.product_ids
    });
  } catch (error) {
    next(error);
  }
};

// Footer endpoints
export const getFooter = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const footer = await Footer.findOne();
    
    if (!footer) {
      res.status(404).json({ message: "Footer content not found" });
      return;
    }

    res.status(200).json({
      about_text: footer.about_text,
      contact_info: footer.contact_info,
      social_links: footer.social_links
    });
  } catch (error) {
    next(error);
  }
};

export const updateFooter = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { about_text, contact_info, social_links } = req.body;

    const footer = await Footer.findOneAndUpdate(
      {},
      {
        about_text,
        contact_info,
        social_links
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      about_text: footer.about_text,
      contact_info: footer.contact_info,
      social_links: footer.social_links
    });
  } catch (error) {
    next(error);
  }
};

