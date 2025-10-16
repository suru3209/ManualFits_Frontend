"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

interface ImageUploaderProps {
  images: string[];
  setImages: (images: string[]) => void;
  cloudinaryPublicIds: string[];
  setCloudinaryPublicIds: (ids: string[]) => void;
  maxImages?: number;
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
      <div className="relative w-32 h-32 bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-primary transition-colors">
        <Image
          src={image}
          alt={`Product image ${index + 1}`}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              {...listeners}
              title="Drag to reorder"
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={() => onRemove(index)}
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {index === 0 && (
          <div className="absolute top-1 left-1">
            <div className="bg-primary text-white text-xs px-2 py-1 rounded font-medium">
              Default
            </div>
          </div>
        )}
        {index === 1 && (
          <div className="absolute top-1 left-1">
            <div className="bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
              Hover
            </div>
          </div>
        )}
        <div className="absolute bottom-1 right-1">
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
            {index + 1}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImageUploader({
  images,
  setImages,
  cloudinaryPublicIds,
  setCloudinaryPublicIds,
  maxImages = 10,
}: ImageUploaderProps) {
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
      toast.warning(`Only ${remainingSlots} images can be uploaded`);
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

        toast.success(`Image ${i + 1} of ${filesToUpload.length} uploaded`);
      }

      toast.success(`${filesToUpload.length} images uploaded successfully`);
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
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-primary transition-colors ${
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
              <div className="space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <div className="text-center">
                  <p className="text-slate-700 font-medium">
                    Uploading to Cloudinary...
                  </p>
                  <p className="text-sm text-slate-600">
                    Images will appear below once uploaded
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-8 h-8 mx-auto text-slate-400" />
                <div>
                  <p className="text-lg font-medium text-slate-900">
                    Click to upload images
                  </p>
                  <p className="text-sm text-slate-600">
                    PNG, JPG, WEBP up to 10MB each
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {images.length} / {maxImages} images uploaded
                  </p>
                  {images.length > 0 && (
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      ✓ Images will show preview below immediately after upload
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Gallery */}
      {images.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">
                    Uploaded Images ({images.length})
                  </h3>
                </div>
                <div className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  ✓ Successfully uploaded
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-slate-600 mb-4">
                  <strong>Image Order:</strong> Drag to reorder •{" "}
                  <span className="text-primary font-medium">First image</span>{" "}
                  is default •{" "}
                  <span className="text-green-600 font-medium">
                    Second image
                  </span>{" "}
                  is hover
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
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Hover over images to see drag and
                  remove options. The first image will be the main product
                  image, and the second will show on hover.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
