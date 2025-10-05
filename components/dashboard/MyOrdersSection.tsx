"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Star, MessageCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Order {
  _id: string;
  createdAt: string;
  updatedAt?: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  items: Array<{
    product: {
      _id?: string;
      id?: string;
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
}

interface MyOrdersSectionProps {
  filteredOrders: Order[];
  orderStatusFilter: string;
  orderStatusOptions: Array<{ value: string; label: string }>;
  expandedOrders: Set<string>;
  orderActionMessage: string;
  selectedOrderId: string;
  onOrderStatusFilterChange: (value: string) => void;
  onToggleOrderExpansion: (orderId: string) => void;
  onTrackOrder: (order: Order) => void;
  onCancelOrder: (orderId: string) => void;
  onReturnReplace: (orderId: string) => void;
  onWriteReview: (orderId: string, orderItems: unknown[]) => void;
  isWithinReturnWindow: (order: Order) => boolean;
  orderReviews: Map<string, unknown>;
}

export default function MyOrdersSection({
  filteredOrders,
  orderStatusFilter,
  orderStatusOptions,
  expandedOrders,
  orderActionMessage,
  selectedOrderId,
  onOrderStatusFilterChange,
  onToggleOrderExpansion,
  onTrackOrder,
  onCancelOrder,
  onReturnReplace,
  onWriteReview,
  isWithinReturnWindow,
  orderReviews,
}: MyOrdersSectionProps) {
  const router = useRouter();

  const handleProductClick = (
    productId: string | undefined,
    productName: string
  ) => {
    if (productId) {
      router.push(`/products/${productId}`);
    }
  };
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">My Orders</h2>
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium text-gray-700">
            Filter by Status:
          </Label>
          <select
            value={orderStatusFilter}
            onChange={(e) => onOrderStatusFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
          >
            {orderStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrders.has(order._id);
            return (
              <div key={order._id} className="border rounded-lg p-4 sm:p-6">
                {/* Order Summary - Always Visible */}
                <div
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2 sm:gap-0 cursor-pointer"
                  onClick={() => onToggleOrderExpansion(order._id)}
                >
                  <div className="flex items-center space-x-4">
                    {/* Order Image - Clickable */}
                    <div
                      className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (order.items?.[0]?.product) {
                          handleProductClick(
                            order.items[0].product._id ||
                              order.items[0].product.id,
                            order.items[0].product.name
                          );
                        }
                      }}
                    >
                      {order.items?.[0]?.product?.images?.[0] ? (
                        <img
                          src={order.items[0].product.images[0]}
                          alt={order.items[0].product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">
                        Order #{order._id.slice(-8)}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        Date: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm sm:text-base text-gray-600">
                        Total: ₹{order.totalAmount}
                      </p>
                      <p className="text-sm sm:text-base text-gray-600">
                        Payment: {order.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "shipped"
                          ? "bg-gray-100 text-gray-800"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                    <span className="text-gray-400">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {isExpanded && (
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium text-sm sm:text-base text-gray-800 mb-3">
                        Order Items:
                      </h4>
                      <div className="space-y-3">
                        {order.items.map((item: unknown, index: number) => {
                          const itemData = item as {
                            product: {
                              _id?: string;
                              id?: string;
                              name: string;
                              images?: string[];
                            };
                            quantity: number;
                            price: number;
                          };
                          return (
                            <div
                              key={index}
                              className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-3 bg-gray-50 rounded-lg"
                            >
                              {/* Product Image - Clickable */}
                              <div
                                className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() =>
                                  handleProductClick(
                                    itemData.product._id || itemData.product.id,
                                    itemData.product.name
                                  )
                                }
                              >
                                {itemData.product?.images?.[0] ? (
                                  <img
                                    src={itemData.product.images[0]}
                                    alt={itemData.product.name}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <ShoppingBag className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                {/* Product Name - Clickable */}
                                <h5
                                  className="font-medium text-sm sm:text-base cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={() =>
                                    handleProductClick(
                                      itemData.product._id ||
                                        itemData.product.id,
                                      itemData.product.name
                                    )
                                  }
                                >
                                  {itemData.product?.name || "Product"}
                                </h5>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Quantity: {itemData.quantity}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Price: ₹{itemData.price}
                                </p>
                              </div>
                              <div className="text-right sm:text-right">
                                <p className="font-medium text-sm sm:text-base">
                                  ₹{itemData.price * itemData.quantity}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-800 mb-2">
                        Shipping Address:
                      </h4>
                      <div className="text-sm text-gray-600">
                        <p>{order.shippingAddress.name}</p>
                        <p>{order.shippingAddress.street}</p>
                        <p>
                          {order.shippingAddress.city},{" "}
                          {order.shippingAddress.state} -{" "}
                          {order.shippingAddress.zip}
                        </p>
                        <p>{order.shippingAddress.country}</p>
                        <p>Phone: {order.shippingAddress.phone}</p>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="pt-4 border-t">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => onTrackOrder(order)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm font-medium"
                        >
                          Track Order
                        </button>

                        {/* Conditional buttons based on order status */}
                        {(order.status === "pending" ||
                          order.status === "shipped") && (
                          <button
                            onClick={() => onCancelOrder(order._id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Cancel Order
                          </button>
                        )}

                        {/* Show return/replace button only for delivered orders within 5 days */}
                        {order.status === "delivered" &&
                          isWithinReturnWindow(order) && (
                            <button
                              onClick={() => onReturnReplace(order._id)}
                              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium"
                            >
                              Return/Replace
                            </button>
                          )}

                        {/* Show review button for delivered orders - One review per order */}
                        {order.status === "delivered" && (
                          <div className="flex flex-col gap-2">
                            {(() => {
                              const hasOrderReview = orderReviews.has(
                                order._id
                              );

                              if (hasOrderReview) {
                                // Order has been reviewed - show disabled button
                                return (
                                  <button
                                    disabled
                                    className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-not-allowed"
                                  >
                                    <Star className="w-4 h-4" />
                                    Review Submitted
                                  </button>
                                );
                              } else {
                                // Order not reviewed - show active review button
                                return (
                                  <button
                                    onClick={() =>
                                      onWriteReview(order._id, order.items)
                                    }
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                                  >
                                    <Star className="w-4 h-4" />
                                    Write Review for Order
                                  </button>
                                );
                              }
                            })()}
                          </div>
                        )}

                        {/* Show message for delivered orders outside return window */}
                        {order.status === "delivered" &&
                          !isWithinReturnWindow(order) && (
                            <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">
                              <p className="font-medium">
                                Return window expired
                              </p>
                              <p className="text-xs text-gray-500">
                                Return/Replace available for 5 days after
                                delivery
                              </p>
                            </div>
                          )}

                        {/* Status message for non-actionable statuses */}
                        {!["pending", "shipped", "delivered"].includes(
                          order.status
                        ) && (
                          <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">
                            <p className="font-medium">
                              Status:{" "}
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Last updated:{" "}
                              {new Date(
                                order.updatedAt || order.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {/* Success message */}
                        {orderActionMessage &&
                          order._id === selectedOrderId && (
                            <div className="w-full bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                              {orderActionMessage}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No orders found</p>
          <p className="text-gray-400">
            {orderStatusFilter === "all"
              ? "Your order history will appear here"
              : `No orders found with status: ${
                  orderStatusOptions.find(
                    (opt) => opt.value === orderStatusFilter
                  )?.label
                }`}
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
}
