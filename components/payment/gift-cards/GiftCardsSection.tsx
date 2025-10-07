"use client";

import React, { useState, useEffect } from "react";
import { Gift, Edit3 } from "lucide-react";
import { giftCardApi } from "@/lib/paymentApi";
import { TrashIcon } from "@/components/ui/skiper-ui/skiper42";

interface GiftCard {
  giftcard_id: string;
  code: string;
  balance: number;
  expiry_date: string;
  is_active: boolean;
}

interface GiftCardForm {
  code: string;
  balance: string;
  expiry_date: string;
  is_active: boolean;
}

export default function GiftCardsSection() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGiftCard, setEditingGiftCard] = useState<GiftCard | null>(null);
  const [form, setForm] = useState<GiftCardForm>({
    code: "",
    balance: "",
    expiry_date: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  // Fetch gift cards
  const fetchGiftCards = async () => {
    try {
      setLoading(true);
      const response = await giftCardApi.getAll();
      setGiftCards(response.gift_cards || []);
    } catch (error) {
      console.error("Error fetching gift cards:", error);
      console.error("Failed to fetch gift cards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftCards();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingGiftCard) {
        await giftCardApi.update(editingGiftCard.giftcard_id, form);
        console.log("Gift card updated successfully!");
      } else {
        await giftCardApi.add(form);
        console.log("Gift card added successfully!");
      }

      await fetchGiftCards();
      resetForm();
    } catch (error) {
      console.error("Error saving gift card:", error);
      console.error("Failed to save gift card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (giftCard: GiftCard) => {
    setEditingGiftCard(giftCard);
    setForm({
      code: giftCard.code || "",
      balance: giftCard.balance?.toString() || "",
      expiry_date: giftCard.expiry_date || "",
      is_active: giftCard.is_active || true,
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (giftCardId: string) => {
    if (!confirm("Are you sure you want to delete this gift card?")) return;

    try {
      setLoading(true);
      await giftCardApi.delete(giftCardId);
      console.log("Gift card deleted successfully!");
      await fetchGiftCards();
    } catch (error) {
      console.error("Error deleting gift card:", error);
      console.error("Failed to delete gift card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      code: "",
      balance: "",
      expiry_date: "",
      is_active: true,
    });
    setEditingGiftCard(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gift Cards</h2>
        <button
          onClick={() => {
            setEditingGiftCard(null);
            setForm({
              code: "",
              balance: "",
              expiry_date: "",
              is_active: true,
            });
            setShowForm(true);
          }}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center space-x-2"
          disabled={loading}
        >
          <Gift className="w-4 h-4" />
          <span>Add Gift Card</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {editingGiftCard ? "Edit Gift Card" : "Add New Gift Card"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gift Card Code *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Enter gift card code"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance (₹) *
                </label>
                <input
                  type="number"
                  value={form.balance}
                  onChange={(e) =>
                    setForm({ ...form, balance: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Enter balance amount"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) =>
                    setForm({ ...form, expiry_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm({ ...form, is_active: e.target.checked })
                    }
                    className="mr-2"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingGiftCard
                  ? "Update Gift Card"
                  : "Add Gift Card"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gift Cards List */}
      {loading && giftCards.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading gift cards...</p>
        </div>
      ) : giftCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {giftCards.map((card) => (
            <div
              key={card.giftcard_id}
              className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-800">Gift Card</h3>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    card.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {card.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Code</p>
                  <p className="font-mono text-lg font-bold text-gray-800">
                    {card.code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="text-xl font-bold text-green-600">
                    ₹{card.balance}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expires</p>
                  <p className="text-gray-700">
                    {new Date(card.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(card)}
                  className="text-gray-600 hover:text-gray-800 p-1"
                  title="Edit Gift Card"
                  disabled={loading}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(card.giftcard_id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Delete Gift Card"
                  disabled={loading}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No gift cards</p>
          <p className="text-gray-400">
            Add your first gift card to get started
          </p>
        </div>
      )}
    </div>
  );
}
