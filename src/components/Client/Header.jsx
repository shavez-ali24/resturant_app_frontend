import { useState, useEffect, useRef } from "react";
import { X, Clock, Search, UtensilsCrossed, ArrowRight, Rocket, Moon, Sun } from "lucide-react";
import { createRoot } from "react-dom/client";
import { FiShoppingCart } from "react-icons/fi";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
  removeFromCart,
  addToCart,
  clearCart,
} from "../../redux/clientRedux/clientSlice";
import {
  useGetRestaurantQuery,
  useCreateOrderMutation,
  useGetOrdersByFingerprintQuery,
} from "../../redux/clientRedux/clientAPI";
import { Toaster } from "@/components/ui/toaster";
import OrderComplete from "@/components/Client/OrderComplete";
import OrderFormModal from "./OrderFormModal";
import fingerprintService from "@/service/fingerprintService";
import config from "@/config";

const NAME_VALID_PATTERN = /^[A-Za-z\s]+$/;
const PHONE_VALID_PATTERN = /^\d{10}$/;

const capitalizeFirstLetter = (value) =>
  String(value || "").replace(
    /^(\s*)([a-z])/,
    (_, spaces, char) => `${spaces}${char.toUpperCase()}`
  );

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
  const sseRetryTimer = useRef(null);
  const orderStatusTracker = useRef(new Map());
  const orderItemStatusTracker = useRef(new Map());

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableId, setTableId] = useState("");
  const [orderType, setOrderType] = useState("");
  const [address, setAddress] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [sseRetryKey, setSseRetryKey] = useState(0);

  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.client?.cart?.items || {});

  const cartCount = Object.values(cartItems || {}).reduce(
    (acc, item) => acc + (item?.quantity || 0),
    0
  );

  const [calculatedDetails, setCalculatedDetails] = useState({
    subtotal: 0,
    gstAmount: 0,
    deliveryCharges: 0,
    totalAmount: 0,
    items: [],
    loading: false,
  });

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

  // Cart bump animation on item add
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

  // Estimate totals from latest order + current cart
  const estimateFromLatestOrder = (latestOrder, currentCartItems) => {
    try {
      const latestOrderItems = latestOrder?.items || [];
      if (!latestOrderItems.length) {
        setCalculatedDetails({
          subtotal: 0,
          gstAmount: 0,
          deliveryCharges: 0,
          totalAmount: 0,
          items: latestOrderItems,
          loading: false,
        });
        setItemPrices({});
        return;
      }

      const currentCartArray = Object.values(currentCartItems || {});
      if (!currentCartArray.length) {
        setCalculatedDetails({
          subtotal: 0,
          gstAmount: 0,
          deliveryCharges: 0,
          totalAmount: 0,
          items: [],
          loading: false,
        });
        return;
      }

      let estimatedSubtotal = 0;
      const newItemPrices = {};

      currentCartArray.forEach((cartItem) => {
        if (!cartItem) return;
        const quantity = cartItem.quantity || 1;
        const itemKey = `${cartItem.name}_${cartItem.variantLabel || ""}`;
        let itemPrice = 0;

        if (cartItem.isCombo || cartItem.pricingType === "combo") {
          const matchingOrderItem = latestOrderItems.find(
            (orderItem) => orderItem.name === cartItem.name
          );
          itemPrice = matchingOrderItem
            ? matchingOrderItem.discountedPrice || matchingOrderItem.price || 0
            : cartItem.comboPrice || 0;
        } else {
          const matchingOrderItem = latestOrderItems.find((orderItem) => {
            const nameMatches = orderItem.name === cartItem.name;
            const variantMatches =
              (!cartItem.variantLabel && !orderItem.variant) ||
              (cartItem.variantLabel &&
                orderItem.variant &&
                cartItem.variantLabel
                  .toLowerCase()
                  .includes(orderItem.variant.toLowerCase()));
            return nameMatches && variantMatches;
          });

          if (matchingOrderItem) {
            itemPrice =
              matchingOrderItem.discountedPrice || matchingOrderItem.price || 0;
          } else {
            const sameNameItem = latestOrderItems.find(
              (orderItem) => orderItem.name === cartItem.name
            );
            itemPrice = sameNameItem
              ? sameNameItem.discountedPrice || sameNameItem.price || 0
              : cartItem.price || cartItem.comboPrice || 0;
          }
        }

        newItemPrices[itemKey] = itemPrice;
        if (itemPrice > 0) estimatedSubtotal += itemPrice * quantity;
      });

      setItemPrices(newItemPrices);

      const restaurant = restaurantData?.restaurant || {};
      const gstRate = Number(restaurant.gstRate) || 0;
      const estimatedGstAmount = restaurant.gstEnabled
        ? (estimatedSubtotal * gstRate) / 100
        : 0;
      const deliveryCharges =
        normalizedOrderType === "Delivery"
          ? Number(restaurant.deliveryCharges) || 0
          : 0;
      const estimatedTotalAmount =
        estimatedSubtotal + estimatedGstAmount + deliveryCharges;

      setCalculatedDetails({
        subtotal: Number(estimatedSubtotal.toFixed(2)),
        gstAmount: Number(estimatedGstAmount.toFixed(2)),
        deliveryCharges: Number(deliveryCharges.toFixed(2)),
        totalAmount: Number(estimatedTotalAmount.toFixed(2)),
        items: latestOrderItems,
        loading: false,
      });
    } catch (error) {
      console.error("Estimation error:", error);
      setCalculatedDetails((prev) => ({ ...prev, loading: false }));
    }
  };

  // Resolve display price for a cart item
  const getDisplayPrice = (
    itemName,
    variantLabel,
    isCombo = false,
    cartItem = null
  ) => {
    const itemKey = `${itemName}_${variantLabel || ""}`;

    if (
      allOrders.length > 0 &&
      Object.prototype.hasOwnProperty.call(itemPrices, itemKey)
    ) {
      return Number(itemPrices[itemKey]) || 0;
    }

    if (cartItem) {
      if (
        cartItem.price !== undefined &&
        cartItem.price !== null &&
        cartItem.price !== ""
      ) {
        const explicitPrice = Number(cartItem.price);
        if (!Number.isNaN(explicitPrice)) return explicitPrice;
      }
      if (isCombo || cartItem.pricingType === "combo") {
        return Number(cartItem.comboPrice) || 0;
      }
      if (
        cartItem.variantKey &&
        cartItem.variantRates &&
        cartItem.variantRates[cartItem.variantKey]
      ) {
        return Number(cartItem.variantRates[cartItem.variantKey].price) || 0;
      }
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

    if (
      cartItem.variantKey &&
      cartItem.variantRates &&
      cartItem.variantRates[cartItem.variantKey]
    ) {
      return Number(cartItem.variantRates[cartItem.variantKey].price) || 0;
    }

    if (cartItem.isCombo || cartItem.pricingType === "combo") {
      return Number(cartItem.comboPrice ?? cartItem.price) || 0;
    }

    return Number(cartItem.price) || 0;
  };

  const calculateCartTotal = () => {
    if (!cartItems || !Object.keys(cartItems).length || cartCount === 0) {
      return { subtotal: 0, gstAmount: 0, deliveryCharges: 0, totalAmount: 0 };
    }

    let subtotal = 0;
    Object.values(cartItems).forEach((cartItem) => {
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

    const restaurant = restaurantData?.restaurant || {};
    const gstRate = Number(restaurant.gstRate) || 0;
    const gstAmount = restaurant.gstEnabled
      ? (subtotal * gstRate) / 100
      : 0;
    const deliveryCharges =
      normalizedOrderType === "Delivery"
        ? Number(restaurant.deliveryCharges) || 0
        : 0;
    const totalAmount = subtotal + gstAmount + deliveryCharges;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      deliveryCharges: Number(deliveryCharges.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
    };
  };

  // Sync calculated totals whenever cart / orders / orderType changes
  useEffect(() => {
    if (allOrders.length > 0 && cartCount > 0) {
      const latestOrder = allOrders[0];
      if (latestOrder.items && latestOrder.totalAmount) {
        estimateFromLatestOrder(latestOrder, cartItems);
      }
    } else if (cartCount > 0) {
      setItemPrices({});
      const cartTotal = calculateCartTotal();
      setCalculatedDetails({ ...cartTotal, items: [], loading: false });
    } else {
      setCalculatedDetails({
        subtotal: 0,
        gstAmount: 0,
        deliveryCharges: 0,
        totalAmount: 0,
        items: [],
        loading: false,
      });
      setItemPrices({});
    }
  }, [allOrders, cartItems, cartCount, orderType, restaurantData]);

  // Close search on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isSearchOpen) setIsSearchOpen(false);
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

  // Get browser fingerprint on mount
  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await fingerprintService.getFingerprint();
      setFingerPrint(fp);
    };
    getFingerprint();
  }, []);

  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch,
  } = useGetOrdersByFingerprintQuery(
    { fingerPrint, page: currentPage },
    {
      skip: !fingerPrint,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // Merge fetched orders into local state
  useEffect(() => {
    if (!ordersData) return;

    let orders = [];
    if (Array.isArray(ordersData)) {
      orders = ordersData;
    } else if (Array.isArray(ordersData?.orders)) {
      orders = ordersData.orders;
    } else if (Array.isArray(ordersData?.data)) {
      orders = ordersData.data;
    } else if (ordersData?.order && typeof ordersData.order === "object") {
      orders = [ordersData.order];
    }

    const dedup = (list) =>
      list.filter(
        (order, idx, self) =>
          idx ===
          self.findIndex(
            (o) =>
              (o._id || o.id || o.orderId) ===
              (order._id || order.id || order.orderId)
          )
      );

    if (currentPage === 1) {
      setAllOrders(dedup(orders));
    } else {
      setAllOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o._id || o.id || o.orderId));
        const newOrders = orders.filter(
          (order) => !existingIds.has(order._id || order.id || order.orderId)
        );
        return [...prev, ...newOrders];
      });
    }

    setHasMore(orders.length > 0 && ordersData?.hasMore !== false);
  }, [ordersData, currentPage]);

  // SSE — real-time order status updates
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!fingerPrint || !config?.BASE_URL) return undefined;

    const baseUrl = String(config.BASE_URL).replace(/\/$/, "");
    const sseUrl = `${baseUrl}/api/notifications?fingerPrint=${encodeURIComponent(fingerPrint)}`;

    if (sseRetryTimer.current) {
      window.clearTimeout(sseRetryTimer.current);
      sseRetryTimer.current = null;
    }

    const source = new EventSource(sseUrl);

    source.onmessage = (event) => {
      if (!event?.data) return;
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (
        ["ORDER_STATUS_CHANGED", "ORDER_UPDATED"].includes(payload?.type) &&
        payload.data
      ) {
        const updatedOrder = payload.data;
        const orderId =
          updatedOrder?._id || updatedOrder?.id || updatedOrder?.orderId;
        if (!orderId) return;

        // ALWAYS update UI for all data changes (including item ticks/checkboxes)
        setAllOrders((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const idx = next.findIndex(
            (order) =>
              (order?._id || order?.id || order?.orderId) === orderId
          );
          if (idx === -1) return [updatedOrder, ...next];
          next[idx] = { ...next[idx], ...updatedOrder };
          return next;
        });

        pulseOrdersIcon();

        // ONLY trigger notification if actual status has changed
        const previousStatus = orderStatusTracker.current.get(orderId);
        const newStatus = String(updatedOrder.status || "").toLowerCase();
        
        if (previousStatus !== newStatus) {
          orderStatusTracker.current.set(orderId, newStatus);
          if (payload.type === "ORDER_UPDATED") showOrderStatusBanner(updatedOrder);
        }
        
        refetch();
      }
    };

    source.onerror = () => {
      if (sseRetryTimer.current) return;
      source.close();
      sseRetryTimer.current = window.setTimeout(() => {
        sseRetryTimer.current = null;
        setSseRetryKey((prev) => prev + 1);
      }, 5000);
    };

    return () => {
      if (sseRetryTimer.current) {
        window.clearTimeout(sseRetryTimer.current);
        sseRetryTimer.current = null;
      }
      source.close();
    };
  }, [fingerPrint, refetch, sseRetryKey]);

  // Pre-fill form from latest order when modal opens
  useEffect(() => {
    if (showModal && allOrders.length > 0) {
      const latestOrder = allOrders[0];
      if (latestOrder.customerName)
        setCustomerName(sanitizeCustomerName(latestOrder.customerName));
      if (latestOrder.customerPhone)
        setCustomerPhone(sanitizeCustomerPhone(latestOrder.customerPhone));
      setOrderType("");
      setTableId("");
      setAddress("");
      setUseCurrentLocation(false);
    }
  }, [showModal, allOrders]);

  // Reset pagination when fingerprint changes
  useEffect(() => {
    if (fingerPrint) {
      setCurrentPage(1);
      setAllOrders([]);
      setHasMore(true);
    }
  }, [fingerPrint]);

  const pulseOrdersIcon = () => {
    setIsOrdersIconHighlighted(true);
    setTimeout(() => setIsOrdersIconHighlighted(false), 2200);
  };

  const triggerPreparingVibration = () => {
    if (typeof window === "undefined" || !window.navigator) return;
    try {
      const nav = window.navigator;
      const vibrateFn =
        nav.vibrate?.bind(nav) ||
        nav.webkitVibrate?.bind(nav) ||
        nav.mozVibrate?.bind(nav);
      if (typeof vibrateFn === "function") vibrateFn([160, 80, 160]);
    } catch (e) {
      // vibration not supported on this device
    }
  };

  const showOrderStatusBanner = (order) => {
    const rawStatus = order?.status ? String(order.status).toLowerCase() : "";
    if (!rawStatus.includes("preparing")) return;
    setOrderStatusBanner({
      message: "Your order is preparing",
      status: "preparing",
      ts: Date.now(),
    });
    triggerPreparingVibration();
  };

  useEffect(() => {
    if (!orderStatusBanner) return;
    const timer = window.setTimeout(() => setOrderStatusBanner(null), 3500);
    return () => window.clearTimeout(timer);
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
          transform:
            "translate(-50%, -50%) translate(0px, 0px) scale(0.7) rotate(-20deg)",
          opacity: 0,
        },
        {
          transform: `translate(-50%, -50%) translate(${dx * 0.28}px, ${
            dy * 0.34 - 46
          }px) scale(1.05) rotate(6deg)`,
          opacity: 1,
          offset: 0.5,
        },
        {
          transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.72) rotate(18deg)`,
          opacity: 0.1,
        },
      ],
      { duration: 1200, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" }
    );

    rocketAnimation.onfinish = () => {
      rocketRoot.unmount();
      if (document.body.contains(rocket)) document.body.removeChild(rocket);

      const ping = document.createElement("div");
      ping.className =
        "pointer-events-none fixed z-[145] h-14 w-14 rounded-full border-2 border-orange-400/80 bg-orange-400/20";
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
        if (document.body.contains(ping)) document.body.removeChild(ping);
      };

      pulseOrdersIcon();
    };
  };

  const showSuccessMessage = () => animateOrderRocketToOrders();

  const showErrorMessage = (message) => {
    const messageDiv = document.createElement("div");
    messageDiv.className =
      "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm";

    messageDiv.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200">
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
        if (document.body.contains(messageDiv))
          document.body.removeChild(messageDiv);
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
    if (!trimmedName || !NAME_VALID_PATTERN.test(trimmedName)) return false;
    if (!PHONE_VALID_PATTERN.test(customerPhone)) return false;
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
      const finalOrderType = normalizedOrderType;
      const trimmedName = customerName.trim();
      const formattedName = capitalizeFirstLetter(
        trimmedName.replace(/\s+/g, " ")
      );
      const trimmedAddress = address.trim();

      if (!isRestaurantOpen) {
        showErrorMessage(
          "Orders are currently closed. Please try again later."
        );
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

      const orderItems = Object.values(cartItems).map((cartItem) => {
        const variantData =
          cartItem.variantKey &&
          cartItem.variantRates &&
          cartItem.variantRates[cartItem.variantKey]
            ? cartItem.variantRates[cartItem.variantKey]
            : null;

        const isComboItem =
          cartItem.isCombo || cartItem.pricingType === "combo";
        const variantBasePrice = Number(variantData?.price) || 0;

        const price =
          Number(
            cartItem.originalPrice ??
              (isComboItem
                ? cartItem.comboPrice
                : variantBasePrice || cartItem.price) ??
              0
          ) || 0;

        const discountedPrice =
          Number(
            cartItem.price ??
              (isComboItem ? cartItem.comboPrice : variantBasePrice) ??
              0
          ) || 0;

        const orderItem = {
          menuItemId: cartItem._id,
          name: cartItem.name,
          quantity: cartItem.quantity || 1,
          customizations: cartItem.customizations || "",
          price,
          discountedPrice,
          discountApplied:
            variantData?.discount || cartItem.discount || null,
        };

        if (cartItem.variantKey) orderItem.variant = cartItem.variantKey;
        if (cartItem.isCombo && cartItem.comboItems)
          orderItem.comboItems = cartItem.comboItems;

        return orderItem;
      });

      const fp = await fingerprintService.getFingerprint();

      const orderData = {
        fingerPrint: fp,
        customerName: formattedName,
        customerPhone,
        items: orderItems,
        orderType: finalOrderType,
      };

      if (finalOrderType === "Eat Here" && tableId)
        orderData.tableId = tableId;
      if (finalOrderType === "Delivery" && trimmedAddress)
        orderData.address = trimmedAddress;

      await createOrder(orderData).unwrap();

      showSuccessMessage();

      setCurrentPage(1);
      setAllOrders([]);
      setHasMore(true);

      if (fp) setTimeout(() => refetch(), 500);

      setShowModal(false);
      setIsCartOpen(false);
      onSidebarToggle?.(false);
      setOrderType("");
      setAddress("");
      setUseCurrentLocation(false);
      setCustomerName("");
      setCustomerPhone("");
      setTableId("");

      setTimeout(() => dispatch(clearCart()), 300);
    } catch (error) {
      console.error("Order error:", error);
      let errorMessage =
        error.data?.message || "Failed to place order. Please try again.";
      if (error.data?.error) errorMessage += ` - ${error.data.error}`;
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

  const safeOnSearch =
    typeof onSearch === "function" ? onSearch : () => {};

  return (
    <>
      <Toaster />
      <div className={`relative z-50 ${isDarkMode ? "text-slate-100" : ""}`}>
        {/* Bottom Order Summary Bar */}
        {cartCount > 0 && (
          <>
            {/* Collapsed bar */}
            <AnimatePresence>
              {!isAccordionOpen && (
                <motion.div
                  className="fixed bottom-2 left-2 right-2"
                  initial={{ y: 64, opacity: 0, scale: 0.88 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 56, opacity: 0, scale: 0.94 }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 26,
                    mass: 0.78,
                  }}
                >
                  <motion.div
                    animate={
                      isCartBarBump ? { scale: [1, 1.05, 1] } : { scale: 1 }
                    }
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
                            <span className="text-2xl font-bold">
                              {cartCount}
                            </span>
                            <span
                              className={`ml-1 hidden text-sm font-semibold min-[360px]:inline ${
                                isDarkMode
                                  ? "text-orange-100"
                                  : "text-slate-200"
                              }`}
                            >
                              item{cartCount > 1 ? "s" : ""}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsAccordionOpen(true);
                          onSidebarToggle?.(true);
                        }}
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

            {/* Full-screen cart accordion */}
            <AnimatePresence>
              {isAccordionOpen && (
                <motion.div
                  className={`fixed inset-0 z-[100] flex flex-col ${
                    isDarkMode
                      ? "bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#020617]"
                      : "bg-gradient-to-b from-[#fffaf4] via-[#fffdf8] to-[#fff3e6]"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {/* Header */}
                  <div
                    className={`sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 ${
                      isDarkMode
                        ? "border-slate-700 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"
                        : "border-orange-100 bg-gradient-to-r from-[#fffdf9] via-[#fff6ec] to-[#fffdf9]"
                    }`}
                  >
                    <h2
                      className={`text-xl font-semibold sm:text-[1.65rem] ${
                        isDarkMode ? "text-slate-100" : "text-slate-900"
                      }`}
                    >
                      Your Order ({cartCount})
                    </h2>
                    <button
                      onClick={() => {
                        setIsAccordionOpen(false);
                        onSidebarToggle?.(false);
                      }}
                      className={`p-1 transition-colors ${
                        isDarkMode
                          ? "text-slate-300 hover:text-slate-100"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      aria-label="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                 

                  {/* Items list */}
                  <div className="flex-1 overflow-y-auto px-3 py-3 pb-28">
                    {cartCount === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <p className="py-6 text-center text-lg text-slate-500">
                          Your cart is empty 🛒
                        </p>
                      </div>
                    ) : (
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
                          const effectiveOriginalPrice =
                            originalPrice > 0 ? originalPrice : itemPrice;
                          const hasDiscountedPrice =
                            effectiveOriginalPrice > itemPrice;
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
                                  <p className="line-clamp-2 break-words text-sm font-semibold leading-tight tracking-tight text-slate-900 flex-1">
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
                                    {Number.isInteger(item.quantity)
                                      ? item.quantity
                                      : item.quantity
                                          .toFixed(2)
                                          .replace(".00", "")
                                          .replace(".25", "¼")
                                          .replace(".50", "½")
                                          .replace(".75", "¾")}
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
                                            item.isCombo ||
                                              item.pricingType === "combo",
                                            item
                                          ),
                                        })
                                      )
                                    }
                                  >
                                    +
                                  </button>

                                  <span className="ml-auto flex w-[112px] shrink-0 flex-col items-end overflow-hidden rounded-lg border border-orange-200/80 bg-orange-50 px-2 py-1 text-right font-medium text-slate-600 sm:w-[124px]">
                                    {itemPrice > 0 ? (
                                      <>
                                        <span className="flex w-full items-center justify-end gap-0.5 whitespace-nowrap text-[10px] leading-none">
                                          {hasDiscountedPrice && (
                                            <span className="text-[9px] text-slate-400 line-through">
                                              ₹{effectiveOriginalPrice.toFixed(2)}
                                            </span>
                                          )}
                                          <span
                                            className={
                                              hasDiscountedPrice
                                                ? "font-semibold text-primary"
                                                : "text-slate-700"
                                            }
                                          >
                                            ₹{itemPrice.toFixed(2)}
                                          </span>
                                          <span className="text-[9px] text-slate-500">
                                            × {item.quantity}
                                          </span>
                                        </span>
                                        <span className="text-lg font-bold leading-tight text-slate-900">
                                          ₹{itemTotal.toFixed(2)}
                                        </span>
                                      </>
                                    ) : item.isCombo ? (
                                      <>
                                        <span className="text-[10px] leading-tight">
                                          Combo: ₹
                                          {(item.comboPrice || 0).toFixed(2)} ×{" "}
                                          {item.quantity}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-800">
                                          = ₹
                                          {(
                                            (item.comboPrice || 0) *
                                            (item.quantity || 1)
                                          ).toFixed(2)}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[10px] text-slate-500">
                                        Price calculating...
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                   {/* Price Breakdown */}
                   <div className={`px-4 py-3 border-t ${isDarkMode ? "border-slate-700 bg-slate-900/90" : "border-orange-100 bg-orange-50/50"}`}>
                     {/* Subtotal */}
                     <div className="flex justify-between items-center text-sm">
                       <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>Subtotal</span>
                       <span className="font-medium">₹{calculatedDetails.subtotal.toFixed(2)}</span>
                     </div>
                     
                     {/* GST */}
                     {calculatedDetails.gstAmount > 0 && (
                       <div className="flex justify-between items-center text-sm mt-1.5">
                         <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
                           GST ({restaurantData?.restaurant?.gstRate || 5}%)
                         </span>
                         <span className="font-medium">+ ₹{calculatedDetails.gstAmount.toFixed(2)}</span>
                       </div>
                     )}

                     {/* Delivery Charges */}
                     {calculatedDetails.deliveryCharges > 0 && (
                       <div className="flex justify-between items-center text-sm mt-1.5">
                         <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>Delivery Charges</span>
                         <span className="font-medium">+ ₹{calculatedDetails.deliveryCharges.toFixed(2)}</span>
                       </div>
                     )}

                     {/* Total Amount */}
                     <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-dashed font-bold text-lg">
                       <span>Total Amount</span>
                       <span className="text-primary">₹{calculatedDetails.totalAmount.toFixed(2)}</span>
                     </div>
                   </div>

                   {/* Footer CTA */}
                   <div
                     className={`sticky bottom-0 border-t px-4 py-4 ${
                       isDarkMode
                         ? "border-slate-700 bg-slate-900/95"
                         : "border-slate-200 bg-white"
                     }`}
                   >
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

        {/* Main Header */}
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
            <span
              className={`font-fredoka text-xl font-semibold tracking-wide sm:text-2xl ${
                isDarkMode
                  ? "text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.8)]"
                  : "text-orange-600 drop-shadow-[0_0_8px_rgba(234,88,12,0.4)]"
              }`}
            >
              {siteName}
            </span>
          </Link>

          <div className="flex items-center space-x-2.5">
            {/* Dark mode toggle */}
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
              {isDarkMode ? (
                <Sun className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Moon className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>

            {/* Search */}
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

            {/* Orders / Cart */}
            <button
              onClick={() => {
                setIsCartOpen(true);
                onSidebarToggle?.(true);
              }}
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
                      isDarkMode
                        ? "border-emerald-400/70"
                        : "border-emerald-500/70"
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

          {/* Search dropdown */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                className={`absolute left-0 right-0 top-full z-50 shadow-lg ${
                  isDarkMode
                    ? "bg-slate-900 border-t border-slate-700"
                    : "bg-white"
                }`}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.99 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
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

          {/* Order status banner */}
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
                    <p className="text-sm font-semibold leading-tight">
                      {orderStatusBanner.message}
                    </p>
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

        {/* Sidebar backdrop */}
        <AnimatePresence>
          {isCartOpen && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
              onClick={() => {
                setIsCartOpen(false);
                onSidebarToggle?.(false);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>

        {/* Orders sidebar */}
        <AnimatePresence>
          {isCartOpen && (
            <motion.div
              className={`fixed top-0 right-0 z-50 flex h-full w-[87%] max-w-sm flex-col border-l shadow-2xl ${
                isDarkMode
                  ? "border-slate-700 bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#020617]"
                  : "border-orange-100 bg-gradient-to-b from-[#fffaf4] via-[#fffdf8] to-[#fff3e6]"
              }`}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div
                className={`flex items-center justify-between border-b p-4 ${
                  isDarkMode ? "border-slate-700" : "border-orange-100"
                }`}
              >
                <h2
                  className={`text-lg font-semibold sm:text-xl ${
                    isDarkMode ? "text-slate-100" : "text-gray-800"
                  }`}
                >
                  Your Orders
                </h2>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onSidebarToggle?.(false);
                  }}
                  className={`p-1 transition-colors ${
                    isDarkMode
                      ? "text-slate-300 hover:text-slate-100"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <X
                    className={`w-5 h-5 ${
                      isDarkMode ? "text-slate-300" : "text-gray-600"
                    }`}
                  />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4 p-4">
                  {ordersLoading && currentPage === 1 ? null : allOrders.length ===
                    0 ? (
                    <div className="text-center py-8">
                      <FiShoppingCart
                        className={`w-12 h-12 mx-auto mb-3 ${
                          isDarkMode ? "text-slate-500" : "text-gray-300"
                        }`}
                      />
                      <p
                        className={
                          isDarkMode ? "text-slate-300" : "text-gray-500"
                        }
                      >
                        No orders yet
                      </p>
                    </div>
                  ) : (
                    <>
                      {allOrders.map((order) => {
                        const orderTypeNormalized = String(
                          order.orderType || ""
                        )
                          .trim()
                          .toLowerCase();
                        const orderTypeLabel =
                          normalizeOrderType(order.orderType) ||
                          order.orderType ||
                          "Unknown Type";

                        return (
                          <div
                            key={order._id || order.id || order.orderId}
                            className={`overflow-hidden rounded-2xl border shadow-sm ${
                              isDarkMode
                                ? "border-slate-700 bg-slate-900"
                                : "border-orange-100 bg-white"
                            }`}
                          >
                            {/* Meta rows */}
                            <div className="px-4 pt-4 pb-3 space-y-2.5">
                              {/* ID + Name + Phone */}
                              <div className={`grid grid-cols-[68px_1fr] gap-x-3 gap-y-2`}>
                                <span className={`text-[11px] font-semibold uppercase tracking-wide self-center ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Order ID</span>
                                <span className={`text-sm font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                                  {String(order._id || order.id || order.orderId || "").slice(-4).toUpperCase()}
                                </span>
                                <span className={`text-[11px] font-semibold uppercase tracking-wide self-center ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Name</span>
                                <span className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{order.customerName || "Guest"}</span>
                                <span className={`text-[11px] font-semibold uppercase tracking-wide self-center ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Phone</span>
                                <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{order.customerPhone || "—"}</span>
                              </div>

                              {/* Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                {/* Order type badge */}
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  isDarkMode
                                    ? orderTypeNormalized === "delivery" ? "bg-orange-500/15 text-orange-300"
                                      : orderTypeNormalized === "take away" || orderTypeNormalized === "takeaway" ? "bg-blue-500/15 text-blue-300"
                                      : "bg-green-500/15 text-green-300"
                                    : orderTypeNormalized === "delivery" ? "bg-orange-50 text-orange-700"
                                      : orderTypeNormalized === "take away" || orderTypeNormalized === "takeaway" ? "bg-blue-50 text-blue-700"
                                      : "bg-green-50 text-green-700"
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    orderTypeNormalized === "delivery" ? "bg-orange-400"
                                    : orderTypeNormalized === "take away" || orderTypeNormalized === "takeaway" ? "bg-blue-400"
                                    : "bg-green-400"
                                  }`} />
                                  {orderTypeLabel}
                                </span>

                                {/* Status badge */}
                                {order.status && (() => {
                                  const s = String(order.status).toLowerCase();
                                  const colorDark = s === "pending" ? "bg-amber-500/15 text-amber-300" : s === "preparing" ? "bg-teal-500/15 text-teal-300" : s === "ready" ? "bg-blue-500/15 text-blue-300" : s === "completed" ? "bg-green-500/15 text-green-300" : s === "cancelled" ? "bg-red-500/15 text-red-300" : "bg-slate-700 text-slate-300";
                                  const colorLight = s === "pending" ? "bg-amber-50 text-amber-700" : s === "preparing" ? "bg-teal-50 text-teal-700" : s === "ready" ? "bg-blue-50 text-blue-700" : s === "completed" ? "bg-green-50 text-green-700" : s === "cancelled" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600";
                                  const dot = s === "pending" ? "bg-amber-400" : s === "preparing" ? "bg-teal-400" : s === "ready" ? "bg-blue-400" : s === "completed" ? "bg-green-400" : s === "cancelled" ? "bg-red-400" : "bg-gray-400";
                                  return (
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${isDarkMode ? colorDark : colorLight}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                                      {order.status}
                                    </span>
                                  );
                                })()}

                                {/* Table badge */}
                                {order.tableId && (
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                                    Table {order.tableId}
                                  </span>
                                )}
                              </div>

                              {/* Address */}
                              {order.address && (
                                <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                                  📍 {order.address}
                                </p>
                              )}
                            </div>

                            {/* Divider */}
                            <div className={`h-px ${isDarkMode ? "bg-slate-700/80" : "bg-orange-50"}`} />

                            {/* Items */}
                            <div>
                              {order.items.map((item, index) => {
                                const isCompleted = item.status === "completed" || item.isReady === true || item.done === true;
                                return (
                                  <div
                                    key={index}
                                    className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
                                      index !== 0 ? isDarkMode ? "border-t border-slate-700/50" : "border-t border-orange-50" : ""
                                    } ${isCompleted ? isDarkMode ? "bg-green-900/10" : "bg-green-50/50" : ""}`}
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      {isCompleted && <span className="shrink-0 text-green-500 text-xs">✔</span>}
                                      <span className={`truncate ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                                        {item.name}
                                        {item.variant && <span className={`ml-1 text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>({item.variant})</span>}
                                        <span className={`ml-1 ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}>× {item.quantity}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {item.discountedPrice && item.price && Number(item.discountedPrice) < Number(item.price) && (
                                        <span className={`text-xs line-through ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                                          ₹{Number(item.price).toFixed(2)}
                                        </span>
                                      )}
                                      <span className={`font-semibold ${isCompleted ? "text-green-500" : isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                                        ₹{Number(item.discountedPrice || item.price || 0).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Divider */}
                            <div className={`h-px ${isDarkMode ? "bg-slate-700/80" : "bg-orange-50"}`} />

                            {/* Totals */}
                            <div className="px-4 py-3 space-y-1.5">
                              {order.gstAmount !== undefined && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>GST{order.gstRate ? ` (${order.gstRate}%)` : ""}</span>
                                  <span className={isDarkMode ? "text-slate-300" : "text-slate-600"}>₹{Number(order.gstAmount).toFixed(2)}</span>
                                </div>
                              )}
                              {orderTypeNormalized === "delivery" && typeof order.deliveryCharges === "number" && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Delivery</span>
                                  <span className={isDarkMode ? "text-slate-300" : "text-slate-600"}>₹{Number(order.deliveryCharges).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between pt-1">
                                <span className={`text-sm font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>Total</span>
                                <span className="text-base font-bold text-orange-500">₹{order.totalAmount?.toFixed(2) || "0.00"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Load More */}
                      {hasMore && allOrders.length >= 3 && (
                        <button
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={ordersLoading}
                          className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                            isDarkMode
                              ? "bg-slate-800 text-orange-400 hover:bg-slate-700 disabled:opacity-50"
                              : "bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-50"
                          }`}
                        >
                          {ordersLoading ? "Loading..." : "Load More"}
                        </button>
                      )}
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
          restaurantData={
            restaurantData?.restaurant
              ? restaurantData
              : { restaurant: restaurantData }
          }
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
