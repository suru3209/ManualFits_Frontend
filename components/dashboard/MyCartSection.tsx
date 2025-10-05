"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Plus, Minus } from "lucide-react";
import { useCart, CartItem } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api";
import { safeLocalStorage } from "@/lib/storage";
import { TrashIcon } from "../ui/skiper-ui/skiper42";

interface MyCartSectionProps {
  userCart: CartItem[];
  onCartUpdate?: () => void;
}

export default function MyCartSection({
  userCart,
  onCartUpdate,
}: MyCartSectionProps) {
  const { cartItems, removeFromCart, increaseQty, decreaseQty, totalItems } =
    useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [cartData, setCartData] = useState<CartItem[]>(userCart);
  const router = useRouter();

  // Update cart data when userCart prop changes
  useEffect(() => {
    setCartData(userCart);
  }, [userCart]);

  // Use cartItems from context if available, otherwise use prop data
  const displayCartItems = cartItems.length > 0 ? cartItems : cartData;

  // Handle remove item
  const handleRemoveItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      await removeFromCart(itemId);
      if (onCartUpdate) {
        onCartUpdate();
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
      alert("Failed to remove item from cart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quantity increase
  const handleIncreaseQty = async (itemId: string) => {
    setIsLoading(true);
    try {
      await increaseQty(itemId);
      if (onCartUpdate) {
        onCartUpdate();
      }
    } catch (error) {
      console.error("Error increasing quantity:", error);
      alert("Failed to update quantity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quantity decrease
  const handleDecreaseQty = async (itemId: string) => {
    setIsLoading(true);
    try {
      await decreaseQty(itemId);
      if (onCartUpdate) {
        onCartUpdate();
      }
    } catch (error) {
      console.error("Error decreasing quantity:", error);
      alert("Failed to update quantity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle proceed to checkout
  const handleProceedToCheckout = () => {
    router.push("/checkout");
  };

  // Handle product click to open in new tab
  const handleProductClick = (productId: string) => {
    const productUrl = `/products/${productId}`;
    window.open(productUrl, "_blank", "noopener,noreferrer");
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    return displayCartItems.reduce((total, item) => {
      const quantity = item.qty || 1;
      const price = item.price || 0;
      return total + quantity * price;
    }, 0);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">My Cart</h2>
      {displayCartItems.length > 0 ? (
        <div className="space-y-4">
          {displayCartItems.map((item, index) => {
            const itemId = String(item._id || item.id);
            const quantity = item.qty || 1;
            const price = item.price || 0;
            const totalItemPrice = quantity * price;

            return (
              <div
                key={itemId || index}
                className="border rounded-lg p-3 sm:p-4"
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {/* Product Image - Clickable */}
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-gray-300 transition-all duration-200"
                    onClick={() => handleProductClick(itemId)}
                    title="Click to view product details"
                  >
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.name || "Product"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.parentElement?.appendChild(
                            Object.assign(document.createElement("div"), {
                              className:
                                "w-full h-full flex items-center justify-center",
                              innerHTML:
                                '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
                            })
                          );
                        }}
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Product Info - Clickable */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer hover:text-gray-600 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-all duration-200"
                    onClick={() => handleProductClick(itemId)}
                    title="Click to view product details"
                  >
                    <h3 className="font-semibold text-sm sm:text-base truncate">
                      {item.name || `Product ID: ${item.id}`}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Price: ₹{price}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      Total: ₹{totalItemPrice}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDecreaseQty(itemId)}
                        disabled={isLoading || quantity <= 1}
                        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleIncreaseQty(itemId)}
                        disabled={isLoading}
                        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(itemId)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-800 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <TrashIcon />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="mt-6 pt-4 border-t">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg font-semibold">
                  Total Items: {displayCartItems.length}
                </span>
                <span className="text-base sm:text-lg font-semibold">
                  Total Quantity:{" "}
                  {displayCartItems.reduce(
                    (total, item) => total + (item.qty || 1),
                    0
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg sm:text-xl font-bold">
                  Total Price: ₹{calculateTotalPrice()}
                </span>
                <button
                  onClick={handleProceedToCheckout}
                  disabled={isLoading}
                  className="bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
                >
                  {isLoading ? "Processing..." : "Proceed to Checkout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8">
          <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-base sm:text-lg">
            Your cart is empty
          </p>
          <p className="text-gray-400 text-sm sm:text-base">
            Add some products to your cart to see them here
          </p>
        </div>
      )}
    </div>
  );
}
