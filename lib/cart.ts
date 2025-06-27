import { getAuthToken } from "./auth"

export interface CartItem {
  id: string
  product_id: number
  quantity: number
  color?: string
  name: string
  price: number
  image_url: string
  total: number
  product: {
    name: string
    price: number
    image_url: string
    images: string[]
    model: string
    category: string
    description?: string
  }
}

interface CartResponse {
  success: boolean
  message?: string
  data?: CartItem | CartItem[]
  deleted_items?: number
}

export async function getCart(): Promise<CartItem[]> {
  try {
    const token = getAuthToken()
    if (!token) {
      return []
    }

    const response = await fetch("/api/cart", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data: CartResponse = await response.json()

    if (data.success && data.data) {
      const cartItems = data.data as CartItem[]

      // Ensure all items have required properties with fallbacks
      return cartItems.map((item) => ({
        ...item,
        total: item.total || item.price * item.quantity,
        product: {
          name: item.product?.name || item.name,
          price: item.product?.price || item.price,
          image_url: item.product?.image_url || item.image_url,
          images: item.product?.images || [item.image_url],
          model: item.product?.model || "Standard Model",
          category: item.product?.category || "Electric Vehicle",
          description: item.product?.description,
        },
      }))
    }

    return []
  } catch (error) {
    console.error("Get cart error:", error)
    return []
  }
}

export async function addToCart(productId: number, quantity = 1, color?: string): Promise<CartItem | null> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        quantity,
        color,
      }),
    })

    const data: CartResponse = await response.json()

    if (data.success && data.data) {
      // Dispatch cart updated event
      window.dispatchEvent(new CustomEvent("cartUpdated"))
      return data.data as CartItem
    }

    throw new Error(data.message || "Failed to add to cart")
  } catch (error) {
    console.error("Add to cart error:", error)
    throw error
  }
}

export async function updateCartQuantity(itemId: string, quantity: number): Promise<boolean> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`/api/cart/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        quantity,
      }),
    })

    const data: CartResponse = await response.json()

    if (data.success) {
      window.dispatchEvent(new CustomEvent("cartUpdated"))
    }

    return data.success
  } catch (error) {
    console.error("Update cart quantity error:", error)
    return false
  }
}

export async function removeFromCart(itemId: string): Promise<boolean> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`/api/cart/${itemId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data: CartResponse = await response.json()

    if (data.success) {
      window.dispatchEvent(new CustomEvent("cartUpdated"))
    }

    return data.success
  } catch (error) {
    console.error("Remove from cart error:", error)
    return false
  }
}

// Clear entire cart - Updated with better error handling
export async function clearCart(): Promise<boolean> {
  try {
    const token = getAuthToken()
    if (!token) {
      console.error("No authentication token found")
      throw new Error("Authentication required")
    }

    console.log("Attempting to clear cart with token:", token.substring(0, 10) + "...")

    const response = await fetch("/api/cart/clear", {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    })

    console.log("Clear cart response status:", response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Clear cart HTTP error:", response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data: CartResponse = await response.json()
    console.log("Clear cart response data:", data)

    if (data.success) {
      // Dispatch multiple events to ensure all components update
      window.dispatchEvent(new CustomEvent("cartUpdated"))
      window.dispatchEvent(new CustomEvent("cartCleared"))
      console.log("Cart cleared successfully, deleted items:", data.deleted_items || 0)
      return true
    } else {
      console.error("Failed to clear cart:", data.message)
      throw new Error(data.message || "Failed to clear cart")
    }
  } catch (error) {
    console.error("Clear cart error:", error)
    return false
  }
}

// Clear cart after successful checkout with retry logic
export async function clearCartAfterCheckout(): Promise<boolean> {
  try {
    console.log("Clearing cart after checkout...")

    // Try to clear cart with retry logic
    let attempts = 0
    const maxAttempts = 3
    let lastError: Error | null = null

    while (attempts < maxAttempts) {
      try {
        const success = await clearCart()

        if (success) {
          console.log("Cart cleared after successful checkout")
          return true
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.log(`Cart clear attempt ${attempts + 1} failed:`, lastError.message)
      }

      attempts++

      // Wait a bit before retrying
      if (attempts < maxAttempts) {
        console.log(`Waiting before retry attempt ${attempts + 1}...`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    console.error("Failed to clear cart after multiple attempts. Last error:", lastError?.message)
    throw lastError || new Error("Failed to clear cart after multiple attempts")
  } catch (error) {
    console.error("Error clearing cart after checkout:", error)
    return false
  }
}

// Get cart items count
export function getCartItemsCount(cartItems: CartItem[]): number {
  return cartItems.reduce((total, item) => total + item.quantity, 0)
}

// Get cart total price
export function getCartTotal(cartItems: CartItem[]): number {
  return cartItems.reduce((total, item) => {
    return total + item.total
  }, 0)
}

// Get cart subtotal (before taxes/shipping)
export function getCartSubtotal(cartItems: CartItem[]): number {
  return getCartTotal(cartItems)
}

// Calculate cart summary
export function getCartSummary(cartItems: CartItem[]) {
  const subtotal = getCartSubtotal(cartItems)
  const itemCount = getCartItemsCount(cartItems)
  const tax = subtotal * 0.08 // 8% tax rate
  const shipping = subtotal > 100 ? 0 : 10 // Free shipping over $100
  const total = subtotal + tax + shipping

  return {
    itemCount,
    subtotal,
    tax,
    shipping,
    total,
  }
}
