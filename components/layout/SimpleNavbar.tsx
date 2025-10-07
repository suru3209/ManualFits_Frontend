"use client";

import { useRouter, usePathname } from "next/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useState, useEffect } from "react";

export default function SimpleNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems } = useCart();
  const { wishlist } = useWishlist();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // Calculate cart items count
  const cartItemsCount = cartItems.reduce((total, item) => total + item.qty, 0);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <img src="/logo2.png" alt="MANUAL|FITS" className="h-8 w-auto" />
            </button>
          </div>

          {/* Right side - Icons */}
          <div className="flex items-center space-x-4">
            {/* Wishlist Icon */}
            <button
              onClick={() => router.push("/wishlist")}
              className="relative p-2 text-gray-600 hover:text-red-500 transition-colors"
            >
              <Heart className="h-6 w-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => router.push("/cart")}
              className="relative p-2 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <ShoppingBag className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Login/Profile Button - Hide Profile button on login page */}
            {isLoggedIn && pathname !== "/account/login" ? (
              <button
                onClick={() => router.push("/account/dashboard")}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Profile
              </button>
            ) : !isLoggedIn ? (
              <button
                onClick={() => router.push("/account/login")}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Login
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
