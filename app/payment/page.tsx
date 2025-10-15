"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  QrCode,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface PaymentPageProps {
  orderData?: {
    orderId: string;
    amount: number;
    items: any[];
  };
}

export default function PaymentPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [currentQRIndex, setCurrentQRIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [showUtrInput, setShowUtrInput] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [copiedUpiId, setCopiedUpiId] = useState(false);

  // Validate stock in real-time
  const validateStockInRealTime = async (orderData: any) => {
    try {
      for (const item of orderData.items) {
        const response = await fetch(`/api/products/${item._id || item.id}`);
        if (response.ok) {
          const productData = await response.json();
          const product = productData.product;

          if (product && product.variants) {
            const variant = product.variants.find(
              (v: any) =>
                v.size === item.selectedSize && v.color === item.selectedColor
            );

            if (variant) {
              console.log({
                variant: `${item.selectedSize}-${item.selectedColor}`,
                available: variant.stock,
                requested: item.qty,
                sufficient: variant.stock >= item.qty,
              });

              if (variant.stock < item.qty) {
                alert(
                  `❌ Stock Update: ${item.name} (${item.selectedSize}, ${item.selectedColor})\n\nAvailable: ${variant.stock}, Requested: ${item.qty}\n\nPlease reduce quantity or choose different variant.`
                );
                router.push("/cart");
                return;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error validating stock:", error);
    }
  };

  // Sample QR codes - replace with actual payment QR codes
  const qrCodes = [
    {
      id: 1,
      provider: "PhonePe",
      qrCode:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzAwMCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UGhvbmVQZTwvdGV4dD48L3N2Zz4=",
      upiId: "manualfits@phonepe",
    },
    {
      id: 2,
      provider: "Google Pay",
      qrCode:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzAwMCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+R29vZ2xlIFBheTwvdGV4dD48L3N2Zz4=",
      upiId: "manualfits@gpay",
    },
    {
      id: 3,
      provider: "Paytm",
      qrCode:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzAwMCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UGF5dG08L3RleHQ+PC9zdmc+",
      upiId: "manualfits@paytm",
    },
    {
      id: 4,
      provider: "BHIM",
      qrCode:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzAwMCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QkhJTTwvdGV4dD48L3N2Zz4=",
      upiId: "manualfits@bhim",
    },
    {
      id: 5,
      provider: "Amazon Pay",
      qrCode:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzAwMCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QW1hem9uIFBheTwvdGV4dD48L3N2Zz4=",
      upiId: "manualfits@amazon",
    },
  ];

  // Debug localStorage on mount
  useEffect(() => {
    console.log({
      token: localStorage.getItem("token"),
      user: localStorage.getItem("user"),
      pendingOrder: localStorage.getItem("pendingOrder"),
    });
  }, []);

  // Fetch payment settings and order data on component mount
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await fetch("/api/admin/public/payment-settings");

        if (response.ok) {
          const data = await response.json();
          setPaymentSettings(data.paymentSettings);

          // Set random QR index when payment settings are loaded
          if (data.paymentSettings?.qrCodes?.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * data.paymentSettings.qrCodes.length
            );
            setCurrentQRIndex(randomIndex);
          }
        } else {
          console.error(
            "Failed to fetch payment settings, status:",
            response.status
          );
        }
      } catch (error) {
        console.error("Failed to fetch payment settings:", error);
      }
    };

    fetchPaymentSettings();

    // Get order data from localStorage
    const pendingOrder = localStorage.getItem("pendingOrder");
    if (pendingOrder) {
      const parsedOrderData = JSON.parse(pendingOrder);
      setOrderData(parsedOrderData);

      // Validate stock in real-time before showing payment page
      validateStockInRealTime(parsedOrderData);
    } else {
      router.push("/checkout");
    }
  }, [router]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Time expired, redirect back to checkout
      router.push("/checkout");
    }
  }, [timeLeft, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUpiId(true);
      setTimeout(() => setCopiedUpiId(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!utrNumber.trim()) {
      alert("Please enter UTR number before submitting");
      return;
    }

    setIsProcessing(true);

    try {
      // Get order data from localStorage
      const pendingOrder = localStorage.getItem("pendingOrder");
      if (!pendingOrder) {
        router.push("/checkout");
        return;
      }

      const orderData = JSON.parse(pendingOrder);

      // Process payment and create order
      try {
        // Get user token for backend API call
        const token = localStorage.getItem("token");

        // Transform order items to match backend schema
        const transformedItems = orderData.items.map((item: any) => ({
          product: item.product || item._id || item.id,
          quantity: item.quantity || item.qty || 1,
          price: item.price || item.variants?.[0]?.price || 0,
          size:
            item.size || item.selectedSize || item.variants?.[0]?.size || "M",
          color:
            item.color ||
            item.selectedColor ||
            item.variants?.[0]?.color ||
            "Default",
        }));

        const orderPayload = {
          items: transformedItems,
          shippingAddress: orderData.shippingAddress,
          paymentMethod: "upi",
          totalAmount: orderData.totalAmount,
          utrNumber: utrNumber,
        };

        console.log(
          "User token value:",
          token ? `${token.substring(0, 20)}...` : "No token"
        );

        // Debug color data
        orderData.items.forEach((item: any, index: number) => {
          console.log({
            productId: item._id || item.id,
            selectedColor: item.selectedColor,
            color: item.color,
            variants: item.variants?.[0]?.color,
            finalColor: transformedItems[index]?.color,
          });
        });

        // Check if token exists
        if (!token) {
          console.error("❌ No authentication token found");
          alert("❌ Authentication Error: Please login again to place order");
          return;
        }

        // Create order in backend database
        const orderResponse = await fetch("/api/user/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderPayload),
        });

        let orderResult;
        if (orderResponse.ok) {
          orderResult = await orderResponse.json();
        } else {
          // If backend fails, log the error and generate local order ID
          const errorText = await orderResponse.text();
          console.error("❌ Backend order creation failed:", {
            status: orderResponse.status,
            statusText: orderResponse.statusText,
            error: errorText,
            url: "/api/user/orders",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token
                ? `Bearer ${token.substring(0, 20)}...`
                : "No token",
            },
          });

          // Show user-friendly error message
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              if (errorData.message.includes("Insufficient stock")) {
                alert(
                  `❌ Order Failed: ${errorData.message}\n\nPlease reduce quantity or choose different variant.`
                );
                return; // Don't proceed with local order creation
              } else if (errorData.message.includes("Product not found")) {
                alert(
                  `❌ Order Failed: ${errorData.message}\n\nProduct is no longer available.`
                );
                return;
              } else if (errorData.message.includes("variant not found")) {
                alert(
                  `❌ Order Failed: ${errorData.message}\n\nSelected variant is no longer available.`
                );
                return;
              } else if (
                errorData.message.includes("Token is not valid") ||
                errorData.message.includes("Unauthorized")
              ) {
                alert(
                  `❌ Authentication Error: ${errorData.message}\n\nPlease login again to place order.`
                );
                // Clear invalid token and redirect to login
                localStorage.removeItem("token");
                router.push("/login");
                return;
              } else {
                alert(`❌ Order Failed: ${errorData.message}`);
                return;
              }
            }
          } catch (e) {
            if (orderResponse.status === 401) {
              alert(
                `❌ Authentication Error: Please login again to place order.`
              );
              localStorage.removeItem("token");
              router.push("/login");
              return;
            } else if (orderResponse.status === 0 || !orderResponse.status) {
              alert(
                `❌ Network Error: Cannot connect to server. Please check your internet connection.`
              );
              return;
            } else {
              alert(
                `❌ Order Failed: Server error (${orderResponse.status}). Please try again.`
              );
              return;
            }
          }

          orderResult = {
            order: {
              _id: `ORD-${Date.now()}`,
              status: "pending",
              totalAmount: orderData.totalAmount,
              createdAt: new Date().toISOString(),
              items: orderData.items,
              shippingAddress: orderData.shippingAddress,
              paymentMethod: "upi",
            },
          };
        }

        // Save shipping address for order confirmation page
        if (orderData.shippingAddress) {
          localStorage.setItem(
            "orderShippingAddress",
            JSON.stringify(orderData.shippingAddress)
          );
        }

        // Save order to localStorage for dashboard (backup)
        const existingOrders = JSON.parse(
          localStorage.getItem("userOrders") || "[]"
        );
        const newOrder = {
          _id: orderResult.order._id,
          status: "pending",
          totalAmount: orderData.totalAmount,
          createdAt: new Date().toISOString(),
          items: orderData.items,
          shippingAddress: orderData.shippingAddress,
          paymentMethod: "upi",
          utrNumber: utrNumber,
        };
        existingOrders.unshift(newOrder);
        localStorage.setItem("userOrders", JSON.stringify(existingOrders));

        // Clear cart after successful payment
        await clearCart();

        // Clear pending order from localStorage
        localStorage.removeItem("pendingOrder");

        // Generate new random QR for next transaction
        if (paymentSettings?.qrCodes?.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * paymentSettings.qrCodes.length
          );
          setCurrentQRIndex(randomIndex);
          console.log(
            "New random QR generated for next transaction:",
            randomIndex
          );
        }

        // Redirect to order confirmation page
        router.push(
          `/order-confirmation?orderId=${orderResult.order._id}&amount=${orderData.totalAmount}&status=success`
        );
      } catch (error) {
        console.error("Error creating order:", error);
        setIsProcessing(false);
        alert("Error processing order. Please try again.");
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      setIsProcessing(false);
    }
  };

  const currentQR =
    paymentSettings?.qrCodes?.length > 0
      ? {
          id: 1,
          provider: "ManualFits",
          qrCode:
            paymentSettings.qrCodes[
              currentQRIndex % paymentSettings.qrCodes.length
            ].imageUrl,
          upiId:
            paymentSettings.qrCodes[
              currentQRIndex % paymentSettings.qrCodes.length
            ].upiId,
          upiName:
            paymentSettings.qrCodes[
              currentQRIndex % paymentSettings.qrCodes.length
            ].upiName,
        }
      : qrCodes[currentQRIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 lg:mt-15">
      {/* Header */}
      <div className="">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-semibold">Payment</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>Scan & Pay</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timer */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Clock
                    className={cn(
                      "w-5 h-5",
                      timeLeft < 60
                        ? "text-red-500"
                        : timeLeft < 120
                        ? "text-yellow-500"
                        : "text-green-500"
                    )}
                  />
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      timeLeft < 60
                        ? "text-red-500"
                        : timeLeft < 120
                        ? "text-yellow-500"
                        : "text-green-500"
                    )}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Complete payment within this time
                </p>
                <Progress
                  value={(timeLeft / 300) * 100}
                  className="w-full h-2"
                />
              </div>

              <Separator />

              {/* QR Code */}
              <div className="text-center space-y-4">
                <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                  <img
                    src={currentQR.qrCode}
                    alt={`${currentQR.provider} QR Code`}
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="space-y-2">
                  <Badge variant="outline" className="text-sm">
                    {currentQR.provider}
                  </Badge>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          UPI ID
                        </p>
                        <p className="text-sm text-gray-600 font-mono">
                          {currentQR.upiId}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(currentQR.upiId)}
                        className="ml-2"
                      >
                        {copiedUpiId ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {"upiName" in currentQR && currentQR.upiName && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Name:</span>{" "}
                        {currentQR.upiName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Amount */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">Amount to Pay</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{orderData?.totalAmount || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Open your UPI app
                    </p>
                    <p className="text-sm text-gray-600">
                      Open any UPI app on your phone (PhonePe, Google Pay,
                      Paytm, BHIM, etc.)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Scan the QR code
                    </p>
                    <p className="text-sm text-gray-600">
                      Use your phone's camera to scan the QR code above
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Enter amount and UPI ID
                    </p>
                    <p className="text-sm text-gray-600">
                      Enter ₹{orderData?.totalAmount || 0} as the payment amount
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">
                        UPI ID: {currentQR.upiId}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(currentQR.upiId)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedUpiId ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Complete payment
                    </p>
                    <p className="text-sm text-gray-600">
                      Enter your UPI PIN to complete the transaction
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* UTR Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="utr" className="text-sm font-medium">
                    Transaction Reference (UTR) Number
                  </Label>
                  <Input
                    id="utr"
                    type="text"
                    placeholder="Enter your UTR/Transaction ID"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Enter the UTR number from your UPI app after completing the
                    payment
                  </p>
                </div>
              </div>

              <Separator />

              {/* Submit Button */}
              <div className="space-y-4">
                <Button
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing Payment...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>I have made the payment</span>
                    </div>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Click this button only after completing the payment in your
                  UPI app
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
