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

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  images: string[]; // first = default, second = hover
  category: "Men" | "Women" | "Kids" | "Footwear" | "Accessories";
  subcategory: Subcategory; // ✅ Correct
  colors: string[]; // multiple colors
  sizes: { size: string; stock: number }[];
  discount: number;
  discountEnd?: Date;
  inStock: boolean;
  rating: number; // 1-5
  reviews: number;
  brand: string;
  description: string;
  tags?: string[];
  sku?: string;
}
