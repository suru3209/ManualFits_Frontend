"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Eye,
  EyeOff,
  Package,
  Star,
  DollarSign,
  Tag,
  Calendar,
  Users,
  TrendingUp,
  ShoppingCart,
  Archive,
  Trash2,
  Copy,
  Share2,
} from "lucide-react";

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice: number;
  images?: string[];
  category: string;
  subcategory: string;
  brand: string;
  status: "active" | "draft" | "archived";
  inStock: boolean;
  totalStock: number;
  rating: number;
  reviews: number;
  discount: number;
  description: string;
  tags?: string[];
  sku?: string;
  createdAt: string;
  updatedAt: string;
  variants?: {
    color: string;
    images: string[];
    sizes: { size: string; stock: number }[];
  }[];
}

const statusConfig = {
  active: { color: "bg-green-100 text-green-800", label: "Active" },
  draft: { color: "bg-yellow-100 text-yellow-800", label: "Draft" },
  archived: { color: "bg-gray-100 text-gray-800", label: "Archived" },
};

const categoryConfig = {
  Men: "bg-blue-100 text-blue-800",
  Women: "bg-pink-100 text-pink-800",
  Kids: "bg-purple-100 text-purple-800",
  Footwear: "bg-orange-100 text-orange-800",
  Accessories: "bg-green-100 text-green-800",
  "New Arrivals": "bg-red-100 text-red-800",
};

interface AdminProductViewProps {
  productId: string;
}

