"use client";

import { useAdmin } from "@/context/AdminContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock } from "lucide-react";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string | null;
  fallback?: React.ReactNode;
}

export default function PermissionGuard({
  children,
  requiredPermission,
  fallback,
}: PermissionGuardProps) {
  const { admin, hasPermission } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (requiredPermission && admin && !hasPermission(requiredPermission)) {
      // Redirect to dashboard if user doesn't have permission
      router.push("/admin/dashboard");
    }
  }, [requiredPermission, admin, hasPermission, router]);

  // If no permission required, show content
  if (!requiredPermission) {
    return <>{children}</>;
  }

  // If admin not loaded yet, show loading
  if (!admin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user has permission, show content
  if (hasPermission(requiredPermission)) {
    return <>{children}</>;
  }

  // If user doesn't have permission, show fallback or default message
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default permission denied message
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Required permission:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              {requiredPermission}
            </code>
          </p>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
