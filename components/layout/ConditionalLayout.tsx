"use client";

import { usePathname } from "next/navigation";
import { AppleNavbar } from "@/components/ui/skiper-ui/skiper38";
import Footer from "@/components/layout/Footer";
import SimpleNavbar from "@/components/layout/SimpleNavbar";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Check if current route is an admin route or dashboard route
  const isAdminRoute = pathname?.startsWith("/admin");
  const isDashboardRoute = pathname?.startsWith("/account/dashboard");

  // Check if current route needs simple navbar (login, wishlist, cart)
  const isLoginRoute = pathname?.startsWith("/account/login");
  const isWishlistRoute = pathname?.startsWith("/wishlist");
  const isCartRoute = pathname?.startsWith("/cart");

  // For admin routes and dashboard, don't show navbar and footer
  if (isAdminRoute || isDashboardRoute) {
    return <>{children}</>;
  }

  // For login, wishlist, and cart pages, show simple navbar
  if (isLoginRoute || isWishlistRoute || isCartRoute) {
    return (
      <>
        <SimpleNavbar />
        {children}
      </>
    );
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
