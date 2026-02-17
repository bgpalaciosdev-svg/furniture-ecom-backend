"use strict";

import { ISubcategory } from "../../types/subcategory.type";
import mongoose from "../index";

const Schema = mongoose.Schema;

const SubcategorySchema = new Schema<ISubcategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    image_url: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

const Subcategory = mongoose.model("Subcategory", SubcategorySchema);

export default Subcategory;
