"use client";

import { motion } from "framer-motion";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Heart } from "lucide-react";
import { useCart } from "../../../context/CartContext";

// Product Interface
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  images: string[];
  category: string;
  color: string[];
  size: string[];
  discount: number;
  inStock: boolean;
  rating: number;
  reviews: number;
  brand: string;
  description: string;
}

// Demo Products
const demoProducts: Product[] = [
  {
    id: 1,
    name: "Summer Floral Dress",
    price: 899,
    originalPrice: 1999,
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=600&fit=crop",
    ],
    category: "Women",
    color: ["Pink", "Blue", "Yellow"],
    size: ["S", "M", "L"],
    discount: 55,
    inStock: true,
    rating: 4.5,
    reviews: 623,
    brand: "MANUAL-FITS",
    description:
      "Beautiful floral summer dress perfect for sunny days and casual outings.",
  },
];

export default function ProductPage() {
  const { id } = useParams();
  const product = demoProducts.find((p) => p.id === Number(id));

  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>(
    product?.size[0] || ""
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product?.color[0] || ""
  );
  const [qty, setQty] = useState(1);
  const [wishlist, setWishlist] = useState(false);
  const [mainImage, setMainImage] = useState(product?.images[0]);

  if (!product)
    return <div className="p-10 text-center text-xl">Product not found!</div>;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      qty,
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-20">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Product Images */}
        <div className="flex-1">
          <div className="relative">
            <motion.img
              key={mainImage}
              src={mainImage}
              alt={product.name}
              className="w-full rounded-lg shadow-md mb-4 object-cover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />

            {/* Wishlist Button */}
            <motion.button
              onClick={() => setWishlist(!wishlist)}
              className="absolute top-4 right-4 bg-white p-2 rounded-full shadow"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              {wishlist ? (
                <Heart className="text-red-500 w-6 h-6" />
              ) : (
                <Heart className="w-6 h-6" />
              )}
            </motion.button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 mt-3">
            {product.images.map((img) => (
              <motion.img
                key={img}
                src={img}
                alt="thumbnail"
                className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${
                  mainImage === img ? "border-yellow-500" : "border-gray-300"
                }`}
                whileHover={{ scale: 1.1 }}
                onClick={() => setMainImage(img)}
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1">
          <motion.h1
            className="text-3xl font-bold mb-2"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {product.name}
          </motion.h1>
          <p className="text-gray-500 mb-2">{product.brand}</p>

          <div className="flex items-center gap-4 mb-4">
            <p className="text-2xl font-semibold text-blue-600">
              ₹{product.price}
            </p>
            <p className="text-gray-400 line-through">
              ₹{product.originalPrice}
            </p>
            <span className="text-green-600 font-medium">
              {product.discount}% off
            </span>
          </div>

          <p className="mb-4 text-sm text-gray-600">
            {product.reviews} Reviews | Rating: {product.rating}⭐
          </p>

          {/* Size Selection */}
          <div className="mb-4">
            <p className="font-medium mb-2">Select Size:</p>
            <div className="flex gap-2">
              {product.size.map((s) => (
                <motion.button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`px-4 py-2 border rounded ${
                    selectedSize === s
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-4">
            <p className="font-medium mb-2">Select Color:</p>
            <div className="flex gap-2">
              {product.color.map((c) => (
                <motion.div
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full border cursor-pointer ${
                    selectedColor === c
                      ? "ring-2 ring-blue-500"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c.toLowerCase() }}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-4 flex items-center gap-4">
            <p className="font-medium">Quantity:</p>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => qty > 1 && setQty(qty - 1)}
                className="px-2 py-1 bg-gray-200 rounded"
                whileTap={{ scale: 0.9 }}
              >
                -
              </motion.button>
              <span>{qty}</span>
              <motion.button
                onClick={() => setQty(qty + 1)}
                className="px-2 py-1 bg-gray-200 rounded"
                whileTap={{ scale: 0.9 }}
              >
                +
              </motion.button>
            </div>
          </div>

          {/* Add to Cart */}
          <motion.button
            onClick={handleAddToCart}
            className="w-full bg-[#FEBE10] hover:bg-yellow-600 text-gray-800 py-2 rounded-lg font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add to Cart
          </motion.button>

          {/* Description */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Product Description</h2>
            <p className="text-gray-700 text-sm">{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
