"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { safeLocalStorage } from "@/lib/storage";
import { cardApi, upiApi } from "@/lib/paymentApi";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DynamicBreadcrumb from "@/lib/breadcrumb";

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // All state hooks must be declared before any conditional returns
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [savedUPI, setSavedUPI] = useState<any[]>([]);
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

  // Fetch user addresses
  const fetchUserAddresses = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      if (!token) return;

      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_ADDRESS), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const addresses = data.addresses || [];
        setSavedAddresses(addresses);

        // Set default address as selected and filter to show only default
        const defaultAddress = addresses.find((addr: any) => addr.is_default);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.address_id);
          // Show only the default address
          setSavedAddresses([defaultAddress]);
        } else {
          // If no default address, show all addresses
          setSavedAddresses(addresses);
        }

        console.log("CheckoutPage - User addresses:", addresses);
        console.log("CheckoutPage - Default address:", defaultAddress);
      } else {
        console.error("Failed to fetch addresses:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching user addresses:", error);
    }
  };

  // Fetch saved cards
  const fetchSavedCards = async () => {
    try {
      const response = await cardApi.getAll();
      const cards = response.cards || [];
      setSavedCards(cards);

      // Set default card as selected and filter to show only default
      const defaultCard = cards.find((card: any) => card.is_default);
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
      const response = await upiApi.getAll();
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
      setIsLoading(false);

      if (isLoggedIn) {
        fetchUserAddresses();
        fetchSavedCards();
        fetchSavedUPI();
      }
    };

    checkLoginStatus();
  }, []);

  // Redirect to login if not logged in
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-lg">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-gray-700 mb-6">
            Please login to proceed with checkout.
          </p>
          <Link
            href="/account/login"
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * item.qty,
    0
  );
  const tax = +(subtotal * 0.05).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

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
        // Refresh addresses
        await fetchUserAddresses();
        setEditingAddress(null);
        alert("Address updated successfully!");
      } else {
        throw new Error("Failed to update address");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      alert("Failed to update address. Please try again.");
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
          state: "Delhi",
          zip: formData.pincode,
          country: "India",
          is_default: savedAddresses.length === 0,
        }),
      });

      if (response.ok) {
        // Refresh addresses
        await fetchUserAddresses();
        setShowNewAddressForm(false);
        alert("Address saved successfully!");
      } else {
        throw new Error("Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address. Please try again.");
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
      alert("Card saved successfully!");
    } catch (error) {
      console.error("Error saving card:", error);
      alert("Failed to save card. Please try again.");
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
      alert("UPI saved successfully!");
    } catch (error) {
      console.error("Error saving UPI:", error);
      alert("Failed to save UPI. Please try again.");
    }
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!selectedAddress && !showNewAddressForm) {
      alert("Please select an address or add a new one");
      return;
    }

    if (
      formData.paymentMethod === "card" &&
      !selectedCard &&
      !showNewCardForm
    ) {
      alert("Please select a card or add a new one");
      return;
    }

    if (formData.paymentMethod === "upi" && !selectedUPI && !showNewUPIForm) {
      alert("Please select a UPI or add a new one");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const token = safeLocalStorage.getItem("token");

      // Get shipping address
      let shippingAddress;
      if (showNewAddressForm) {
        shippingAddress = {
          name: formData.name,
          phone: formData.mobile,
          street: formData.address,
          city: formData.city,
          state: "Delhi",
          zip: formData.pincode,
          country: "India",
        };
      } else {
        const selectedAddr = savedAddresses.find(
          (addr) => addr.address_id === selectedAddress
        );
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

      // Prepare order data according to backend API
      const orderData = {
        items: cartItems.map((item) => ({
          product: item._id || item.id, // Use _id (ObjectId) if available, fallback to id
          quantity: item.qty,
          price: item.price,
        })),
        shippingAddress: shippingAddress,
        paymentMethod: formData.paymentMethod,
        totalAmount: total + 50, // Including shipping
      };

      console.log("Sending order data:", orderData);
      console.log("Cart items:", cartItems);
      console.log(
        "Cart items IDs:",
        cartItems.map((item) => ({ id: item.id, _id: item._id }))
      );

      // Validate that we have cart items
      if (cartItems.length === 0) {
        throw new Error("No items in cart");
      }

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
        console.log("Order placed successfully:", orderResult);

        // Clear cart after successful order
        await clearCart();
        console.log("Cart cleared after successful order");

        alert(`Order placed successfully! Order ID: ${orderResult.order._id}`);

        // Redirect to dashboard
        window.location.href = "/account/dashboard";
      } else {
        const errorData = await orderResponse.json();
        console.error("Order creation failed:", errorData);
        throw new Error(
          errorData.message || `Failed to place order: ${orderResponse.status}`
        );
      }
    } catch (error) {
      console.error("Error placing order:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error details:", errorMessage);
      alert(`Failed to place order: ${errorMessage}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addressUsed =
      selectedAddress !== null
        ? savedAddresses.find((addr) => addr.id === selectedAddress)
        : formData;

    alert(
      `✅ Order placed successfully!\n\nAddress:\n${JSON.stringify(
        addressUsed,
        null,
        2
      )}`
    );
  };

  return (
    <div className="mx-auto p-5 lg:p-20 pt-15 bg-gray-300">
      <DynamicBreadcrumb />
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Shipping Info */}
        <div className="flex-1 bg-gray-50 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

          {/* Saved Addresses */}
          {savedAddresses.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Saved Addresses</h3>
              {savedAddresses.map((addr) => (
                <div
                  key={addr.address_id}
                  className={`p-3 border rounded-lg mb-2 cursor-pointer transition relative ${
                    selectedAddress === addr.address_id
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-300"
                  }`}
                  onClick={() => handleAddressSelect(addr.address_id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">{addr.type}</p>
                      <p className="text-sm text-gray-600">
                        {addr.name}, {addr.street}, {addr.city} - {addr.zip}
                      </p>
                      {addr.is_default && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAddress(addr.address_id);
                      }}
                      className="p-1 text-gray-500 hover:text-gray-900 transition"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Address Form */}
          {editingAddress && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Edit Address</h3>
              <form className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className="w-full p-2 border rounded"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  className="w-full p-2 border rounded"
                  value={editFormData.phone}
                  onChange={handleEditChange}
                  required
                />
                <input
                  type="text"
                  name="street"
                  placeholder="Street Address"
                  className="w-full p-2 border rounded"
                  value={editFormData.street}
                  onChange={handleEditChange}
                  required
                />
                <div className="flex gap-4">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    className="w-1/2 p-2 border rounded"
                    value={editFormData.city}
                    onChange={handleEditChange}
                    required
                  />
                  <input
                    type="text"
                    name="zip"
                    placeholder="ZIP Code"
                    className="w-1/2 p-2 border rounded"
                    value={editFormData.zip}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAddress(null)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-900"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add New Address Button */}
          {!showNewAddressForm && !editingAddress && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleNewAddress}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-500 hover:text-gray-900 transition"
              >
                + Add New Address
              </button>
            </div>
          )}

          {/* New Address Form */}
          {showNewAddressForm && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Add New Address</h3>
              <form className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className="w-full p-2 border rounded"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="w-full p-2 border rounded"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <input
                  type="tel"
                  name="mobile"
                  placeholder="Mobile Number"
                  className="w-full p-2 border rounded"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  className="w-full p-2 border rounded"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="landmark"
                  placeholder="Landmark (Optional)"
                  className="w-full p-2 border rounded"
                  value={formData.landmark}
                  onChange={handleChange}
                />
                <div className="flex gap-4">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    className="w-1/2 p-2 border rounded"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="pincode"
                    placeholder="Pincode"
                    className="w-1/2 p-2 border rounded"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewAddress}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block mb-2 font-medium">Payment Method</label>
            <select
              name="paymentMethod"
              className="w-full p-2 border rounded"
              value={formData.paymentMethod}
              onChange={handleChange}
            >
              <option value="cod">Cash on Delivery</option>
              <option value="card">Credit/Debit Card</option>
              <option value="upi">UPI</option>
            </select>

            {/* Saved Cards Section */}
            {formData.paymentMethod === "card" && savedCards.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Saved Cards</h3>
                {savedCards.map((card) => (
                  <div
                    key={card.card_id}
                    className={`p-3 border rounded-lg mb-2 cursor-pointer transition ${
                      selectedCard === card.card_id
                        ? "border-gray-500 bg-gray-50"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedCard(card.card_id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">
                          {card.brand} ****{card.last4}
                        </p>
                        <p className="text-sm text-gray-600">
                          {card.cardholder_name} • Expires {card.expiry_month}/
                          {card.expiry_year}
                        </p>
                        {card.is_default && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">
                          {card.card_type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Card Button */}
            {formData.paymentMethod === "card" && !showNewCardForm && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowNewCardForm(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-500 hover:text-gray-900 transition"
                >
                  + Add New Card
                </button>
              </div>
            )}

            {/* New Card Form */}
            {formData.paymentMethod === "card" && showNewCardForm && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Add New Card</h3>
                <form className="space-y-4">
                  <div className="flex gap-4">
                    <select
                      name="card_type"
                      className="w-1/2 p-2 border rounded"
                      value={newCardData.card_type}
                      onChange={(e) =>
                        setNewCardData({
                          ...newCardData,
                          card_type: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="Credit">Credit Card</option>
                      <option value="Debit">Debit Card</option>
                    </select>
                    <input
                      type="text"
                      name="brand"
                      placeholder="Card Brand (Visa, Mastercard, etc.)"
                      className="w-1/2 p-2 border rounded"
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
                  <input
                    type="text"
                    name="last4"
                    placeholder="Last 4 digits"
                    className="w-full p-2 border rounded"
                    value={newCardData.last4}
                    onChange={(e) =>
                      setNewCardData({ ...newCardData, last4: e.target.value })
                    }
                    required
                  />
                  <input
                    type="text"
                    name="cardholder_name"
                    placeholder="Cardholder Name"
                    className="w-full p-2 border rounded"
                    value={newCardData.cardholder_name}
                    onChange={(e) =>
                      setNewCardData({
                        ...newCardData,
                        cardholder_name: e.target.value,
                      })
                    }
                    required
                  />
                  <div className="flex gap-4">
                    <input
                      type="text"
                      name="expiry_month"
                      placeholder="MM"
                      className="w-1/2 p-2 border rounded"
                      value={newCardData.expiry_month}
                      onChange={(e) =>
                        setNewCardData({
                          ...newCardData,
                          expiry_month: e.target.value,
                        })
                      }
                      required
                    />
                    <input
                      type="text"
                      name="expiry_year"
                      placeholder="YYYY"
                      className="w-1/2 p-2 border rounded"
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
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={newCardData.is_default}
                      onChange={(e) =>
                        setNewCardData({
                          ...newCardData,
                          is_default: e.target.checked,
                        })
                      }
                    />
                    <label className="text-sm">Set as default card</label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewCardForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewCard}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-900"
                    >
                      Save Card
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Saved UPI Section */}
            {formData.paymentMethod === "upi" && savedUPI.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Saved UPI</h3>
                {savedUPI.map((upi) => (
                  <div
                    key={upi.upi_id}
                    className={`p-3 border rounded-lg mb-2 cursor-pointer transition ${
                      selectedUPI === upi.upi_id
                        ? "border-gray-500 bg-gray-50"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedUPI(upi.upi_id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{upi.name}</p>
                        <p className="text-sm text-gray-600">{upi.upi_id}</p>
                        {upi.is_default && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New UPI Button */}
            {formData.paymentMethod === "upi" && !showNewUPIForm && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowNewUPIForm(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-gray-900 hover:text-gray-900 transition"
                >
                  + Add New UPI
                </button>
              </div>
            )}

            {/* New UPI Form */}
            {formData.paymentMethod === "upi" && showNewUPIForm && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Add New UPI</h3>
                <form className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="UPI Name (e.g., John Doe)"
                    className="w-full p-2 border rounded"
                    value={newUPIData.name}
                    onChange={(e) =>
                      setNewUPIData({ ...newUPIData, name: e.target.value })
                    }
                    required
                  />
                  <input
                    type="text"
                    name="upi_id"
                    placeholder="UPI ID (e.g., john@paytm, 9876543210@ybl)"
                    className="w-full p-2 border rounded"
                    value={newUPIData.upi_id}
                    onChange={(e) =>
                      setNewUPIData({ ...newUPIData, upi_id: e.target.value })
                    }
                    required
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={newUPIData.is_default}
                      onChange={(e) =>
                        setNewUPIData({
                          ...newUPIData,
                          is_default: e.target.checked,
                        })
                      }
                    />
                    <label className="text-sm">Set as default UPI</label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewUPIForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewUPI}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-900"
                    >
                      Save UPI
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* No saved payment methods message */}
            {formData.paymentMethod === "card" && savedCards.length === 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm">
                  No saved cards found. You can add cards in your account
                  settings.
                </p>
              </div>
            )}

            {formData.paymentMethod === "upi" && savedUPI.length === 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm">
                  No saved UPI found. You can add UPI in your account settings.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="w-full bg-gray-600 hover:bg-gray-900 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {isPlacingOrder ? "Placing Order..." : "Place Order"}
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3 h-80 bg-gray-50 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="flex justify-between mb-2">
            <span>Items ({cartItems.length})</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Shipping</span>
            <span>₹50</span>
          </div>
          <div className="flex justify-between mb-4">
            <span>Tax (5%)</span>
            <span>₹{tax}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-4">
            <span>Total</span>
            <span>₹{total + 50}</span> {/* shipping add */}
          </div>
        </div>
      </div>
    </div>
  );
}
