"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Plus,
  Trash2,
  Package,
  DollarSign,
  Eye,
  Settings,
  FileText,
  Palette,
  Globe,
} from "lucide-react";
import { uploadMultipleImages } from "@/lib/cloudinary";

// Product schema types
interface Specification {
  key: string;
  value: string;
}

interface SizeStock {
  size: string;
  stock: number;
}

interface Variant {
  color: string;
  images: string[];
  sizes: SizeStock[];
}

interface Product {
  _id?: string;
  name: string;
  price: number;
  originalPrice: number;
  images: string[];
  cloudinaryPublicIds?: string[];
  category:
    | "Men"
    | "Women"
    | "Kids"
    | "Footwear"
    | "Accessories"
    | "New Arrivals";
  subcategory: string[];
  colors: string[];
  sizes: SizeStock[];
  slug: string;
  totalStock: number;
  status: "active" | "draft" | "archived";
  discountType: "percentage" | "flat";
  discount: number;
  discountEnd?: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  brand: string;
  description: string;
  tags?: string[];
  sku?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  variants?: Variant[];
  detailedDescription?: string;
  specifications?: Specification[];
  careInstructions?: string[];
  keyFeatures?: string[];
  material?: string;
  weight?: string;
  warranty?: string;
  origin?: string;
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
  // New Arrivals
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
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Orange",
  "Brown",
  "Gray",
  "Navy",
];

interface ProductAddEditProps {
  productId?: string;
  isEdit?: boolean;
}

