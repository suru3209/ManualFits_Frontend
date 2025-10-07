"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api";
import UsersManagement from "@/components/admin/UsersManagement";
import ProductsManagement from "@/components/admin/ProductsManagement";
import OrdersManagement from "@/components/admin/OrdersManagement";
import ReviewsManagement from "@/components/admin/ReviewsManagement";
import ReturnsManagement from "@/components/admin/ReturnsManagement";
import SupportManagement from "@/components/admin/SupportManagement";
import AdminManagement from "@/components/admin/AdminManagement";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Package,
  ShoppingCart,
  Star,
  // TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  // AlertCircle,
  LogOut,
  Settings,
  BarChart3,
  UserCheck,
  ShoppingBag,
  Star as StarIcon,
  RotateCcw,
  MessageCircle,
} from "lucide-react";

interface AdminOrder {
  _id: string;
  totalAmount: number;
  status: string;
  user?: {
    username: string;
  };
}

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalReviews: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  recentOrders: AdminOrder[];
}

interface AdminInfo {
  id: string;
  username: string;
  role: string;
  permissions: string[];
  lastLogin: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem("adminToken");
    const adminData = localStorage.getItem("adminInfo");

    if (!token || !adminData) {
      router.push("/admin/login");
      return;
    }

    setAdminInfo(JSON.parse(adminData));
    fetchDashboardStats();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(buildApiUrl("/api/admin/dashboard/stats"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen z-1000 bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {adminInfo?.username}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800"
              >
                {adminInfo?.role}
              </Badge>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "users", label: "Users", icon: Users },
              { id: "products", label: "Products", icon: Package },
              { id: "orders", label: "Orders", icon: ShoppingCart },
              { id: "reviews", label: "Reviews", icon: StarIcon },
              { id: "returns", label: "Returns", icon: RotateCcw },
              { id: "admins", label: "Admins", icon: UserCheck },
              { id: "support", label: "Support", icon: MessageCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registered users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Products
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalProducts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available products
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Orders
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalOrders || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{stats?.totalRevenue || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From completed orders
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Order Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Orders
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats?.pendingOrders || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting processing
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed Orders
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.completedOrders || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successfully delivered
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Reviews
                  </CardTitle>
                  <Star className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.totalReviews || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customer feedback
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentOrders
                    ?.slice(0, 5)
                    .map((order: AdminOrder, index: number) => {
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium">
                                Order #{order._id?.slice(-8) || "N/A"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {order.user?.username || "Unknown User"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ₹{order.totalAmount || 0}
                            </p>
                            <Badge
                              variant={
                                order.status === "delivered"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                order.status === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : ""
                              }
                            >
                              {order.status || "Unknown"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "users" && <UsersManagement />}

        {activeTab === "products" && <ProductsManagement />}

        {activeTab === "orders" && <OrdersManagement />}

        {activeTab === "reviews" && <ReviewsManagement />}

        {activeTab === "returns" && <ReturnsManagement />}

        {activeTab === "admins" && <AdminManagement />}

        {activeTab === "support" && <SupportManagement />}
      </main>
    </div>
  );
}
