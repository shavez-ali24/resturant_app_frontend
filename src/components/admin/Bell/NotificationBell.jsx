import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import audio from "@/assets/orderRing.mp3";
import { useGetOrdersQuery } from "@/redux/adminRedux/adminAPI";
import { useNotification } from "./NotificationContext";

// Constants
const POLLING_INTERVAL = 60000;
const REFETCH_DEBOUNCE_MS = 300;
const MODIFIED_STALE_MS = 30000;
const MODIFIED_RECENT_MS = 15000;
const MAX_LATEST_ORDERS = 10;
const MAX_RECENT_ORDERS = 15;

const extractOrders = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.orders)) return response.orders;
  if (Array.isArray(response.data)) return response.data;
  return [];
};

const getTotalCount = (response, fallback = 0) => {
  return Number(
    response?.totalOrders ??
    response?.total ??
    response?.count ??
    fallback
  );
};

const getTime = (date) => {
  const time = Date.parse(date);
  return Number.isFinite(time) ? time : 0;
};

const checkAndClearAdminModifiedOrderId = (id) => {
  if (!id) return false;
  try {
    const data = JSON.parse(sessionStorage.getItem("adminModifiedOrderIds") || "{}");
    if (Array.isArray(data)) {
      const index = data.indexOf(String(id));
      if (index !== -1) {
        data.splice(index, 1);
        sessionStorage.setItem("adminModifiedOrderIds", JSON.stringify(data));
        return true;
      }
      return false;
    }
    const now = Date.now();
    let isFound = false;
    const pruned = {};
    Object.entries(data).forEach(([key, val]) => {
      if (now - Number(val) < MODIFIED_STALE_MS) {
        pruned[key] = val;
      }
    });
    const timestamp = data[String(id)];
    if (timestamp && now - Number(timestamp) < MODIFIED_RECENT_MS) {
      isFound = true;
    }
    sessionStorage.setItem("adminModifiedOrderIds", JSON.stringify(pruned));
    return isFound;
  } catch (_) { }
  return false;
};

// Styling badge helpers moved outside of component render
const getStatusBadgeStyle = (status, isDarkMode) => {
  const s = String(status || "").toLowerCase();
  if (s === "preparing") {
    return {
      backgroundColor: isDarkMode ? "rgba(20, 184, 166, 0.15)" : "#f0fdf4",
      borderColor: isDarkMode ? "rgba(20, 184, 166, 0.4)" : "rgba(34, 197, 94, 0.2)",
      color: isDarkMode ? "#2dd4bf" : "#166534",
      borderWidth: "1px"
    };
  }
  return {
    backgroundColor: isDarkMode ? "rgba(234, 179, 8, 0.15)" : "#fef9c3",
    borderColor: isDarkMode ? "rgba(234, 179, 8, 0.4)" : "rgba(234, 179, 8, 0.2)",
    color: isDarkMode ? "#facc15" : "#854d0e",
    borderWidth: "1px"
  };
};

