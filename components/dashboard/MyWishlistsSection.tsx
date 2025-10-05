"use client";

import React from "react";
import { Heart } from "lucide-react";

interface WishlistItem {
  _id?: string;
  id?: string;
  name: string;
  price: number;
}

interface MyWishlistsSectionProps {
  userWishlists: WishlistItem[];
}

export default function MyWishlistsSection({
  userWishlists,
}: MyWishlistsSectionProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        My Wishlists
      </h2>
      {userWishlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userWishlists.map((item, index) => (
            <div
              key={item._id || item.id || index}
              className="border rounded-lg p-3 sm:p-4"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base truncate">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    ₹{item.price}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8">
          <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-base sm:text-lg">
            No wishlist items
          </p>
          <p className="text-gray-400 text-sm sm:text-base">
            Items you wishlist will appear here
          </p>
        </div>
      )}
    </div>
  );
}
