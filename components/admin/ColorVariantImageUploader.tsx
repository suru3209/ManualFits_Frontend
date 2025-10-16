"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ColorVariantImageUploaderProps {
  images: string[];
  setImages: (images: string[]) => void;
  cloudinaryPublicIds: string[];
  setCloudinaryPublicIds: (ids: string[]) => void;
  maxImages?: number;
  colorName?: string;
}

interface SortableImageItemProps {
  image: string;
  publicId: string;
  index: number;
  onRemove: (index: number) => void;
}

function SortableImageItem({
  image,
  publicId,
  index,
  onRemove,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative group"
    >
      <div className="relative w-24 h-24 bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-primary transition-colors">
        <Image
          src={image}
          alt={`Color image ${index + 1}`}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
              {...listeners}
              title="Drag to reorder"
            >
              <ArrowUpDown className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
              onClick={() => onRemove(index)}
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
        {index === 0 && (
          <div className="absolute top-1 left-1">
            <div className="bg-primary text-white text-xs px-1 py-0.5 rounded font-medium">
              Main
            </div>
          </div>
        )}
        <div className="absolute bottom-1 right-1">
          <div className="bg-black/70 text-white text-xs px-1 py-0.5 rounded">
            {index + 1}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ColorVariantImageUploader({
  images,
  setImages,
  cloudinaryPublicIds,
  setCloudinaryPublicIds,
  maxImages = 5,
  colorName = "this color",
}: ColorVariantImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length < fileArray.length) {
      toast.warning(
        `Only ${remainingSlots} images can be uploaded for ${colorName}`
      );
    }

    setIsUploading(true);

    try {
      // Upload images one by one to show progress and immediate previews
      const newImages: string[] = [];
      const newPublicIds: string[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const result = await uploadToCloudinary(filesToUpload[i]);
        newImages.push(result.url);
        newPublicIds.push(result.publicId);

        // Update state after each upload to show immediate preview
        setImages([...images, ...newImages]);
        setCloudinaryPublicIds([...cloudinaryPublicIds, ...newPublicIds]);

        toast.success(
          `Image ${i + 1} of ${filesToUpload.length} uploaded for ${colorName}`
        );
      }

      toast.success(
        `${filesToUpload.length} images uploaded successfully for ${colorName}`
      );
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload images";
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadToCloudinary = async (
    file: File
  ): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append("image", file);

    // Use backend upload route instead of Next.js API route
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080";

    const token = localStorage.getItem("adminToken");

    const response = await fetch(`${backendUrl}/api/admin/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = "Upload failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Upload failed with status: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  };

  const handleRemoveImage = async (index: number) => {
    const publicIdToDelete = cloudinaryPublicIds[index];

    if (publicIdToDelete) {
      try {
        // Delete from Cloudinary via backend
        const backendUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:8080";

        const token = localStorage.getItem("adminToken");

        await fetch(`${backendUrl}/api/admin/upload/${publicIdToDelete}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Failed to delete from Cloudinary:", error);
        // Continue with local removal even if Cloudinary deletion fails
      }
    }

    // Remove from local state
    const newImages = images.filter((_, i) => i !== index);
    const newPublicIds = cloudinaryPublicIds.filter((_, i) => i !== index);

    setImages(newImages);
    setCloudinaryPublicIds(newPublicIds);

    toast.success("Image removed successfully");
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = images.indexOf(active.id);
      const newIndex = images.indexOf(over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      const newPublicIds = arrayMove(cloudinaryPublicIds, oldIndex, newIndex);

      setImages(newImages);
      setCloudinaryPublicIds(newPublicIds);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-primary transition-colors ${
          isUploading ? "pointer-events-none opacity-50" : "cursor-pointer"
        }`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            <div className="text-center">
              <p className="text-slate-700 font-medium text-sm">
                Uploading to Cloudinary...
              </p>
              <p className="text-xs text-slate-600">
                Images will appear below once uploaded
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-6 h-6 mx-auto text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                Click to upload images for {colorName}
              </p>
              <p className="text-xs text-slate-600">
                PNG, JPG, WEBP up to 10MB each
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {images.length} / {maxImages} images uploaded
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-green-800 text-sm">
                Images for {colorName} ({images.length})
              </h4>
            </div>
            <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
              ✓ Uploaded
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-green-200">
            <p className="text-xs text-slate-600 mb-2">
              <strong>Image Order:</strong> Drag to reorder •{" "}
              <span className="text-primary font-medium">First image</span> is
              main image
            </p>

            <DndContext
              sensors={[sensors, keyboardSensor]}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map((_, index) => index)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-wrap gap-2">
                  {images.map((image, index) => (
                    <SortableImageItem
                      key={`${image}-${index}`}
                      image={image}
                      publicId={cloudinaryPublicIds[index] || ""}
                      index={index}
                      onRemove={handleRemoveImage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}
    </div>
  );
}
