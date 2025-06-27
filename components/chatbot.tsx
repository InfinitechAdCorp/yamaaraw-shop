"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, MapPin, Phone, Clock, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  text: string
  isBot: boolean
  timestamp: Date
  type?: "text" | "location" | "faq" | "products" | "quick-reply" | "search"
  data?: any
}

interface Product {
  id: string
  name: string
  model: string
  price: number
  original_price?: number
  category: string
  in_stock: boolean
  featured: boolean
  description: string
  image?: string
}

const FAQ_DATA = [
  {
    question: "What is the warranty period for E-Trikes?",
    answer:
      "All our E-Trikes come with a comprehensive 2-year warranty covering motor, battery, and electrical components. Frame warranty is 5 years.",
  },
  {
    question: "How long does the battery last?",
    answer:
      "Our E-Trike batteries typically last 40-60km on a single charge, depending on the model and usage conditions. Battery life is 3-5 years with proper maintenance.",
  },
  {
    question: "Do you offer financing options?",
    answer:
      "Yes! We offer flexible financing plans with 0% interest for qualified buyers. Down payment starts at 20% with terms up to 36 months.",
  },
  {
    question: "What maintenance is required?",
    answer:
      "Regular maintenance includes battery charging, tire pressure checks, and periodic brake adjustments. We recommend professional servicing every 6 months.",
  },
  {
    question: "Can I test drive before buying?",
    answer:
      "We encourage test drives. Visit our showroom to experience different models. Please bring a valid driver's license.",
  },
  {
    question: "Do you provide delivery service?",
    answer:
      "Yes, we offer free delivery within Metro Manila and Bulacan. For other areas, delivery fees may apply based on distance.",
  },
]

const QUICK_REPLIES = ["Show me prices", "Store location", "FAQ", "Financing options", "Test drive", "Contact info"]

