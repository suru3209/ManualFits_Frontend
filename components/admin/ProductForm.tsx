"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  Loader2,
  Save,
  ArrowLeft,
} from "lucide-react";
import ColorVariantImageUploader from "@/components/admin/ColorVariantImageUploader";
import { ColorVariant, SizeVariant, Product } from "@/types/types";

// Color Variant Schema
const colorVariantSchema = z.object({
  colorName: z.string().min(1, "Color name is required"),
  colorCode: z.string().min(1, "Color code is required"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  price: z.number().min(0, "Price must be positive"),
  originalPrice: z.number().min(0, "Original price must be positive"),
  sku: z.string().min(1, "SKU is required"),
  isAvailable: z.boolean(),
  // Discount will be calculated automatically from originalPrice and price
});

// Size Variant Schema
const sizeVariantSchema = z.object({
  size: z.string().min(1, "Size is required"),
  colors: z.array(colorVariantSchema).min(1, "At least one color is required"),
  isAvailable: z.boolean(),
});

const productSchema = z.object({
  title: z.string().min(1, "Product title is required"),
  brand: z.string().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
  subcategory: z
    .array(z.string())
    .min(1, "At least one subcategory is required"),
  description: z.string().min(1, "Description is required"),
  detailedDescription: z.string().optional(),
  sizes: z.array(sizeVariantSchema).min(1, "At least one size is required"),
  tags: z.array(z.string()).optional(),
  material: z.string().optional(),
  weight: z.string().optional(),
  warranty: z.string().optional(),
  totalStock: z.number().min(0, "Total stock must be non-negative"),
  origin: z.string().optional(),
  specifications: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  careInstructions: z.array(z.string()).optional(),
  keyFeatures: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Extended Product interface for form with legacy fields
interface ProductFormProduct extends Product {
  // Legacy fields for backward compatibility
  name?: string;
  price?: number;
  originalPrice?: number;
  colors?: string[];
  images?: string[];
  cloudinaryPublicIds?: string[];
  sizes?: SizeVariant[];
}

interface ProductFormProps {
  product?: ProductFormProduct | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const categories = [
  "Men",
  "Women",
  "Kids",
  "Footwear",
  "Accessories",
  "New Arrivals",
];
const subcategories = [
  // Men's Clothing
  "T-Shirts",
  "Shirts",
  "Jeans",
  "Jackets",
  "Hoodies",
  "Shorts",
  "Track Pants",
  "Blazers",
  "Sportswear",
  "Ethnic Wear",
  "Innerwear",
  "Casual Wear",
  "Office Wear",
  "Party Wear",
  "Traditional",
  "Street Style",

  // Women's Clothing
  "Dresses",
  "Tops",
  "Skirts",
  "Winter",
  "Lingerie",
  "Casual Daywear",
  "Office Formals",
  "Party Evening",
  "Wedding",
  "Beach",
  "Festive",

  // Footwear
  "Sneakers",
  "Formal Shoes",
  "Casual Shoes",
  "Sports Shoes",
  "Boots",
  "Sandals",
  "Flats",
  "Heels",
  "Loafers",
  "Oxfords",

  // Accessories
  "Bags",
  "Wallets",
  "Belts",
  "Watches",
  "Sunglasses",
  "Jewelry",
  "Hats",
  "Scarves",
  "Gloves",
  "Phone Cases",

  // New Arrivals (can be any category)
  "Just Launched",
  "Trending Now",
  "Limited Edition",
  "Designer Collabs",
  "Seasonal Picks",
  "Celebrity Styles",
  "Viral Fashions",
];

const commonColors = [
  "Black",
  "White",
  "Gray",
  "Navy",
  "Brown",
  "Beige",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Orange",
  "Maroon",
  "Cream",
  "Khaki",
];

const commonSizes = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
];

export default function ProductForm({
  product,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [cloudinaryPublicIds, setCloudinaryPublicIds] = useState<string[]>(
    product?.cloudinaryPublicIds || []
  );

  // State for managing images for each color variant
  const [colorVariantImages, setColorVariantImages] = useState<{
    [key: string]: string[];
  }>({});
  const [colorVariantCloudinaryIds, setColorVariantCloudinaryIds] = useState<{
    [key: string]: string[];
  }>({});
  const [newTag, setNewTag] = useState("");
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [newCareInstruction, setNewCareInstruction] = useState("");
  const [newKeyFeature, setNewKeyFeature] = useState("");
  const [newMetaKeyword, setNewMetaKeyword] = useState("");

  // Helper function to calculate discount percentage
  const calculateDiscount = (
    originalPrice: number,
    currentPrice: number
  ): number => {
    if (originalPrice <= 0 || currentPrice >= originalPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  // Helper function to convert variants to sizes structure for form
  const convertVariantsToSizes = (variants: any[]) => {
    if (!variants || variants.length === 0) {
      return [
        {
          size: "",
          colors: [
            {
              colorName: "",
              colorCode: "#000000",
              images: [],
              stock: 0,
              price: 0,
              originalPrice: 0,
              sku: "",
              isAvailable: true,
            },
          ],
          isAvailable: true,
        },
      ];
    }

    // Group variants by size
    const sizeGroups: { [key: string]: any[] } = {};
    variants.forEach((variant) => {
      if (!sizeGroups[variant.size]) {
        sizeGroups[variant.size] = [];
      }
      sizeGroups[variant.size].push(variant);
    });

    // Convert to sizes structure
    return Object.keys(sizeGroups).map((size) => ({
      size: size,
      colors: sizeGroups[size].map((variant) => ({
        colorName: variant.color,
        colorCode: variant.colorCode || "#000000",
        images: variant.images || [],
        price: variant.price || 0,
        originalPrice: variant.originalPrice || 0,
        sku: variant.sku || "",
        isAvailable: variant.isAvailable !== false,
      })),
      isAvailable: true,
    }));
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title || product?.name || "",
      brand: product?.brand || "",
      category: product?.category || "",
      subcategory: product?.subcategory || [],
      description: product?.description || "",
      detailedDescription: product?.detailedDescription || "",
      sizes:
        product?.sizes && product.sizes.length > 0
          ? product.sizes
          : product?.variants && product.variants.length > 0
          ? convertVariantsToSizes(product.variants)
          : [
              {
                size: "",
                colors: [
                  {
                    colorName: "",
                    colorCode: "#000000",
                    images: [],
                    stock: 0,
                    price: 0,
                    originalPrice: 0,
                    sku: "",
                    isAvailable: true,
                  },
                ],
                isAvailable: true,
              },
            ],
      tags: product?.tags || [],
      material: product?.material || "",
      weight: product?.weight || "",
      warranty: product?.warranty || "",
      totalStock: product?.totalStock || 0,
      origin: product?.origin || "",
      specifications: product?.specifications || [],
      careInstructions: product?.careInstructions || [],
      keyFeatures: product?.keyFeatures || [],
      metaTitle: product?.metaTitle || "",
      metaDescription: product?.metaDescription || "",
      metaKeywords: product?.metaKeywords || [],
    },
  });

  const watchedSizes = form.watch("sizes");
  const watchedSubcategory = form.watch("subcategory");
  const watchedTags = form.watch("tags");
  const watchedSpecifications = form.watch("specifications");
  const watchedCareInstructions = form.watch("careInstructions");
  const watchedKeyFeatures = form.watch("keyFeatures");
  const watchedMetaKeywords = form.watch("metaKeywords");

  // Force re-render when prices change to update discount display
  const [, forceUpdate] = useState({});
  const triggerUpdate = () => forceUpdate({});

  // Helper functions for variant management
  const addSize = () => {
    const newSize: SizeVariant = {
      size: "",
      colors: [
        {
          colorName: "",
          colorCode: "#000000",
          images: [],
          stock: 0,
          price: 0,
          originalPrice: 0,
          sku: "",
          isAvailable: true,
        },
      ],
      isAvailable: true,
    };
    form.setValue("sizes", [...watchedSizes, newSize]);
  };

  const removeSize = (index: number) => {
    form.setValue(
      "sizes",
      watchedSizes.filter((_, i) => i !== index)
    );
  };

  const addColorToSize = (sizeIndex: number) => {
    const newColor: ColorVariant = {
      colorName: "",
      colorCode: "#000000",
      images: [],
      stock: 0,
      price: 0,
      originalPrice: 0,
      sku: "",
      isAvailable: true,
    };
    const updatedSizes = [...watchedSizes];
    updatedSizes[sizeIndex].colors.push(newColor);
    form.setValue("sizes", updatedSizes);
  };

  const removeColorFromSize = (sizeIndex: number, colorIndex: number) => {
    const updatedSizes = [...watchedSizes];
    updatedSizes[sizeIndex].colors = updatedSizes[sizeIndex].colors.filter(
      (_, i) => i !== colorIndex
    );
    form.setValue("sizes", updatedSizes);
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsSubmitting(true);

      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      if (!token) {
        toast.error("Admin token not found. Please login again.");
        return;
      }

      // Validate form data
      if (!data.title || !data.brand || !data.category || !data.description) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (!data.sizes || data.sizes.length === 0) {
        toast.error("Please add at least one size variant");
        return;
      }

      // Validate that each size has at least one color
      for (const size of data.sizes) {
        if (!size.size) {
          toast.error("Please select a size for all variants");
          return;
        }
        if (!size.colors || size.colors.length === 0) {
          toast.error("Please add at least one color for each size");
          return;
        }
        for (const color of size.colors) {
          if (!color.colorName || !color.sku || color.price <= 0) {
            toast.error("Please fill in all color details (name, SKU, price)");
            return;
          }
        }
      }

      // Generate a unique slug
      const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const timestamp = Date.now();
      const uniqueSlug = `${baseSlug}-${timestamp}`;

      // Convert sizes structure to variants
      const variants = data.sizes.flatMap((size, sizeIndex) =>
        size.colors.map((color, colorIndex) => {
          const variantKey = `${sizeIndex}-${colorIndex}`;
          const variantImages =
            colorVariantImages[variantKey] || color.images || [];
          const variantCloudinaryIds =
            colorVariantCloudinaryIds[variantKey] || [];

          return {
            size: size.size,
            color: color.colorName,
            colorCode: color.colorCode,
            images: variantImages, // Use color-specific images
            price: color.price,
            originalPrice: color.originalPrice,
            sku: color.sku,
            isAvailable: color.isAvailable,
            discount: calculateDiscount(color.originalPrice, color.price),
          };
        })
      );

      const productData = {
        ...data,
        slug: uniqueSlug,
        variants: variants,
        cloudinaryPublicIds: [
          ...cloudinaryPublicIds,
          ...Object.values(colorVariantCloudinaryIds).flat(),
        ], // Include all Cloudinary public IDs from global and color variants
        totalStock: data.totalStock,
        // Ensure required fields are present
        isActive: true,
        rating: 0,
        reviewCount: 0,
        status: "active",
      };

      const url = product
        ? `${backendUrl}/api/admin/products/${product._id}`
        : `${backendUrl}/api/admin/products`;

      const method = product ? "PUT" : "POST";

      // Test if backend is accessible first
      try {
        const testResponse = await fetch(`${backendUrl}/api/admin/products`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!testResponse.ok) {
        }
      } catch (testError) {}

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          product
            ? "Product updated successfully"
            : "Product created successfully"
        );
        onSuccess();
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        toast.error(errorData.message || "Failed to save product");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !(watchedTags || []).includes(newTag.trim())) {
      form.setValue("tags", [...(watchedTags || []), newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      (watchedTags || []).filter((tag) => tag !== tagToRemove)
    );
  };

  const addSubcategory = (sub: string) => {
    if (!watchedSubcategory.includes(sub)) {
      form.setValue("subcategory", [...watchedSubcategory, sub]);
    }
  };

  const removeSubcategory = (subToRemove: string) => {
    form.setValue(
      "subcategory",
      watchedSubcategory.filter((sub) => sub !== subToRemove)
    );
  };

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      const specs = watchedSpecifications || [];
      form.setValue("specifications", [
        ...specs,
        { key: newSpecKey.trim(), value: newSpecValue.trim() },
      ]);
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const removeSpecification = (index: number) => {
    const specs = watchedSpecifications || [];
    form.setValue(
      "specifications",
      specs.filter((_, i) => i !== index)
    );
  };

  const addCareInstruction = () => {
    if (newCareInstruction.trim()) {
      const instructions = watchedCareInstructions || [];
      form.setValue("careInstructions", [
        ...instructions,
        newCareInstruction.trim(),
      ]);
      setNewCareInstruction("");
    }
  };

  const removeCareInstruction = (index: number) => {
    const instructions = watchedCareInstructions || [];
    form.setValue(
      "careInstructions",
      instructions.filter((_, i) => i !== index)
    );
  };

  const addKeyFeature = () => {
    if (newKeyFeature.trim()) {
      const features = watchedKeyFeatures || [];
      form.setValue("keyFeatures", [...features, newKeyFeature.trim()]);
      setNewKeyFeature("");
    }
  };

  const removeKeyFeature = (index: number) => {
    const features = watchedKeyFeatures || [];
    form.setValue(
      "keyFeatures",
      features.filter((_, i) => i !== index)
    );
  };

  const addMetaKeyword = () => {
    if (
      newMetaKeyword.trim() &&
      !(watchedMetaKeywords || []).includes(newMetaKeyword.trim())
    ) {
      form.setValue("metaKeywords", [
        ...(watchedMetaKeywords || []),
        newMetaKeyword.trim(),
      ]);
      setNewMetaKeyword("");
    }
  };

  const removeMetaKeyword = (keywordToRemove: string) => {
    form.setValue(
      "metaKeywords",
      (watchedMetaKeywords || []).filter(
        (keyword) => keyword !== keywordToRemove
      )
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();

          // Force submit even with validation errors for debugging
          const formData = form.getValues();
          onSubmit(formData);
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter brand name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="warranty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1 Year Warranty" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Stock Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Total available stock for this product across all variants
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin/Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Made in India" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief product description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="detailedDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed product description"
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Categories and Colors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Subcategories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {watchedSubcategory.map((sub) => (
                  <Badge
                    key={sub}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {sub}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeSubcategory(sub)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {subcategories.map((sub) => (
                  <Button
                    key={sub}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSubcategory(sub)}
                    disabled={watchedSubcategory.includes(sub)}
                  >
                    {sub}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Size-Color Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Size-Color Variants</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create size and color combinations with individual pricing and
              stock
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {watchedSizes.map((size, sizeIndex) => (
              <div key={sizeIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    Size: {size.size || "Not selected"}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addColorToSize(sizeIndex)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Color
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSize(sizeIndex)}
                      disabled={watchedSizes.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Size Selection */}
                <FormField
                  control={form.control}
                  name={`sizes.${sizeIndex}.size`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonSizes.map((sizeOption) => (
                            <SelectItem key={sizeOption} value={sizeOption}>
                              {sizeOption}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Colors for this size */}
                <div className="space-y-4">
                  {size.colors.map((color, colorIndex) => (
                    <div
                      key={colorIndex}
                      className="border rounded p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">
                          Color: {color.colorName || "Not set"}
                        </h5>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            removeColorFromSize(sizeIndex, colorIndex)
                          }
                          disabled={size.colors.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Color Name */}
                        <FormField
                          control={form.control}
                          name={`sizes.${sizeIndex}.colors.${colorIndex}.colorName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Red, Blue"
                                  {...field}
                                  onChange={(e) => {
                                    const colorName =
                                      e.target.value.toLowerCase();
                                    field.onChange(e.target.value);

                                    // Auto-populate color code based on color name
                                    const colorCodeMap: {
                                      [key: string]: string;
                                    } = {
                                      red: "#FF0000",
                                      blue: "#0000FF",
                                      green: "#008000",
                                      yellow: "#FFFF00",
                                      orange: "#FFA500",
                                      purple: "#800080",
                                      pink: "#FFC0CB",
                                      black: "#000000",
                                      white: "#FFFFFF",
                                      gray: "#808080",
                                      grey: "#808080",
                                      brown: "#A52A2A",
                                      navy: "#000080",
                                      maroon: "#800000",
                                      olive: "#808000",
                                      teal: "#008080",
                                      cyan: "#00FFFF",
                                      magenta: "#FF00FF",
                                      lime: "#00FF00",
                                      silver: "#C0C0C0",
                                      gold: "#FFD700",
                                      beige: "#F5F5DC",
                                      ivory: "#FFFFF0",
                                      khaki: "#F0E68C",
                                      coral: "#FF7F50",
                                      salmon: "#FA8072",
                                      crimson: "#DC143C",
                                      indigo: "#4B0082",
                                      turquoise: "#40E0D0",
                                      violet: "#EE82EE",
                                    };

                                    if (colorCodeMap[colorName]) {
                                      form.setValue(
                                        `sizes.${sizeIndex}.colors.${colorIndex}.colorCode`,
                                        colorCodeMap[colorName]
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Color Code */}
                        <FormField
                          control={form.control}
                          name={`sizes.${sizeIndex}.colors.${colorIndex}.colorCode`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color Code</FormLabel>
                              <FormControl>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="#000000"
                                    {...field}
                                    className="flex-1"
                                    onChange={(e) => {
                                      const colorCode = e.target.value;
                                      field.onChange(colorCode);

                                      // Auto-populate color name based on color code
                                      const codeToNameMap: {
                                        [key: string]: string;
                                      } = {
                                        "#FF0000": "Red",
                                        "#0000FF": "Blue",
                                        "#008000": "Green",
                                        "#FFFF00": "Yellow",
                                        "#FFA500": "Orange",
                                        "#800080": "Purple",
                                        "#FFC0CB": "Pink",
                                        "#000000": "Black",
                                        "#FFFFFF": "White",
                                        "#808080": "Gray",
                                        "#A52A2A": "Brown",
                                        "#000080": "Navy",
                                        "#800000": "Maroon",
                                        "#808000": "Olive",
                                        "#008080": "Teal",
                                        "#00FFFF": "Cyan",
                                        "#FF00FF": "Magenta",
                                        "#00FF00": "Lime",
                                        "#C0C0C0": "Silver",
                                        "#FFD700": "Gold",
                                        "#F5F5DC": "Beige",
                                        "#FFFFF0": "Ivory",
                                        "#F0E68C": "Khaki",
                                        "#FF7F50": "Coral",
                                        "#FA8072": "Salmon",
                                        "#DC143C": "Crimson",
                                        "#4B0082": "Indigo",
                                        "#40E0D0": "Turquoise",
                                        "#EE82EE": "Violet",
                                      };

                                      if (
                                        codeToNameMap[colorCode.toUpperCase()]
                                      ) {
                                        const currentName = form.getValues(
                                          `sizes.${sizeIndex}.colors.${colorIndex}.colorName`
                                        );
                                        // Only auto-populate if color name is empty or matches a generic name
                                        if (
                                          !currentName ||
                                          currentName.toLowerCase() ===
                                            "color" ||
                                          currentName.toLowerCase() ===
                                            "new color"
                                        ) {
                                          form.setValue(
                                            `sizes.${sizeIndex}.colors.${colorIndex}.colorName`,
                                            codeToNameMap[
                                              colorCode.toUpperCase()
                                            ]
                                          );
                                        }
                                      }
                                    }}
                                  />
                                  <div
                                    className="w-10 h-10 border rounded"
                                    style={{ backgroundColor: field.value }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Price */}
                        <FormField
                          control={form.control}
                          name={`sizes.${sizeIndex}.colors.${colorIndex}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    );
                                    triggerUpdate();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Original Price */}
                        <FormField
                          control={form.control}
                          name={`sizes.${sizeIndex}.colors.${colorIndex}.originalPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Original Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    );
                                    triggerUpdate();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Calculated Discount Display */}
                        <div className="col-span-full">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-800">
                                Calculated Discount:
                              </span>
                              <span className="text-lg font-bold text-blue-900">
                                {(() => {
                                  const currentPrice =
                                    form.getValues(
                                      `sizes.${sizeIndex}.colors.${colorIndex}.price`
                                    ) || 0;
                                  const originalPrice =
                                    form.getValues(
                                      `sizes.${sizeIndex}.colors.${colorIndex}.originalPrice`
                                    ) || 0;
                                  const discount = calculateDiscount(
                                    originalPrice,
                                    currentPrice
                                  );
                                  return discount > 0
                                    ? `${discount}%`
                                    : "No Discount";
                                })()}
                              </span>
                            </div>
                            {(() => {
                              const currentPrice =
                                form.getValues(
                                  `sizes.${sizeIndex}.colors.${colorIndex}.price`
                                ) || 0;
                              const originalPrice =
                                form.getValues(
                                  `sizes.${sizeIndex}.colors.${colorIndex}.originalPrice`
                                ) || 0;
                              const discount = calculateDiscount(
                                originalPrice,
                                currentPrice
                              );
                              const savings = originalPrice - currentPrice;
                              return (
                                discount > 0 && (
                                  <div className="mt-1 text-xs text-blue-700">
                                    You save: ₹{savings.toFixed(2)}
                                  </div>
                                )
                              );
                            })()}
                          </div>
                        </div>

                        {/* Variant Availability Switch */}
                        <FormField
                          control={form.control}
                          name={`sizes.${sizeIndex}.colors.${colorIndex}.isAvailable`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Variant Available
                                </FormLabel>
                                <FormDescription>
                                  Toggle to enable/disable this variant
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* SKU */}
                        <FormField
                          control={form.control}
                          name={`sizes.${sizeIndex}.colors.${colorIndex}.sku`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., MF-TSHIRT-RED-M"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Images for this color variant */}
                        <div className="col-span-full">
                          <FormLabel>Images for this color</FormLabel>
                          <div className="mt-2">
                            <ColorVariantImageUploader
                              images={
                                colorVariantImages[
                                  `${sizeIndex}-${colorIndex}`
                                ] || []
                              }
                              setImages={(newImages) => {
                                setColorVariantImages((prev) => ({
                                  ...prev,
                                  [`${sizeIndex}-${colorIndex}`]: newImages,
                                }));
                                // Also update the form value
                                form.setValue(
                                  `sizes.${sizeIndex}.colors.${colorIndex}.images`,
                                  newImages
                                );
                              }}
                              cloudinaryPublicIds={
                                colorVariantCloudinaryIds[
                                  `${sizeIndex}-${colorIndex}`
                                ] || []
                              }
                              setCloudinaryPublicIds={(newIds) => {
                                setColorVariantCloudinaryIds((prev) => ({
                                  ...prev,
                                  [`${sizeIndex}-${colorIndex}`]: newIds,
                                }));
                              }}
                              maxImages={5}
                              colorName={
                                form.getValues(
                                  `sizes.${sizeIndex}.colors.${colorIndex}.colorName`
                                ) || `color ${colorIndex + 1}`
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addSize}>
              <Plus className="w-4 h-4 mr-2" />
              Add Size
            </Button>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(watchedTags || []).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Add tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
              />
              <Button type="button" onClick={addTag}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Material & Weight</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cotton, Polyester" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 250g, 1.2kg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {(watchedKeyFeatures || []).map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded"
                  >
                    <span className="text-sm">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKeyFeature(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add key feature"
                  value={newKeyFeature}
                  onChange={(e) => setNewKeyFeature(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addKeyFeature())
                  }
                />
                <Button type="button" onClick={addKeyFeature}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {watchedSpecifications?.map((spec, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 bg-slate-50 rounded"
                >
                  <span className="text-sm font-medium">{spec.key}:</span>
                  <span className="text-sm">{spec.value}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSpecification(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Specification key"
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
              />
              <Input
                placeholder="Specification value"
                value={newSpecValue}
                onChange={(e) => setNewSpecValue(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addSpecification())
                }
              />
            </div>
            <Button type="button" onClick={addSpecification}>
              Add Specification
            </Button>
          </CardContent>
        </Card>

        {/* Care Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Care Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {watchedCareInstructions?.map((instruction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded"
                >
                  <span className="text-sm">{instruction}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCareInstruction(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Add care instruction"
                value={newCareInstruction}
                onChange={(e) => setNewCareInstruction(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), addCareInstruction())
                }
              />
              <Button type="button" onClick={addCareInstruction}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SEO Fields */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SEO title for search engines"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metaDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="SEO description for search engines"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Meta Keywords</FormLabel>
              <div className="flex flex-wrap gap-2">
                {watchedMetaKeywords?.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {keyword}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeMetaKeyword(keyword)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add meta keyword"
                  value={newMetaKeyword}
                  onChange={(e) => setNewMetaKeyword(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addMetaKeyword())
                  }
                />
                <Button type="button" onClick={addMetaKeyword}>
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>

          <Button type="submit" disabled={isSubmitting} onClick={(e) => {}}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {product ? "Update Product" : "Create Product"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
