"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Upload,
  X,
  QrCode,
  Edit,
  Trash2,
  Save,
  Loader2,
  Plus,
} from "lucide-react";
import Image from "next/image";

interface QRCodeDetails {
  imageUrl: string;
  upiId: string;
  upiName: string;
}

interface PaymentSettings {
  qrCodes: QRCodeDetails[];
}

export default function PaymentSettingsPage() {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    qrCodes: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state for adding/editing QR codes
  const [formData, setFormData] = useState({
    upiId: "",
    upiName: "",
    imageUrl: "",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${backendUrl}/api/admin/payment-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentSettings(data.paymentSettings || { qrCodes: [] });
      }
    } catch (error) {
      console.error("Failed to fetch payment settings:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error("Failed to fetch payment settings: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${backendUrl}/api/admin/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.secure_url) {
          setFormData((prev) => ({ ...prev, imageUrl: data.secure_url }));
          toast.success("Image uploaded successfully");
        } else {
          throw new Error(data.message || "Upload failed");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddQRCode = async () => {
    if (!formData.imageUrl || !formData.upiId || !formData.upiName) {
      toast.error("Please fill all fields and upload an image");
      return;
    }

    try {
      let updatedQrCodes;

      if (editingIndex !== null) {
        // Update existing QR code
        updatedQrCodes = paymentSettings.qrCodes.map((qr, index) =>
          index === editingIndex ? formData : qr
        );
      } else {
        // Add new QR code
        updatedQrCodes = [...paymentSettings.qrCodes, formData];
      }

      // Update local state
      setPaymentSettings((prev) => ({
        ...prev,
        qrCodes: updatedQrCodes,
      }));

      // Save to database immediately
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${backendUrl}/api/admin/payment-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentSettings: {
            qrCodes: updatedQrCodes,
          },
        }),
      });

      if (response.ok) {
        toast.success(
          editingIndex !== null
            ? "QR code updated successfully"
            : "QR code added successfully"
        );
        // Reset form
        setFormData({ upiId: "", upiName: "", imageUrl: "" });
        setEditingIndex(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save QR code");
      }
    } catch (error) {
      console.error("Failed to save QR code:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error("Failed to save QR code: " + errorMessage);

      // Revert local state on error
      await fetchPaymentSettings();
    }
  };

  const handleEditQRCode = (index: number) => {
    const qrCode = paymentSettings.qrCodes[index];
    setFormData({
      upiId: qrCode.upiId,
      upiName: qrCode.upiName,
      imageUrl: qrCode.imageUrl,
    });
    setEditingIndex(index);
  };

  const handleDeleteQRCode = async (index: number) => {
    if (confirm("Are you sure you want to delete this QR code?")) {
      try {
        const updatedQrCodes = paymentSettings.qrCodes.filter(
          (_, i) => i !== index
        );

        // Update local state
        setPaymentSettings((prev) => ({
          ...prev,
          qrCodes: updatedQrCodes,
        }));

        // Save to database immediately
        const token = localStorage.getItem("adminToken");
        const backendUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

        const response = await fetch(
          `${backendUrl}/api/admin/payment-settings`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              paymentSettings: {
                qrCodes: updatedQrCodes,
              },
            }),
          }
        );

        if (response.ok) {
          toast.success("QR code deleted successfully");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete QR code");
        }
      } catch (error) {
        console.error("Failed to delete QR code:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error("Failed to delete QR code: " + errorMessage);

        // Revert local state on error
        await fetchPaymentSettings();
      }
    }
  };

  const handleCancelEdit = () => {
    setFormData({ upiId: "", upiName: "", imageUrl: "" });
    setEditingIndex(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${backendUrl}/api/admin/payment-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentSettings),
      });

      if (response.ok) {
        toast.success("Payment settings updated successfully");
        await fetchPaymentSettings();
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update payment settings"
        );
      }
    } catch (error) {
      console.error("Failed to save payment settings:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error("Failed to save payment settings: " + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage QR codes and UPI payment details
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Add/Edit QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                {editingIndex !== null ? "Edit QR Code" : "Add New QR Code"}
              </CardTitle>
              <CardDescription>
                {editingIndex !== null
                  ? "Update QR code details"
                  : "Upload QR code image and set UPI details"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code Image Upload */}
              <div className="space-y-2">
                <Label>QR Code Image *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {formData.imageUrl ? (
                    <div className="space-y-4">
                      <div className="aspect-square max-w-48 mx-auto border rounded-lg overflow-hidden">
                        <Image
                          src={formData.imageUrl}
                          alt="QR Code"
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement)
                              .files?.[0];
                            if (file) handleImageUpload(file);
                          };
                          input.click();
                        }}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Replace Image
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) handleImageUpload(file);
                        };
                        input.click();
                      }}
                    >
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-sm text-gray-500">
                        Click to upload QR code image
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* UPI Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID *</Label>
                  <Input
                    id="upiId"
                    value={formData.upiId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        upiId: e.target.value,
                      }))
                    }
                    placeholder="yourname@paytm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upiName">UPI Name *</Label>
                  <Input
                    id="upiName"
                    value={formData.upiName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        upiName: e.target.value,
                      }))
                    }
                    placeholder="Your Business Name"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleAddQRCode} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  {editingIndex !== null ? "Update QR Code" : "Add QR Code"}
                </Button>
                {editingIndex !== null && (
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: QR Codes List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Codes ({paymentSettings.qrCodes.length})
              </CardTitle>
              <CardDescription>Manage your existing QR codes</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentSettings.qrCodes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No QR codes added yet</p>
                  <p className="text-sm">
                    Add your first QR code using the form on the left
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentSettings.qrCodes.map((qrCode, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">QR Code {index + 1}</h3>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditQRCode(index)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteQRCode(index)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {/* Mini QR Image */}
                        <div className="aspect-square border rounded-lg overflow-hidden">
                          <Image
                            src={qrCode.imageUrl}
                            alt={`QR Code ${index + 1}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* UPI Details */}
                        <div className="col-span-2 space-y-2">
                          <div>
                            <Label className="text-xs text-gray-500">
                              UPI ID
                            </Label>
                            <p className="text-sm font-medium">
                              {qrCode.upiId}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">
                              UPI Name
                            </Label>
                            <p className="text-sm font-medium">
                              {qrCode.upiName}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
