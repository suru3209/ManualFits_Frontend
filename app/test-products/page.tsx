"use client";
import React, { useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/api";

interface ColorVariant {
  colorName: string;
  colorCode: string;
  images: string[];
  stock: number;
  price: number;
  originalPrice: number;
  sku: string;
}

interface SizeVariant {
  size: string;
  variants: ColorVariant[];
}

interface Product {
  _id?: string;
  title: string;
  description: string;
  category: string;
  brand: string;
  rating: number;
  reviewCount?: number;
  isActive: boolean;
  sizes: SizeVariant[];
  slug: string;
  totalStock?: number;
  minPrice?: number;
  maxPrice?: number;
}

export default function TestProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(buildApiUrl("/api/products"), {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const json = await res.json();
        setProducts(json.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Products ({products.length} products)
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="aspect-square bg-gray-200 p-4">
                {product.sizes[0]?.variants[0]?.images[0] ? (
                  <img
                    src={product.sizes[0].variants[0].images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 rounded flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-green-600">
                    ₹
                    {product.minPrice ||
                      product.sizes[0]?.variants[0]?.price ||
                      0}
                  </span>
                  {product.sizes[0]?.variants[0]?.originalPrice &&
                    product.sizes[0].variants[0].originalPrice >
                      (product.minPrice ||
                        product.sizes[0].variants[0].price) && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{product.sizes[0].variants[0].originalPrice}
                      </span>
                    )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>Category: {product.category}</span>
                  <span>Brand: {product.brand}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>Rating: {product.rating}/5</span>
                  <span>Reviews: {product.reviewCount || 0}</span>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Available Sizes:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.sizes.map((size, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {size.size}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">
                    Available Colors:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(
                      new Set(
                        product.sizes.flatMap((size) =>
                          size.variants.map((variant) => variant.colorName)
                        )
                      )
                    )
                      .slice(0, 3)
                      .map((color, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          {color}
                        </span>
                      ))}
                    {Array.from(
                      new Set(
                        product.sizes.flatMap((size) =>
                          size.variants.map((variant) => variant.colorName)
                        )
                      )
                    ).length > 3 && (
                      <span className="text-xs text-gray-500">
                        +
                        {Array.from(
                          new Set(
                            product.sizes.flatMap((size) =>
                              size.variants.map((variant) => variant.colorName)
                            )
                          )
                        ).length - 3}{" "}
                        more
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Total Stock: {product.totalStock || 0} units
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