const getTypeBadgeStyle = (type, colors, isDarkMode) => {
  const t = String(type || "").toLowerCase().replace(/\s+/g, "");
  if (t === "delivery") {
    return {
      backgroundColor: isDarkMode ? "rgba(239, 159, 39, 0.15)" : colors.primaryLight,
      borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}20`,
      color: isDarkMode ? colors.primary : colors.primaryText,
      borderWidth: "1px"
    };
  }
  if (t === "takeaway") {
    return {
      backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
      borderColor: isDarkMode ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.2)",
      color: isDarkMode ? "#60a5fa" : "#1e40af",
      borderWidth: "1px"
    };
  }
  return {
    backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5",
    borderColor: isDarkMode ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.2)",
    color: isDarkMode ? "#34d399" : "#065f46",
    borderWidth: "1px"
  };
};

export default function NotificationBell() {
  const dispatch = useDispatch();
  const bellRef = useRef(null);
  const [latestOrders, setLatestOrders] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const knownOrderIds = useRef(new Set());
  const dismissedOrderIds = useRef(new Set());
  const hasInitialized = useRef(false);
  const notificationSound = useMemo(() => new Audio(audio), []);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { notify, sseEvent, sseConnected } = useNotification();
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });

  const pollingInterval = sseConnected ? 0 : POLLING_INTERVAL;
  const refetchOnAction = !sseConnected;

  const { data: pendingResponse = {}, refetch: refetchPending, isSuccess: isPendingSuccess } = useGetOrdersQuery(
    { status: "pending", page: 1, limit: 20, range: "all" },
    { pollingInterval, refetchOnFocus: refetchOnAction, refetchOnReconnect: refetchOnAction }
  );
  const { data: preparingResponse = {}, refetch: refetchPreparing, isSuccess: isPreparingSuccess } = useGetOrdersQuery(
    { status: "preparing", page: 1, limit: 20, range: "all" },
    { pollingInterval, refetchOnFocus: refetchOnAction, refetchOnReconnect: refetchOnAction }
  );

  const pendingOrders = useMemo(() => extractOrders(pendingResponse), [pendingResponse]);
  const preparingOrders = useMemo(() => extractOrders(preparingResponse), [preparingResponse]);

  const orders = useMemo(() => {
    const combined = [...pendingOrders, ...preparingOrders];
    if (!combined.length) return [];
    const seen = new Set();
    return combined.filter((order) => {
      const id = order?._id || order?.id || order?.orderId;
      if (id) { if (seen.has(id)) return false; seen.add(id); }
      return true;
    });
  }, [pendingOrders, preparingOrders]);

  const pendingOrdersCount = useMemo(() => {
    return getTotalCount(pendingResponse, pendingOrders.length);
  }, [pendingResponse, pendingOrders]);

  // Debounced API invalidation scheduling to avoid race conditions
  const pendingRefetchTimeoutRef = useRef(null);
  const preparingRefetchTimeoutRef = useRef(null);

  const schedulePendingRefetch = useCallback(() => {
    if (pendingRefetchTimeoutRef.current) clearTimeout(pendingRefetchTimeoutRef.current);
    pendingRefetchTimeoutRef.current = setTimeout(() => {
      refetchPending();
    }, REFETCH_DEBOUNCE_MS);
  }, [refetchPending]);

  const schedulePreparingRefetch = useCallback(() => {
    if (preparingRefetchTimeoutRef.current) clearTimeout(preparingRefetchTimeoutRef.current);
    preparingRefetchTimeoutRef.current = setTimeout(() => {
      refetchPreparing();
    }, REFETCH_DEBOUNCE_MS);
  }, [refetchPreparing]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pendingRefetchTimeoutRef.current) clearTimeout(pendingRefetchTimeoutRef.current);
      if (preparingRefetchTimeoutRef.current) clearTimeout(preparingRefetchTimeoutRef.current);
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioEnabled) {
      try {
        notificationSound.currentTime = 0;
        const p = notificationSound.play();
        if (p?.catch) p.catch(() => { });
      } catch { /* ignore */ }
    }
  }, [audioEnabled, notificationSound]);

  // Invalidates queries target-wise according to SSE events
  const handleSSEEventRefetch = useCallback((type, data) => {
    const actualOrder = data?.order || data;
    const status = actualOrder?.status;
    const previousStatus = actualOrder?.previousStatus;

    if (type === "NEW_ORDER") {
      schedulePendingRefetch();
    } else if (type === "ORDER_STATUS_CHANGED") {
      schedulePendingRefetch();
      schedulePreparingRefetch();
    } else if (type === "ORDER_UPDATED") {
      if (status === "pending" || previousStatus === "pending") {
        schedulePendingRefetch();
      }
      if (status === "preparing" || previousStatus === "preparing") {
        schedulePreparingRefetch();
      }
    }
  }, [schedulePendingRefetch, schedulePreparingRefetch]);

  // Initial load succeeds when both query results are fetched
  const isInitialLoadComplete = isPendingSuccess && isPreparingSuccess;

  useEffect(() => {
    if (!isInitialLoadComplete) return;

    const sorted = [...orders].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
    const recent = sorted.slice(0, MAX_RECENT_ORDERS);

    // First load — mark all existing orders as known so they don't fire notifications
    if (!hasInitialized.current) {
      recent.forEach((o) => { if (o._id) knownOrderIds.current.add(o._id); });
      hasInitialized.current = true;
      const visibleOrders = recent.filter((o) => o._id && !dismissedOrderIds.current.has(o._id));
      setLatestOrders(visibleOrders.slice(0, MAX_LATEST_ORDERS));
      return;
    }

    const fresh = recent.filter((o) => o._id && o.status === "pending" && !knownOrderIds.current.has(o._id));

    if (fresh.length > 0) {
      fresh.forEach((o) => { if (o._id) knownOrderIds.current.add(o._id); });
      playNotificationSound();
      notify(`${fresh.length} new order${fresh.length > 1 ? "s" : ""} received`, "info");
    }

    const visibleOrders = recent.filter((o) => o._id && !dismissedOrderIds.current.has(o._id));
    setLatestOrders(visibleOrders.slice(0, MAX_LATEST_ORDERS));

    const currentIds = new Set(recent.map((o) => o._id).filter(Boolean));
    knownOrderIds.current = new Set([...knownOrderIds.current].filter((id) => currentIds.has(id)));
  }, [orders, isInitialLoadComplete, playNotificationSound, notify]);

  // Handle incoming SSE events
  useEffect(() => {
    if (!sseEvent?.type || !sseEvent?.data) return;

    if (sseEvent.type === "OCCUPANCY_CHANGED") {
      const payload = sseEvent.data;
      const action = payload?.action;
      const unitName = payload?.unitName;
      const sectionName = payload?.sectionName;

      let message = "";
      if (action === "ROOM_VACATED") {
        message = `Room ${unitName} (${sectionName}) has been vacated.`;
      } else if (action === "TABLE_VACATED") {
        message = `Table ${unitName} (${sectionName}) has been vacated.`;
      } else if (action === "ROOM_CANCELLED") {
        message = `Booking for Room ${unitName} (${sectionName}) has been cancelled.`;
      } else if (action === "ROOM_OCCUPIED") {
        message = `Room ${unitName} (${sectionName}) is now occupied.`;
      } else if (action === "TABLE_OCCUPIED") {
        message = `Table ${unitName} (${sectionName}) is now occupied.`;
      }

      if (message) {
        notify(message, "info");
        playNotificationSound();
      }
      return;
    }

    const actualOrder = sseEvent.data?.order || sseEvent.data;
    const orderId = actualOrder?._id || actualOrder?.id || actualOrder?.orderId;
    const isAdminAction = checkAndClearAdminModifiedOrderId(orderId);

    const isNewOrder = sseEvent.type === "NEW_ORDER";
    const isPendingUpdate = sseEvent.type === "ORDER_UPDATED" && actualOrder?.status === "pending";

    if ((isNewOrder || isPendingUpdate) && !isAdminAction) {
      playNotificationSound();
    }

    if (["NEW_ORDER", "ORDER_UPDATED", "ORDER_STATUS_CHANGED"].includes(sseEvent.type)) {
      handleSSEEventRefetch(sseEvent.type, sseEvent.data);
    }
  }, [sseEvent, handleSSEEventRefetch, playNotificationSound, notify]);

  // Click outside to close dropdown
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard Escape key handler to close dropdown
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Pre-unlock audio so browser allows autoplay
  useEffect(() => {
    if (typeof window === "undefined") return;
    const enable = () => {
      setAudioEnabled(true);
      if (notificationSound) {
        notificationSound.volume = 0;
        notificationSound.play().then(() => {
          notificationSound.pause();
          notificationSound.currentTime = 0;
          notificationSound.volume = 1;
        }).catch(() => { });
      }
    };
    window.addEventListener("click", enable, { once: true });
    window.addEventListener("keydown", enable, { once: true });
    window.addEventListener("touchstart", enable, { once: true });
    return () => {
      window.removeEventListener("click", enable);
      window.removeEventListener("keydown", enable);
      window.removeEventListener("touchstart", enable);
    };
  }, [notificationSound]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      notificationSound.pause();
      notificationSound.currentTime = 0;
    };
  }, [notificationSound]);

  // Optimized dark mode observer
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => {
      const next = root.classList.contains("admin-dark") || root.classList.contains("dark");
      setIsDarkMode((prev) => (prev === next ? prev : next));
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const handleViewBill = (order) => {
    setIsDropdownOpen(false);
    dispatch(showBill(order));
  };

  const handleClearAll = () => {
    latestOrders.forEach((o) => {
      if (o._id) dismissedOrderIds.current.add(o._id);
    });
    setLatestOrders([]);
    setIsDropdownOpen(false);
  };

  const handleManualRefresh = () => {
    dismissedOrderIds.current.clear();
    const sorted = [...orders].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
    const recent = sorted.slice(0, MAX_RECENT_ORDERS);
    const visibleOrders = recent.filter((o) => o._id && !dismissedOrderIds.current.has(o._id));
    setLatestOrders(visibleOrders.slice(0, MAX_LATEST_ORDERS));

    refetchPending();
    refetchPreparing();
  };

  const displayCount = pendingOrdersCount > 99 ? "99+" : String(pendingOrdersCount);

  // Dynamic Theme Tokens
  const colors = useSelector((state) => state.admin.theme.colors);
  const bg = isDarkMode ? (colors.dark?.cardBg || "#0f172a") : "#ffffff";
  const border = isDarkMode ? (colors.dark?.border || "border-slate-700/60") : (colors.border || "border-[#ede8e3]");
  const textPri = isDarkMode ? (colors.dark?.textPrimary || "#f1f5f9") : (colors.textPrimary || "#1c1917");
  const textSec = isDarkMode ? (colors.dark?.textSecondary || "#94a3b8") : (colors.textSecondary || "#57524e");
  const textMut = isDarkMode ? "#64748b" : (colors.textMuted || "#4b5563");
  const footerBg = isDarkMode ? "rgba(15, 23, 42, 0.4)" : (colors.pageBg || "#faf7f4");

  // Reusable hover values based on CSS variables instead of dynamic inline JS event listeners
  const viewBillBtnStyle = {
    "--hover-border": colors.primary,
    "--hover-bg": isDarkMode ? `${colors.primary}1a` : colors.primaryLight,
    "--hover-text": colors.primaryText,
    backgroundColor: isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff",
    borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
    color: isDarkMode ? colors.primary : colors.primaryText,
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setIsDropdownOpen((p) => !p)}
        className="relative flex h-9 w-9 items-center justify-center transition-colors duration-200 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 focus:outline-none"
        title="Order Notifications"
        aria-label="Order notifications"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <Bell size={20} className="stroke-[1.5]" />
        {pendingOrdersCount > 0 && (
          <motion.span
            key={pendingOrdersCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="pointer-events-none absolute right-0.5 top-0.5 z-20 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white dark:ring-slate-950"
          >
            {displayCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border shadow-2xl md:w-96"
            style={{
              backgroundColor: bg,
              borderColor: border,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{
                backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "#ffffff",
                borderBottomColor: border,
              }}
            >
              <div>
                <h4 className="text-sm font-black tracking-tight" style={{ color: textPri }}>New Orders</h4>
                <p className="text-[10px] font-bold" style={{ color: textMut }}>Real-time notifications</p>
              </div>
              {pendingOrdersCount > 0 && (
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-black"
                  style={{
                    backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                    borderColor: isDarkMode ? `${colors.primary}40` : `${colors.primary}33`,
                    color: isDarkMode ? colors.primary : colors.primaryText,
                  }}
                >
                  {displayCount} pending
                </span>
              )}
            </div>

            {/* Orders list */}
            <div
              className="max-h-[420px] overflow-y-auto animate-none"
              style={{ backgroundColor: bg }}
            >
              {latestOrders.length > 0 ? (
                <div
                  className="divide-y"
                  style={{ borderColor: border }}
                >
                  {latestOrders.map((order, index) => (
                    <motion.div
                      key={order._id || index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[var(--hover-bg)]"
                      style={{
                        "--hover-bg": isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(239,159,39,0.02)",
                        borderBottomColor: border,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Status + Type badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span
                            className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border"
                            style={getStatusBadgeStyle(order.status, isDarkMode)}
                          >
                            {String(order.status || "").toLowerCase() === "preparing" ? "Preparing" : "Pending"}
                          </span>
                          <span
                            className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border"
                            style={getTypeBadgeStyle(order.orderType, colors, isDarkMode)}
                          >
                            {order.orderType || "Unknown"}
                          </span>
                        </div>
                        {/* Customer info */}
                        <p className="text-sm font-extrabold" style={{ color: textPri }}>{order.customerName || "Guest"}</p>
                        <p className="text-xs font-semibold" style={{ color: textSec }}>{order.customerPhone || "—"}</p>
                        <p className="text-[10px] font-bold mt-0.5" style={{ color: textMut }}>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
                            : "Just now"}
                        </p>
                      </div>

                      {/* View Bill button */}
                      <button
                        onClick={() => handleViewBill(order)}
                        className="shrink-0 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition-all duration-150 active:scale-[0.97] hover:border-[var(--hover-border)] hover:bg-[var(--hover-bg)] hover:text-[var(--hover-text)]"
                        style={viewBillBtnStyle}
                      >
                        View Bill
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : colors.primaryLight }}
                  >
                    <Bell size={20} style={{ color: colors.primary }} />
                  </div>
                  <p className="text-sm font-black" style={{ color: textPri }}>No new orders</p>
                  <p className="mt-1 text-xs font-medium" style={{ color: textMut }}>New pending orders will appear here</p>
                  <button
                    onClick={handleManualRefresh}
                    className="mt-4 rounded-xl border px-4 py-1.5 text-xs font-extrabold transition-all duration-150 active:scale-[0.97] shadow-sm hover:border-[var(--hover-border)] hover:bg-[var(--hover-bg)] hover:text-[var(--hover-text)]"
                    style={viewBillBtnStyle}
                  >
                    Check for orders
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between border-t px-4 py-2.5"
              style={{
                backgroundColor: footerBg,
                borderTopColor: border,
              }}
            >
              <button
                onClick={handleClearAll}
                disabled={latestOrders.length === 0}
                className="text-xs font-black transition-colors hover:text-[var(--hover-text)]"
                style={{
                  "--hover-text": colors.primaryHover,
                  color: latestOrders.length > 0 ? colors.primary : textMut,
                  cursor: latestOrders.length > 0 ? "pointer" : "not-allowed",
                }}
              >
                Clear all
              </button>
              <span className="text-xs font-bold" style={{ color: textMut }}>
                {latestOrders.length} order{latestOrders.length !== 1 ? "s" : ""}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
