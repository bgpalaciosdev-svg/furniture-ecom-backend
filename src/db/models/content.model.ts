"use strict";

import {
  IBanner,
  ISaleSection,
  IFeaturedProducts,
  IFooter,
} from "../../types/content.type";
import mongoose from "../index";

const Schema = mongoose.Schema;

// Banner Schema
const BannerSchema = new Schema<IBanner>(
  {
    image_url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    button_text: {
      type: String,
      required: false,
    },
    button_link: {
      type: String,
      required: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Sale Section Schema
const SaleSectionSchema = new Schema<ISaleSection>(
  {
    image_url: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    discount_text: {
      type: String,
      required: true,
    },
    products: [
      {
        type: String,
        ref: "Product",
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Featured Products Schema
const FeaturedProductsSchema = new Schema<IFeaturedProducts>(
  {
    product_ids: [
      {
        type: String,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Footer Schema
const FooterSchema = new Schema<IFooter>(
  {
    about_text: {
      type: String,
      required: true,
    },
    contact_info: {
      phone: {
        type: String,
        required: false,
      },
      email: {
        type: String,
        required: false,
      },
      address: {
        type: String,
        required: false,
      },
    },
    social_links: {
      facebook: {
        type: String,
        required: false,
      },
      instagram: {
        type: String,
        required: false,
      },
      twitter: {
        type: String,
        required: false,
      },
      linkedin: {
        type: String,
        required: false,
      },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const Banner = mongoose.model("Banner", BannerSchema);
export const SaleSection = mongoose.model("SaleSection", SaleSectionSchema);
export const FeaturedProducts = mongoose.model(
  "FeaturedProducts",
  FeaturedProductsSchema
);
export const Footer = mongoose.model("Footer", FooterSchema);
