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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserPlus,
  Users,
  Key,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";

interface Admin {
  _id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AdminFormData {
  username: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
}

const availablePermissions = [
  "products.create",
  "products.read",
  "products.update",
  "products.delete",
  "orders.read",
  "orders.update",
  "users.read",
  "users.update",
  "users.delete",
  "reviews.read",
  "reviews.update",
  "reviews.delete",
  "coupons.create",
  "coupons.read",
  "coupons.update",
  "coupons.delete",
  "analytics.read",
  "settings.read",
  "settings.update",
  "admins.create",
  "admins.read",
  "admins.update",
  "admins.delete",
];

const rolePermissions = {
  super_admin: ["*"],
  admin: [
    "products.create",
    "products.read",
    "products.update",
    "products.delete",
    "orders.read",
    "orders.update",
    "users.read",
    "users.update",
    "reviews.read",
    "reviews.update",
    "coupons.create",
    "coupons.read",
    "coupons.update",
    "coupons.delete",
    "analytics.read",
  ],
  moderator: [
    "products.read",
    "products.update",
    "orders.read",
    "orders.update",
    "users.read",
    "reviews.read",
    "reviews.update",
  ],
  viewer: ["products.read", "orders.read", "users.read", "reviews.read"],
};

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AdminFormData>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "moderator",
      permissions: [],
    },
  });

  const watchedRole = watch("role");
  const watchedPermissions = watch("permissions");

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    // Auto-set permissions based on role
    if (
      watchedRole &&
      rolePermissions[watchedRole as keyof typeof rolePermissions]
    ) {
      setValue(
        "permissions",
        rolePermissions[watchedRole as keyof typeof rolePermissions]
      );
    }
  }, [watchedRole, setValue]);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${backendUrl}/api/admin/admins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
      } else {
        throw new Error("Failed to fetch admins");
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
      toast.error("Failed to fetch admins");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: AdminFormData) => {
    try {
      if (editingAdmin) {
        setIsUpdating(true);
      } else {
        setIsCreating(true);
      }

      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const url = editingAdmin
        ? `${backendUrl}/api/admin/admins/${editingAdmin._id}`
        : `${backendUrl}/api/admin/admins`;

      const method = editingAdmin ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(
          editingAdmin
            ? "Admin updated successfully"
            : "Admin created successfully"
        );
        setIsAdminFormOpen(false);
        setEditingAdmin(null);
        reset();
        fetchAdmins();
      } else {
        const errorData = await response.text();
        console.error("Error response:", errorData);
        throw new Error("Failed to save admin");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save admin");
    } finally {
      setIsCreating(false);
      setIsUpdating(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      setIsDeleting(adminId);
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(
        `${backendUrl}/api/admin/admins/${adminId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Admin deleted successfully");
        fetchAdmins();
      } else {
        throw new Error("Failed to delete admin");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete admin");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setValue("username", admin.username);
    setValue("email", admin.email);
    setValue("role", admin.role);
    setValue("permissions", admin.permissions);
    setIsAdminFormOpen(true);
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const currentPermissions = watchedPermissions || [];
    if (checked) {
      setValue("permissions", [...currentPermissions, permission]);
    } else {
      setValue(
        "permissions",
        currentPermissions.filter((p) => p !== permission)
      );
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      case "moderator":
        return "secondary";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span>Loading admins...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Management
          </h1>
          <p className="text-slate-600 mt-1">
            Manage admin accounts and permissions
          </p>
        </div>
        <Dialog open={isAdminFormOpen} onOpenChange={setIsAdminFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingAdmin(null);
                reset();
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAdmin ? "Edit Admin" : "Add New Admin"}
              </DialogTitle>
              <DialogDescription>
                {editingAdmin
                  ? "Update admin information and permissions."
                  : "Create a new admin account with specific permissions."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    {...register("username", {
                      required: "Username is required",
                      minLength: {
                        value: 3,
                        message: "Username must be at least 3 characters",
                      },
                    })}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {!editingAdmin && (
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password", {
                        required: !editingAdmin
                          ? "Password is required"
                          : false,
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                      })}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <select
                    id="role"
                    {...register("role", { required: "Role is required" })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  {errors.role && (
                    <p className="text-sm text-red-600">
                      {errors.role.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {availablePermissions.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={permission}
                        checked={
                          watchedPermissions?.includes(permission) || false
                        }
                        onCheckedChange={(checked) =>
                          handlePermissionChange(permission, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={permission}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {permission.replace(".", " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdminFormOpen(false);
                    setEditingAdmin(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingAdmin ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {editingAdmin ? "Update Admin" : "Create Admin"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Admin Accounts ({admins.length})</span>
          </CardTitle>
          <CardDescription>
            Manage admin accounts and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No admins found</h3>
              <p className="text-slate-600 mb-4">
                Get started by creating your first admin account
              </p>
              <Button onClick={() => setIsAdminFormOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Admin
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{admin.username}</div>
                          <div className="text-sm text-slate-600">
                            {admin.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(admin.role)}>
                          {admin.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {admin.permissions.slice(0, 3).map((permission) => (
                            <Badge
                              key={permission}
                              variant="outline"
                              className="text-xs"
                            >
                              {permission.split(".")[0]}
                            </Badge>
                          ))}
                          {admin.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{admin.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {admin.isActive ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="text-red-600">Inactive</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {admin.lastLogin
                            ? new Date(admin.lastLogin).toLocaleDateString()
                            : "Never"}
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
                              onClick={() => handleEditAdmin(admin)}
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
                                    permanently delete the admin account "
                                    {admin.username}".
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
