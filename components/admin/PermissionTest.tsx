"use client";

import { useAdmin } from "@/context/AdminContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

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
  "support.view",
  "support.create",
  "support.update",
  "support.delete",
];

export default function PermissionTest() {
  const { admin, hasPermission } = useAdmin();

  if (!admin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading admin data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Test - {admin.username}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Role: {admin.role} | Total Permissions: {admin.permissions.length}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {availablePermissions.map((permission) => {
              const hasAccess = hasPermission(permission);
              return (
                <div
                  key={permission}
                  className={`p-2 rounded border text-xs ${
                    hasAccess
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center space-x-1 mb-1">
                    {hasAccess ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-600" />
                    )}
                    <span className="font-medium">
                      {permission.split(".")[0]}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {permission.split(".")[1]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium text-blue-900 mb-2">Admin Details:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Username:</strong> {admin.username}
              </p>
              <p>
                <strong>Role:</strong> {admin.role}
              </p>
              <p>
                <strong>Has Super Admin:</strong>{" "}
                {admin.permissions.includes("*") ? "Yes" : "No"}
              </p>
              <p>
                <strong>Total Permissions:</strong> {admin.permissions.length}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium mb-2">Current Permissions:</h4>
            <div className="flex flex-wrap gap-1">
              {admin.permissions.map((permission) => (
                <Badge key={permission} variant="secondary" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
