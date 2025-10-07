"use client";
import React from "react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { Product } from "../../types/types"; // ✅ Product interface import
import { useRouter } from "next/navigation";
import DynamicBreadcrumb from "@/lib/breadcrumb";
import { TrashIcon } from "@/components/ui/skiper-ui/skiper42";

export default function CartPage() {
  const { cartItems, increaseQty, decreaseQty, removeFromCart } = useCart();
  const router = useRouter();

  // Debug cart items
  console.log("CartPage - cartItems:", cartItems);
  console.log("CartPage - First item:", cartItems[0]);

  // Total calculations
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * item.qty,
    0
  );
  const tax = +(subtotal * 0.05).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  if (cartItems.length === 0)
    return (
      <div className="mx-auto  p-5 mt-10 lg:p-20 bg-gray-300 min-h-screen flex flex-col justify-center items-center">
        <div className="flex lg:pt-60 lg:pb-50 lg:w-330 flex-col items-center justify-center">
          <span className="absolute top-16 bg-gray-300 w-screen">
            <DynamicBreadcrumb />
          </span>
          <ShoppingBag className="w-20 h-20 opacity-40 mb-4" />
          <p className="text-lg text-gray-500">Your cart is empty!</p>
          <Link
            href="/products"
            className="mt-4 px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );

  return (
    <div className="mx-auto p-5 lg:p-20 bg-gray-300 min-h-screen mt-15">
      <DynamicBreadcrumb />

      {/* <h1 className="text-3xl font-bold mb-6">Your Cart</h1> */}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cart Items */}
        <div className="flex-1 bg-gray-50 min-h-100 shadow-md rounded-lg p-4 space-y-3">
          {cartItems.map((item: Product & { qty: number }) => {
            const stableId =
              (item as unknown as { _id?: string })._id ?? item.id;
            return (
              <div
                key={stableId}
                className="flex justify-between items-center border-b py-3"
              >
                <div className="flex items-center gap-4">
                  {/* Product Image (Clickable) */}
                  {item.images?.[0] && (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      onClick={() => router.push(`/products/${stableId}`)}
                      className="w-20 h-20 object-contain rounded cursor-pointer"
                    />
                  )}

                  <div>
                    <p
                      className="font-semibold cursor-pointer hover:underline"
                      onClick={() => router.push(`/products/${stableId}`)}
                    >
                      {item.name}
                    </p>
                    <p className="text-gray-500 text-sm">{item.brand}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <button
                        onClick={() => decreaseQty(stableId)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span>{item.qty}</span>
                      <button
                        onClick={() => increaseQty(stableId)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(stableId)}
                        className="ml-4 text-gray-500 hover:text-gray-900"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="font-semibold">₹{(item.price || 0) * item.qty}</p>
              </div>
            );
          })}
        </div>

        {/* Order Summary (Sticky) */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 rounded-lg p-6 h-fit shadow-md sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span>Tax (5%):</span>
              <span>₹{tax}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total:</span>
              <span>₹{total}</span>
            </div>
            <Link
              href="/checkout"
              className="w-full block text-center bg-gray-600 hover:bg-gray-900 text-white py-2 mt-4 rounded-lg font-semibold transition-all"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
