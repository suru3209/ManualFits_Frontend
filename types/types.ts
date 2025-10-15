// export interface Product {
//   id: number;
//   name: string;
//   price: number;
//   originalPrice: number;
//   image: string;
//   hoverImage: string;
//   category: string;
//   color: string;
//   size: string[];
//   discount: number;
//   inStock: boolean;
//   rating: number;
//   reviews: number;
//   brand: string;
//   description: string;
// }

export const Subcategories = [
  "Jeans",
  "T-Shirts",
  "Shirts",
  "Jackets",
  "Hoodies",
  "Shorts",
  "Track Pants",
  "Blazers",
  "Sneakers",
  "Formal Shoes",
  "Dresses",
  "Tops",
  "Skirts",
  "Jeans",
  "T-Shirts",
  "Jackets",
  "Hoodies",
  "Blazers",
  "Flats",
  "Heels",
] as const; // ✅ as const important hai

export type Subcategory = (typeof Subcategories)[number]; // Union type from array

// Color Variant Interface
export interface ColorVariant {
  colorName: string;
  colorCode: string;
  images: string[];
  stock: number;
  price: number;
  originalPrice: number;
  sku: string;
  isAvailable: boolean;
}

// Size Variant Interface
export interface SizeVariant {
  size: string;
  colors: ColorVariant[];
  isAvailable: boolean;
}

// Variant Pair Interface - Simplified structure
export interface VariantPair {
  _id?: string;
  images: string[]; // Array of images for this variant
  size: string; // Size (S, M, L, XL, etc.)
  color: string; // Color name
  colorCode?: string; // Hex color code
  price: number; // Current price
  originalPrice: number; // Original price for discount calculation
  discount: number; // Discount percentage
  stock: number; // Available stock
  sku: string; // Unique SKU
  isAvailable: boolean; // Availability status
}

export interface Product {
  _id?: string;
  id?: number; // For backward compatibility
  title: string;
  name?: string; // For backward compatibility - will map to title
  description: string;
  category:
    | "Men"
    | "Women"
    | "Kids"
    | "Footwear"
    | "Accessories"
    | "New Arrivals";
  subcategory?: string[];
  brand: string;
  tags?: string[];
  rating: number;
  reviewCount?: number;
  reviews?: number; // For backward compatibility
  isActive: boolean;
  variants: VariantPair[];

  // SEO and metadata
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];

  // Detailed product information
  detailedDescription?: string;
  specifications?: { key: string; value: string }[];
  careInstructions?: string[];
  keyFeatures?: string[];
  material?: string;
  weight?: string;
  warranty?: string;
  origin?: string;

  // Virtual fields (computed)
  discountPercent?: number;
  totalStock?: number;
  inStock?: boolean;

  // Legacy fields for backward compatibility
  price?: number;
  originalPrice?: number;
  images?: string[];
  colors?: string[];
  discount?: number;
  discountEnd?: Date;
  sku?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}
