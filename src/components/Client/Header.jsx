import { useState, useEffect, useRef } from "react";
import { X, Clock, MapPin, Search, UtensilsCrossed, ArrowRight, Rocket, Moon, Sun } from "lucide-react";
import { createRoot } from "react-dom/client";
import { FiShoppingCart } from "react-icons/fi";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useSelector, useDispatch } from "react-redux";
import {
  removeFromCart,
  addToCart,
  clearCart,
} from "../../redux/clientRedux/clientSlice";
import { useGetRestaurantQuery, useCreateOrderMutation, useGetOrdersByFingerprintQuery } from "../../redux/clientRedux/clientAPI";
import { Toaster } from "@/components/ui/toaster";
import OrderComplete from "@/components/Client/OrderComplete";
import OrderFormModal from "./OrderFormModal";
import fingerprintService from "@/service/fingerprintService";
import config from "@/config";

const NAME_VALID_PATTERN = /^[A-Za-z\s]+$/;
const PHONE_VALID_PATTERN = /^\d{10}$/;
const capitalizeFirstLetter = (value) =>
  String(value || "").replace(/^(\s*)([a-z])/, (_, spaces, char) => `${spaces}${char.toUpperCase()}`);
const sanitizeCustomerName = (value) =>
  capitalizeFirstLetter(
    String(value || "")
      .replace(/[^A-Za-z\s]/g, "")
      .slice(0, 15)
  );
const sanitizeCustomerPhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);

