"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Eye,
  Settings,
  Bell,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, getAuthToken, type User } from "@/lib/auth";
import { useETrikeToast } from "@/components/ui/toast-container";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const toast = useETrikeToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      // Get the actual auth token instead of using email:role format
      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        return;
      }

      const response = await fetch("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        console.error("Failed to fetch dashboard stats:", response.status);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
    toast.success("Dashboard Updated", "Statistics have been refreshed");
  };

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return;
    }

    // Set user and loading state only once
    if (!user) {
      setUser(currentUser);
      setLoading(false);
    }

    // Show welcome toast only once when component first mounts
    if (!hasShownWelcome && currentUser && !user) {
      const timer = setTimeout(() => {
        toast.powerUp("Admin Dashboard", "Welcome to your control center!");
        setHasShownWelcome(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []); // Empty dependency array to run only once

  // Separate useEffect for fetching stats
  useEffect(() => {
    if (user && !stats) {
      fetchDashboardStats();
    }
  }, [user, stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statsCards = [
    {
      title: "Total Revenue",
      value: stats ? formatCurrency(stats.totalRevenue) : "Loading...",
      change: "+12.5%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "From delivered orders",
    },
    {
      title: "Orders",
      value: stats ? stats.totalOrders.toLocaleString() : "Loading...",
      change: "+8.2%",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Total orders placed",
    },
    {
      title: "Customers",
      value: stats ? stats.totalCustomers.toLocaleString() : "Loading...",
      change: "+15.3%",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Registered customers",
    },
    {
      title: "Products",
      value: stats ? stats.totalProducts.toLocaleString() : "Loading...",
      change: "+3.1%",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Available products",
    },
  ];

  const quickActions = [
    {
      title: "Manage Orders",
      description: "View and process customer orders",
      icon: ShoppingCart,
      href: "/admin/orders",
      color: "bg-blue-500",
    },
    {
      title: "Manage Products",
      description: "Add, edit, or remove products",
      icon: Package,
      href: "/admin/products",
      color: "bg-green-500",
    },
    {
      title: "View Customers",
      description: "Manage customer accounts",
      icon: Users,
      href: "/admin/customers",
      color: "bg-purple-500",
    },
    {
      title: "Analytics",
      description: "View sales and performance data",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 mt-28">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                Administrator
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshStats}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-gray-600">
            Here's what's happening with your store today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions and Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => router.push(action.href)}
                    className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-all"
                  >
                    <div
                      className={`p-2 rounded-lg ${action.color} text-white`}
                    >
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {action.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentOrders?.length ? (
                  stats.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {order.order_number}
                        </p>
                        <p className="text-xs text-gray-600">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(order.total)}
                        </p>
                        <Badge
                          className={`text-xs ${getStatusColor(order.status)}`}
                          variant="secondary"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent orders</p>
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="w-full text-orange-600 hover:text-orange-700"
                  onClick={() => router.push("/admin/orders")}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View All Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
