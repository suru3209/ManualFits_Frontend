"use client";

import React, { useState, useEffect } from "react";
import { CreditCard as CardIcon, Edit3 } from "lucide-react";
import { cardApi } from "@/lib/paymentApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrashIcon } from "@/components/ui/skiper-ui/skiper42";

interface SavedCard {
  card_id: string;
  card_type: string;
  brand: string;
  last4: string;
  expiry_month: number;
  expiry_year: number;
  cardholder_name: string;
  is_default: boolean;
}

interface CardForm {
  card_type: string;
  brand: string;
  last4: string;
  expiry_month: string;
  expiry_year: string;
  cardholder_name: string;
  is_default: boolean;
}

export default function SavedCardsSection() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<SavedCard | null>(null);
  const [form, setForm] = useState<CardForm>({
    card_type: "",
    brand: "",
    last4: "",
    expiry_month: "",
    expiry_year: "",
    cardholder_name: "",
    is_default: false,
  });
  const [loading, setLoading] = useState(false);

  // Fetch cards
  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await cardApi.getAll();
      setCards(response.cards || []);
    } catch (error) {
      console.error("Error fetching cards:", error);
      console.error("Failed to fetch cards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingCard) {
        await cardApi.update(editingCard.card_id, form);
        console.log("Card updated successfully!");
      } else {
        await cardApi.add(form);
        console.log("Card added successfully!");
      }

      await fetchCards();
      resetForm();
    } catch (error) {
      console.error("Error saving card:", error);
      console.error("Failed to save card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (card: SavedCard) => {
    setEditingCard(card);
    setForm({
      card_type: card.card_type || "",
      brand: card.brand || "",
      last4: card.last4 || "",
      expiry_month: card.expiry_month?.toString() || "",
      expiry_year: card.expiry_year?.toString() || "",
      cardholder_name: card.cardholder_name || "",
      is_default: card.is_default || false,
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (cardId: string) => {
    try {
      setLoading(true);
      await cardApi.delete(cardId);
      console.log("Card deleted successfully!");
      await fetchCards();
    } catch (error) {
      console.error("Error deleting card:", error);
      console.error("Failed to delete card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      card_type: "",
      brand: "",
      last4: "",
      expiry_month: "",
      expiry_year: "",
      cardholder_name: "",
      is_default: false,
    });
    setEditingCard(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Saved Cards</h2>
        <Button
          onClick={() => {
            setEditingCard(null);
            setForm({
              card_type: "",
              brand: "",
              last4: "",
              expiry_month: "",
              expiry_year: "",
              cardholder_name: "",
              is_default: false,
            });
            setShowForm(true);
          }}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center space-x-2"
          disabled={loading}
        >
          <CardIcon className="w-4 h-4" />
          <span>Add Card</span>
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {editingCard ? "Edit Card" : "Add New Card"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Type *
                </Label>
                <select
                  value={form.card_type}
                  onChange={(e) =>
                    setForm({ ...form, card_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  required
                  disabled={loading}
                >
                  <option value="">Select Card Type</option>
                  <option value="Credit">Credit Card</option>
                  <option value="Debit">Debit Card</option>
                  <option value="Prepaid">Prepaid Card</option>
                </select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand *
                </Label>
                <select
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  required
                  disabled={loading}
                >
                  <option value="">Select Brand</option>
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="RuPay">RuPay</option>
                  <option value="American Express">American Express</option>
                </select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Last 4 Digits *
                </Label>
                <Input
                  type="text"
                  value={form.last4}
                  onChange={(e) => setForm({ ...form, last4: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="1234"
                  maxLength={4}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Cardholder Name *
                </Label>
                <Input
                  type="text"
                  value={form.cardholder_name}
                  onChange={(e) =>
                    setForm({ ...form, cardholder_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Month *
                </Label>
                <select
                  value={form.expiry_month}
                  onChange={(e) =>
                    setForm({ ...form, expiry_month: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  required
                  disabled={loading}
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Year *
                </Label>
                <select
                  value={form.expiry_year}
                  onChange={(e) =>
                    setForm({ ...form, expiry_year: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  required
                  disabled={loading}
                >
                  <option value="">Year</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="md:col-span-2 flex items-center">
                <Label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) =>
                      setForm({ ...form, is_default: e.target.checked })
                    }
                    className="mr-2"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">
                    Set as default card
                  </span>
                </Label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingCard
                  ? "Update Card"
                  : "Add Card"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Cards List */}
      {loading && cards.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading cards...</p>
        </div>
      ) : cards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card
              key={card.card_id}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <CardIcon className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-gray-800">
                      {card.card_type}
                    </CardTitle>
                  </div>
                  {card.is_default && (
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-800"
                    >
                      Default
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Card Number</p>
                    <p className="font-mono text-lg font-bold text-gray-800">
                      {card.brand} •••• {card.last4}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cardholder</p>
                    <p className="text-gray-700">{card.cardholder_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expires</p>
                    <p className="text-gray-700">
                      {String(card.expiry_month).padStart(2, "0")}/
                      {card.expiry_year}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleEdit(card)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800 p-1"
                    title="Edit Card"
                    disabled={loading}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(card.card_id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete Card"
                    disabled={loading}
                  >
                    <TrashIcon />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CardIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No cards saved</p>
          <p className="text-gray-400">
            Add your first card for secure payments
          </p>
        </div>
      )}
    </div>
  );
}
