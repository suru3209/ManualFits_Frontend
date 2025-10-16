"use client";

import { useState, useEffect } from "react";
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
  Search,
  MoreHorizontal,
  Eye,
  Star,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  Calendar,
  User,
  Package,
  Trash2,
} from "lucide-react";
import Image from "next/image";

interface Review {
  _id: string;
  productId: string;
  product: {
    name: string;
    title: string;
    images: string[];
    variants: Array<{
      size: string;
      color: string;
      images: string[];
    }>;
  };
  userId: string;
  user: {
    username: string;
    email: string;
  };
  rating: number;
  title?: string;
  comment: string;
  verified: boolean;
  status: "pending" | "approved" | "rejected" | "hidden";
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  hidden: { label: "Hidden", color: "bg-gray-100 text-gray-800" },
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isReviewDetailOpen, setIsReviewDetailOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [page, searchQuery, statusFilter, ratingFilter]);

  const fetchReviews = async () => {
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

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);
      if (ratingFilter && ratingFilter !== "all")
        params.append("rating", ratingFilter);

      const response = await fetch(
        `${backendUrl}/api/admin/reviews?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error("Failed to fetch reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (reviewId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(reviewId);
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8080";

      const response = await fetch(
        `${backendUrl}/api/admin/reviews/${reviewId}`,
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
        toast.success("Review status updated successfully");
        fetchReviews();
        if (selectedReview && selectedReview._id === reviewId) {
          setSelectedReview({ ...selectedReview, status: newStatus as any });
        }
      } else {
        throw new Error("Failed to update review status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update review status");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      setIsDeleting(reviewId);
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8080";

      const response = await fetch(
        `${backendUrl}/api/admin/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Review deleted successfully");
        fetchReviews();
        if (selectedReview && selectedReview._id === reviewId) {
          setIsReviewDetailOpen(false);
          setSelectedReview(null);
        }
      } else {
        throw new Error("Failed to delete review");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete review");
    } finally {
      setIsDeleting(null);
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <PermissionGuard requiredPermission="reviews.read">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reviews</h1>
            <p className="text-slate-600 mt-1">
              Manage product reviews and ratings
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
                    placeholder="Search by product or user..."
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
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reviews ({reviews.length})</CardTitle>
            <CardDescription>Customer reviews and ratings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                <span>Loading reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                <p className="text-slate-600">
                  {searchQuery || statusFilter || ratingFilter
                    ? "Try adjusting your filters"
                    : "No reviews have been submitted yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => {
                      const statusConfigItem = statusConfig[review.status];
                      return (
                        <TableRow key={review._id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden">
                                {(() => {
                                  console.log(
                                    "🔍 Review product data:",
                                    review.product
                                  );
                                  console.log(
                                    "🔍 Product variants:",
                                    review.product?.variants
                                  );

                                  // Get first image from variants
                                  const firstImage =
                                    review.product?.variants?.[0]?.images?.[0];
                                  console.log(
                                    "🔍 First image from variants:",
                                    firstImage
                                  );

                                  return firstImage;
                                })() ? (
                                  <Image
                                    src={
                                      review.product?.variants?.[0]
                                        ?.images?.[0] || ""
                                    }
                                    alt={review.product?.name || "Product"}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {review.product?.name}
                                </div>
                                <div className="text-sm text-slate-600">
                                  ID:{" "}
                                  {review.productId
                                    ? String(review.productId).slice(-8)
                                    : "N/A"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {review.user?.username || "Anonymous"}
                              </div>
                              <div className="text-sm text-slate-600">
                                {review.user?.email || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {renderStars(review.rating)}
                              <span className="text-sm text-slate-600 ml-1">
                                ({review.rating})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {review.title && (
                                <div className="font-medium text-sm mb-1">
                                  {review.title}
                                </div>
                              )}
                              <div className="text-sm text-slate-600 line-clamp-2">
                                {review.comment}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${
                                statusConfigItem?.color ||
                                "bg-gray-100 text-gray-800"
                              } border-0`}
                            >
                              {statusConfigItem?.label || review.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {review.verified ? (
                              <Badge
                                variant="default"
                                className="bg-green-100 text-green-800 border-0"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-800 border-0"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(review.createdAt)}
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
                                    setSelectedReview(review);
                                    setIsReviewDetailOpen(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {review.status !== "approved" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(review._id, "approved")
                                    }
                                    disabled={isUpdatingStatus === review._id}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {review.status !== "hidden" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(review._id, "hidden")
                                    }
                                    disabled={isUpdatingStatus === review._id}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Hide
                                  </DropdownMenuItem>
                                )}
                                {review.status !== "rejected" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(review._id, "rejected")
                                    }
                                    disabled={isUpdatingStatus === review._id}
                                    className="text-red-600"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                )}
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
                                        permanently delete the review.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteReview(review._id)
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

        {/* Review Detail Dialog */}
        <Dialog open={isReviewDetailOpen} onOpenChange={setIsReviewDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
              <DialogDescription>
                Review by {selectedReview?.user?.username || "Anonymous"}
              </DialogDescription>
            </DialogHeader>

            {selectedReview && (
              <div className="space-y-6">
                {/* Review Header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-100 rounded overflow-hidden">
                          {selectedReview.product?.variants?.[0]
                            ?.images?.[0] ? (
                            <Image
                              src={
                                selectedReview.product?.variants?.[0]
                                  ?.images?.[0] || ""
                              }
                              alt={selectedReview.product?.name || "Product"}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {selectedReview.product?.name}
                          </h3>
                          <div className="flex items-center space-x-1 mt-1">
                            {renderStars(selectedReview.rating)}
                            <span className="text-sm text-slate-600 ml-2">
                              {selectedReview.rating}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {(() => {
                          console.log(
                            "🔍 Selected review status:",
                            selectedReview.status
                          );
                          console.log(
                            "🔍 Status config:",
                            statusConfig[selectedReview.status]
                          );
                          return null;
                        })()}
                        <Badge
                          className={`${
                            statusConfig[selectedReview.status]?.color ||
                            "bg-gray-100 text-gray-800"
                          } border-0`}
                        >
                          {statusConfig[selectedReview.status]?.label ||
                            selectedReview.status ||
                            "Unknown"}
                        </Badge>
                        {selectedReview.verified && (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800 border-0"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* User Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Reviewer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {selectedReview.user?.username || "Anonymous"}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {selectedReview.user?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Reviewed on {formatDate(selectedReview.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Review Content */}
                <Card>
                  <CardHeader>
                    <CardTitle>Review Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedReview.title && (
                      <h4 className="font-semibold mb-3">
                        {selectedReview.title}
                      </h4>
                    )}
                    <div className="prose max-w-none">
                      <p className="text-slate-700 leading-relaxed">
                        {selectedReview.comment}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {selectedReview.status !== "approved" && (
                        <Button
                          onClick={() =>
                            handleStatusUpdate(selectedReview._id, "approved")
                          }
                          disabled={isUpdatingStatus === selectedReview._id}
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Review
                        </Button>
                      )}
                      {selectedReview.status !== "hidden" && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleStatusUpdate(selectedReview._id, "hidden")
                          }
                          disabled={isUpdatingStatus === selectedReview._id}
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Hide Review
                        </Button>
                      )}
                      {selectedReview.status !== "rejected" && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleStatusUpdate(selectedReview._id, "rejected")
                          }
                          disabled={isUpdatingStatus === selectedReview._id}
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Review
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Review
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Review</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this review? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteReview(selectedReview._id)
                              }
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