export default function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      setTimeout(() => {
        addBotMessage("Hi there! 👋 I'm Darlene, your YAMAARAW assistant. How can I help you today?", "text")
      }, 500)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Fetch products from API
  const fetchProducts = async (action = "products", params = {}) => {
    try {
      setIsLoadingProducts(true)
      const searchParams = new URLSearchParams(params)
      const response = await fetch(`/api/chatbot?action=${action}&${searchParams.toString()}`)
      const data = await response.json()

      if (data.success) {
        return data.data
      } else {
        console.error("Failed to fetch products:", data.message)
        return []
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      return []
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/chatbot?action=categories")
      const data = await response.json()

      if (data.success) {
        setCategories(data.data)
        return data.data
      }
      return []
    } catch (error) {
      console.error("Error fetching categories:", error)
      return []
    }
  }

  const addBotMessage = (text: string, type = "text", data?: any) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      isBot: true,
      timestamp: new Date(),
      type: type as any,
      data,
    }
    setMessages((prev) => [...prev, message])
  }

  const addUserMessage = (text: string) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      isBot: false,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, message])
  }

  const simulateTyping = (callback: () => void, delay = 1000) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      callback()
    }, delay)
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    addUserMessage(inputValue)
    const userInput = inputValue.toLowerCase()
    setInputValue("")
    setShowQuickReplies(false)

    simulateTyping(() => {
      processUserInput(userInput)
    })
  }

  const processUserInput = async (input: string) => {
    if (input.includes("price") || input.includes("cost") || input.includes("how much")) {
      await showProductPrices()
    } else if (input.includes("location") || input.includes("address") || input.includes("where")) {
      showStoreLocation()
    } else if (input.includes("faq") || input.includes("question") || input.includes("help")) {
      showFAQ()
    } else if (input.includes("financing") || input.includes("payment") || input.includes("installment")) {
      showFinancingInfo()
    } else if (input.includes("test drive") || input.includes("try")) {
      showTestDriveInfo()
    } else if (input.includes("contact") || input.includes("phone") || input.includes("call")) {
      showContactInfo()
    } else if (input.includes("search") || input.includes("find") || input.includes("looking for")) {
      await showSearchOptions()
    } else if (input.includes("category") || input.includes("type")) {
      await showCategories()
    } else if (input.includes("featured") || input.includes("popular") || input.includes("best")) {
      await showFeaturedProducts()
    } else if (input.includes("warranty")) {
      addBotMessage(
        "All our E-Trikes come with a comprehensive 2-year warranty covering motor, battery, and electrical components. Frame warranty is 5 years. Would you like to know more about our warranty terms?",
      )
    } else if (input.includes("battery")) {
      addBotMessage(
        "Our E-Trike batteries typically last 40-60km on a single charge and have a lifespan of 3-5 years with proper maintenance. We use high-quality lithium-ion batteries. Need more battery specifications?",
      )
    } else if (input.includes("hello") || input.includes("hi") || input.includes("hey")) {
      addBotMessage(
        "Hello! Great to hear from you! 😊 I'm here to help with any questions about our YAMAARAW E-Trikes. What would you like to know?",
      )
    } else if (input.includes("thank") || input.includes("thanks")) {
      addBotMessage("You're very welcome! 😊 Is there anything else I can help you with today?")
    } else {
      addBotMessage(
        "I'd be happy to help! I can assist you with product prices, store location, FAQ, financing options, or any other questions about our YAMAARAW E-Trikes. What interests you most?",
      )
    }

    setTimeout(() => setShowQuickReplies(true), 1000)
  }

  const showProductPrices = async () => {
    addBotMessage("Let me fetch our current YAMAARAW E-Trike models and prices for you...")

    const products = await fetchProducts("products")

    if (products.length > 0) {
      addBotMessage("Here are our current YAMAARAW E-Trike models and prices:", "products", products)
      setTimeout(() => {
        addBotMessage(
          `We have ${products.length} models available. All prices are subject to change and may vary based on customization. Would you like to know about financing options or schedule a test drive?`,
        )
      }, 1500)
    } else {
      addBotMessage(
        "I'm sorry, I couldn't fetch the current product prices at the moment. Please try again later or contact our store directly.",
      )
    }
  }

  const showFeaturedProducts = async () => {
    addBotMessage("Let me show you our featured and most popular E-Trikes...")

    const featured = await fetchProducts("featured")

    if (featured.length > 0) {
      addBotMessage("Here are our featured YAMAARAW E-Trike models:", "products", featured)
      setTimeout(() => {
        addBotMessage(
          "These are our most popular models loved by customers. Would you like more details about any specific model?",
        )
      }, 1500)
    } else {
      addBotMessage("I couldn't fetch the featured products at the moment. Please try again later.")
    }
  }

  const showCategories = async () => {
    const categories = await fetchCategories()

    if (categories.length > 0) {
      addBotMessage(
        `We have E-Trikes in these categories: ${categories.join(", ")}. Which category interests you most?`,
      )
    } else {
      addBotMessage("I couldn't fetch the categories at the moment. Please try again later.")
    }
  }

  const showSearchOptions = async () => {
    addBotMessage("I can help you search for specific E-Trikes! You can search by:", "search", {
      options: [
        "Product name or model",
        "Category (e.g., Passenger, Cargo, Premium)",
        "Price range",
        "Features or specifications",
      ],
    })
    addBotMessage("Just tell me what you're looking for, for example: 'Show me cargo e-trikes under ₱100,000'")
  }

  const showStoreLocation = () => {
    const locationData = {
      address: "DRT Highway, Brgy. Cutcot, Pulilan, Bulacan, Bulacan, Philippines, 3005",
      hours: "Monday - Saturday: 8:00 AM - 6:00 PM\nSunday: 9:00 AM - 5:00 PM",
      phone: "+63 917 123 4567",
      email: "info@yamaaraw.ph",
    }

    addBotMessage("Here's our YAMAARAW store location and contact details:", "location", locationData)
    setTimeout(() => {
      addBotMessage(
        "We're easily accessible from major highways in Bulacan. Free parking available! Would you like directions or want to schedule a visit?",
      )
    }, 1500)
  }

  const showFAQ = () => {
    addBotMessage("Here are some frequently asked questions about YAMAARAW E-Trikes:", "faq", FAQ_DATA)
    setTimeout(() => {
      addBotMessage("Do any of these answer your question? If you need more specific information, feel free to ask!")
    }, 2000)
  }

  const showFinancingInfo = () => {
    addBotMessage(
      "💳 **YAMAARAW Financing Options:**\n\n✅ 0% Interest for qualified buyers\n✅ Down payment starts at 20%\n✅ Terms up to 36 months\n✅ Quick approval process\n✅ Flexible payment schedules\n✅ In-house financing available\n\nWould you like to apply or need more details about requirements?",
    )
  }

  const showTestDriveInfo = () => {
    addBotMessage(
      "🚗 **Test Drive Information:**\n\n✅ Free test drives available\n✅ Multiple YAMAARAW models to try\n✅ Bring valid driver's license\n✅ No appointment needed\n✅ Expert guidance provided\n✅ Test different terrains\n\nVisit us during business hours for your test drive experience!",
    )
  }

  const showContactInfo = () => {
    addBotMessage(
      "📞 **YAMAARAW Contact Information:**\n\n**Phone:** +63 917 123 4567\n**Email:** info@yamaaraw.ph\n**Website:** www.yamaaraw.ph\n**Address:** DRT Highway, Brgy. Cutcot, Pulilan, Bulacan\n\n**Business Hours:**\nMon-Sat: 8:00 AM - 6:00 PM\nSunday: 9:00 AM - 5:00 PM\n\nFeel free to call or visit us anytime!",
    )
  }

  const handleQuickReply = async (reply: string) => {
    addUserMessage(reply)
    setShowQuickReplies(false)

    simulateTyping(() => {
      processUserInput(reply.toLowerCase())
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const renderMessage = (message: Message) => {
    if (message.type === "products") {
      return (
        <div className="space-y-3">
          <p className="font-medium text-gray-800">{message.text}</p>
          {isLoadingProducts ? (
            <div className="flex items-center space-x-2 text-orange-600">
              <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading products...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {message.data.map((product: Product) => (
                <div key={product.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  {/* Product Header with Name and Price */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-base truncate">{product.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">Model: {product.model}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <div className="text-xl font-bold text-orange-600">{formatPrice(product.price)}</div>
                      {product.original_price && product.original_price > product.price && (
                        <div className="text-sm text-gray-500 line-through">{formatPrice(product.original_price)}</div>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-orange-500 text-white text-xs">{product.category}</Badge>
                    {product.featured && <Badge className="bg-yellow-500 text-white text-xs">Featured</Badge>}
                    <Badge
                      className={`text-xs ${
                        product.in_stock ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      }`}
                    >
                      {product.in_stock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>

                  {/* Description */}
                  {product.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (message.type === "search") {
      return (
        <div className="space-y-3">
          <p className="font-medium text-gray-800">{message.text}</p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search Options:
            </h4>
            <ul className="space-y-1">
              {message.data.options.map((option: string, index: number) => (
                <li key={index} className="text-sm text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  {option}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }

    if (message.type === "location") {
      return (
        <div className="space-y-3">
          <p className="font-medium text-gray-800">{message.text}</p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Store Address</h4>
                <p className="text-gray-700 text-sm">{message.data.address}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Business Hours</h4>
                <p className="text-gray-700 text-sm whitespace-pre-line">{message.data.hours}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Phone</h4>
                <p className="text-gray-700 text-sm">{message.data.phone}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (message.type === "faq") {
      return (
        <div className="space-y-3">
          <p className="font-medium text-gray-800">{message.text}</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {message.data.map((faq: any, index: number) => (
              <details key={index} className="bg-orange-50 border border-orange-200 rounded-lg">
                <summary className="p-3 cursor-pointer font-medium text-gray-900 hover:bg-orange-100 rounded-lg">
                  {faq.question}
                </summary>
                <div className="px-3 pb-3 text-gray-700 text-sm">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      )
    }

    return <p className="whitespace-pre-line">{message.text}</p>
  }

  return (
    <>
      {/* Chat Button - Fixed positioning for global access */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 animate-pulse"
          }`}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="relative">
              {/* Call Center Girl Icon */}
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="text-lg">👩‍💼</div>
              </div>
              {/* Notification Badge */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              </div>
            </div>
          )}
        </Button>
      </div>

      {/* Chat Window - Responsive sizing */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] sm:h-[600px] bg-white rounded-2xl shadow-2xl border-2 border-orange-200 z-[9998] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <div className="text-xl">👩‍💼</div>
              </div>
              <div>
                <h3 className="font-bold text-lg">Darlene</h3>
                <p className="text-orange-100 text-sm">YAMAARAW Assistant • Online</p>
              </div>
              <div className="ml-auto">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-2xl ${
                    message.isBot
                      ? "bg-white border border-orange-200 text-gray-800"
                      : "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  }`}
                >
                  {renderMessage(message)}
                  <div className={`text-xs mt-2 ${message.isBot ? "text-gray-500" : "text-orange-100"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-orange-200 p-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Replies */}
            {showQuickReplies && messages.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Quick replies:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors border border-orange-300"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-orange-200 bg-white">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 p-2 sm:p-3 text-sm sm:text-base border border-orange-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Powered by YAMAARAW AI Assistant</p>
          </div>
        </div>
      )}
    </>
  )
}
