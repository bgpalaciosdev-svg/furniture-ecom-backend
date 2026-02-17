import mongoose from "mongoose";

export interface ISubcategory {
  _id?: string;
  name: string;
  slug: string;
  category: mongoose.Types.ObjectId; // Reference to Category _id
  image_url?: string;
  created_at?: Date;
  updated_at?: Date;
}
