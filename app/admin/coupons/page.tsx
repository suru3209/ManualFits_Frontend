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
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Gift,
  Calendar,
  Users,
  DollarSign,
  Percent,
  Loader2,
  Copy,
  CheckCircle,
  XCircle,
} from "lucide-react";
import CouponForm from "@/components/admin/CouponForm";

interface Coupon {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  usagePerUser?: number;
  usedCount: number;
  isActive: boolean;
  description?: string;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, [page, searchQuery, statusFilter, typeFilter]);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);
      if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);

      const response = await fetch(
        `${backendUrl}/api/admin/coupons?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast.error("Failed to fetch coupons");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(
        `${backendUrl}/api/admin/coupons/${couponId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      } else {
        throw new Error("Failed to delete coupon");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete coupon");
    } finally {
      setDeletingCoupon(null);
    }
  };

  const handleToggleStatus = async (
    couponId: string,
    currentStatus: boolean
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(
        `${backendUrl}/api/admin/coupons/${couponId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      if (response.ok) {
        toast.success(
          `Coupon ${!currentStatus ? "activated" : "deactivated"} successfully`
        );
        fetchCoupons();
      } else {
        throw new Error("Failed to update coupon status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update coupon status");
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validTo = new Date(coupon.validTo);

    if (!coupon.isActive) {
      return { label: "Inactive", color: "bg-gray-100 text-gray-800" };
    }

    if (now < validFrom) {
      return { label: "Upcoming", color: "bg-blue-100 text-blue-800" };
    }

    if (now > validTo) {
      return { label: "Expired", color: "bg-red-100 text-red-800" };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { label: "Fully Used", color: "bg-orange-100 text-orange-800" };
    }

    return { label: "Active", color: "bg-green-100 text-green-800" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Coupons</h1>
          <p className="text-slate-600 mt-1">
            Manage discount codes and promotions
          </p>
        </div>
        <Button onClick={() => setIsCouponFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
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
                  placeholder="Search by coupon code..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Coupons ({coupons.length})</CardTitle>
          <CardDescription>
            Discount codes and promotional offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              <span>Loading coupons...</span>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No coupons found</h3>
              <p className="text-slate-600 mb-4">
                {searchQuery || statusFilter || typeFilter
                  ? "Try adjusting your filters"
                  : "Get started by creating your first coupon"}
              </p>
              <Button onClick={() => setIsCouponFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Coupon
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <TableRow key={coupon._id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                              {coupon.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCouponCode(coupon.code)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {coupon.type === "percentage" ? (
                              <Percent className="w-4 h-4 text-green-600" />
                            ) : (
                              <DollarSign className="w-4 h-4 text-blue-600" />
                            )}
                            <span className="capitalize">{coupon.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {coupon.type === "percentage"
                              ? `${coupon.value}%`
                              : `₹${coupon.value}`}
                          </div>
                          {coupon.minOrderValue && (
                            <div className="text-sm text-slate-600">
                              Min: ₹{coupon.minOrderValue}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {coupon.usedCount}
                              {coupon.usageLimit
                                ? ` / ${coupon.usageLimit}`
                                : ""}
                            </div>
                            <div className="text-slate-600">
                              {coupon.usagePerUser &&
                                `${coupon.usagePerUser}/user`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center space-x-1 text-slate-600">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(coupon.validFrom)}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-slate-600">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(coupon.validTo)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.color} border-0`}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(coupon.createdAt)}
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
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingCoupon(coupon);
                                  setIsCouponFormOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => copyCouponCode(coupon.code)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Code
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleStatus(
                                    coupon._id,
                                    coupon.isActive
                                  )
                                }
                              >
                                {coupon.isActive ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
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
                                      permanently delete the coupon "
                                      {coupon.code}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteCoupon(coupon._id)
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

      {/* Coupon Form Dialog */}
      <Dialog open={isCouponFormOpen} onOpenChange={setIsCouponFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
            <DialogDescription>
              {editingCoupon
                ? "Update the coupon information below."
                : "Fill in the details to create a new discount coupon."}
            </DialogDescription>
          </DialogHeader>
          <CouponForm
            coupon={editingCoupon}
            onSuccess={() => {
              setIsCouponFormOpen(false);
              setEditingCoupon(null);
              fetchCoupons();
            }}
            onCancel={() => {
              setIsCouponFormOpen(false);
              setEditingCoupon(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
