"use client"
export const dynamic = "force-dynamic"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, CreditCard, Truck, Shield, MapPin, Phone, Mail, User } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCart, getCartTotal, clearCartAfterCheckout } from "@/lib/cart"
import { getCurrentUser } from "@/lib/auth"
import { useCart } from "@/contexts/cart-context"
import { useNotifications } from "@/contexts/notification-context"
import { useClientToast } from "@/hooks/use-client-toast"
import type { CartItem } from "@/lib/cart"

export default function CheckoutPage() {
  const router = useRouter()
  const { refreshCart } = useCart()
  const { refreshNotifications } = useNotifications()
  const toast = useClientToast()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    zipCode: "",
  })
  const [paymentMethod, setPaymentMethod] = useState("cod")

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/login")
      return
    }

    const nameParts = user.name.split(" ")
    setShippingInfo((prev) => ({
      ...prev,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: user.email,
    }))

    fetchCart()
  }, [router])

  const fetchCart = async () => {
    try {
      const cartItems = await getCart()
      setCart(cartItems)

      if (cartItems.length === 0) {
        router.push("/cart")
        return
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast.error("Failed to Load", "Could not load cart items")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value,
    })
  }

  const validateForm = () => {
    const requiredFields = ["firstName", "lastName", "email", "phone", "address", "city", "province", "zipCode"]

    for (const field of requiredFields) {
      if (!shippingInfo[field as keyof typeof shippingInfo].trim()) {
        toast.error("Validation Error", `Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`)
        return false
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(shippingInfo.email)) {
      toast.error("Validation Error", "Please enter a valid email address")
      return false
    }

    if (shippingInfo.phone.length < 10) {
      toast.error("Validation Error", "Please enter a valid phone number")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    try {
      const orderData = {
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          color: item.color,
        })),
        shipping_info: shippingInfo,
        payment_method: paymentMethod,
        subtotal: subtotal,
        shipping_fee: shipping,
        total: total,
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (result.success) {
        const cartCleared = await clearCartAfterCheckout()

        if (cartCleared) {
          await refreshCart()

          setTimeout(() => {
            refreshNotifications()
          }, 1000)

          window.dispatchEvent(new CustomEvent("orderPlaced"))

          toast.orderPlaced(result.data.order_number)

          router.push(`/order-success?orderId=${result.data.id}&orderNumber=${result.data.order_number}`)
        } else {
          toast.warning("Order Placed", "Order successful but cart may need manual refresh")
          router.push(`/order-success?orderId=${result.data.id}&orderNumber=${result.data.order_number}`)
        }
      } else {
        throw new Error(result.message || "Order failed")
      }
    } catch (error) {
      console.error("Error placing order:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast.error("Order Failed", errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const getAuthToken = () => {
    try {
      const sessionData = localStorage.getItem("session")
      if (!sessionData) return null
      const session = JSON.parse(sessionData)
      return session.token || null
    } catch (error) {
      return null
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const subtotal = getCartTotal(cart)
  const shipping = subtotal > 50000 ? 0 : 500
  const total = subtotal + shipping

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
            <Button onClick={() => router.push("/products")} className="bg-orange-500 hover:bg-orange-600">
              Continue Shopping
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="bg-gradient-to-br from-slate-900 via-orange-900 to-red-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">Checkout</h1>
            <p className="text-slate-300">Complete your order securely</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/cart")}
            className="text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <User className="w-5 h-5 mr-2 text-orange-500" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="firstName"
                        value={shippingInfo.firstName}
                        onChange={handleInputChange}
                        required
                        className="h-12"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="lastName"
                        value={shippingInfo.lastName}
                        onChange={handleInputChange}
                        required
                        className="h-12"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        name="email"
                        type="email"
                        value={shippingInfo.email}
                        onChange={handleInputChange}
                        required
                        className="pl-10 h-12"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        name="phone"
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        required
                        className="pl-10 h-12"
                        placeholder="+63 9XX XXX XXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleInputChange}
                        required
                        className="pl-10 h-12"
                        placeholder="Street address, building, apartment"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        required
                        className="h-12"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Province <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="province"
                        value={shippingInfo.province}
                        onChange={handleInputChange}
                        required
                        className="h-12"
                        placeholder="Province"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="zipCode"
                        value={shippingInfo.zipCode}
                        onChange={handleInputChange}
                        required
                        className="h-12"
                        placeholder="ZIP"
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <CreditCard className="w-5 h-5 mr-2 text-orange-500" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <label className="flex items-center p-4 border-2 border-orange-300 bg-orange-50 rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <Truck className="w-5 h-5 mr-3 text-orange-600" />
                    <div>
                      <span className="font-medium text-orange-800">Cash on Delivery</span>
                      <p className="text-sm text-orange-600">Pay when you receive your order</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-not-allowed opacity-50">
                    <input type="radio" name="payment" value="card" disabled className="mr-3" />
                    <CreditCard className="w-5 h-5 mr-3 text-gray-600" />
                    <div>
                      <span className="font-medium">Credit/Debit Card</span>
                      <p className="text-sm text-gray-500">Coming soon</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={item.product.images[0] || "/placeholder.svg"}
                          alt={item.product.name}
                          fill
                          className="object-contain rounded-lg"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{item.product.name}</h4>
                        <p className="text-sm text-gray-600">{item.product.model}</p>
                        {item.color && <p className="text-xs text-gray-500">Color: {item.color}</p>}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                          <span className="font-semibold text-orange-600">{formatPrice(item.total)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({cart.length} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping Fee</span>
                    <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-orange-600">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing || cart.length === 0}
                  className="w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-14 text-lg font-semibold disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing Order...</span>
                    </div>
                  ) : (
                    `Place Order - ${formatPrice(total)}`
                  )}
                </Button>

                <div className="mt-6 space-y-3 text-center text-sm text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Secure payment guaranteed</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Truck className="w-4 h-4 text-orange-500" />
                    <span>Free shipping on orders over ₱50,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
