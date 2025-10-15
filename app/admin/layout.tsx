"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { AdminProvider } from "@/context/AdminContext";
import { Loader2 } from "lucide-react";
import { Toaster } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
        setIsLoading(false);
        return;
      }

      // Verify token with backend
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await fetch(
          `${backendUrl}/api/admin/dashboard/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setIsAuthenticated(true);
          if (pathname === "/admin/login") {
            router.push("/admin/dashboard");
          }
        } else {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("rememberMe");
          router.push("/admin/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("rememberMe");
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminProvider>
      <div className="min-h-screen bg-slate-50">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div
          className={`transition-all duration-300 ${
            sidebarCollapsed ? "ml-16" : "ml-64"
          }`}
        >
          <AdminHeader
            onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main className="p-6">{children}</main>
        </div>
      </div>
      {/* Disable all sonner toasts */}
      <Toaster />
    </AdminProvider>
  );
}
