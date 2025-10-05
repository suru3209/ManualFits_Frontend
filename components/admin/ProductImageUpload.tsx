"use client";

import React, { useState } from "react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

interface ProductImageUploadProps {
  productId?: string;
  existingImages?: string[];
  onSave: (images: string[]) => void;
  onCancel: () => void;
  token: string;
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  productId,
  existingImages = [],
  onSave,
  onCancel,
  token,
}) => {
  const [images, setImages] = useState<string[]>(existingImages);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = (uploadedImages: string[]) => {
    setImages(uploadedImages);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      onSave(images);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Product Images</span>
          <div className="flex space-x-2">
            <Button
              onClick={handleSave}
              disabled={saving || images.length === 0}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Images"}</span>
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ImageUpload
          onUpload={handleImageUpload}
          multiple={true}
          maxFiles={10}
          token={token}
          existingImages={images}
        />

        {images.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">
              Current Images ({images.length}):
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