export default function ProductAddEdit({
  productId,
  isEdit = false,
}: ProductAddEditProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product>({
    name: "",
    price: 0,
    originalPrice: 0,
    images: [],
    category: "Men",
    subcategory: [],
    colors: [],
    sizes: [],
    slug: "",
    totalStock: 0,
    status: "active",
    discountType: "percentage",
    discount: 0,
    inStock: true,
    rating: 1,
    reviews: 0,
    brand: "",
    description: "",
    tags: [],
    variants: [],
    specifications: [],
    careInstructions: [],
    keyFeatures: [],
  });

  const [newSpecification, setNewSpecification] = useState<Specification>({
    key: "",
    value: "",
  });
  const [newTag, setNewTag] = useState("");
  const [newCareInstruction, setNewCareInstruction] = useState("");
  const [newKeyFeature, setNewKeyFeature] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newSizeStock, setNewSizeStock] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Load product data for editing
  useEffect(() => {
    if (isEdit && productId) {
      loadProduct();
    }
  }, [isEdit, productId]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${baseUrl}/api/admin/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      }
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof Product,
    value: string | number | boolean | string[]
  ) => {
    setProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayAdd = (field: keyof Product, value: string) => {
    if (value.trim()) {
      setProduct((prev) => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()],
      }));
    }
  };

  const handleSubcategoryAdd = (value: string) => {
    if (value.trim() && !product.subcategory.includes(value.trim())) {
      setProduct((prev) => ({
        ...prev,
        subcategory: [...prev.subcategory, value.trim()],
      }));
    }
  };

  const handleArrayRemove = (field: keyof Product, index: number) => {
    setProduct((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleSubcategoryRemove = (index: number) => {
    setProduct((prev) => ({
      ...prev,
      subcategory: prev.subcategory.filter((_, i) => i !== index),
    }));
  };

  const handleSizeAdd = () => {
    if (newSize && newSizeStock > 0) {
      setProduct((prev) => ({
        ...prev,
        sizes: [...prev.sizes, { size: newSize, stock: newSizeStock }],
      }));
      setNewSize("");
      setNewSizeStock(0);
    }
  };

  const handleSizeRemove = (index: number) => {
    setProduct((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const handleSpecificationAdd = () => {
    if (newSpecification.key && newSpecification.value) {
      setProduct((prev) => ({
        ...prev,
        specifications: [...(prev.specifications || []), newSpecification],
      }));
      setNewSpecification({ key: "", value: "" });
    }
  };

  const handleSpecificationRemove = (index: number) => {
    setProduct((prev) => ({
      ...prev,
      specifications: (prev.specifications || []).filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        console.error("No admin token found");
        return;
      }

      const fileArray = Array.from(files);
      const result = await uploadMultipleImages(fileArray, token);

      if (result.success && result.data) {
        const newImageUrls = result.data.successful.map((item) => item.url);
        setProduct((prev) => ({
          ...prev,
          images: [...prev.images, ...newImageUrls],
        }));
        console.log("Images uploaded successfully:", newImageUrls);
      } else {
        console.error("Upload failed:", result.message);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("Admin token not found. Please login again.");
      }

      // Use proper API utilities
      const url = isEdit
        ? buildApiUrl(`/api/admin/products/${productId}`)
        : buildApiUrl("/api/admin/products");
      const method = isEdit ? "PUT" : "POST";

      // Generate slug if not provided and fix subcategory format
      const productData = {
        ...product,
        slug:
          product.slug ||
          product.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
        // Keep subcategory as array for multiple subcategories
        subcategory: product.subcategory,
      };

      console.log("Sending product data:", productData);
      console.log("API URL:", url);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log("Product created successfully:", result);
        router.push("/admin?tab=products");
      } else {
        let errorMessage = "Unknown error";
        const contentType = response.headers.get("content-type");

        console.log("Error response content-type:", contentType);
        console.log("Error response status:", response.status);
        console.log("Error response statusText:", response.statusText);

        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            console.error("Error saving product:", errorData);
            errorMessage = errorData.message || "Unknown error";
          } catch (jsonError) {
            console.error("Failed to parse JSON error response:", jsonError);
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        } else {
          try {
            const errorText = await response.text();
            console.error("Raw error response:", errorText);
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          } catch (textError) {
            console.error("Failed to read error response:", textError);
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        console.error(`Error saving product: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error saving product:", error);

      // Handle different types of errors
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        console.error("Network error: Unable to connect to the server");
        alert(
          "Network error: Unable to connect to the server. Please check your internet connection and try again."
        );
      } else if (error instanceof Error) {
        console.error("Error message:", error.message);
        alert(`Error: ${error.message}`);
      } else {
        console.error("Unknown error occurred");
        alert("An unknown error occurred. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin?tab=products")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEdit ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-gray-600">
              {isEdit
                ? "Update product information"
                : "Create a new product listing"}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Essential product details and identification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  value={product.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                  placeholder="Enter brand name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={product.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategories *</Label>
                <div className="text-xs text-gray-500 mb-2">
                  Current: [{product.subcategory.join(", ")}]
                </div>
                <div className="space-y-4">
                  {/* Selected Subcategories */}
                  <div className="flex flex-wrap gap-2">
                    {product.subcategory.map((sub, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {sub}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSubcategoryRemove(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>

                  {/* Checkbox Selection */}
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">
                        Select Subcategories:
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProduct((prev) => ({
                              ...prev,
                              subcategory: [...subcategories],
                            }));
                          }}
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProduct((prev) => ({
                              ...prev,
                              subcategory: [],
                            }));
                          }}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {subcategories.map((subcategory) => (
                        <label
                          key={subcategory}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={product.subcategory.includes(subcategory)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleSubcategoryAdd(subcategory);
                              } else {
                                const index =
                                  product.subcategory.indexOf(subcategory);
                                if (index > -1) {
                                  handleSubcategoryRemove(index);
                                }
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{subcategory}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={product.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter product description"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="detailedDescription">Detailed Description</Label>
              <Textarea
                id="detailedDescription"
                value={product.detailedDescription || ""}
                onChange={(e) =>
                  handleInputChange("detailedDescription", e.target.value)
                }
                placeholder="Enter detailed product description"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Product Images
            </CardTitle>
            <CardDescription>
              Upload product images (first image will be the default)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product Images</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-contain rounded-lg border bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newImages = product.images.filter(
                          (_, i) => i !== index
                        );
                        handleInputChange("images", newImages);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    {index === 0 && (
                      <Badge className="absolute bottom-1 left-1 text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                ))}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center hover:border-gray-400 transition-colors relative overflow-hidden">
                  <Upload
                    className={`w-6 h-6 text-gray-400 mb-2 ${
                      uploadingImages ? "animate-spin" : ""
                    }`}
                  />
                  <span className="text-sm text-gray-500">
                    {uploadingImages ? "Uploading..." : "Add Image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    disabled={uploadingImages}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing & Discounts
            </CardTitle>
            <CardDescription>
              Set product pricing and discount information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="originalPrice">Original Price *</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  value={product.originalPrice}
                  onChange={(e) =>
                    handleInputChange("originalPrice", Number(e.target.value))
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Selling Price *</Label>
                <Input
                  id="price"
                  type="number"
                  value={product.price}
                  onChange={(e) =>
                    handleInputChange("price", Number(e.target.value))
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={product.discountType}
                  onValueChange={(value) =>
                    handleInputChange("discountType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount">Discount Value</Label>
                <Input
                  id="discount"
                  type="number"
                  value={product.discount}
                  onChange={(e) =>
                    handleInputChange("discount", Number(e.target.value))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="discountEnd">Discount End Date</Label>
                <Input
                  id="discountEnd"
                  type="datetime-local"
                  value={product.discountEnd || ""}
                  onChange={(e) =>
                    handleInputChange("discountEnd", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory & Stock
            </CardTitle>
            <CardDescription>
              Manage product stock and availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalStock">Total Stock</Label>
                <Input
                  id="totalStock"
                  type="number"
                  value={product.totalStock}
                  onChange={(e) =>
                    handleInputChange("totalStock", Number(e.target.value))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={product.sku || ""}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  placeholder="Product SKU"
                />
              </div>
            </div>

            <div>
              <Label>Product Sizes & Stock</Label>
              <div className="space-y-2">
                {product.sizes.map((size, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline">{size.size}</Badge>
                    <span>Stock: {size.stock}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSizeRemove(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Size (e.g., M, L, XL)"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Stock"
                    value={newSizeStock}
                    onChange={(e) => setNewSizeStock(Number(e.target.value))}
                  />
                  <Button type="button" onClick={handleSizeAdd}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="inStock"
                checked={product.inStock}
                onChange={(e) => handleInputChange("inStock", e.target.checked)}
              />
              <Label htmlFor="inStock">Product is in stock</Label>
            </div>
          </CardContent>
        </Card>

        {/* Colors & Variants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Colors & Variants
            </CardTitle>
            <CardDescription>
              Define available colors and product variants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product Colors</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {product.colors.map((color, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {color}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArrayRemove("colors", index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      handleArrayAdd("colors", newColor);
                      setNewColor("");
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">
                    Quick Add Common Colors:
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {commonColors.map((color) => (
                      <Button
                        key={color}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!product.colors.includes(color)) {
                            handleArrayAdd("colors", color);
                          }
                        }}
                        disabled={product.colors.includes(color)}
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Product Details
            </CardTitle>
            <CardDescription>
              Additional product information and specifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={product.material || ""}
                  onChange={(e) =>
                    handleInputChange("material", e.target.value)
                  }
                  placeholder="e.g., Cotton, Polyester"
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={product.weight || ""}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="e.g., 250g, 1kg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="warranty">Warranty</Label>
                <Input
                  id="warranty"
                  value={product.warranty || ""}
                  onChange={(e) =>
                    handleInputChange("warranty", e.target.value)
                  }
                  placeholder="e.g., 1 year, 6 months"
                />
              </div>
              <div>
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  value={product.origin || ""}
                  onChange={(e) => handleInputChange("origin", e.target.value)}
                  placeholder="e.g., Made in India"
                />
              </div>
            </div>

            <div>
              <Label>Key Features</Label>
              <div className="space-y-2">
                {product.keyFeatures?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline">{feature}</Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleArrayRemove("keyFeatures", index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add key feature"
                    value={newKeyFeature}
                    onChange={(e) => setNewKeyFeature(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      handleArrayAdd("keyFeatures", newKeyFeature);
                      setNewKeyFeature("");
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label>Care Instructions</Label>
              <div className="space-y-2">
                {product.careInstructions?.map((instruction, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline">{instruction}</Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleArrayRemove("careInstructions", index)
                      }
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add care instruction"
                    value={newCareInstruction}
                    onChange={(e) => setNewCareInstruction(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      handleArrayAdd("careInstructions", newCareInstruction);
                      setNewCareInstruction("");
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Specifications
            </CardTitle>
            <CardDescription>
              Technical specifications and product details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {product.specifications?.map((spec, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border rounded"
                >
                  <span className="font-medium">{spec.key}:</span>
                  <span>{spec.value}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSpecificationRemove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Specification key"
                  value={newSpecification.key}
                  onChange={(e) =>
                    setNewSpecification((prev) => ({
                      ...prev,
                      key: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Specification value"
                  value={newSpecification.value}
                  onChange={(e) =>
                    setNewSpecification((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                />
                <Button type="button" onClick={handleSpecificationAdd}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO & Meta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              SEO & Meta Information
            </CardTitle>
            <CardDescription>
              Search engine optimization and meta tags
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={product.metaTitle || ""}
                onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                placeholder="SEO title for search engines"
              />
            </div>
            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={product.metaDescription || ""}
                onChange={(e) =>
                  handleInputChange("metaDescription", e.target.value)
                }
                placeholder="SEO description for search engines"
                rows={3}
              />
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {product.tags?.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArrayRemove("tags", index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={() => {
                    handleArrayAdd("tags", newTag);
                    setNewTag("");
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Product Status
            </CardTitle>
            <CardDescription>
              Control product visibility and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={product.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={product.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="product-url-slug"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
