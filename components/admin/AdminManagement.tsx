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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Settings,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Key,
} from "lucide-react";

interface Admin {
  _id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface AdminsResponse {
  admins: Admin[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

const DEFAULT_PERMISSIONS = [
  {
    id: "users.view",
    name: "View Users",
    description: "View user list and details",
    category: "Users",
  },
  {
    id: "users.edit",
    name: "Edit Users",
    description: "Edit user information",
    category: "Users",
  },
  {
    id: "users.delete",
    name: "Delete Users",
    description: "Delete user accounts",
    category: "Users",
  },
  {
    id: "products.view",
    name: "View Products",
    description: "View product list and details",
    category: "Products",
  },
  {
    id: "products.create",
    name: "Create Products",
    description: "Create new products",
    category: "Products",
  },
  {
    id: "products.edit",
    name: "Edit Products",
    description: "Edit product information",
    category: "Products",
  },
  {
    id: "products.delete",
    name: "Delete Products",
    description: "Delete products",
    category: "Products",
  },
  {
    id: "orders.view",
    name: "View Orders",
    description: "View order list and details",
    category: "Orders",
  },
  {
    id: "orders.edit",
    name: "Edit Orders",
    description: "Update order status",
    category: "Orders",
  },
  {
    id: "reviews.view",
    name: "View Reviews",
    description: "View product reviews",
    category: "Reviews",
  },
  {
    id: "reviews.delete",
    name: "Delete Reviews",
    description: "Delete product reviews",
    category: "Reviews",
  },
  {
    id: "returns.view",
    name: "View Returns",
    description: "View return/replace requests",
    category: "Returns",
  },
  {
    id: "returns.edit",
    name: "Edit Returns",
    description: "Process return/replace requests",
    category: "Returns",
  },
  {
    id: "admins.view",
    name: "View Admins",
    description: "View admin list",
    category: "Admins",
  },
  {
    id: "admins.create",
    name: "Create Admins",
    description: "Create new admin accounts",
    category: "Admins",
  },
  {
    id: "admins.edit",
    name: "Edit Admins",
    description: "Edit admin information",
    category: "Admins",
  },
  {
    id: "admins.delete",
    name: "Delete Admins",
    description: "Delete admin accounts",
    category: "Admins",
  },
];

const ROLE_PERMISSIONS = {
  super_admin: [
    "admins.view",
    "admins.create",
    "admins.edit",
    "admins.delete",
    "users.view",
    "users.edit",
    "users.delete",
    "products.view",
    "products.create",
    "products.edit",
    "products.delete",
    "orders.view",
    "orders.edit",
    "reviews.view",
    "reviews.delete",
    "returns.view",
    "returns.edit",
  ],
  admin: [
    "users.view",
    "products.view",
    "products.edit",
    "orders.view",
    "orders.edit",
    "reviews.view",
    "reviews.delete",
    "returns.view",
    "returns.edit",
  ],
  moderator: [
    "users.view",
    "products.view",
    "orders.view",
    "reviews.view",
    "reviews.delete",
    "returns.view",
  ],
};

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [permissions, setPermissions] =
    useState<Permission[]>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });

