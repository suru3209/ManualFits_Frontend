"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Star,
  Gift,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  BarChart3,
  MessageCircle,
  RotateCcw,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigationItems = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: null, // Dashboard is accessible to all authenticated admins
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
    permission: "products.view",
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    permission: "orders.view",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    permission: "users.view",
  },
  {
    name: "Reviews",
    href: "/admin/reviews",
    icon: Star,
    permission: "reviews.view",
  },
  {
    name: "Returns",
    href: "/admin/returns",
    icon: RotateCcw,
    permission: "returns.view",
  },
  {
    name: "Coupons",
    href: "/admin/coupons",
    icon: Gift,
    permission: "coupons.view",
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    permission: "analytics.view",
  },
  {
    name: "Support",
    href: "/admin/support",
    icon: MessageCircle,
    permission: "support.view",
  },
  {
    name: "Payment Settings",
    href: "/admin/payment",
    icon: CreditCard,
    permission: "settings.update",
  },
  {
    name: "Admin Management",
    href: "/admin/settings",
    icon: Settings,
    permission: "admins.view",
  },
];

export default function AdminSidebar({
  collapsed,
  onToggle,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { admin, hasPermission, logout } = useAdmin();

  const filteredNavItems = navigationItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-50 h-full bg-white border-r border-slate-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-slate-900">Admin Panel</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Admin Info */}
      {!collapsed && admin && (
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {admin.username}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {admin.role.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-5 w-5", collapsed && "mx-auto")} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4">
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full justify-start text-slate-700 hover:bg-slate-100 hover:text-slate-900",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className={cn("h-5 w-5", collapsed && "mx-auto")} />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </div>
  );
}
