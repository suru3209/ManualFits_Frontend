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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Package,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import Image from "next/image";
import { VariantPair, Product } from "@/types/types";

// Extended Product interface for admin with additional fields
interface AdminProduct extends Omit<Product, "createdAt"> {
  status: string;
  createdAt: string;
  subcategory: string[]; // Make required for admin
  // Legacy fields for backward compatibility
  name?: string;
  price?: number;
  originalPrice?: number;
  images?: string[];
  colors?: string[];
  discountType?: "percentage" | "flat";
  discount?: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null
  );
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] = useState<AdminProduct | null>(
    null
  );

  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (searchQuery) params.append("search", searchQuery);
      if (categoryFilter && categoryFilter !== "all")
        params.append("category", categoryFilter);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);

      const response = await fetch(
        `${backendUrl}/api/admin/products?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(
        `${backendUrl}/api/admin/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        throw new Error("Failed to delete product");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeletingProduct(null);
    }
  };

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(
        `${backendUrl}/api/admin/products/${productId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        toast.success("Product status updated successfully");
        fetchProducts();
      } else {
        throw new Error("Failed to update product status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update product status");
    }
  };

  const categories = [
    "Men",
    "Women",
    "Kids",
    "Footwear",
    "Accessories",
    "New Arrivals",
  ];
  const statuses = ["active", "draft", "archived"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={() => setIsProductFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({products.length})</CardTitle>
          <CardDescription>
            Manage your product inventory and details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              <span>Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-slate-600 mb-4">
                {searchQuery || categoryFilter || statusFilter
                  ? "Try adjusting your filters"
                  : "Get started by adding your first product"}
              </p>
              <Button onClick={() => setIsProductFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                            {(() => {
                              console.log(
                                "🔍 Product for image display:",
                                product
                              );
                              console.log(
                                "🔍 Product variants:",
                                product.variants
                              );

                              // Try to get image from new variant structure first
                              if (
                                product.variants &&
                                product.variants.length > 0 &&
                                product.variants[0].images &&
                                product.variants[0].images.length > 0
                              ) {
                                console.log(
                                  "🔍 Using variant image:",
                                  product.variants[0].images[0]
                                );
                                return (
                                  <Image
                                    src={product.variants[0].images[0]}
                                    alt={product.title}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                );
                              }
                              // Fallback to legacy images
                              else if (product.images && product.images[0]) {
                                console.log(
                                  "🔍 Using legacy image:",
                                  product.images[0]
                                );
                                return (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.title}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                );
                              }
                              // No image available
                              else {
                                return (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-6 h-6 text-slate-400" />
                                  </div>
                                );
                              }
                            })()}
                          </div>
                          <div>
                            <div className="font-medium">{product.title}</div>
                            <div className="text-sm text-slate-600">
                              {product.subcategory?.slice(0, 2).join(", ") ||
                                "No subcategories"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>{product.brand}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {(() => {
                            // Try to get price from new variant structure first
                            if (
                              product.variants &&
                              product.variants.length > 0
                            ) {
                              const firstVariant = product.variants[0];
                              return (
                                <>
                                  <span className="font-medium">
                                    ₹{firstVariant.price}
                                  </span>
                                  {firstVariant.originalPrice >
                                    firstVariant.price && (
                                    <span className="text-sm text-slate-500 line-through">
                                      ₹{firstVariant.originalPrice}
                                    </span>
                                  )}
                                </>
                              );
                            }
                            // Fallback to legacy price fields
                            else if (product.price) {
                              return (
                                <>
                                  <span className="font-medium">
                                    ₹{product.price}
                                  </span>
                                  {product.originalPrice &&
                                    product.originalPrice > product.price && (
                                      <span className="text-sm text-slate-500 line-through">
                                        ₹{product.originalPrice}
                                      </span>
                                    )}
                                </>
                              );
                            }
                            // No price set
                            else {
                              return (
                                <span className="text-sm text-slate-500">
                                  No price set
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{product.totalStock}</span>
                          {product.inStock ? (
                            <Badge variant="default" className="text-xs">
                              In Stock
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={product.status}
                          onValueChange={(value) =>
                            handleStatusChange(product._id!, value)
                          }
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setViewingProduct(product)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingProduct(product);
                                setIsProductFormOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the product "
                                    {product.name}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteProduct(product._id!)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update the product information below."
                : "Fill in the details to create a new product."}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct as any}
            onSuccess={() => {
              setIsProductFormOpen(false);
              setEditingProduct(null);
              fetchProducts();
            }}
            onCancel={() => {
              setIsProductFormOpen(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Product View Dialog */}
      <Dialog
        open={!!viewingProduct}
        onOpenChange={() => setViewingProduct(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              View complete product information
            </DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-6">
              {/* Product Images */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    // Try to get images from new variant structure first
                    if (
                      viewingProduct.variants &&
                      viewingProduct.variants.length > 0
                    ) {
                      const allImages = viewingProduct.variants.flatMap(
                        (variant) => variant.images
                      );

                      if (allImages.length > 0) {
                        return allImages
                          .slice(0, 8)
                          .map((image: string, index: number) => (
                            <div key={index} className="relative">
                              <Image
                                src={image}
                                alt={`${viewingProduct.title} ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              {index === 0 && (
                                <Badge className="absolute top-2 left-2 text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                          ));
                      }
                    }

                    // Fallback to legacy images
                    if (
                      viewingProduct.images &&
                      viewingProduct.images.length > 0
                    ) {
                      return viewingProduct.images.map((image, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={image}
                            alt={`${viewingProduct.title} ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          {index === 0 && (
                            <Badge className="absolute top-2 left-2 text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      ));
                    }

                    // No images available
                    return (
                      <div className="col-span-full text-center py-8 text-slate-500">
                        No images available
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Basic Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Title:</span>
                      <p className="text-slate-600">{viewingProduct.title}</p>
                    </div>
                    <div>
                      <span className="font-medium">Brand:</span>
                      <p className="text-slate-600">{viewingProduct.brand}</p>
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>
                      <Badge variant="outline" className="ml-2">
                        {viewingProduct.category}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Subcategories:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {viewingProduct.subcategory?.map((sub) => (
                          <Badge
                            key={sub}
                            variant="secondary"
                            className="text-xs"
                          >
                            {sub}
                          </Badge>
                        )) || (
                          <span className="text-slate-500 text-sm">
                            No subcategories
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge
                        variant={
                          viewingProduct.status === "active"
                            ? "default"
                            : "secondary"
                        }
                        className="ml-2"
                      >
                        {viewingProduct.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Pricing & Stock
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Price Range:</span>
                      {(() => {
                        // Try to get price from new variant structure first
                        if (
                          viewingProduct.variants &&
                          viewingProduct.variants.length > 0
                        ) {
                          const prices = viewingProduct.variants.map(
                            (variant) => variant.price
                          );
                          if (prices.length > 0) {
                            const minPrice = Math.min(...prices);
                            const maxPrice = Math.max(...prices);
                            return (
                              <div className="text-slate-600">
                                {minPrice === maxPrice
                                  ? `₹${minPrice}`
                                  : `₹${minPrice} - ₹${maxPrice}`}
                              </div>
                            );
                          }
                        }

                        // Fallback to legacy price
                        if (viewingProduct.price) {
                          return (
                            <p className="text-slate-600">
                              ₹{viewingProduct.price}
                            </p>
                          );
                        }

                        // No price set
                        return <p className="text-slate-500">No price set</p>;
                      })()}
                    </div>
                    {viewingProduct.discount && (
                      <div>
                        <span className="font-medium">Discount:</span>
                        <p className="text-slate-600">
                          {viewingProduct.discount}% (
                          {viewingProduct.discountType})
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Stock Status:</span>
                      <Badge
                        variant={
                          viewingProduct.inStock ? "default" : "destructive"
                        }
                        className="ml-2"
                      >
                        {viewingProduct.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Total Stock:</span>
                      <p className="text-slate-600">
                        {viewingProduct.totalStock}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingProduct.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">
                    {viewingProduct.description}
                  </p>
                </div>
              )}

              {/* Colors */}
              {viewingProduct.colors && viewingProduct.colors.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Available Colors (Legacy)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingProduct.colors.map((color) => (
                      <Badge key={color} variant="outline">
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : viewingProduct.variants &&
                viewingProduct.variants.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Available Colors
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      new Set(
                        viewingProduct.variants.map((variant) => variant.color)
                      )
                    ).map((colorName: string) => (
                      <Badge key={colorName} variant="outline">
                        {colorName}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Variants */}
              {viewingProduct.variants &&
                viewingProduct.variants.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Available Variants
                    </h3>
                    <div className="space-y-4">
                      {viewingProduct.variants.map(
                        (variant: VariantPair, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-lg">
                                {variant.size} - {variant.color}
                              </span>
                              <Badge
                                variant={
                                  variant.isAvailable ? "default" : "secondary"
                                }
                              >
                                {variant.isAvailable
                                  ? "Available"
                                  : "Unavailable"}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: variant.colorCode }}
                                />
                                <span className="font-medium">
                                  {variant.color}
                                </span>
                              </div>
                              <div className="text-sm text-slate-600">
                                Stock: {variant.stock} | ₹{variant.price}
                                {variant.originalPrice > variant.price && (
                                  <span className="line-through ml-2">
                                    ₹{variant.originalPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Additional Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Product ID:</span>
                    <p className="text-slate-600 font-mono text-xs">
                      {viewingProduct._id}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <p className="text-slate-600">
                      {new Date(viewingProduct.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
