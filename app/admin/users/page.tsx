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
  User,
  UserCheck,
  UserX,
  ShoppingCart,
  Heart,
  Download,
  Loader2,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import Image from "next/image";

interface User {
  _id: string;
  username: string;
  email: string;
  image?: string;
  phone?: string;
  addresses: Array<{
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }>;
  cart: Array<{
    productId: string;
    quantity: number;
    size: string;
    color: string;
  }>;
  wishlist: string[];
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, searchQuery]);

  const fetchUsers = async () => {
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

      const response = await fetch(`${backendUrl}/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(
        `${backendUrl}/api/admin/users/${userId}/status`,
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
          `User ${!currentStatus ? "activated" : "deactivated"} successfully`
        );
        fetchUsers();
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser({ ...selectedUser, isActive: !currentStatus });
        }
      } else {
        throw new Error("Failed to update user status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update user status");
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const exportUserData = () => {
    // In a real implementation, this would generate and download a CSV/Excel file
    toast.info("Export functionality coming soon");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-600 mt-1">
            Manage customer accounts and data
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportUserData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
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
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>Customer accounts and information</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              <span>Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-slate-600">
                {searchQuery
                  ? "Try adjusting your search"
                  : "No users have registered yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Addresses</TableHead>
                    <TableHead>Cart Items</TableHead>
                    <TableHead>Wishlist</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.username}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-slate-600">
                              ID:{" "}
                              {user._id ? String(user._id).slice(-8) : "N/A"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-2 text-sm text-slate-600">
                              <Phone className="w-3 h-3" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">
                            {user.addresses.length}
                          </span>
                          <span className="text-slate-600 ml-1">addresses</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">
                            {user.cart.length} items
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">
                            {user.wishlist.length} items
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "destructive"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(user.created_at)}
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
                                setSelectedUser(user);
                                setIsUserDetailOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleUserStatus(user._id, user.isActive)
                              }
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
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

      {/* User Detail Dialog */}
      <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              {selectedUser?.username} - {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Information */}
              <Card>
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full overflow-hidden">
                      {selectedUser.image ? (
                        <Image
                          src={selectedUser.image}
                          alt={selectedUser.username}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedUser.username}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <span>{selectedUser.email}</span>
                        </div>
                        {selectedUser.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{selectedUser.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge
                          variant={
                            selectedUser.isActive ? "default" : "destructive"
                          }
                        >
                          {selectedUser.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex items-center space-x-1 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Joined {formatDate(selectedUser.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Addresses */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Addresses ({selectedUser.addresses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUser.addresses.length === 0 ? (
                    <p className="text-slate-600">No addresses saved</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedUser.addresses.map((address, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{address.fullName}</h4>
                            {address.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>{address.address}</p>
                            <p>
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            <p>{address.country}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cart Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Cart Items ({selectedUser.cart.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUser.cart.length === 0 ? (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <ShoppingCart className="w-5 h-5" />
                      <span>Cart is empty</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.cart.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded"
                        >
                          <div>
                            <p className="font-medium">
                              Product ID:{" "}
                              {item.productId
                                ? String(item.productId).slice(-8)
                                : "N/A"}
                            </p>
                            <div className="text-sm text-slate-600 space-y-1">
                              <p>Quantity: {item.quantity}</p>
                              <p>Size: {item.size}</p>
                              <p>Color: {item.color}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wishlist */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Wishlist ({selectedUser.wishlist.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUser.wishlist.length === 0 ? (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Heart className="w-5 h-5" />
                      <span>Wishlist is empty</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedUser.wishlist.map((productId, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-50 rounded text-sm font-mono"
                        >
                          {productId ? String(productId).slice(-8) : "N/A"}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
