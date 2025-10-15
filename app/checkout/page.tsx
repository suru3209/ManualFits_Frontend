"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { safeLocalStorage } from "@/lib/storage";
import { cardApi, upiApi } from "@/lib/paymentApi";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Edit2,
  MapPin,
  CreditCard,
  Smartphone,
  Truck,
  Shield,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

interface CheckoutAddress {
  address_id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  type: string;
  is_default: boolean;
}

interface CheckoutCard {
  card_id: string;
  card_type: string;
  brand: string;
  last4: string;
  expiry_month: number;
  expiry_year: number;
  cardholder_name: string;
  is_default: boolean;
}

interface CheckoutUPI {
  upi_id: string;
  name: string;
  is_default: boolean;
}

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  // Validate stock before checkout
  const validateStockBeforeCheckout = async (cartItems: any[]) => {
    try {
      for (const item of cartItems) {
        const response = await fetch(`/api/products/${item._id || item.id}`);
        if (response.ok) {
          const productData = await response.json();
          const product = productData.product;

          if (
            product &&
            product.variants &&
            item.selectedSize &&
            item.selectedColor
          ) {
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
                return {
                  valid: false,
                  message: `${item.name} (${item.selectedSize}, ${item.selectedColor}): Available ${variant.stock}, Requested ${item.qty}`,
                };
              }
            }
          }
        }
      }

      return { valid: true, message: "All items have sufficient stock" };
    } catch (error) {
      console.error("Error validating stock:", error);
      return { valid: false, message: "Error validating stock" };
    }
  };
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // All state hooks must be declared before any conditional returns
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<CheckoutAddress[]>([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<CheckoutCard[]>([]);
  const [savedUPI, setSavedUPI] = useState<CheckoutUPI[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedUPI, setSelectedUPI] = useState<string | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [showNewUPIForm, setShowNewUPIForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
    type: "Home",
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    landmark: "",
    city: "",
    pincode: "",
    state: "",
    paymentMethod: "cod",
  });
  const [newCardData, setNewCardData] = useState({
    card_type: "Credit",
    brand: "",
    last4: "",
    expiry_month: "",
    expiry_year: "",
    cardholder_name: "",
    is_default: false,
  });
  const [newUPIData, setNewUPIData] = useState({
    upi_id: "",
    name: "",
    is_default: false,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Fetch location details from pincode
  const fetchLocationFromPincode = async (pincode: string) => {
    if (!pincode || pincode.length !== 6) return;

    setIsLoadingLocation(true);
    try {
      // Using Indian Postal API for pincode lookup
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await response.json();

      if (
        data &&
        data[0] &&
        data[0].Status === "Success" &&
        data[0].PostOffice &&
        data[0].PostOffice.length > 0
      ) {
        const postOffice = data[0].PostOffice[0];
        const city = postOffice.District || postOffice.City || "";
        const state = postOffice.State || "";

        setFormData((prev) => ({
          ...prev,
          city: city,
          state: state,
        }));

        showToast(`Location auto-filled: ${city}, ${state}`);
      } else {
        showToast(
          "Pincode not found. Please enter city and state manually.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      showToast(
        "Failed to fetch location details. Please enter manually.",
        "error"
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle pincode change with debounce
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, pincode: value }));

    // Clear city and state when pincode changes
    if (value.length < 6) {
      setFormData((prev) => ({ ...prev, city: "", state: "" }));
    }
  };

  // Handle pincode blur to fetch location
  const handlePincodeBlur = () => {
    if (formData.pincode.length === 6) {
      fetchLocationFromPincode(formData.pincode);
    }
  };

  // Fetch user addresses
  const fetchUserAddresses = async () => {
    try {
      const token = safeLocalStorage.getItem("token");

      if (!token) {
        return;
      }

      const apiUrl = buildApiUrl(API_ENDPOINTS.USER_ADDRESS);

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        const addresses = data.addresses || [];
        setSavedAddresses(addresses);

        // Set default address as selected and filter to show only default
        const defaultAddress = addresses.find(
          (addr: unknown) =>
            (addr as unknown as { is_default?: boolean }).is_default
        );
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.address_id);
          // Show only the default address
          setSavedAddresses([defaultAddress]);
        } else {
          // If no default address, show all addresses
          setSavedAddresses(addresses);
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch addresses:", response.status, errorText);
      }
    } catch (error) {
      console.error("Error fetching user addresses:", error);
    }
  };

  // Fetch saved cards
  const fetchSavedCards = async () => {
    try {
      const response = await cardApi.getAll();
      const cards = (response as any).cards || [];
      setSavedCards(cards);

      // Set default card as selected and filter to show only default
      const defaultCard = cards.find(
        (card: unknown) =>
          (card as unknown as { is_default?: boolean }).is_default
      );
      if (defaultCard) {
        setSelectedCard(defaultCard.card_id);
        // Show only the default card
        setSavedCards([defaultCard]);
      } else {
        // If no default card, show all cards
        setSavedCards(cards);
      }
    } catch (error) {
      console.error("Error fetching saved cards:", error);
    }
  };

  // Fetch saved UPI
  const fetchSavedUPI = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await upiApi.getAll();

      if (!response.success) {
        console.error("CheckoutPage - UPI fetch failed:", response.error);
        showToast("Failed to fetch UPI data", "error");
        return;
      }

      const upiList = response.upi || [];
      setSavedUPI(upiList);

      // Set default UPI as selected and filter to show only default
      const defaultUPI = upiList.find((upi: any) => upi.is_default);

      if (defaultUPI) {
        setSelectedUPI(defaultUPI.upi_id);
        // Show only the default UPI
        setSavedUPI([defaultUPI]);
      } else {
        // If no default UPI, show all UPI
        setSavedUPI(upiList);
      }
    } catch (error) {
      console.error("Error fetching saved UPI:", error);
      showToast("Error fetching UPI data", "error");
    }
  };

  // Check login status and fetch addresses
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = safeLocalStorage.getItem("token");
      const user = safeLocalStorage.getItem("user");
      const isLoggedIn = !!(
        token &&
        user &&
        user !== "undefined" &&
        user !== "null"
      );
      setIsLoggedIn(isLoggedIn);

      if (isLoggedIn) {
        // Fetch all data in parallel
        Promise.all([
          fetchUserAddresses(),
          fetchSavedCards(),
          fetchSavedUPI(),
        ]).finally(() => {
          setIsPageLoading(false);
        });
      } else {
        console.log(
          "CheckoutPage - User is not logged in, skipping data fetch"
        );
        setIsPageLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Debug: Log cart items whenever they change
  useEffect(() => {
    console.log({
      totalItems: cartItems.length,
      cartItems: cartItems.map((item, index) => ({
        index: index,
        id: item._id || item.id,
        name: item.name || item.title,
        qty: item.qty,
        price: item.price,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        hasSelectedVariant: !!item.selectedVariant,
      })),
      completeCartArray: cartItems,
    });
  }, [cartItems]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Login Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Please login to proceed with checkout and complete your purchase.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/account/login">Login Now</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * item.qty,
    0
  );
  const tax = +(subtotal * 0.05).toFixed(2);
  const shipping = 50;
  const total = +(subtotal + tax + shipping).toFixed(2);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddress(addressId);
    setShowNewAddressForm(false);
    setEditingAddress(null);
  };

  const handleNewAddress = () => {
    setShowNewAddressForm(true);
    setSelectedAddress(null);
    setEditingAddress(null);
  };

  const handleEditAddress = (addressId: string) => {
    const address = savedAddresses.find(
      (addr) => addr.address_id === addressId
    );
    if (address) {
      setEditingAddress(addressId);
      setEditFormData({
        name: address.name,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        type: address.type,
      });
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.USER_ADDRESS}/${editingAddress}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editFormData),
        }
      );

      if (response.ok) {
        await fetchUserAddresses();
        setEditingAddress(null);
        showToast("Address updated successfully!");
      } else {
        throw new Error("Failed to update address");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      showToast("Failed to update address. Please try again.", "error");
    }
  };

  const handleSaveNewAddress = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_ADDRESS), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "Home",
          name: formData.name,
          phone: formData.mobile,
          street: formData.address,
          city: formData.city,
          state: formData.state || "Delhi",
          zip: formData.pincode,
          country: "India",
          is_default: savedAddresses.length === 0,
        }),
      });

      if (response.ok) {
        await fetchUserAddresses();
        setShowNewAddressForm(false);
        showToast("Address saved successfully!");
      } else {
        throw new Error("Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      showToast("Failed to save address. Please try again.", "error");
    }
  };

  const handleSaveNewCard = async () => {
    try {
      await cardApi.add(newCardData);
      await fetchSavedCards();
      setShowNewCardForm(false);
      setNewCardData({
        card_type: "Credit",
        brand: "",
        last4: "",
        expiry_month: "",
        expiry_year: "",
        cardholder_name: "",
        is_default: false,
      });
      showToast("Card saved successfully!");
    } catch (error) {
      console.error("Error saving card:", error);
      showToast("Failed to save card. Please try again.", "error");
    }
  };

  const handleSaveNewUPI = async () => {
    try {
      await upiApi.add(newUPIData);
      await fetchSavedUPI();
      setShowNewUPIForm(false);
      setNewUPIData({
        upi_id: "",
        name: "",
        is_default: false,
      });
      showToast("UPI saved successfully!");
    } catch (error) {
      console.error("Error saving UPI:", error);
      showToast("Failed to save UPI. Please try again.", "error");
    }
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!selectedAddress && !showNewAddressForm) {
      showToast("Please select an address or add a new one", "error");
      return;
    }

    if (cartItems.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    setIsPlacingOrder(true);

    try {
      // For UPI payments, redirect to payment page
      if (formData.paymentMethod === "upi") {
        // Store order data in localStorage for payment page
        const orderData = {
          items: cartItems,
          totalAmount: total,
          shippingAddress: showNewAddressForm
            ? {
                name: formData.name,
                phone: formData.mobile,
                street: formData.address,
                city: formData.city,
                state: formData.state || "Delhi",
                zip: formData.pincode,
                country: "India",
              }
            : savedAddresses.find(
                (addr) => addr.address_id === selectedAddress
              ),
        };

        // Validate stock before saving to localStorage
        const stockValidationResult = await validateStockBeforeCheckout(
          cartItems
        );
        if (!stockValidationResult.valid) {
          showToast(`❌ Stock Issue: ${stockValidationResult.message}`);
          return;
        }

        localStorage.setItem("pendingOrder", JSON.stringify(orderData));
        // Also save cart items for order confirmation page
        localStorage.setItem("lastOrderItems", JSON.stringify(cartItems));

        // Redirect to payment page
        router.push("/payment");
        return;
      }

      // For COD and card payments, proceed with normal order flow
      const token = safeLocalStorage.getItem("token");

      // Get shipping address
      let shippingAddress;
      if (showNewAddressForm) {
        shippingAddress = {
          name: formData.name,
          phone: formData.mobile,
          street: formData.address,
          city: formData.city,
          state: formData.state || "Delhi",
          zip: formData.pincode,
          country: "India",
        };
      } else {
        const selectedAddr = savedAddresses.find(
          (addr) => addr.address_id === selectedAddress
        );
        if (selectedAddr) {
          shippingAddress = {
            name: selectedAddr.name,
            phone: selectedAddr.phone,
            street: selectedAddr.street,
            city: selectedAddr.city,
            state: selectedAddr.state,
            zip: selectedAddr.zip,
            country: selectedAddr.country,
          };
        }
      }

      // Prepare order data according to backend API
      console.log({
        originalCartItems: cartItems,
        cartItemsDetails: cartItems.map((item, index) => ({
          index: index,
          productId: item._id || item.id,
          productName: item.name || item.title,
          quantity: item.qty,
          price: item.price,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          selectedVariant: item.selectedVariant,
          allFields: Object.keys(item),
          completeItem: item,
        })),
      });

      const orderData = {
        items: cartItems.map((item) => ({
          product: item._id || item.id,
          quantity: item.qty,
          price: item.price,
          size: item.selectedSize || (item as any).size || "M",
          color: item.selectedColor || (item as any).color || "Default",
        })),
        shippingAddress: shippingAddress,
        paymentMethod: formData.paymentMethod,
        totalAmount: total,
      };

      console.log({
        orderData: orderData,
        orderItems: orderData.items,
        orderItemsDetails: orderData.items.map((item, index) => ({
          index: index,
          productId: item.product,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color,
        })),
      });

      // Place order
      const orderResponse = await fetch(
        buildApiUrl(API_ENDPOINTS.USER_ORDERS),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        }
      );

      if (orderResponse.ok) {
        const orderResult = await orderResponse.json();

        // Save cart items for order confirmation page
        localStorage.setItem("lastOrderItems", JSON.stringify(cartItems));

        // Save order to localStorage for dashboard
        const existingOrders = JSON.parse(
          localStorage.getItem("userOrders") || "[]"
        );
        const newOrder = {
          _id: orderResult.order._id,
          status: "pending",
          totalAmount: total,
          createdAt: new Date().toISOString(),
          items: cartItems,
          shippingAddress: shippingAddress,
          paymentMethod: formData.paymentMethod,
        };
        existingOrders.unshift(newOrder);
        localStorage.setItem("userOrders", JSON.stringify(existingOrders));

        // Clear cart after successful order
        await clearCart();

        // Redirect to order confirmation page
        router.push(
          `/order-confirmation?orderId=${orderResult.order._id}&amount=${total}&status=success`
        );
      } else {
        let errorData;
        try {
          errorData = await orderResponse.json();
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorData = {};
        }

        console.error("Order creation failed:", {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          errorData: errorData,
          url: orderResponse.url,
        });

        throw new Error(
          errorData.message ||
            errorData.error ||
            `Failed to place order: ${orderResponse.status} ${orderResponse.statusText}`
        );
      }
    } catch (error) {
      console.error("Error placing order:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      showToast(`Failed to place order: ${errorMessage}`, "error");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Show loading state while page is initializing
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 h-12 w-12"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            Loading checkout...
          </h2>
          <p className="text-sm text-gray-500">
            Please wait while we prepare your checkout
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Breadcrumb */}
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
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
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                Home
              </Link>
              <span className="text-gray-400">/</span>
              <Link href="/cart" className="text-gray-500 hover:text-gray-700">
                Cart
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Checkout</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Shipping Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Saved Addresses */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      Saved Addresses
                    </Label>
                    <div className="grid gap-3">
                      {savedAddresses.map((addr, index) => (
                        <div
                          key={`addr-${addr.address_id}-${index}`}
                          className={cn(
                            "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                            selectedAddress === addr.address_id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => handleAddressSelect(addr.address_id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="secondary">{addr.type}</Badge>
                                {addr.is_default && (
                                  <Badge
                                    variant="default"
                                    className="bg-green-500"
                                  >
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium text-gray-900">
                                {addr.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {addr.street}, {addr.city} - {addr.zip}
                              </p>
                              <p className="text-sm text-gray-500">
                                {addr.phone}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAddress(addr.address_id);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edit Address Form */}
                {editingAddress && (
                  <Card className="border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Edit Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Full Name</Label>
                          <Input
                            id="edit-name"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-phone">Phone Number</Label>
                          <Input
                            id="edit-phone"
                            name="phone"
                            type="tel"
                            value={editFormData.phone}
                            onChange={handleEditChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-street">Street Address</Label>
                        <Input
                          id="edit-street"
                          name="street"
                          value={editFormData.street}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-city">City</Label>
                          <Input
                            id="edit-city"
                            name="city"
                            value={editFormData.city}
                            onChange={handleEditChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-zip">ZIP Code</Label>
                          <Input
                            id="edit-zip"
                            name="zip"
                            value={editFormData.zip}
                            onChange={handleEditChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setEditingAddress(null)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Add New Address Button */}
                {!showNewAddressForm && !editingAddress && (
                  <Button
                    variant="outline"
                    className="w-full h-12 border-dashed"
                    onClick={handleNewAddress}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Address
                  </Button>
                )}

                {/* New Address Form */}
                {showNewAddressForm && (
                  <Card className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Add New Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <Input
                          id="mobile"
                          name="mobile"
                          type="tel"
                          value={formData.mobile}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="landmark">Landmark (Optional)</Label>
                        <Input
                          id="landmark"
                          name="landmark"
                          value={formData.landmark}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            disabled={isLoadingLocation}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pincode">Pincode</Label>
                          <div className="relative">
                            <Input
                              id="pincode"
                              name="pincode"
                              placeholder="Enter 6-digit pincode"
                              value={formData.pincode}
                              onChange={handlePincodeChange}
                              onBlur={handlePincodeBlur}
                              maxLength={6}
                              pattern="[0-9]{6}"
                              required
                              className="pr-10"
                            />
                            {isLoadingLocation && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Enter pincode to auto-fill city and state
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          placeholder="Enter your state"
                          value={formData.state || ""}
                          onChange={handleChange}
                          disabled={isLoadingLocation}
                          required
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowNewAddressForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveNewAddress}>
                          Save Address
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4" />
                          <span>Cash on Delivery</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="card" disabled>
                        <div className="flex items-center space-x-2 opacity-50">
                          <CreditCard className="w-4 h-4" />
                          <span>Credit/Debit Card (Coming Soon)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="upi">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="w-4 h-4" />
                          <span>UPI</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Saved Cards Section */}
                {formData.paymentMethod === "card" && savedCards.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Saved Cards</Label>
                    <div className="grid gap-3">
                      {savedCards.map((card, index) => (
                        <div
                          key={`card-${card.card_id}-${index}`}
                          className={cn(
                            "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                            selectedCard === card.card_id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => setSelectedCard(card.card_id)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {card.brand} ****{card.last4}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {card.cardholder_name} • Expires{" "}
                                  {card.expiry_month}/{card.expiry_year}
                                </p>
                                {card.is_default && (
                                  <Badge
                                    variant="default"
                                    className="bg-green-500 mt-1"
                                  >
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge variant="secondary">{card.card_type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Card Button */}
                {formData.paymentMethod === "card" && !showNewCardForm && (
                  <Button
                    variant="outline"
                    className="w-full h-12 border-dashed"
                    onClick={() => setShowNewCardForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Card
                  </Button>
                )}

                {/* New Card Form */}
                {formData.paymentMethod === "card" && showNewCardForm && (
                  <Card className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Add New Card</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Card Type</Label>
                          <Select
                            value={newCardData.card_type}
                            onValueChange={(value) =>
                              setNewCardData({
                                ...newCardData,
                                card_type: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Credit">
                                Credit Card
                              </SelectItem>
                              <SelectItem value="Debit">Debit Card</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brand">Card Brand</Label>
                          <Input
                            id="brand"
                            placeholder="Visa, Mastercard, etc."
                            value={newCardData.brand}
                            onChange={(e) =>
                              setNewCardData({
                                ...newCardData,
                                brand: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last4">Last 4 Digits</Label>
                        <Input
                          id="last4"
                          placeholder="1234"
                          value={newCardData.last4}
                          onChange={(e) =>
                            setNewCardData({
                              ...newCardData,
                              last4: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardholder_name">Cardholder Name</Label>
                        <Input
                          id="cardholder_name"
                          value={newCardData.cardholder_name}
                          onChange={(e) =>
                            setNewCardData({
                              ...newCardData,
                              cardholder_name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry_month">Expiry Month</Label>
                          <Input
                            id="expiry_month"
                            placeholder="MM"
                            value={newCardData.expiry_month}
                            onChange={(e) =>
                              setNewCardData({
                                ...newCardData,
                                expiry_month: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiry_year">Expiry Year</Label>
                          <Input
                            id="expiry_year"
                            placeholder="YYYY"
                            value={newCardData.expiry_year}
                            onChange={(e) =>
                              setNewCardData({
                                ...newCardData,
                                expiry_year: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_default_card"
                          checked={newCardData.is_default}
                          onCheckedChange={(checked) =>
                            setNewCardData({
                              ...newCardData,
                              is_default: !!checked,
                            })
                          }
                        />
                        <Label htmlFor="is_default_card" className="text-sm">
                          Set as default card
                        </Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowNewCardForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveNewCard}>Save Card</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Saved UPI Section */}
                {(() => {
                  console.log({
                    paymentMethod: formData.paymentMethod,
                    savedUPILength: savedUPI.length,
                    savedUPI: savedUPI,
                    shouldShow:
                      formData.paymentMethod === "upi" && savedUPI.length > 0,
                  });
                  return (
                    formData.paymentMethod === "upi" && savedUPI.length > 0
                  );
                })() && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Saved UPI</Label>
                    <div className="grid gap-3">
                      {savedUPI.map((upi, index) => (
                        <div
                          key={`upi-${upi.upi_id}-${index}`}
                          className={cn(
                            "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                            selectedUPI === upi.upi_id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => setSelectedUPI(upi.upi_id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                              <Smartphone className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {upi.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {upi.upi_id}
                              </p>
                              {upi.is_default && (
                                <Badge
                                  variant="default"
                                  className="bg-green-500 mt-1"
                                >
                                  Default
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New UPI Button */}
                {formData.paymentMethod === "upi" && !showNewUPIForm && (
                  <Button
                    variant="outline"
                    className="w-full h-12 border-dashed"
                    onClick={() => setShowNewUPIForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New UPI
                  </Button>
                )}

                {/* New UPI Form */}
                {formData.paymentMethod === "upi" && showNewUPIForm && (
                  <Card className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Add New UPI</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="upi_name">UPI Name</Label>
                        <Input
                          id="upi_name"
                          placeholder="John Doe"
                          value={newUPIData.name}
                          onChange={(e) =>
                            setNewUPIData({
                              ...newUPIData,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="upi_id">UPI ID</Label>
                        <Input
                          id="upi_id"
                          placeholder="john@paytm, 9876543210@ybl"
                          value={newUPIData.upi_id}
                          onChange={(e) =>
                            setNewUPIData({
                              ...newUPIData,
                              upi_id: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_default_upi"
                          checked={newUPIData.is_default}
                          onCheckedChange={(checked) =>
                            setNewUPIData({
                              ...newUPIData,
                              is_default: !!checked,
                            })
                          }
                        />
                        <Label htmlFor="is_default_upi" className="text-sm">
                          Set as default UPI
                        </Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowNewUPIForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveNewUPI}>Save UPI</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* No saved payment methods message */}
                {formData.paymentMethod === "card" &&
                  savedCards.length === 0 &&
                  !showNewCardForm && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-gray-600 text-sm">
                        No saved cards found. You can add cards in your account
                        settings.
                      </p>
                    </div>
                  )}

                {formData.paymentMethod === "upi" &&
                  savedUPI.length === 0 &&
                  !showNewUPIForm && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-gray-600 text-sm">
                        No saved UPI found. You can add UPI in your account
                        settings.
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item, index) => {
                    // Debug: Log complete product object for each cart item
                    console.log({
                      itemIndex: index,
                      productId: item._id || item.id,
                      productName: item.name || item.title,
                      productPrice: item.price,
                      productOriginalPrice: item.originalPrice,
                      quantity: item.qty,
                      selectedSize: item.selectedSize,
                      selectedColor: item.selectedColor,
                      selectedVariant: item.selectedVariant,
                      productImages: item.images,
                      productSKU: item.sku,
                      productVariants: item.variants,
                      completeProductObject: item,
                      allProductFields: Object.keys(item),
                    });

                    return (
                      <div
                        key={`cart-item-${item._id || item.id}-${index}`}
                        className="flex items-center space-x-3"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {item.images?.[0] ? (
                            <>
                              <img
                                src={item.images[0]}
                                alt={item.name || item.title}
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
                                {item.qty}
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center w-full h-full">
                              <span className="text-xs font-medium text-gray-600">
                                {item.qty}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name || item.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Size:{" "}
                            {(item as any).selectedSize ||
                              (item as any).size ||
                              "One Size"}{" "}
                            | Color:{" "}
                            {(item as any).selectedColor ||
                              (item as any).color ||
                              "Default"}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          ₹{(item.price || 0) * item.qty}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Items ({cartItems.length})
                    </span>
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
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || cartItems.length === 0}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  {isPlacingOrder ? "Placing Order..." : "Place Order"}
                </Button>

                {cartItems.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Your cart is empty
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
