"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Package, Truck, MapPin, ArrowLeft, CheckCircle, Clock, User, Phone, Mail, CreditCard } from 'lucide-react';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ETrikeLoader from "@/components/ui/etrike-loader";
import { getCurrentUser } from "@/lib/auth";

interface OrderDetail {
  id: number;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: number;
    product: {
      name: string;
      images: string[];
      description: string;
    };
    quantity: number;
    price: number;
  }>;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  payment_method: string;
  tracking_number?: string;
  estimated_delivery?: string;
  order_notes?: string;
  admin_notes?: string;
}

interface TrackingEvent {
  id: number;
  status: string;
  description: string;
  location: string;
  timestamp: string;
  admin_notes?: string;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [tracking, setTracking] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    fetchOrderDetail();
    fetchTrackingInfo();
  }, [orderId, router]);

  const fetchOrderDetail = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_LARAVEL_API_URL;
      const response = await fetch(`${apiUrl}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch (error) {
      console.error("Error fetching order detail:", error);
    }
  };

  const fetchTrackingInfo = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const apiUrl =
        process.env.NEXT_PUBLIC_LARAVEL_API_URL;
      const response = await fetch(`${apiUrl}/orders/${orderId}/tracking`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTracking(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching tracking info:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = () => {
    try {
      const sessionData = localStorage.getItem("session");
      if (!sessionData) return null;
      const session = JSON.parse(sessionData);
      return session.token || null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "processing":
        return "bg-red-100 text-red-800 border-red-200";
      case "shipped":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTrackingIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-orange-600" />;
      case "processing":
        return <Package className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <ETrikeLoader />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Order Not Found
            </h1>
            <Button onClick={() => router.push("/orders")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-orange-900 to-red-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                Order Details
              </h1>
              <p className="text-slate-300">Order #{order.order_number}</p>
            </div>
            <Badge
              className={`${getStatusColor(order.status)} text-lg px-4 py-2`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/orders")}
            className="text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={item.product.images[0] || "/placeholder.svg"}
                          alt={item.product.name}
                          fill
                          className="object-contain rounded-lg"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.product.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-600">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-semibold text-orange-600">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tracking Information */}
            {tracking.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Order Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tracking.map((event, index) => (
                      <div key={event.id} className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {getTrackingIcon(event.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">
                              {event.description}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {new Date(event.timestamp).toLocaleDateString(
                                "en-PH",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </p>
                          {event.admin_notes && (
                            <p className="text-sm text-orange-600 mt-2 bg-orange-50 p-2 rounded">
                              Admin Note: {event.admin_notes}
                            </p>
                          )}
                        </div>
                        {index < tracking.length - 1 && (
                          <div className="absolute left-2 mt-8 w-px h-8 bg-gray-300"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.total * 0.9)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formatPrice(order.total * 0.1)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-orange-600">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>
                    {order.first_name} {order.last_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{order.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{order.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p>{order.address}</p>
                    <p>
                      {order.city}, {order.postal_code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="capitalize">{order.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Date:</span>
                    <span>
                      {new Date(order.created_at).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {order.tracking_number && (
                    <div className="flex justify-between">
                      <span>Tracking #:</span>
                      <span className="font-mono text-sm">
                        {order.tracking_number}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            {order.admin_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 bg-orange-50 p-3 rounded-lg">
                    {order.admin_notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
