"use client";
import React from "react";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import DynamicBreadcrumb from "@/lib/breadcrumb";
import Link from "next/link";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();

  if (wishlist.length === 0) {
    return (
      <div className="mx-auto  p-5 mt-10 lg:p-20 bg-gray-300 min-h-screen flex flex-col justify-center items-center">
        <span className="absolute top-18 lg:left-15">
          <DynamicBreadcrumb />
        </span>
        <div className="flex lg:pt-60 lg:pb-50 lg:w-330 flex-col items-center justify-center">
          <Heart className="w-20 h-20 opacity-40 mb-4" />
          <p className="text-lg text-gray-500">Your Wishlist!</p>
          <Link
            href="/products"
            className="mt-4 px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 pt-20 bg-gray-300 min-h-screen">
      <DynamicBreadcrumb />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {wishlist.map((product) => {
          const stableId = (product as any)._id ?? product.id;
          return (
            <Card
              key={stableId}
              className="relative overflow-hidden rounded-none"
            >
              {/* Product Image */}
              <div className="relative h-60 lg:h-80 overflow-hidden">
                <img
                  src={product.images?.[0] || "/placeholder-image.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity duration-500"
                />

                {/* Buttons always visible */}
                <div className="absolute inset-0 flex flex-col justify-end p-3 gap-2">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => removeFromWishlist(stableId)}
                      className="p-2 text-red-500 transition-all duration-300 hover:scale-110 bg-white rounded"
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => addToCart({ ...product, qty: 1 })}
                  >
                    <ShoppingBag size={16} />
                    Move to Cart
                  </Button>
                </div>
              </div>

              {/* Product Info */}
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 mb-1 line-clamp-2 text-sm leading-tight">
                  {product.name}
                </h3>
                <p className="text-sm font-bold text-gray-900 mb-1">
                  ₹{product.price}
                </p>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {product.brand}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