export default function Header({
  logo,
  siteName = "Default Name",
  search,
  onSearch,
  isRestaurantOpen = true,
  onSidebarToggle,
  isDarkMode = false,
  onToggleDarkMode = () => {},
}) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isCartBarBump, setIsCartBarBump] = useState(false);
  const [isOrdersIconHighlighted, setIsOrdersIconHighlighted] = useState(false);
  const [orderStatusBanner, setOrderStatusBanner] = useState(null);
  const { data: restaurantData } = useGetRestaurantQuery();
  const [createOrder, { isLoading: isOrderLoading }] = useCreateOrderMutation();
  const searchRef = useRef(null);
  const ordersButtonRef = useRef(null);
  const prevCartCountRef = useRef(0);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableId, setTableId] = useState("");
  const [orderType, setOrderType] = useState("");
  const [address, setAddress] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.client?.cart?.items || {});

  const cartCount = Object.values(cartItems || {}).reduce(
    (acc, item) => acc + (item?.quantity || 0),
    0
  );

  // ✅ बैकएंड से आए कैलकुलेशन डेटा
  const [calculatedDetails, setCalculatedDetails] = useState({
    subtotal: 0,
    gstAmount: 0,
    deliveryCharges: 0,
    totalAmount: 0,
    items: [],
    loading: false
  });

  // ✅ Individual item prices store करने के लिए
  const [itemPrices, setItemPrices] = useState({});

  const cartEntries = Object.entries(cartItems);
  const MAX_CART_PREVIEW_IMAGES = 4;
  const visibleCartItems = cartEntries.slice(0, MAX_CART_PREVIEW_IMAGES);

  const [fingerPrint, setFingerPrint] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [allOrders, setAllOrders] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const isPreparingBanner = orderStatusBanner?.status === "preparing";

  const normalizeOrderType = (value) => {
    const type = String(value || "").trim().toLowerCase();

    if (type === "delivery") return "Delivery";
    if (type === "eat here" || type === "eathere") return "Eat Here";
    if (type === "take away" || type === "takeaway") return "Take Away";

    return "";
  };

  const normalizedOrderType = normalizeOrderType(orderType);

  useEffect(() => {
    const previousCount = prevCartCountRef.current;

    if (cartCount > previousCount) {
      setIsCartBarBump(true);
      const timer = setTimeout(() => setIsCartBarBump(false), 320);
      prevCartCountRef.current = cartCount;
      return () => clearTimeout(timer);
    }

    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  // Function: Latest order से current cart के लिए estimate बनाएं
  const estimateFromLatestOrder = (latestOrder, currentCartItems) => {
    try {
      const latestOrderItems = latestOrder?.items || [];
      if (!latestOrderItems || latestOrderItems.length === 0) {
        setCalculatedDetails({
          subtotal: 0,
          gstAmount: 0,
          deliveryCharges: 0,
          totalAmount: 0,
          items: latestOrderItems,
          loading: false
        });
        setItemPrices({});
        return;
      }

      // Current cart के items की total price calculate करें
      const currentCartArray = Object.values(currentCartItems || {});
      if (!currentCartArray || currentCartArray.length === 0) {
        setCalculatedDetails({
          subtotal: 0,
          gstAmount: 0,
          deliveryCharges: 0,
          totalAmount: 0,
          items: [],
          loading: false
        });
        return;
      }

      let estimatedSubtotal = 0;
      const newItemPrices = {};

      currentCartArray.forEach(cartItem => {
        if (!cartItem) return;
        const quantity = cartItem.quantity || 1;
        const itemKey = `${cartItem.name}_${cartItem.variantLabel || ''}`;
        
        // 🔴 पहला: Exact match ढूंढें (name + variant + combo check)
        let matchingOrderItem = null;
        let itemPrice = 0;
        
        // COMBO ITEM की special handling
        if (cartItem.isCombo || cartItem.pricingType === "combo") {
          // कॉम्बो के लिए latest order में combo item ढूंढें
          matchingOrderItem = latestOrderItems.find(orderItem => {
            // कॉम्बो items की comparison
            if (orderItem.comboItems && cartItem.comboItems) {
              // Same number of combo items?
              return orderItem.name === cartItem.name;
            }
            return orderItem.name === cartItem.name;
          });
          
          if (matchingOrderItem) {
            itemPrice = matchingOrderItem.discountedPrice || matchingOrderItem.price || 0;
          } else {
            // कॉम्बो नहीं मिला तो comboPrice use करें
            itemPrice = cartItem.comboPrice || 0;
          }
        } else {
          // REGULAR/SINGLE/VARIANT ITEM
          matchingOrderItem = latestOrderItems.find(orderItem => {
            const nameMatches = orderItem.name === cartItem.name;
            
            // Variant matching
            const variantMatches = (!cartItem.variantLabel && !orderItem.variant) || 
                                  (cartItem.variantLabel && orderItem.variant && 
                                   cartItem.variantLabel.toLowerCase().includes(orderItem.variant.toLowerCase()));
            
            return nameMatches && variantMatches;
          });

          if (matchingOrderItem) {
            itemPrice = matchingOrderItem.discountedPrice || matchingOrderItem.price || 0;
          } else {
            // Exact match नहीं मिला तो same name का item ढूंढें
            const sameNameItem = latestOrderItems.find(orderItem => orderItem.name === cartItem.name);
            if (sameNameItem) {
              itemPrice = sameNameItem.discountedPrice || sameNameItem.price || 0;
            } else {
              // Latest order में भी नहीं मिला तो cart item की price use करें
              itemPrice = cartItem.price || cartItem.comboPrice || 0;
            }
          }
        }

        // Store item price for display
        newItemPrices[itemKey] = itemPrice;

        if (itemPrice > 0) {
          estimatedSubtotal += itemPrice * quantity;
        }
      });

      // Store item prices for display
      setItemPrices(newItemPrices);

      // GST calculation
      const restaurant = restaurantData?.restaurant || {};
      const gstRate = Number(restaurant.gstRate) || 0;
      const estimatedGstAmount = restaurant.gstEnabled ? (estimatedSubtotal * gstRate) / 100 : 0;
      
      // Delivery charges
      const deliveryCharges = normalizedOrderType === "Delivery"
        ? (Number(restaurant.deliveryCharges) || 0)
        : 0;
      
      const estimatedTotalAmount = estimatedSubtotal + estimatedGstAmount + deliveryCharges;

      setCalculatedDetails({
        subtotal: Number(estimatedSubtotal.toFixed(2)),
        gstAmount: Number(estimatedGstAmount.toFixed(2)),
        deliveryCharges: Number(deliveryCharges.toFixed(2)),
        totalAmount: Number(estimatedTotalAmount.toFixed(2)),
        items: latestOrderItems,
        loading: false
      });

    } catch (error) {
      console.error("Estimation error:", error);
      setCalculatedDetails(prev => ({ ...prev, loading: false }));
    }
  };

  // Get item price for display - with combo support
  const getDisplayPrice = (itemName, variantLabel, isCombo = false, cartItem = null) => {
    const itemKey = `${itemName}_${variantLabel || ''}`;
    
    // First check itemPrices (from latest order estimation)
    if (
      allOrders.length > 0 &&
      Object.prototype.hasOwnProperty.call(itemPrices, itemKey)
    ) {
      return Number(itemPrices[itemKey]) || 0;
    }
    
    // If not in itemPrices, check cart item's own price
    if (cartItem) {
      // Prefer explicit cart price snapshot (discount/final price)
      if (cartItem.price !== undefined && cartItem.price !== null && cartItem.price !== "") {
        const explicitPrice = Number(cartItem.price);
        if (!Number.isNaN(explicitPrice)) {
          return explicitPrice;
        }
      }
      // Handle combo items
      if (isCombo || cartItem.pricingType === "combo") {
        return Number(cartItem.comboPrice) || 0;
      }
      // Handle variant items
      if (cartItem.variantKey && cartItem.variantRates && cartItem.variantRates[cartItem.variantKey]) {
        return Number(cartItem.variantRates[cartItem.variantKey].price) || 0;
      }
      // Handle single items
      return Number(cartItem.price) || 0;
    }
    
    return 0;
  };

  const getDisplayOriginalPrice = (cartItem = null) => {
    if (!cartItem) return 0;

    if (
      cartItem.originalPrice !== undefined &&
      cartItem.originalPrice !== null &&
      cartItem.originalPrice !== ""
    ) {
      const original = Number(cartItem.originalPrice);
      if (!Number.isNaN(original)) return original;
    }

    if (cartItem.variantKey && cartItem.variantRates && cartItem.variantRates[cartItem.variantKey]) {
      return Number(cartItem.variantRates[cartItem.variantKey].price) || 0;
    }

    if (cartItem.isCombo || cartItem.pricingType === "combo") {
      return Number(cartItem.comboPrice ?? cartItem.price) || 0;
    }

    return Number(cartItem.price) || 0;
  };

  // ✅ CRITICAL FIX: Calculate price directly from cart items
  const calculateCartTotal = () => {
    if (!cartItems || Object.keys(cartItems).length === 0 || cartCount === 0) {
      return {
        subtotal: 0,
        gstAmount: 0,
        deliveryCharges: 0,
        totalAmount: 0
      };
    }

    let subtotal = 0;
    const cartItemsArray = Object.values(cartItems || {});

    cartItemsArray.forEach(cartItem => {
      if (!cartItem) return;
      const quantity = cartItem.quantity || 1;
      const itemPrice = getDisplayPrice(
        cartItem.name,
        cartItem.variantLabel,
        cartItem.isCombo || cartItem.pricingType === "combo",
        cartItem
      );

      subtotal += itemPrice * quantity;
    });

    // Get restaurant data for GST and delivery charges
    const restaurant = restaurantData?.restaurant || {};
    const gstRate = Number(restaurant.gstRate) || 0;
    const gstAmount = restaurant.gstEnabled ? (subtotal * gstRate) / 100 : 0;
    
    const deliveryCharges = normalizedOrderType === "Delivery"
      ? (Number(restaurant.deliveryCharges) || 0)
      : 0;
    const totalAmount = subtotal + gstAmount + deliveryCharges;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      deliveryCharges: Number(deliveryCharges.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2))
    };
  };

  // ✅ Latest order से calculation details उठाएं और estimate बनाएं
  useEffect(() => {
    if (allOrders.length > 0 && cartCount > 0) {
      const latestOrder = allOrders[0];
      
      if (latestOrder.items && latestOrder.totalAmount) {
        // Latest order के items और current cart items के बीच compare करके estimate बनाएं
        estimateFromLatestOrder(latestOrder, cartItems);
      }
    } else if (cartCount > 0) {
      // If no latest order, calculate directly from cart
      setItemPrices({});
      const cartTotal = calculateCartTotal();
      setCalculatedDetails({
        ...cartTotal,
        items: [],
        loading: false
      });
    } else if (cartCount === 0) {
      // Cart empty है तो सब कुछ 0 कर दो
      setCalculatedDetails({
        subtotal: 0,
        gstAmount: 0,
        deliveryCharges: 0,
        totalAmount: 0,
        items: [],
        loading: false
      });
      setItemPrices({});
    }
  }, [allOrders, cartItems, cartCount, orderType, restaurantData]);

  // Close search when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

  // Get fingerprint on component mount
  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await fingerprintService.getFingerprint();
      setFingerPrint(fp);
    };
    getFingerprint();
  }, []);

  // Fetch orders by fingerprint with pagination
  const { data: ordersData, isLoading: ordersLoading, refetch } = useGetOrdersByFingerprintQuery(
    { fingerPrint, page: currentPage },
    {
      skip: !fingerPrint,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // Update orders when new data is fetched
  useEffect(() => {
    if (ordersData) {
      // Handle different API response structures
      let orders = [];
      
      if (Array.isArray(ordersData)) {
        orders = ordersData;
      } else if (ordersData?.orders && Array.isArray(ordersData.orders)) {
        orders = ordersData.orders;
      } else if (ordersData?.data && Array.isArray(ordersData.data)) {
        orders = ordersData.data;
      } else if (ordersData?.order && typeof ordersData.order === 'object') {
        // Single order response - wrap in array
        orders = [ordersData.order];
      }
      
      if (currentPage === 1) {
        // For page 1, replace all orders (deduplicate by order ID)
        const uniqueOrders = orders.filter((order, index, self) => 
          index === self.findIndex((o) => 
            (o._id || o.id || o.orderId) === (order._id || order.id || order.orderId)
          )
        );
        setAllOrders(uniqueOrders);
      } else {
        // For subsequent pages, append new orders (deduplicate)
        setAllOrders((prev) => {
          const existingIds = new Set(prev.map(o => o._id || o.id || o.orderId));
          const newOrders = orders.filter(order => 
            !existingIds.has(order._id || order.id || order.orderId)
          );
          return [...prev, ...newOrders];
        });
      }
      // Check if there are more pages
      setHasMore(orders.length > 0 && (ordersData?.hasMore !== false));
    }
  }, [ordersData, currentPage]);

  // SSE updates for order status changes (fingerPrint-based)
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!fingerPrint || !config?.BASE_URL) return undefined;

    const baseUrl = String(config.BASE_URL).replace(/\/$/, "");
    const sseUrl = `${baseUrl}/api/notifications?fingerPrint=${encodeURIComponent(
      fingerPrint
    )}`;

    const source = new EventSource(sseUrl);

    source.onmessage = (event) => {
      if (!event?.data) return;
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (payload?.type === "ORDER_STATUS_CHANGED" && payload.data) {
        const updatedOrder = payload.data;
        const orderId =
          updatedOrder?._id || updatedOrder?.id || updatedOrder?.orderId;
        if (!orderId) return;

        setAllOrders((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const idx = next.findIndex(
            (order) =>
              (order?._id || order?.id || order?.orderId) === orderId
          );

          if (idx === -1) {
            return [updatedOrder, ...next];
          }

          next[idx] = { ...next[idx], ...updatedOrder };
          return next;
        });

        pulseOrdersIcon();
        showOrderStatusBanner(updatedOrder);
        refetch();
      }
    };

    source.onerror = () => {
      // EventSource auto-reconnects; no-op.
    };

    return () => {
      source.close();
    };
  }, [fingerPrint, refetch]);

  // Pre-fill form with latest order data when modal opens
  useEffect(() => {
    if (showModal && allOrders.length > 0) {
      const latestOrder = allOrders[0];
      
      if (latestOrder.customerName) {
        setCustomerName(sanitizeCustomerName(latestOrder.customerName));
      }
      if (latestOrder.customerPhone) {
        setCustomerPhone(sanitizeCustomerPhone(latestOrder.customerPhone));
      }
      
      setOrderType("");
      setTableId("");
      setAddress("");
      setUseCurrentLocation(false);
    }
  }, [showModal, allOrders]);

  // Reset to page 1 when fingerprint changes
  useEffect(() => {
    if (fingerPrint) {
      setCurrentPage(1);
      setAllOrders([]);
      setHasMore(true);
    }
  }, [fingerPrint]);

  const handleLoadMore = () => {
    if (hasMore && !ordersLoading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const pulseOrdersIcon = () => {
    setIsOrdersIconHighlighted(true);
    setTimeout(() => setIsOrdersIconHighlighted(false), 2200);
  };

  const triggerPreparingVibration = () => {
    if (typeof window === "undefined" || !window.navigator) return;
    const vibrate = window.navigator.vibrate || window.navigator.webkitVibrate || window.navigator.mozVibrate;
    if (typeof vibrate === "function") {
      // Vibrate pattern: short-long-short for attention
      vibrate([160, 80, 160]);
    }
  };

  const showOrderStatusBanner = (order) => {
    const rawStatus = order?.status ? String(order.status).toLowerCase() : "";
    const isPreparing = rawStatus.includes("preparing");
    if (!isPreparing) return;

    const message = "Your order is preparing";
    setOrderStatusBanner({ message, status: "preparing", ts: Date.now() });
    triggerPreparingVibration();
  };

  useEffect(() => {
    if (!orderStatusBanner) return;
    const timer = window.setTimeout(() => {
      setOrderStatusBanner(null);
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [orderStatusBanner]);

  const animateOrderRocketToOrders = () => {
    const targetEl = ordersButtonRef.current;
    if (!targetEl || typeof window === "undefined") {
      pulseOrdersIcon();
      return;
    }

    const targetRect = targetEl.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    const startX = window.innerWidth * 0.5;
    const startY = window.innerHeight * 0.68;
    const dx = targetX - startX;
    const dy = targetY - startY;

    const rocket = document.createElement("div");
    rocket.className =
      "pointer-events-none fixed z-[145] flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-[0_10px_24px_rgba(0,0,0,0.24)]";
    rocket.style.left = `${startX}px`;
    rocket.style.top = `${startY}px`;
    rocket.style.transform = "translate(-50%, -50%)";
    document.body.appendChild(rocket);

    const rocketRoot = createRoot(rocket);
    rocketRoot.render(<Rocket className="h-5 w-5 text-primary" strokeWidth={2.4} />);

    const rocketAnimation = rocket.animate(
      [
        {
          transform: "translate(-50%, -50%) translate(0px, 0px) scale(0.7) rotate(-20deg)",
          opacity: 0,
        },
        {
          transform: `translate(-50%, -50%) translate(${dx * 0.28}px, ${dy * 0.34 - 46}px) scale(1.05) rotate(6deg)`,
          opacity: 1,
          offset: 0.5,
        },
        {
          transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.72) rotate(18deg)`,
          opacity: 0.1,
        },
      ],
      {
        duration: 1200,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "forwards",
      }
    );

    rocketAnimation.onfinish = () => {
      rocketRoot.unmount();
      if (document.body.contains(rocket)) {
        document.body.removeChild(rocket);
      }

      const ping = document.createElement("div");
      ping.className = "pointer-events-none fixed z-[145] h-14 w-14 rounded-full border-2 border-orange-400/80 bg-orange-400/20";
      ping.style.left = `${targetX}px`;
      ping.style.top = `${targetY}px`;
      ping.style.transform = "translate(-50%, -50%)";
      document.body.appendChild(ping);

      const pingAnimation = ping.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.55)", opacity: 0.95 },
          { transform: "translate(-50%, -50%) scale(1.45)", opacity: 0 },
        ],
        { duration: 650, easing: "ease-out" }
      );

      pingAnimation.onfinish = () => {
        if (document.body.contains(ping)) {
          document.body.removeChild(ping);
        }
      };

      pulseOrdersIcon();
    };
  };

  const showSuccessMessage = () => {
    animateOrderRocketToOrders();
  };

  const showErrorMessage = (message) => {
    const messageDiv = document.createElement("div");
    messageDiv.className =
      "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm";

    messageDiv.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200" style="animation: scale-in 0.3s ease-out;">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>

          <h3 class="text-xl font-bold text-gray-800 mb-2">Order Failed</h3>
          <p class="text-gray-600 mb-4">${message}</p>
          
          <button class="w-full bg-gray-500 text-white py-3 rounded-xl text-base font-medium hover:bg-gray-600 transition-colors duration-200 shadow-md">
            Try Again
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(messageDiv);

    const content = messageDiv.querySelector("div > div");
    content.style.transform = "scale(0.9)";
    content.style.opacity = "0";
    content.style.transition = "all 0.3s ease-out";

    setTimeout(() => {
      content.style.transform = "scale(1)";
      content.style.opacity = "1";
    }, 10);

    const closeMessage = () => {
      content.style.transform = "scale(0.9)";
      content.style.opacity = "0";
      setTimeout(() => {
        if (document.body.contains(messageDiv)) {
          document.body.removeChild(messageDiv);
        }
      }, 300);
    };

    messageDiv.querySelector("button").onclick = closeMessage;
    messageDiv.onclick = (e) => {
      if (e.target === messageDiv) closeMessage();
    };

    setTimeout(closeMessage, 5000);
  };

  const isFormValid = () => {
    const trimmedName = customerName.trim();

    if (!trimmedName || !NAME_VALID_PATTERN.test(trimmedName)) {
      return false;
    }
    if (!PHONE_VALID_PATTERN.test(customerPhone)) {
      return false;
    }

    switch (normalizedOrderType) {
      case "Eat Here":
        return !!tableId;
      case "Take Away":
        return true;
      case "Delivery":
        return !!address && address.trim().length > 0;
      default:
        return false;
    }
  };

  const handleOrderSubmit = async () => {
    try {
      // console.log("=== START handleOrderSubmit ===");
      
      const finalOrderType = normalizedOrderType;
      const trimmedName = customerName.trim();
      const formattedName = capitalizeFirstLetter(trimmedName.replace(/\s+/g, " "));
      const trimmedAddress = address.trim();

      if (!isRestaurantOpen) {
        showErrorMessage("Orders are currently closed. Please try again later.");
        return;
      }

      if (!isFormValid()) {
        let errorMessage = "Please fill all required fields correctly.";
        if (!trimmedName) errorMessage = "Please enter your name.";
        else if (!NAME_VALID_PATTERN.test(trimmedName))
          errorMessage = "Name can contain only letters and spaces.";
        else if (!PHONE_VALID_PATTERN.test(customerPhone))
          errorMessage = "Please enter a valid 10-digit phone number.";
        else if (finalOrderType === "Eat Here" && !tableId)
          errorMessage = "Please select a table.";
        else if (finalOrderType === "Delivery" && !trimmedAddress)
          errorMessage = "Please enter delivery address.";

        showErrorMessage(errorMessage);
        return;
      }

      // console.log("CART ITEMS FOR ORDER:", cartItems);

      // ✅ बैकएंड के लिए सही डेटा तैयार करें
      const orderItems = Object.values(cartItems).map((cartItem) => {
        const variantData =
          cartItem.variantKey &&
          cartItem.variantRates &&
          cartItem.variantRates[cartItem.variantKey]
            ? cartItem.variantRates[cartItem.variantKey]
            : null;

        const isComboItem = cartItem.isCombo || cartItem.pricingType === "combo";
        const variantBasePrice = Number(variantData?.price) || 0;

        const price = Number(
          cartItem.originalPrice ??
            (isComboItem ? cartItem.comboPrice : variantBasePrice || cartItem.price) ??
            0
        ) || 0;

        const discountedPrice = Number(
          cartItem.price ??
            (isComboItem ? cartItem.comboPrice : variantBasePrice) ??
            0
        ) || 0;

        const orderItem = {
          menuItemId: cartItem._id,
          name: cartItem.name,
          quantity: cartItem.quantity || 1,
          customizations: cartItem.customizations || "",
          price: price,
          discountedPrice: discountedPrice,
          discountApplied: variantData?.discount || cartItem.discount || null
        };

        // वेरिएंट भेजें अगर है
        if (cartItem.variantKey) {
          orderItem.variant = cartItem.variantKey;
        }

        // Combo items के details भी भेजें (यदि है)
        if (cartItem.isCombo && cartItem.comboItems) {
          orderItem.comboItems = cartItem.comboItems;
        }

        // console.log("Order item with prices:", orderItem);
        return orderItem;
      });

      const fingerPrint = await fingerprintService.getFingerprint();

      // ✅ बैकएंड को डेटा भेजें (बैकएंड कैलकुलेशन करेगा)
      const orderData = {
        fingerPrint,
        customerName: formattedName,
        customerPhone,
        items: orderItems,
        orderType: finalOrderType,
      };

      // Optional fields
      if (finalOrderType === "Eat Here" && tableId) {
        orderData.tableId = tableId;
      }
      
      if (finalOrderType === "Delivery" && trimmedAddress) {
        orderData.address = trimmedAddress;
      }

      // console.log("FINAL DATA TO BACKEND:", JSON.stringify(orderData, null, 2));

      // Send to backend
      const response = await createOrder(orderData).unwrap();
      
      showSuccessMessage();

      // Reset everything
      setCurrentPage(1);
      setAllOrders([]);
      setHasMore(true);
      
      if (fingerPrint) {
        setTimeout(() => {
          refetch();
        }, 500);
      }

      setShowModal(false);
      setIsCartOpen(false);
      onSidebarToggle?.(false);
      setOrderType("");
      setAddress("");
      setUseCurrentLocation(false);
      setCustomerName("");
      setCustomerPhone("");
      setTableId("");

      setTimeout(() => {
        dispatch(clearCart());
      }, 300);
    } catch (error) {
      console.error("=== ORDER ERROR ===");
      console.error("Full error:", error);
      console.error("Error data:", error.data);
      console.error("Error status:", error.status);
      
      let errorMessage = error.data?.message || "Failed to place order. Please try again.";
      
      // More detailed error messages
      if (error.data?.error) {
        errorMessage += ` - ${error.data.error}`;
      }
      
      showErrorMessage(errorMessage);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setOrderType("");
    setAddress("");
    setUseCurrentLocation(false);
    setCustomerName("");
    setCustomerPhone("");
    setTableId("");
  };
  
  const safeOnSearch = typeof onSearch === "function" ? onSearch : () => {};

  return (
    <>
      <Toaster />
      <div className={`relative z-50 ${isDarkMode ? "text-slate-100" : ""}`}>
        {/* 🌟 Bottom Order Summary */}
        {cartCount > 0 && (
          <>
            {/* Collapsed View */}
            <AnimatePresence>
              {!isAccordionOpen && (
                <motion.div
                  className="fixed bottom-2 left-2 right-2"
                  initial={{ y: 64, opacity: 0, scale: 0.88 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 56, opacity: 0, scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.78 }}
                >
                  <motion.div
                    animate={isCartBarBump ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`relative overflow-hidden rounded-3xl border ${
                      isDarkMode
                        ? "border-orange-300 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 shadow-[0_-12px_34px_rgba(249,115,22,0.42)]"
                        : "border-slate-700 bg-slate-900 shadow-[0_-12px_36px_rgba(2,6,23,0.5)]"
                    }`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 ${
                        isDarkMode
                          ? "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.22),transparent_48%)]"
                          : "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.08),transparent_46%)]"
                      }`}
                    />
                    <div className="relative flex items-center justify-between gap-3 p-2.5">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
                        <div className="flex shrink-0 -space-x-2.5">
                          {visibleCartItems.map(([id, item]) => (
                            <div
                              key={id}
                              className="relative grid h-9 w-9 aspect-square flex-shrink-0 place-items-center overflow-hidden rounded-full bg-gray-100 ring-2 ring-white"
                              style={{ clipPath: "circle(50% at 50% 50%)" }}
                            >
                              {item?.image ? (
                                <img
                                  src={item.image?.url || item.image}
                                  alt={item.name || "Cart item"}
                                  className="h-full w-full rounded-full object-cover object-center scale-[1.18]"
                                  style={{ clipPath: "circle(50% at 50% 50%)" }}
                                />
                              ) : (
                                <span className="h-full w-full rounded-full bg-slate-200" />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="min-w-0 text-white">
                          <p className="leading-none">
                            <span className="text-2xl font-bold">{cartCount}</span>
                            <span
                              className={`ml-1 hidden text-sm font-semibold min-[360px]:inline ${
                                isDarkMode ? "text-orange-100" : "text-slate-200"
                              }`}
                            >
                              item{cartCount > 1 ? "s" : ""}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* View Cart Button on Right */}
                      <button
                        onClick={() => {setIsAccordionOpen(true);onSidebarToggle?.(true);}}
                        className={`group inline-flex flex-shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-white transition-all duration-200 active:scale-95 ${
                          isDarkMode
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 shadow-[0_8px_18px_rgba(249,115,22,0.45)] hover:from-orange-600 hover:to-orange-700"
                            : "bg-slate-700 shadow-[0_5px_14px_rgba(15,23,42,0.45)] hover:bg-slate-600"
                        }`}
                      >
                        <span>View Cart</span>
                        <span
                          className={`grid h-6 w-6 place-items-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 ${
                            isDarkMode ? "bg-orange-400" : "bg-slate-500"
                          }`}
                        >
                          <ArrowRight className="h-4 w-4 text-white" />
                        </span>
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Full Screen Accordion View */}
            <AnimatePresence>
              {isAccordionOpen && (
              <motion.div
                className={`fixed inset-0 z-[100] flex flex-col ${isDarkMode ? "bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#020617]" : "bg-gradient-to-b from-[#fffaf4] via-[#fffdf8] to-[#fff3e6]"}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Header with Close Button */}
                <div className={`sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 ${isDarkMode ? "border-slate-700 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" : "border-orange-100 bg-gradient-to-r from-[#fffdf9] via-[#fff6ec] to-[#fffdf9]"}`}>
                  <h2 className={`text-xl font-semibold sm:text-[1.65rem] ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                    Your Order ({cartCount})
                  </h2>
                  <button
                    onClick={() => {setIsAccordionOpen(false); onSidebarToggle?.(false);}}
                    className={`p-1 transition-colors ${isDarkMode ? "text-slate-300 hover:text-slate-100" : "text-slate-600 hover:text-slate-900"}`}
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className={`shrink-0 border-b px-3 py-3 ${isDarkMode ? "border-slate-700 bg-slate-900/90" : "border-slate-200 bg-white"}`}>
                  <div className={`rounded-xl border p-2 shadow-[0_6px_14px_rgba(15,23,42,0.05)] ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-orange-200/80 bg-white"}`}>
                    <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2">
                      <span className="text-sm font-bold text-white">Total Amount</span>
                      <span className="text-lg font-bold text-primary">
                        ₹{calculatedDetails.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3 pb-28">
                  {cartCount === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="py-6 text-center text-lg text-slate-500">
                        Your cart is empty 🛒
                      </p>
                    </div>
                  ) : (
                    <>
                      <ul className="space-y-2.5">
                        {Object.entries(cartItems || {}).map(([id, item]) => {
                          if (!item) return null;
                          const itemPrice = getDisplayPrice(
                            item.name,
                            item.variantLabel,
                            item.isCombo || item.pricingType === "combo",
                            item
                          );
                          const originalPrice = getDisplayOriginalPrice(item);
                          const effectiveOriginalPrice = originalPrice > 0 ? originalPrice : itemPrice;
                          const hasDiscountedPrice = effectiveOriginalPrice > itemPrice;
                          const itemTotal = itemPrice * (item.quantity || 1);

                          return (
                            <li
                              key={id}
                              className="group flex min-h-[96px] items-center gap-2 rounded-xl border border-orange-200/80 bg-gradient-to-br from-white to-orange-50 p-2 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition-all duration-200 hover:border-orange-300/90 hover:shadow-[0_10px_22px_rgba(15,23,42,0.09)]"
                            >
                              <img
                                src={item.image?.url || item.image}
                                alt={item.name}
                                className="h-12 w-12 aspect-square flex-shrink-0 rounded-full border-2 border-white object-cover object-center shadow-[0_8px_14px_rgba(15,23,42,0.16)]"
                              />

                              <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <p className="truncate text-sm font-semibold leading-tight tracking-tight text-slate-900">
                                    {item.name}
                                  </p>
                                  {item.variantLabel ? (
                                    <span className="inline-flex shrink-0 rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
                                      {item.variantLabel}
                                    </span>
                                  ) : item.isCombo ? (
                                    <span className="inline-flex shrink-0 rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                      Combo
                                    </span>
                                  ) : null}
                                </div>
                                <div className="mt-1.5 flex items-center gap-1 text-sm text-slate-600">
                                  <button
                                    className="flex h-6 w-6 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-sm font-bold text-orange-700 shadow-sm transition-colors hover:bg-orange-100 sm:h-7 sm:w-7"
                                    onClick={() => dispatch(removeFromCart(id))}
                                  >
                                    −
                                  </button>
                                  <span className="w-5 text-center text-base font-semibold text-slate-800 sm:w-6">
                                    {Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(2).replace('.00', '').replace('.25', '¼').replace('.50', '½').replace('.75', '¾')}
                                  </span>
                                  <button
                                    className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-primary/20 sm:h-7 sm:w-7"
                                    onClick={() =>
                                      dispatch(
                                        addToCart({
                                          id,
                                          item,
                                          price: getDisplayPrice(
                                            item.name,
                                            item.variantLabel,
                                            item.isCombo || item.pricingType === "combo",
                                            item
                                          ),
                                        })
                                      )
                                    }
                                  >
                                    +
                                  </button>

                                  <span className="ml-auto flex w-[112px] shrink-0 flex-col items-end overflow-hidden rounded-lg border border-orange-200/80 bg-orange-50 px-2 py-1 text-right font-medium text-slate-600 sm:w-[124px]">
                                    {/* ✅ Item price और total दिखाएं */}
                                    {itemPrice > 0 ? (
                                      <>
                                        <span className="flex w-full items-center justify-end gap-0.5 whitespace-nowrap text-[10px] leading-none">
                                          {hasDiscountedPrice && (
                                            <span className="text-[9px] text-slate-400 line-through">
                                              ₹{effectiveOriginalPrice.toFixed(2)}
                                            </span>
                                          )}
                                          <span className={hasDiscountedPrice ? "font-semibold text-primary" : "text-slate-700"}>
                                            ₹{itemPrice.toFixed(2)}
                                          </span>
                                          <span className="text-[9px] text-slate-500">× {item.quantity}</span>
                                        </span>
                                        <span className="text-lg font-bold leading-tight text-slate-900">
                                          ₹{itemTotal.toFixed(2)}
                                        </span>
                                      </>
                                    ) : item.isCombo ? (
                                      <>
                                        <span className="text-[10px] leading-tight">Combo: ₹{(item.comboPrice || 0).toFixed(2)} × {item.quantity}</span>
                                        <span className="text-sm font-semibold text-slate-800">
                                          = ₹{((item.comboPrice || 0) * (item.quantity || 1)).toFixed(2)}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[10px] text-slate-500">Price calculating...</span>
                                    )}
                                  </span>
                              </div>
                            </div>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>

                <div className={`sticky bottom-0 border-t px-4 py-4 ${isDarkMode ? "border-slate-700 bg-slate-900/95" : "border-slate-200 bg-white"}`}>
                  {!isRestaurantOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="w-full rounded-xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 px-4 py-3 shadow-[0_8px_18px_rgba(249,115,22,0.12)]"
                    >
                      <div className="flex items-center justify-center gap-2.5 text-orange-700">
                        <Clock className="h-5 w-5" />
                        <p className="text-base font-black uppercase tracking-[0.07em] text-red-600">
                          Restaurant Closed
                        </p>
                      </div>
                      <p className="mt-1 text-center text-sm font-medium text-orange-600">
                        We'll be back soon
                      </p>
                    </motion.div>
                  ) : (
                    <OrderComplete
                      buttonText="Order Now"
                      disabled={cartCount === 0}
                      onClick={() => {
                        if (!isRestaurantOpen) return;
                        setOrderType("");
                        setTableId("");
                        setAddress("");
                        setUseCurrentLocation(false);
                        setShowModal(true);
                        setIsAccordionOpen(false);
                        onSidebarToggle?.(false);
                      }}
                      className={`w-full py-2.5 text-base font-semibold transition-all duration-300 ${
                        cartCount === 0
                          ? "cursor-not-allowed rounded-xl bg-gray-300 text-gray-500"
                          : "rounded-xl bg-primary text-white shadow-md hover:bg-primary/90 hover:shadow-lg"
                      }`}
                    />
                  )}
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </>
        )}

        {/* Header */}
        <header
          className={`relative flex items-center justify-between px-3 py-2.5 sm:p-3 ${
            isDarkMode
              ? "bg-gradient-to-r from-slate-900 via-slate-800/70 to-slate-900"
              : "bg-gradient-to-r from-orange-50 via-orange-50/60 to-orange-50/40"
          }`}
          ref={searchRef}
        >
          <Link to="/" className="flex items-center space-x-2">
            {logo && <img src={logo} alt="Logo" className="h-12 w-auto" />}
            <span className={`font-mostrate text-xl drop-shadow-[0_1px_0_rgba(249,115,22,0.15)] sm:text-2xl ${isDarkMode ? "text-orange-400" : "text-primary"}`}>
              {siteName}
            </span>
          </Link>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onToggleDarkMode}
              className={`client-theme-toggle relative rounded-full p-1.5 transition-colors sm:p-2 ${
                isDarkMode
                  ? "border border-slate-600 bg-slate-800 text-amber-300 hover:bg-slate-700"
                  : "bg-orange-50 text-primary hover:bg-orange-100"
              }`}
              aria-label="Toggle dark mode"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="h-5 w-5 sm:h-6 sm:w-6" /> : <Moon className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>

            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`relative rounded-full p-1.5 transition-colors sm:p-2 ${
                isSearchOpen
                  ? "bg-primary text-white shadow-md"
                  : isDarkMode
                  ? "bg-slate-800 text-orange-300 hover:bg-slate-700"
                  : "bg-orange-50 text-primary hover:bg-orange-100"
              }`}
            >
              <Search className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => {setIsCartOpen(true);onSidebarToggle?.(true);}}
              ref={ordersButtonRef}
              className={`relative rounded-full p-1.5 transition-all sm:p-2 ${
                isOrdersIconHighlighted
                  ? "ring-2 ring-orange-400/70 shadow-[0_0_0_6px_rgba(251,146,60,0.18)]"
                  : isDarkMode
                  ? "bg-slate-800 text-orange-300 hover:bg-slate-700"
                  : "bg-orange-50 text-primary hover:bg-orange-100"
              }`}
            >
              {isPreparingBanner && (
                <span className="pointer-events-none absolute inset-0 rounded-full">
                  <span
                    className={`absolute inset-0 rounded-full border-2 ${
                      isDarkMode ? "border-emerald-400/70" : "border-emerald-500/70"
                    } animate-ping`}
                  />
                </span>
              )}
              <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6" />
              {allOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                  {allOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar Dropdown */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                className={`absolute left-0 right-0 top-full z-50 shadow-lg ${isDarkMode ? "bg-slate-900 border-t border-slate-700" : "bg-white"}`}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.99 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* Pill search input */}
                    <div className="relative flex-1">
                      <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={17}
                      />
                      <input
                        type="text"
                        placeholder="Search for food items..."
                        value={search || ""}
                        onChange={(e) => safeOnSearch(e.target.value)}
                        className={`w-full rounded-full border pl-10 pr-4 py-2.5 text-sm shadow-sm outline-none transition-all duration-200 ${
                          isDarkMode
                            ? "border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400 focus:border-orange-400 focus:bg-slate-800 focus:shadow-md"
                            : "border-orange-100 bg-white text-gray-800 placeholder-gray-400 focus:border-primary focus:bg-white focus:shadow-md"
                        }`}
                        autoFocus
                      />
                    </div>

                    {/* Round action / close button */}
                    <button
                      onClick={() => {
                        onSearch("");
                        setIsSearchOpen(false);
                      }}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all duration-150 hover:bg-primary/90 hover:shadow-lg active:scale-95"
                      title="Close search"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {orderStatusBanner && (
              <motion.div
                key={orderStatusBanner?.ts}
                initial={{ opacity: 0, x: 24, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 36, y: -2, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`fixed left-3 right-3 top-2 z-[70] rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)] sm:left-auto sm:right-4 sm:top-3 sm:w-[360px] ${
                  isDarkMode
                    ? "border-emerald-500/30 bg-slate-900/95 text-emerald-100 shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
                    : "border-emerald-200 bg-white text-emerald-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      isDarkMode
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-tight">{orderStatusBanner.message}</p>
                    {/* <p className={`text-xs ${isDarkMode ? "text-emerald-200/80" : "text-emerald-700/70"}`}>
                      We’ll notify you when it’s ready.
                    </p> */}
                  </div>
                  <button
                    onClick={() => setOrderStatusBanner(null)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      isDarkMode
                        ? "text-emerald-100/80 hover:bg-emerald-500/20"
                        : "text-emerald-700 hover:bg-emerald-100"
                    }`}
                    aria-label="Close notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Sidebar overlay with backdrop blur */}
        <AnimatePresence>
          {isCartOpen && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
              onClick={() => { setIsCartOpen(false); onSidebarToggle?.(false); }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>

        {/* Sidebar with multiple */}
        <AnimatePresence>
          {isCartOpen && (
          <motion.div
            className={`fixed top-0 right-0 z-50 flex h-full w-[87%] max-w-sm flex-col border-l shadow-2xl ${isDarkMode ? "border-slate-700 bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#020617]" : "border-orange-100 bg-gradient-to-b from-[#fffaf4] via-[#fffdf8] to-[#fff3e6]"}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
          {/* Header */}
          <div className={`flex items-center justify-between border-b p-4 ${isDarkMode ? "border-slate-700" : "border-orange-100"}`}>
            <h2 className={`text-lg font-semibold sm:text-xl ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>Your Orders</h2>
            <button
              onClick={() => {setIsCartOpen(false);onSidebarToggle?.(false)}}
              className={`p-1 transition-colors ${isDarkMode ? "text-slate-300 hover:text-slate-100" : "text-gray-600 hover:text-gray-900"}`}
            >
              <X className={`w-5 h-5 ${isDarkMode ? "text-slate-300" : "text-gray-600"}`} />
            </button>
          </div>

          {/* Orders List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-4 transition">
              {ordersLoading && currentPage === 1 ? null : allOrders.length === 0 ? (
                <div className="text-center py-8">
                  <FiShoppingCart className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? "text-slate-500" : "text-gray-300"}`} />
                  <p className={isDarkMode ? "text-slate-300" : "text-gray-500"}>No orders yet</p>
                </div>
              ) : (
                <>
                  {allOrders.slice(0, 1).map((order) => {
                    const orderTypeNormalized = String(order.orderType || "").trim().toLowerCase();
                    const orderTypeLabel = normalizeOrderType(order.orderType) || order.orderType || "Unknown Type";

                    return (
                    <div
                      key={order._id || order.id || order.orderId}
                      className={`rounded-2xl border p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] ${
                        isDarkMode
                          ? "border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ring-1 ring-slate-700"
                          : "border-primary/20 bg-gradient-to-br from-white via-orange-50 to-amber-50 ring-1 ring-orange-100"
                      }`}
                    >
                    {/* Customer + order meta */}
                    <div className={`mb-3 rounded-xl border p-3 shadow-[0_6px_14px_rgba(15,23,42,0.05)] ${
                      isDarkMode
                        ? "border-slate-600 bg-slate-900/90"
                        : "border-orange-200/80 bg-white/80"
                    }`}>
                      <div className="grid grid-cols-[72px_1fr] items-center gap-x-2.5 gap-y-2.5">
                        <span className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Name
                        </span>
                        <p className={`truncate text-[15px] font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                          {order.customerName || "Guest"}
                        </p>

                        <span className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Phone
                        </span>
                        <p className={`break-all text-sm font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                          {order.customerPhone || "Not provided"}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-sm ring-1 ${
                            isDarkMode
                              ? orderTypeNormalized.toLowerCase() === "delivery"
                                ? "border-orange-500/50 bg-orange-500/15 text-orange-200 ring-orange-500/30"
                                : orderTypeNormalized.toLowerCase() === "take away" || orderTypeNormalized.toLowerCase() === "takeaway"
                                ? "border-blue-500/50 bg-blue-500/15 text-blue-200 ring-blue-500/30"
                                : orderTypeNormalized.toLowerCase() === "eat here" || orderTypeNormalized.toLowerCase() === "eathere"
                                ? "border-green-500/50 bg-green-500/15 text-green-200 ring-green-500/30"
                                : "border-slate-600 bg-slate-700/80 text-slate-200 ring-slate-600/70"
                              : orderTypeNormalized.toLowerCase() === "delivery"
                              ? "border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 ring-orange-200/70"
                              : orderTypeNormalized.toLowerCase() === "take away" || orderTypeNormalized.toLowerCase() === "takeaway"
                              ? "border-blue-200 bg-gradient-to-r from-blue-50 to-sky-100 text-blue-700 ring-blue-200/70"
                              : orderTypeNormalized.toLowerCase() === "eat here" || orderTypeNormalized.toLowerCase() === "eathere"
                              ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-100 text-green-700 ring-green-200/70"
                              : "border-gray-200 bg-gray-100 text-gray-700 ring-gray-200/70"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              orderTypeNormalized.toLowerCase() === "delivery"
                                ? "bg-orange-300 ring-1 ring-orange-300/60"
                                : orderTypeNormalized.toLowerCase() === "take away" || orderTypeNormalized.toLowerCase() === "takeaway"
                                ? "bg-blue-300 ring-1 ring-blue-300/60"
                                : orderTypeNormalized.toLowerCase() === "eat here" || orderTypeNormalized.toLowerCase() === "eathere"
                                ? "bg-green-300 ring-1 ring-green-300/60"
                                : "bg-gray-500"
                            }`}
                          />
                          <span>{orderTypeLabel}</span>
                        </span>

                        {order.status && (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize shadow-sm ring-1 ${
                              isDarkMode
                                ? String(order.status || "").toLowerCase() === "pending"
                                  ? "border-amber-500/50 bg-amber-500/15 text-amber-200 ring-amber-500/30"
                                  : String(order.status || "").toLowerCase() === "preparing"
                                  ? "border-teal-500/50 bg-teal-500/15 text-teal-200 ring-teal-500/30"
                                  : String(order.status || "").toLowerCase() === "completed"
                                  ? "border-green-500/50 bg-green-500/15 text-green-200 ring-green-500/30"
                                  : String(order.status || "").toLowerCase() === "cancelled"
                                  ? "border-red-500/50 bg-red-500/15 text-red-200 ring-red-500/30"
                                  : "border-slate-600 bg-slate-700/80 text-slate-200 ring-slate-600/70"
                                : String(order.status || "").toLowerCase() === "pending"
                                ? "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-800 ring-amber-200/80"
                                : String(order.status || "").toLowerCase() === "preparing"
                                ? "border-teal-200 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 ring-teal-200/70"
                                : String(order.status || "").toLowerCase() === "completed"
                                ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-100 text-green-700 ring-green-200/70"
                                : String(order.status || "").toLowerCase() === "cancelled"
                                ? "border-red-200 bg-gradient-to-r from-red-50 to-rose-100 text-red-700 ring-red-200/70"
                                : "border-gray-200 bg-gray-100 text-gray-700 ring-gray-200/70"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                String(order.status || "").toLowerCase() === "pending"
                                  ? "bg-amber-600"
                                  : String(order.status || "").toLowerCase() === "preparing"
                                  ? "bg-teal-600"
                                  : String(order.status || "").toLowerCase() === "completed"
                                  ? "bg-green-600"
                                  : String(order.status || "").toLowerCase() === "cancelled"
                                  ? "bg-red-600"
                                  : "bg-gray-500"
                              }`}
                            />
                            <span>{order.status}</span>
                          </span>
                        )}

                        {order.tableId && (
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${isDarkMode ? "border-slate-600 bg-slate-700/80 text-slate-200" : "border-slate-200 bg-slate-100 text-slate-700"}`}>
                            Table {order.tableId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delivery Address (if any) */}
                    {order.address && (
                      <div className={`mb-3 rounded-xl border p-3 ${isDarkMode ? "border-slate-600 bg-slate-900/70" : "border-orange-200/80 bg-orange-50/30"}`}>
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                          Address:
                        </span>
                        <p className={`mt-1 text-xs leading-relaxed ${isDarkMode ? "text-slate-200" : "text-gray-600"}`}>
                          {order.address}
                        </p>
                      </div>
                    )}

                    {/* Order Items with Label */}
                    <div className="mb-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                          Items:
                        </span>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className={`flex items-start justify-between gap-3 rounded-lg border px-2.5 py-2 text-sm ${isDarkMode ? "border-slate-600 bg-slate-900/90" : "border-orange-200/80 bg-white"}`}
                          >
                            <span className={isDarkMode ? "text-slate-100" : "text-gray-700"}>
                              {item.name}
                              {item.variant && (
                                <span className={`ml-1 text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                                  ({item.variant})
                                </span>
                              )}
                              <span className={`ml-1 font-semibold ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
                                × {item.quantity}
                              </span>
                            </span>
                            <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
                              ₹{Number(item.discountedPrice || item.price || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GST (if enabled) */}
                    {order.gstAmount !== undefined && (
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
                          GST {order.gstRate ? `(${order.gstRate}%)` : ""}:
                        </span>
                        <span className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
                          ₹{Number(order.gstAmount).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Delivery Charges (if delivery order) */}
                    {orderTypeNormalized === "delivery" && typeof order.deliveryCharges === "number" && (
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
                          Delivery Charges:
                        </span>
                        <span className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
                          ₹{Number(order.deliveryCharges).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2.5">
                      <span className="font-semibold text-white">
                        Total Amount:
                      </span>
                      <span className="text-xl font-bold text-primary">
                        ₹{order.totalAmount?.toFixed(2) || "0.00"}
                      </span>
                    </div>

                  </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          </motion.div>
        )}
        </AnimatePresence>

        {/* Order Form Modal */}
        <OrderFormModal
          showModal={showModal}
          setShowModal={setShowModal}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          tableId={tableId}
          setTableId={setTableId}
          orderType={orderType}
          setOrderType={setOrderType}
          address={address}
          setAddress={setAddress}
          useCurrentLocation={useCurrentLocation}
          setUseCurrentLocation={setUseCurrentLocation}
          loading={isOrderLoading}
          handleOrderSubmit={handleOrderSubmit}
          restaurantData={restaurantData?.restaurant ? restaurantData : { restaurant: restaurantData }}
          cartItems={cartItems}
          logo={logo}
          resetForm={resetForm}
          calculatedDetails={calculatedDetails}
          isDarkMode={isDarkMode}
        />
      </div>
    </>
  );
}
