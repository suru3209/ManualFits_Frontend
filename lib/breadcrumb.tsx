"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Route mapping for better breadcrumb labels
const routeLabels: Record<string, string> = {
  "/products": "Products",
  "/cart": "Shopping Cart",
  "/checkout": "Checkout",
  "/wishlist": "Wishlist",
  "/wardrobe": "My Wardrobe",
  "/search": "Search Results",
  "/about": "About Us",
  "/contact": "Contact Us",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/account": "My Account",
  "/account/login": "Login",
  "/account/dashboard": "Dashboard",
  "/admin": "Admin Dashboard",
  "/admin/orders": "Manage Orders",
  "/admin/products": "Manage Products",
  "/admin/users": "Manage Users",
  "/admin/settings": "Admin Settings",
};

// Get breadcrumb items based on current path
export function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with Home
  breadcrumbs.push({ label: "Home", href: "/" });

  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Handle dynamic routes like [id]
    if (segment.match(/^[a-f\d]{24}$/) || !isNaN(Number(segment))) {
      // This is likely a product ID or similar dynamic segment
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
      const parentLabel =
        routeLabels[parentPath] || parentPath.split("/").pop() || segment;

      // For product pages, show a more user-friendly label
      if (parentPath === "/products") {
        breadcrumbs.push({
          label: `Product Details`,
          href: currentPath,
        });
      } else {
        breadcrumbs.push({
          label: `Item ${segment}`,
          href: currentPath,
        });
      }
    } else {
      // Regular segment
      const label =
        routeLabels[currentPath] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);

      // Don't make the last segment a link (current page)
      const isLastSegment = currentPath === pathname;

      breadcrumbs.push({
        label,
        href: isLastSegment ? undefined : currentPath,
      });
    }
  }

  return breadcrumbs;
}

export default function DynamicBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null;
  }

  const breadcrumbItems = getBreadcrumbItems(pathname);
  const currentPageLabel =
    breadcrumbItems[breadcrumbItems.length - 1]?.label || "Page";

  const handleBackClick = () => {
    router.back();
  };

  return (
    <div className="pl-2 mb-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-200 group"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Breadcrumb Trail */}
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link
                          href={item.href}
                          className="text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          {item.label}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-gray-900 font-medium">
                        {item.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbItems.length - 1 && (
                    <BreadcrumbSeparator />
                  )}
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </div>
  );
}
