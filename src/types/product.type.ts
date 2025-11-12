export interface IProductVariant {
  _id?: string;
  color?: string;
  material?: string;
  size?: string;
  price: number;
  stock: number;
  sku: string;
  images?: IProductImage[];
}

export interface IProductImage {
  url: string;
  alt?: string;
  is_primary?: boolean;
}

export interface IProduct {
  _id?: string;
  name: string;
  sku: string;
  category_id: string;
  price: number;
  description?: string;
  variants: IProductVariant[];
  images: IProductImage[];
  featured?: boolean;
  stock?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IStockLocation {
  location: string;
  stock: number;
  more_arriving?: boolean;
}

export interface IProductFilterQuery {
  category_id?: string | { $in: string[] };
  price?: {
    $gte?: number;
    $lte?: number;
  };
  "variants.color"?: {
    $regex: string;
    $options: string;
  };
  "variants.material"?: {
    $regex: string;
    $options: string;
  };
  $or?: Array<{
    name?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
    sku?: { $regex: string; $options: string };
  }>;
}
