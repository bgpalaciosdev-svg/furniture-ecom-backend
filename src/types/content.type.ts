export interface IBanner {
  _id?: string;
  image_url: string;
  title: string;
  button_text?: string;
  button_link?: string;
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ISaleSection {
  _id?: string;
  image_url?: string;
  title: string;
  description: string;
  discount_text: string;
  products: string[]; // Array of product IDs
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface IFeaturedProducts {
  _id?: string;
  product_ids: string[];
  created_at?: Date;
  updated_at?: Date;
}

export interface ISocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export interface IContactInfo {
  phone?: string;
  email?: string;
  address?: string;
}

export interface IFooter {
  _id?: string;
  about_text: string;
  contact_info: IContactInfo;
  social_links: ISocialLinks;
  created_at?: Date;
  updated_at?: Date;
}

