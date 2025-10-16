"use client";

import { useState, useEffect, useMemo } from "react";
import PermissionGuard from "@/components/admin/PermissionGuard";
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
} from "@/components/ui/dialog";
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
  Search,
  MoreHorizontal,
  Eye,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  ShoppingCart,
  CreditCard,
  Receipt,
  Hash,
} from "lucide-react";
import Image from "next/image";

interface Order {
  _id: string;
  userId: string;
  user: {
    username: string;
    email: string;
  };
  items: Array<{
    productId: string;
    product: {
      name: string;
      images: string[];
      price: number;
    };
    quantity: number;
    size: string;
    color: string;
  }>;
  totalAmount: number;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentStatus: string;
  paymentMethod: string;
  utrNumber?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-100 text-blue-800",
    icon: Package,
  },
  shipped: {
    label: "Shipped",
    color: "bg-purple-100 text-purple-800",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  returned: {
    label: "Returned",
    color: "bg-orange-100 text-orange-800",
    icon: RefreshCw,
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [page, debouncedSearchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8080";

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);

      console.log("🔍 Frontend Search Debug:", {
        searchQuery: searchQuery,
        debouncedSearchQuery: debouncedSearchQuery,
        statusFilter: statusFilter,
        page: page,
        url: `${backendUrl}/api/admin/orders?${params}`,
      });

      const response = await fetch(`${backendUrl}/api/admin/orders?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Frontend Response:", {
          ordersCount: data.orders?.length,
          pagination: data.pagination,
          orderIds: data.orders?.map((o: any) => o._id),
          firstOrderProduct: data.orders?.[0]?.items?.[0]?.product?.name,
        });
        setOrders(data.orders);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(orderId);
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8080";

      const response = await fetch(
        `${backendUrl}/api/admin/orders/${orderId}/status`,
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
        toast.success("Order status updated successfully");
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus as any });
        }
      } else {
        throw new Error("Failed to update order status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update order status");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <PermissionGuard requiredPermission="orders.read">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
            <p className="text-slate-600 mt-1">
              Manage customer orders and fulfillment
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search by order ID or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status)}
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders ({orders.length})</CardTitle>
            <CardDescription>Recent orders from customers</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                <span>Loading orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-slate-600">
                  {debouncedSearchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No orders have been placed yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const statusConfigItem = statusConfig[order.status];
                      return (
                        <TableRow key={order._id}>
                          <TableCell>
                            <div className="font-mono text-sm">
                              #{order._id ? String(order._id).slice(-8) : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {order.user.username}
                              </div>
                              <div className="text-sm text-slate-600">
                                {order.user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-slate-100 rounded overflow-hidden">
                                {order.items[0]?.product?.images?.[0] ? (
                                  <Image
                                    src={order.items[0].product.images[0]}
                                    alt={order.items[0].product.name}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-4 h-4 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium">
                                  {order.items[0]?.product?.name}
                                </div>
                                <div className="text-xs text-slate-600">
                                  {order.items.length} item
                                  {order.items.length > 1 ? "s" : ""}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              ₹{order.totalAmount}
                            </div>
                            <div className="text-sm text-slate-600">
                              {order.paymentStatus}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Select
                                value={order.status}
                                onValueChange={(value) =>
                                  handleStatusUpdate(order._id, value)
                                }
                                disabled={isUpdatingStatus === order._id}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>Pending</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="processing">
                                    <div className="flex items-center space-x-1">
                                      <Package className="w-3 h-3" />
                                      <span>Processing</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="shipped">
                                    <div className="flex items-center space-x-1">
                                      <Truck className="w-3 h-3" />
                                      <span>Shipped</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="delivered">
                                    <div className="flex items-center space-x-1">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Delivered</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    <div className="flex items-center space-x-1">
                                      <XCircle className="w-3 h-3" />
                                      <span>Cancelled</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {isUpdatingStatus === order._id && (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(order.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setIsOrderDetailOpen(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

        {/* Order Detail Dialog */}
        <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Order #
                {selectedOrder?._id
                  ? String(selectedOrder._id).slice(-8)
                  : "N/A"}{" "}
                - {selectedOrder?.user.username}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">
                          Order ID
                        </label>
                        <p className="font-mono">
                          #
                          {selectedOrder._id
                            ? String(selectedOrder._id).slice(-8)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">
                          Date
                        </label>
                        <p>{formatDate(selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">
                          Status
                        </label>
                        <div className="mt-1">
                          <Badge
                            className={`${
                              statusConfig[selectedOrder.status].color
                            } border-0`}
                          >
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(selectedOrder.status)}
                              <span>
                                {statusConfig[selectedOrder.status].label}
                              </span>
                            </div>
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">
                          Payment Status
                        </label>
                        <p>{selectedOrder.paymentStatus}</p>
                      </div>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">
                          Tracking Number
                        </label>
                        <p className="font-mono">
                          {selectedOrder.trackingNumber}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">
                          Username
                        </label>
                        <p>{selectedOrder.user.username}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">
                          Email
                        </label>
                        <p>{selectedOrder.user.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">
                        {selectedOrder.shippingAddress.fullName}
                      </p>
                      <p>{selectedOrder.shippingAddress.address}</p>
                      <p>
                        {selectedOrder.shippingAddress.city},{" "}
                        {selectedOrder.shippingAddress.state}{" "}
                        {selectedOrder.shippingAddress.zipCode}
                      </p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Payment Status:</span>
                        </div>
                        <Badge
                          variant={
                            selectedOrder.paymentStatus === "paid"
                              ? "default"
                              : selectedOrder.paymentStatus === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {selectedOrder.paymentStatus
                            ?.charAt(0)
                            .toUpperCase() +
                            selectedOrder.paymentStatus?.slice(1) || "Unknown"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Receipt className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Order Total:</span>
                        </div>
                        <span className="text-lg font-semibold">
                          ₹{selectedOrder.totalAmount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Payment Method:</span>
                        </div>
                        <span className="capitalize">
                          {selectedOrder.paymentMethod || "Not specified"}
                        </span>
                      </div>
                      {selectedOrder.utrNumber && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Hash className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">UTR Number:</span>
                          </div>
                          <span className="font-mono text-sm">
                            {selectedOrder.utrNumber}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Order Date:</span>
                        </div>
                        <span>
                          {new Date(
                            selectedOrder.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Truck className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">
                              Tracking Number:
                            </span>
                          </div>
                          <span className="font-mono text-sm">
                            {selectedOrder.trackingNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4 p-4 border rounded-lg"
                        >
                          <div className="w-16 h-16 bg-slate-100 rounded overflow-hidden">
                            {item.product?.images &&
                            item.product.images.length > 0 ? (
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.name || "Product"}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {item.product?.name ||
                                "Product Name Not Available"}
                            </h4>
                            <div className="text-sm text-slate-600 space-y-1">
                              <p>Size: {item.size || "One Size"}</p>
                              <p>Color: {item.color || "Default"}</p>
                              <p>Quantity: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ₹{item.product?.price || 0}
                            </p>
                            <p className="text-sm text-slate-600">
                              Total: ₹
                              {item.product?.price
                                ? item.product.price * item.quantity
                                : 0}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total Amount:</span>
                        <span>₹{selectedOrder.totalAmount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
