"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, Edit3 } from "lucide-react";
import { upiApi } from "@/lib/paymentApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrashIcon } from "@/components/ui/skiper-ui/skiper42";

interface UPI {
  upi_id: string;
  name: string;
  is_default: boolean;
}

interface UPIForm {
  upi_id: string;
  name: string;
  is_default: boolean;
}

export default function UPISection() {
  const [upiList, setUpiList] = useState<UPI[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUPI, setEditingUPI] = useState<UPI | null>(null);
  const [form, setForm] = useState<UPIForm>({
    upi_id: "",
    name: "",
    is_default: false,
  });
  const [loading, setLoading] = useState(false);

  // Fetch UPI list
  const fetchUPI = async () => {
    try {
      setLoading(true);
      const response = await upiApi.getAll();
      setUpiList(response.upi || []);
    } catch (error) {
      console.error("Error fetching UPI:", error);
      console.error("Failed to fetch UPI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUPI();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingUPI) {
        await upiApi.update(editingUPI.upi_id, form);
        console.log("UPI updated successfully!");
      } else {
        await upiApi.add(form);
        console.log("UPI added successfully!");
      }

      await fetchUPI();
      resetForm();
    } catch (error) {
      console.error("Error saving UPI:", error);
      console.error("Failed to save UPI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (upi: UPI) => {
    setEditingUPI(upi);
    setForm({
      upi_id: upi.upi_id || "",
      name: upi.name || "",
      is_default: upi.is_default || false,
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (upiId: string) => {
    try {
      setLoading(true);
      await upiApi.delete(upiId);
      console.log("UPI deleted successfully!");
      await fetchUPI();
    } catch (error) {
      console.error("Error deleting UPI:", error);
      console.error("Failed to delete UPI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      upi_id: "",
      name: "",
      is_default: false,
    });
    setEditingUPI(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Saved UPI</h2>
        <Button
          onClick={() => {
            setEditingUPI(null);
            setForm({ upi_id: "", name: "", is_default: false });
            setShowForm(true);
          }}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center space-x-2"
          disabled={loading}
        >
          <Smartphone className="w-4 h-4" />
          <span>Add UPI</span>
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {editingUPI ? "Edit UPI" : "Add New UPI"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  UPI ID *
                </Label>
                <Input
                  type="text"
                  value={form.upi_id}
                  onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="e.g., user@paytm, 9876543210@ybl"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </Label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="e.g., My Paytm UPI"
                  required
                  disabled={loading}
                />
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
                    Set as default UPI
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
                {loading ? "Saving..." : editingUPI ? "Update UPI" : "Add UPI"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* UPI List */}
      {loading && upiList.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading UPI...</p>
        </div>
      ) : upiList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upiList.map((upi) => (
            <Card
              key={upi.upi_id}
              className="bg-gradient-to-br from-gray-50 to-indigo-50 border-gray-200"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <CardTitle className="text-gray-800">{upi.name}</CardTitle>
                  </div>
                  {upi.is_default && (
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
                    <p className="text-sm text-gray-500">UPI ID</p>
                    <p className="font-mono text-gray-800 break-all">
                      {upi.upi_id}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleEdit(upi)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800 p-1"
                    title="Edit UPI"
                    disabled={loading}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(upi.upi_id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete UPI"
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
          <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No UPI saved</p>
          <p className="text-gray-400">
            Add your first UPI to get started with quick payments
          </p>
        </div>
      )}
    </div>
  );
}