  // Create Admin Form State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    permissions: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit Admin State
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    role: "",
    isActive: true,
    permissions: [] as string[],
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchAdmins = async (page = 1) => {
    try {
      setLoading(true);
      const { adminApi } = await import("@/lib/adminApi");
      const response: AdminsResponse = await adminApi.getAdmins(page, 10);
      setAdmins(response.admins);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { adminApi } = await import("@/lib/adminApi");
      const response = await adminApi.getPermissions();
      if (response.permissions) {
        setPermissions(response.permissions);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      // Use default permissions if API fails
    }
  };

  useEffect(() => {
    fetchAdmins(currentPage);
    fetchPermissions();
  }, [currentPage]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);

    // Validation
    if (createForm.password !== createForm.confirmPassword) {
      setCreateError("Passwords do not match");
      setCreateLoading(false);
      return;
    }

    if (createForm.password.length < 6) {
      setCreateError("Password must be at least 6 characters long");
      setCreateLoading(false);
      return;
    }

    try {
      const { adminApi } = await import("@/lib/adminApi");
      await adminApi.createAdmin({
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        permissions: createForm.permissions,
      });

      // Reset form and close dialog
      setCreateForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
        permissions: [],
      });
      setShowCreateDialog(false);
      fetchAdmins(currentPage);
    } catch (error: any) {
      setCreateError(error.message || "Failed to create admin");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setEditError("");
    setEditLoading(true);

    try {
      const { adminApi } = await import("@/lib/adminApi");
      await adminApi.updateAdmin(editingAdmin._id, {
        username: editForm.username,
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive,
      });

      // Update permissions separately
      await adminApi.updateAdminPermissions(
        editingAdmin._id,
        editForm.permissions
      );

      setEditingAdmin(null);
      setShowEditDialog(false);
      fetchAdmins(currentPage);
    } catch (error: any) {
      setEditError(error.message || "Failed to update admin");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      const { adminApi } = await import("@/lib/adminApi");
      await adminApi.deleteAdmin(adminId);
      fetchAdmins(currentPage);
    } catch (error) {
      console.error("Error deleting admin:", error);
    }
  };

  const handleRoleChange = (role: string, isEdit = false) => {
    if (isEdit) {
      setEditForm({
        ...editForm,
        role,
        permissions:
          ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [],
      });
    } else {
      setCreateForm({
        ...createForm,
        role,
        permissions:
          ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [],
      });
    }
  };

  const handlePermissionChange = (
    permissionId: string,
    checked: boolean,
    isEdit = false
  ) => {
    if (isEdit) {
      setEditForm({
        ...editForm,
        permissions: checked
          ? [...editForm.permissions, permissionId]
          : editForm.permissions.filter((p) => p !== permissionId),
      });
    } else {
      setCreateForm({
        ...createForm,
        permissions: checked
          ? [...createForm.permissions, permissionId]
          : createForm.permissions.filter((p) => p !== permissionId),
      });
    }
  };

  const openEditDialog = (admin: Admin) => {
    setEditingAdmin(admin);
    setEditForm({
      username: admin.username,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      permissions: admin.permissions,
    });
    setShowEditDialog(true);
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
          <p className="text-gray-600">Manage admin accounts and permissions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
              <DialogDescription>
                Create a new admin account with specific permissions.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateAdmin} className="space-y-6">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={createForm.username}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, username: e.target.value })
                    }
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    placeholder="Enter email"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          password: e.target.value,
                        })
                      }
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) => handleRoleChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <Label>Permissions</Label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {Object.entries(groupedPermissions).map(
                    ([category, categoryPermissions]) => (
                      <div key={category} className="mb-4 last:mb-0">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {category}
                        </h4>
                        <div className="space-y-2">
                          {categoryPermissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={permission.id}
                                checked={createForm.permissions.includes(
                                  permission.id
                                )}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(
                                    permission.id,
                                    !!checked
                                  )
                                }
                              />
                              <Label
                                htmlFor={permission.id}
                                className="text-sm"
                              >
                                {permission.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create Admin"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Admins ({pagination.total})
          </CardTitle>
          <CardDescription>
            Manage admin accounts and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admins.map((admin) => (
              <div
                key={admin._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">
                        {admin.username}
                      </h3>
                      <Badge
                        variant={admin.isActive ? "default" : "secondary"}
                        className={
                          admin.isActive ? "bg-green-100 text-green-800" : ""
                        }
                      >
                        {admin.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{admin.role}</Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{admin.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Created:{" "}
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {admin.lastLogin && (
                        <div className="flex items-center space-x-1">
                          <Key className="w-3 h-3" />
                          <span>
                            Last login:{" "}
                            {new Date(admin.lastLogin).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(admin)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Admin</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this admin? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteAdmin(admin._id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {admins.length} of {pagination.total} admins
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-2 text-sm">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Admin Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update admin information and permissions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditAdmin} className="space-y-6">
            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {editError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => handleRoleChange(value, true)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={editForm.isActive}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, isActive: !!checked })
                }
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <Label>Permissions</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                {Object.entries(groupedPermissions).map(
                  ([category, categoryPermissions]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {categoryPermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`edit-${permission.id}`}
                              checked={editForm.permissions.includes(
                                permission.id
                              )}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  permission.id,
                                  !!checked,
                                  true
                                )
                              }
                            />
                            <Label
                              htmlFor={`edit-${permission.id}`}
                              className="text-sm"
                            >
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? "Updating..." : "Update Admin"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
