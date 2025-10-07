"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("adminToken");
      const adminInfo = localStorage.getItem("adminInfo");

      if (!token || !adminInfo) {
        setIsAuthenticated(false);
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, [router, pathname]);

  // If not authenticated and not on login page, don't render anything
  if (!isAuthenticated && pathname !== "/admin/login") {
    return null;
  }

  return <>{children}</>;
}
