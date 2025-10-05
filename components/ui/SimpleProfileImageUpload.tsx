"use client";

import React, { useState, useRef } from "react";
import { Button } from "./button";
import { uploadSingleImage, CloudinaryUploadResponse } from "@/lib/cloudinary";
import { X, Upload, User, Camera } from "lucide-react";

interface SimpleProfileImageUploadProps {
  onUpload: (url: string, publicId: string) => void;
  token: string;
  existingImage?: string;
  size?: "sm" | "md" | "lg";
}

export const SimpleProfileImageUpload: React.FC<
  SimpleProfileImageUploadProps
> = ({ onUpload, token, existingImage, size = "md" }) => {
  const [uploading, setUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | undefined>(
    existingImage
  );
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const handleFileSelect = async (files: FileList | null) => {
    console.log("File selected:", files);
    if (!files || files.length === 0) return;

    const file = files[0];
    console.log("Selected file:", file.name, file.size, file.type);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed");
      return;
    }

    // Validate file size (5MB for profile images)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const result: CloudinaryUploadResponse = await uploadSingleImage(
        file,
        token
      );

      if (result.success && result.data) {
        setCurrentImage(result.data.url);
        onUpload(result.data.url, result.data.public_id);
      } else {
        setUploadError(result.message || "Upload failed");
      }
    } catch (error) {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setCurrentImage(undefined);
    onUpload("", "");
  };

  const openFileDialog = () => {
    console.log("Opening file dialog");
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Profile Image Display */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center`}
        >
          {currentImage ? (
            <img
              src={currentImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-gray-400" />
          )}
        </div>

        {/* Upload Overlay */}
        <Button
          type="button"
          onClick={openFileDialog}
          disabled={uploading}
          size="sm"
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 shadow-lg"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Upload Button */}
      <div className="flex flex-col items-center space-y-2">
        <Button
          type="button"
          onClick={openFileDialog}
          disabled={uploading}
          variant="outline"
          size="sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading
            ? "Uploading..."
            : currentImage
            ? "Change Photo"
            : "Upload Photo"}
        </Button>

        {currentImage && (
          <Button
            type="button"
            onClick={removeImage}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Error Message */}
      {uploadError && (
        <p className="text-sm text-red-600 text-center">{uploadError}</p>
      )}

      {/* Upload Info */}
      <div className="text-xs text-gray-500 text-center max-w-xs">
        <p>JPG, PNG, or GIF</p>
        <p>Maximum 5MB</p>
      </div>
    </div>
  );
};
