"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Package,
  Truck,
  ShoppingBag,
  ArrowLeft,
  Home,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState({
    orderId: "",
    amount: 0,
    status: "",
    estimatedDelivery: "",
    trackingNumber: "",
  });

  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [shippingAddress, setShippingAddress] = useState<any>(null);

  useEffect(() => {
    // Get order details from URL params
    const orderId = searchParams.get("orderId") || "";
    const amount = parseInt(searchParams.get("amount") || "0");
    const status = searchParams.get("status") || "success";

    // Get shipping address from localStorage
    const pendingOrder = localStorage.getItem("pendingOrder");
    if (pendingOrder) {
      try {
        const orderData = JSON.parse(pendingOrder);
        if (orderData.shippingAddress) {
          setShippingAddress(orderData.shippingAddress);
          console.log(
            "Loaded shipping address from pending order:",
            orderData.shippingAddress
          );
        }
      } catch (error) {
        console.error("Error parsing pending order:", error);
      }
    } else {
      // Try to get address from backup storage
      const savedAddress = localStorage.getItem("orderShippingAddress");
      if (savedAddress) {
        try {
          const addressData = JSON.parse(savedAddress);
          setShippingAddress(addressData);
        } catch (error) {
          console.error("Error parsing saved address:", error);
        }
      }
    }

    // Get order items from localStorage if available
    const savedOrderItems = localStorage.getItem("lastOrderItems");
    if (savedOrderItems) {
      try {
        const parsedItems = JSON.parse(savedOrderItems);

        // Transform cart items to display format
        const transformedItems = parsedItems.map((item: any) => ({
          id: item._id || item.id,
          name: item.title || item.name,
          size: item.size || "One Size",
          quantity: item.qty || 1,
          price: item.price || item.variants?.[0]?.price || 0,
          image:
            item.images?.[0] ||
            item.variants?.[0]?.images?.[0] ||
            "https://picsum.photos/100/100?random=" +
              Math.floor(Math.random() * 1000),
        }));

        setOrderItems(transformedItems);
      } catch (error) {
        console.error("Error parsing saved order items:", error);
        setOrderItems([]);
      }
    } else {
      // Fallback data if no items found
      setOrderItems([
        {
          id: 1,
          name: "Your Order Items",
          size: "Various",
          quantity: 1,
          price: amount || 0,
          image:
            "https://picsum.photos/100/100?random=" +
            Math.floor(Math.random() * 1000),
        },
      ]);
    }

    // Clear cart if order is successful (backup safety)
    if (status === "success") {
      clearCart();
    }

    // Generate estimated delivery date (3-5 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(
      deliveryDate.getDate() + Math.floor(Math.random() * 3) + 3
    );

    // Generate tracking number
    const trackingNumber = `TRK${Date.now().toString().slice(-8)}`;

    setOrderDetails({
      orderId,
      amount,
      status,
      estimatedDelivery: deliveryDate.toLocaleDateString("en-IN"),
      trackingNumber,
    });
  }, [searchParams, clearCart]);

  const subtotal =
    orderItems.length > 0
      ? orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : orderDetails.amount;
  const shipping = 50;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 mt-15">
      {/* Header */}
      <div className="">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-semibold">Order Confirmation</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Success Message */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-green-800">
                    Order Placed Successfully!
                  </h2>
                  <p className="text-green-700">
                    Thank you for your purchase. Your order has been confirmed
                    and will be processed shortly.
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant="default" className="bg-green-500">
                    Order ID: {orderDetails.orderId}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="w-5 h-5" />
                    <span>Order Items</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderItems.length > 0 ? (
                    orderItems.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="flex items-center space-x-4 p-4 border rounded-lg"
                      >
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {item.image ? (
                            <>
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const fallback =
                                    target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                              <div
                                className="absolute top-1 right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
                                style={{ display: "none" }}
                              >
                                {item.quantity}
                              </div>
                            </>
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Size: {item.size} • Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No order items found</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Information */}
              <Card className="mb-7">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="w-5 h-5" />
                    <span>Shipping Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Estimated Delivery
                      </p>
                      <p className="text-gray-900">
                        {orderDetails.estimatedDelivery}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Tracking Number
                      </p>
                      <p className="text-gray-900 font-mono">
                        {orderDetails.trackingNumber}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Delivery Address
                    </p>
                    <div className="text-gray-900">
                      {shippingAddress ? (
                        <>
                          <p>{shippingAddress.name}</p>
                          <p>{shippingAddress.street}</p>
                          <p>
                            {shippingAddress.city} - {shippingAddress.zip}
                          </p>
                          <p>{shippingAddress.phone}</p>
                        </>
                      ) : (
                        <p className="text-gray-500 italic">
                          Address information not available
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Order Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-900">₹{shipping}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (5%)</span>
                      <span className="text-gray-900">₹{tax}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Paid</span>
                      <span>₹{total}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Payment Status: Completed</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Package className="w-4 h-4" />
                      <span>Order Status: Processing</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link href="/products">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Continue Shopping
                      </Link>
                    </Button>

                    <Button variant="outline" asChild className="w-full">
                      <Link href="/account/dashboard">View Order History</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
