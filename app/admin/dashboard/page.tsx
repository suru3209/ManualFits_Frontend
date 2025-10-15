"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  Eye,
  Edit,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalReviews: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  recentOrders: any[];
}

interface ChartData {
  date: string;
  orders: number;
  revenue: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${backendUrl}/api/admin/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);

        // Generate sample chart data (in real app, this would come from API)
        const sampleChartData = generateChartData();
        setChartData(sampleChartData);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateChartData = (): ChartData[] => {
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        orders: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 5000) + 1000,
      });
    }
    return data;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-8 bg-slate-200 rounded w-16"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load dashboard</h3>
        <p className="text-slate-600 mb-4">
          Unable to fetch dashboard statistics
        </p>
        <Button onClick={fetchDashboardData}>Try Again</Button>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: "+12%",
      changeType: "positive" as const,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      change: "+5%",
      changeType: "positive" as const,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      change: "+18%",
      changeType: "positive" as const,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+8%",
      changeType: "positive" as const,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Open main site in new tab
              window.open("/", "_blank");
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Site
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  {kpi.changeType === "positive" ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={
                      kpi.changeType === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {kpi.change}
                  </span>
                  <span>from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Daily sales for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from customers</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.push("/admin/orders");
              }}
            >
              View All Orders
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentOrders.slice(0, 5).map((order: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      Order #{order._id ? String(order._id).slice(-8) : "N/A"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {order.user?.username || "Guest"} • ₹{order.totalAmount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      order.status === "delivered" ? "default" : "secondary"
                    }
                  >
                    {order.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common admin tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-2"
              onClick={() => {
                router.push("/admin/orders");
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Manage Orders</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-2"
              onClick={() => {
                router.push("/admin/users");
              }}
            >
              <Users className="w-5 h-5" />
              <span>View Users</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-2"
              onClick={() => {
                router.push("/admin/reviews");
              }}
            >
              <Star className="w-5 h-5" />
              <span>Reviews</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
