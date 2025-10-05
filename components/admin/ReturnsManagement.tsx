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
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  User,
  Package,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";

interface ReturnReplaceRequest {
  _id: string;
  order: {
    _id: string;
    totalAmount: number;
    status: string;
  };
  user: {
    _id: string;
    username: string;
    email: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      images: string[];
    };
    reason: string;
    quantity: number;
  }>;
  type: "return" | "replace";
  status: "requested" | "approved" | "rejected" | "completed";
  createdAt: string;
  updatedAt: string;
}

interface ReturnsResponse {
  requests: ReturnReplaceRequest[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

const statusConfig = {
  requested: {
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    label: "Requested",
  },
  approved: {
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
    label: "Approved",
  },
  rejected: {
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    label: "Rejected",
  },
  completed: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Completed",
  },
};

const typeConfig = {
  return: { color: "bg-orange-100 text-orange-800", label: "Return" },
  replace: { color: "bg-purple-100 text-purple-800", label: "Replace" },
};

export default function ReturnsManagement() {
  const [requests, setRequests] = useState<ReturnReplaceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });

  const fetchRequests = async (page = 1, status = "") => {
    try {
      setLoading(true);
      const response = await adminApi.getReturnReplaceRequests(
        page,
        10,
        status
      );

      setRequests(response.requests);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching return/replace requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(currentPage, selectedStatus);
  }, [currentPage, selectedStatus]);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await adminApi.updateReturnReplaceStatus(requestId, newStatus);

      // Refresh requests
      fetchRequests(currentPage, selectedStatus);
    } catch (error) {
      console.error("Error updating request status:", error);
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

  const getStatusConfig = (status: string) => {
    return (
      statusConfig[status as keyof typeof statusConfig] || {
        color: "bg-gray-100 text-gray-800",
        icon: Clock,
        label: status,
      }
    );
  };

  const getTypeConfig = (type: string) => {
    return (
      typeConfig[type as keyof typeof typeConfig] || {
        color: "bg-gray-100 text-gray-800",
        label: type,
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Return & Replace Management
          </h2>
          <p className="text-gray-600">
            Handle return and replacement requests
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {pagination.total} Total Requests
          </Badge>
        </div>
      </div>

      {/* Status Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStatus === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("")}
            >
              All Requests
            </Button>
            {Object.keys(statusConfig).map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className="capitalize"
              >
                {statusConfig[status as keyof typeof statusConfig].label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            Showing {requests.length} of {pagination.total} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No requests found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => {
                const statusInfo = getStatusConfig(request.status);
                const typeInfo = getTypeConfig(request.type);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={request._id}
                    className="border rounded-lg p-6 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <RotateCcw className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {typeInfo.label} Request #{request._id.slice(-8)}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{request.user.username}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(request.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            Order #{request.order?._id?.slice(-8) || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Amount: ₹{request.order?.totalAmount || "N/A"}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {request.order?.status || "Unknown"}
                        </Badge>
                      </div>
                    </div>

                    {/* Request Items */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Requested Items:
                      </h4>
                      <div className="space-y-3">
                        {request.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 p-3 bg-gray-50 rounded"
                          >
                            {item.product?.images?.[0] && (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {item.product?.name || "Unknown Product"}
                              </p>
                              <p className="text-sm text-gray-500">
                                Quantity: {item.quantity}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Reason:</strong> {item.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          Request ID:
                        </span>
                        <span className="text-sm font-mono">
                          {request._id.slice(-8)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {request.status === "requested" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleStatusChange(request._id, "approved")
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusChange(request._id, "rejected")
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {request.status === "approved" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusChange(request._id, "completed")
                            }
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Completed
                          </Button>
                        )}
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
