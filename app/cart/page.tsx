"use client"
export const dynamic = "force-dynamic"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ShoppingBag, Truck, Shield } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ETrikeLoader from "@/components/ui/etrike-loader"
import { getCart, getCartTotal, clearCart, updateCartQuantity, removeFromCart, type CartItem } from "@/lib/cart"
import { getCurrentUser } from "@/lib/auth"
import { useClientToast } from "@/hooks/use-client-toast"
import { useCart } from "@/contexts/cart-context"
import CheckoutSuccessHandler from "@/components/checkout-success-handler"

export default function CartPage() {
  const router = useRouter()
  const toast = useClientToast()
  const { refreshCart } = useCart()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/login")
      return
    }

    fetchCart()
  }, [router])

  const fetchCart = async () => {
    try {
      const cartItems = await getCart()
      setCart(cartItems)
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast.error("Failed to Load", "Could not load cart items")
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdating(id)
    try {
      const success = await updateCartQuantity(id, newQuantity)
      if (success) {
        await fetchCart()
        await refreshCart()
        toast.cartUpdated("Quantity updated successfully")
      } else {
        toast.error("Update Failed", "Could not update quantity")
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
      toast.error("Update Failed", "Could not update quantity")
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveItem = async (id: string) => {
    setUpdating(id)
    try {
      const success = await removeFromCart(id)
      if (success) {
        await fetchCart()
        await refreshCart()
        toast.success("Item Removed", "Item has been removed from your cart")
      } else {
        toast.error("Remove Failed", "Could not remove item")
      }
    } catch (error) {
      console.error("Error removing item:", error)
      toast.error("Remove Failed", "Could not remove item")
    } finally {
      setUpdating(null)
    }
  }

  const handleClearCart = async () => {
    setClearing(true)
    try {
      const success = await clearCart()
      if (success) {
        setCart([])
        await refreshCart()
        toast.success("Cart Cleared", "All items have been removed from your cart")
      } else {
        toast.error("Clear Failed", "Could not clear cart")
      }
    } catch (error) {
      console.error("Error clearing cart:", error)
      toast.error("Clear Failed", "Could not clear cart")
    } finally {
      setClearing(false)
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
        <CheckoutSuccessHandler />
        <Header />
        <div className="flex items-center justify-center py-20">
          <ETrikeLoader />
        </div>
        <Footer />
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CheckoutSuccessHandler />
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-16 h-16 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Button
              onClick={() => router.push("/products")}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
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
      <CheckoutSuccessHandler />
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-orange-900 to-red-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">Shopping Cart</h1>
              <p className="text-slate-300">Review your items and proceed to checkout</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <ShoppingCart className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/products")}
            className="text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Cart Items ({cart.length})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCart}
                  disabled={clearing}
                  className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {clearing ? "Clearing..." : "Clear All"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={item.product.images[0] || "/placeholder.svg"}
                        alt={item.product.name}
                        fill
                        className="object-contain rounded-lg"
                        sizes="80px"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product_id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 mb-1">{item.product.model}</p>
                      <Badge className="bg-orange-100 text-orange-600 border-orange-200 text-xs">
                        {item.product.category}
                      </Badge>
                      {item.color && <p className="text-sm text-gray-500 mt-1">Color: {item.color}</p>}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updating === item.id}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-semibold text-lg w-8 text-center">
                        {updating === item.id ? "..." : item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updating === item.id}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="font-bold text-lg text-orange-600">{formatPrice(item.total)}</div>
                      <div className="text-sm text-gray-500">{formatPrice(item.price)} each</div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={updating === item.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
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
                  onClick={() => router.push("/checkout")}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-12 text-lg font-semibold"
                >
                  Proceed to Checkout
                </Button>

                <div className="space-y-3 text-center text-sm text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Secure checkout guaranteed</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Truck className="w-4 h-4 text-orange-500" />
                    <span>Free shipping on orders over ₱50,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">You might also like</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 text-sm">
                  <p>Check out our featured products</p>
                  <Button variant="outline" size="sm" onClick={() => router.push("/products")} className="mt-2">
                    Browse Products
                  </Button>
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
