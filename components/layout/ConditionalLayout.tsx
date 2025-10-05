"use client";

import { usePathname } from "next/navigation";
import { AppleNavbar } from "@/components/ui/skiper-ui/skiper38";
import Footer from "@/components/layout/Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Check if current route is an admin route
  const isAdminRoute = pathname?.startsWith("/admin");

  // For admin routes, don't show navbar and footer
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // For all other routes, show navbar and footer
  return (
    <>
      <AppleNavbar />
      {children}
      <Footer />
    </>
  );
}