export default function AdminProductView({ productId }: AdminProductViewProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProductHidden, setIsProductHidden] = useState(false);

  useEffect(() => {
    fetchProduct();
    setSelectedImageIndex(0); // Reset image index when product changes
  }, [productId]);

  // Reset selectedImageIndex if it's out of bounds
  useEffect(() => {
    if (
      product?.images &&
      product.images.length > 0 &&
      selectedImageIndex >= product.images.length
    ) {
      setSelectedImageIndex(0);
    }
  }, [product?.images, selectedImageIndex]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      console.log("Fetching product with ID:", productId);
      const { adminApi } = await import("@/lib/adminApi");
      const response = await adminApi.getProduct(productId);
      console.log("Product response:", response);
      setProduct(response.product || response); // Handle both response formats

      // Check if product is hidden
      const hiddenResponse = await adminApi.getHiddenProducts();
      const hiddenProducts = hiddenResponse.hiddenProducts || [];
      const productData = response.product || response;
      setIsProductHidden(hiddenProducts.includes(productData.name));

      // Debug: Log product images
      if (productData && productData.images) {
        console.log("Product images:", productData.images);
        productData.images.forEach((image: string, index: number) => {
          console.log(`Image ${index}:`, image);
        });
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleHideProduct = async () => {
    try {
      if (!product) return;

      const { adminApi } = await import("@/lib/adminApi");

      // Get current hidden products list
      const hiddenResponse = await adminApi.getHiddenProducts();
      const currentHidden = hiddenResponse.hiddenProducts || [];

      // Add current product name to hidden list
      const updatedHidden = [...currentHidden, product.name];

      // Update hidden products list
      await adminApi.updateHiddenProducts(updatedHidden);

      setIsProductHidden(true);
      setShowArchiveConfirm(false);
      console.log(`Product "${product.name}" has been hidden from customers.`);
    } catch (error) {
      console.error("Error hiding product:", error);
      console.error("Failed to hide product. Please try again.");
    }
  };

  const handleShowProduct = async () => {
    try {
      if (!product) return;

      const { adminApi } = await import("@/lib/adminApi");

      // Get current hidden products list
      const hiddenResponse = await adminApi.getHiddenProducts();
      const currentHidden = hiddenResponse.hiddenProducts || [];

      // Remove current product name from hidden list
      const updatedHidden = currentHidden.filter(
        (name: string) => name !== product.name
      );

      // Update hidden products list
      await adminApi.updateHiddenProducts(updatedHidden);

      setIsProductHidden(false);
      setShowArchiveConfirm(false);
      console.log(`Product "${product.name}" is now visible to customers.`);
    } catch (error) {
      console.error("Error showing product:", error);
      console.error("Failed to show product. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      const { adminApi } = await import("@/lib/adminApi");
      await adminApi.deleteProduct(productId);
      router.push("/admin/products");
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string) => {
    return (
      statusConfig[status as keyof typeof statusConfig] || {
        color: "bg-gray-100 text-gray-800",
        label: status,
      }
    );
  };

  const getCategoryConfig = (category: string) => {
    return (
      categoryConfig[category as keyof typeof categoryConfig] ||
      "bg-gray-100 text-gray-800"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            The product you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusConfig(product.status);
  const categoryColor = getCategoryConfig(product.category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {product.name}
              </h1>
              <p className="text-gray-500">Product ID: {product._id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            <Badge className={categoryColor}>{product.category}</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Product Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                  {product.images &&
                  product.images.length > 0 &&
                  product.images[selectedImageIndex] ? (
                    <Image
                      src={product.images[selectedImageIndex]}
                      alt={product.name}
                      width={600}
                      height={600}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(
                          "Image failed to load:",
                          product.images?.[selectedImageIndex]
                        );
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget
                          .nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center ${
                      product.images && product.images.length > 0
                        ? "hidden"
                        : ""
                    }`}
                  >
                    <Package className="w-24 h-24 text-gray-400" />
                  </div>
                </div>

                {/* Thumbnail Images */}
                {product.images && product.images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                          selectedImageIndex === index
                            ? "border-purple-500"
                            : "border-gray-200"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error(
                              "Thumbnail image failed to load:",
                              image
                            );
                            e.currentTarget.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNUg2MFY1NUgyMFYyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Product Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {product.variants && product.variants.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Variants
                    </h3>
                    <div className="space-y-3">
                      {product.variants.map((variant, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{variant.color}</span>
                            <span className="text-sm text-gray-500">
                              {variant.images.length} images
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {variant.sizes.map((size, sizeIndex) => (
                              <Badge
                                key={sizeIndex}
                                variant={
                                  size.stock > 0 ? "default" : "secondary"
                                }
                              >
                                {size.size} ({size.stock})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Product Info & Actions */}
          <div className="space-y-6">
            {/* Product Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="w-5 h-5" />
                  <span>Product Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Brand</p>
                    <p className="font-medium">{product.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subcategory</p>
                    <p className="font-medium">{product.subcategory}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">SKU</p>
                    <p className="font-medium">{product.sku || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Pricing</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Current Price</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{product.price}
                  </span>
                </div>
                {product.originalPrice > product.price && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Original Price
                      </span>
                      <span className="text-lg text-gray-500 line-through">
                        ₹{product.originalPrice}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Discount</span>
                      <Badge className="bg-red-100 text-red-800">
                        {product.discount}% OFF
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-500">Rating</span>
                  </div>
                  <span className="font-medium">{product.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-500">Reviews</span>
                  </div>
                  <span className="font-medium">{product.reviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-500">Stock</span>
                  </div>
                  <span
                    className={`font-medium ${
                      product.inStock ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {product.totalStock} units
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Dates</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(product.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatDate(product.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/admin/products/edit/${product._id}`)
                  }
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Product
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowArchiveConfirm(true)}
                >
                  {isProductHidden ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Product
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 mr-2" />
                      Hide Product
                    </>
                  )}
                </Button>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigator.clipboard.writeText(product._id)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy ID
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const url = `${window.location.origin}/products/${product._id}`;
                      navigator.clipboard.writeText(url);
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isProductHidden ? "Show Product" : "Hide Product"}
            </h3>
            <p className="text-gray-600 mb-6">
              {isProductHidden
                ? "Are you sure you want to show this product? It will be visible to customers."
                : `Are you sure you want to hide "${product.name}"? It will be hidden from customers but remain in the admin panel.`}
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowArchiveConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${
                  isProductHidden
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
                onClick={
                  isProductHidden ? handleShowProduct : handleHideProduct
                }
              >
                {isProductHidden ? "Show Product" : "Hide Product"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Delete Product
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this product? This
              action cannot be undone and will remove all associated data.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
