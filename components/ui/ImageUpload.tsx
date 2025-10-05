"use client";

import React, { useState, useRef } from "react";
import { Button } from "./button";
import { Card } from "./card";
import {
  uploadSingleImage,
  uploadMultipleImages,
  CloudinaryUploadResponse,
} from "@/lib/cloudinary";
import { X, Upload, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  token: string;
  existingImages?: string[];
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  multiple = false,
  maxFiles = 5,
  token,
  existingImages = [],
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] =
    useState<string[]>(existingImages);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate file count
    if (multiple && fileArray.length > maxFiles) {
      setUploadErrors([`Maximum ${maxFiles} files allowed`]);
      return;
    }

    if (!multiple && fileArray.length > 1) {
      setUploadErrors(["Only one file allowed"]);
      return;
    }

    setUploading(true);
    setUploadErrors([]);

    try {
      let result: CloudinaryUploadResponse;

      if (multiple) {
        const multipleResult = await uploadMultipleImages(fileArray, token);
        if (multipleResult.success && multipleResult.data) {
          const newUrls = multipleResult.data.successful.map(
            (item) => item.url
          );
          const updatedImages = [...uploadedImages, ...newUrls];
          setUploadedImages(updatedImages);
          onUpload(updatedImages);
        } else {
          setUploadErrors([multipleResult.message || "Upload failed"]);
        }
      } else {
        result = await uploadSingleImage(fileArray[0], token);
        if (result.success && result.data) {
          const updatedImages = [...uploadedImages, result.data.url];
          setUploadedImages(updatedImages);
          onUpload(updatedImages);
        } else {
          setUploadErrors([result.message || "Upload failed"]);
        }
      }
    } catch (error) {
      setUploadErrors(["Upload failed. Please try again."]);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);
    onUpload(updatedImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 transition-colors">
        <div className="flex flex-col items-center space-y-2">
          <ImageIcon className="h-12 w-12 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600">
              {multiple ? `Upload up to ${maxFiles} images` : "Upload an image"}
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
          <Button
            onClick={openFileDialog}
            disabled={uploading}
            variant="outline"
            className="mt-2"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Choose Files"}
          </Button>
        </div>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Images:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <Button
                  onClick={() => removeImage(index)}
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {uploadErrors.length > 0 && (
        <div className="space-y-1">
          {uploadErrors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
