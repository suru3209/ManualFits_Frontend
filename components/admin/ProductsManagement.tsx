"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Package,
  Search,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Star,
  DollarSign,
  Tag,
  Calendar,
  Filter,
  Trash2,
} from "lucide-react";

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice: number;
  images: string[];
  category: string;
  subcategory: string;
  brand: string;
  status: "active" | "draft" | "archived";
  inStock: boolean;
  totalStock: number;
  rating: number;
  reviews: number;
  discount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
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

export default function ProductsManagement() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });

  const fetchProducts = async (page = 1, search = "", category = "") => {
    try {
      setLoading(true);
      const { adminApi } = await import("@/lib/adminApi");
      const response = await adminApi.getProducts(page, 10, search, category);

      setProducts(response.products);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, searchTerm, selectedCategory);
  }, [currentPage, searchTerm, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts(1, searchTerm, selectedCategory);
  };

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      const { adminApi } = await import("@/lib/adminApi");
      await adminApi.updateProductStatus(productId, newStatus);

      // Refresh products
      fetchProducts(currentPage, searchTerm, selectedCategory);
    } catch (error) {
      console.error("Error updating product status:", error);
    }
  };

  const handleDeleteProduct = async (
    productId: string,
    productName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { adminApi } = await import("@/lib/adminApi");
      await adminApi.deleteProduct(productId);

      // Refresh products
      fetchProducts(currentPage, searchTerm, selectedCategory);
    } catch (error) {
      console.error("Error deleting product:", error);
      console.error("Failed to delete product. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Product Management
          </h2>
          <p className="text-gray-600">
            Manage your product catalog and inventory
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => router.push("/admin/products/add")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {pagination.total} Total Products
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search & Filter Products</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex space-x-4">
              <Input
                placeholder="Search by name or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Categories</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
                <option value="Footwear">Footwear</option>
                <option value="Accessories">Accessories</option>
                <option value="New Arrivals">New Arrivals</option>
              </select>
              <Button type="submit" variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            Showing {products.length} of {pagination.total} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => {
                const statusInfo = getStatusConfig(product.status);
                const categoryColor = getCategoryConfig(product.category);

                return (
                  <div
                    key={product._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-lg truncate">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-2">
                              {product.brand}
                            </p>

                            {/* Price and Discount */}
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg font-bold text-gray-900">
                                ₹{product.price}
                              </span>
                              {product.originalPrice > product.price && (
                                <>
                                  <span className="text-sm text-gray-500 line-through">
                                    ₹{product.originalPrice}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="bg-red-100 text-red-800 text-xs"
                                  >
                                    {product.discount}% OFF
                                  </Badge>
                                </>
                              )}
                            </div>

                            {/* Additional Info */}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span>{product.rating}</span>
                                <span>({product.reviews})</span>
                              </div>
                              <span>Stock: {product.totalStock}</span>
                              <span>
                                Created: {formatDate(product.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Status and Category Badges */}
                          <div className="flex flex-col items-end space-y-2 ml-4">
                            <Badge className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                            <Badge className={categoryColor}>
                              {product.category}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/admin/products/view/${product._id}`)
                          }
                          className="flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/admin/products/edit/${product._id}`)
                          }
                          className="flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(
                              product._id,
                              product.status === "active"
                                ? "archived"
                                : "active"
                            )
                          }
                          className={`flex items-center ${
                            product.status === "active"
                              ? "text-red-600 hover:bg-red-50 border-red-200"
                              : "text-green-600 hover:bg-green-50 border-green-200"
                          }`}
                        >
                          {product.status === "active" ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Archive
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDeleteProduct(product._id, product.name)
                          }
                          className="flex items-center text-red-600 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
