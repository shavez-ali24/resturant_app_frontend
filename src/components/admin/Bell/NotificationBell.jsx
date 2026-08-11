import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import audio from "@/assets/orderRing.mp3";
import { useGetOrdersQuery } from "@/redux/adminRedux/adminAPI";
import { useNotification } from "./NotificationContext";

const POLLING_INTERVAL = 60000;

const extractOrders = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.orders)) return response.orders;
  if (Array.isArray(response.data)) return response.data;
  return [];
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
      if (now - Number(val) < 30000) {
        pruned[key] = val;
      }
    });
    const timestamp = data[String(id)];
    if (timestamp && now - Number(timestamp) < 15000) {
      isFound = true;
    }
    sessionStorage.setItem("adminModifiedOrderIds", JSON.stringify(pruned));
    return isFound;
  } catch (_) { }
  return false;
};

export default function NotificationBell() {
  const MotionDiv = motion.div;
  const MotionSpan = motion.span;
  const dispatch = useDispatch();
  const bellRef = useRef(null);
  const [latestOrders, setLatestOrders] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const knownOrderIds = useRef(new Set());
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

  const { data: pendingResponse = {}, refetch: refetchPending } = useGetOrdersQuery(
    { status: "pending", page: 1, limit: 20, range: "all" },
    { pollingInterval, refetchOnFocus: refetchOnAction, refetchOnReconnect: refetchOnAction }
  );
  const { data: preparingResponse = {}, refetch: refetchPreparing } = useGetOrdersQuery(
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
    if (typeof pendingResponse?.totalOrders === "number") return pendingResponse.totalOrders;
    return pendingOrders.length;
  }, [pendingResponse, pendingOrders]);

  useEffect(() => {
    if (!orders.length) return;
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recent = sorted.slice(0, 15);

    // First load — just mark all as known, don't play sound
    if (!hasInitialized.current) {
      recent.forEach((o) => { if (o._id) knownOrderIds.current.add(o._id); });
      hasInitialized.current = true;
      setLatestOrders(recent.slice(0, 10));
      return;
    }

    const fresh = recent.filter((o) => o._id && o.status === "pending" && !knownOrderIds.current.has(o._id));

    if (fresh.length > 0) {
      fresh.forEach((o) => { if (o._id) knownOrderIds.current.add(o._id); });
    }

    setLatestOrders(recent.slice(0, 10));
    const currentIds = new Set(recent.map((o) => o._id).filter(Boolean));
    knownOrderIds.current = new Set([...knownOrderIds.current].filter((id) => currentIds.has(id)));
  }, [orders]);

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
        try {
          notificationSound.currentTime = 0;
          const p = notificationSound.play();
          if (p?.catch) p.catch(() => { });
        } catch { /* ignore */ }
      }
      return;
    }

    const actualOrder = sseEvent.data?.order || sseEvent.data;
    const orderId = actualOrder?._id || actualOrder?.id || actualOrder?.orderId;
    const isAdminAction = checkAndClearAdminModifiedOrderId(orderId);

    if (["NEW_ORDER", "ORDER_UPDATED"].includes(sseEvent.type)) {
      if (!isAdminAction) {
        try {
          notificationSound.currentTime = 0;
          const p = notificationSound.play();
          if (p?.catch) p.catch(() => { });
        } catch { /* ignore */ }
      }
    }

    if (["NEW_ORDER", "ORDER_UPDATED", "ORDER_STATUS_CHANGED"].includes(sseEvent.type)) {
      refetchPending();
      refetchPreparing();
    }
  }, [sseEvent, refetchPending, refetchPreparing, notificationSound, notify]);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const enable = () => {
      setAudioEnabled(true);
      // Pre-unlock audio so autoplay works on next SSE event
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

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => setIsDarkMode(root.classList.contains("admin-dark") || root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const handleViewBill = (order) => {
    setIsDropdownOpen(false);
    dispatch(showBill(order));
  };
  const handleClearAll = () => { setLatestOrders([]); knownOrderIds.current.clear(); setIsDropdownOpen(false); };
  const handleManualRefresh = () => { refetchPending(); refetchPreparing(); };

  const displayCount = pendingOrdersCount > 99 ? "99+" : String(pendingOrdersCount);

  // ── Dynamic Theme Tokens from Redux ──────────────────────────────────────────
  const colors = useSelector((state) => state.admin.theme.colors);
  const bg = isDarkMode ? (colors.dark?.cardBg || "#0f172a") : "#ffffff";
  const border = isDarkMode ? (colors.dark?.border || "border-slate-700/60") : (colors.border || "border-[#ede8e3]");
  const textPri = isDarkMode ? (colors.dark?.textPrimary || "#f1f5f9") : (colors.textPrimary || "#1c1917");
  const textSec = isDarkMode ? (colors.dark?.textSecondary || "#94a3b8") : (colors.textSecondary || "#57524e");
  const textMut = isDarkMode ? "#64748b" : (colors.textMuted || "#87807b");
  const footerBg = isDarkMode ? "rgba(15, 23, 42, 0.4)" : (colors.pageBg || "#faf7f4");

  const statusBadge = (status) => {
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

  const typeBadge = (type) => {
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
    // Eat Here / Dine In
    return {
      backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5",
      borderColor: isDarkMode ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.2)",
      color: isDarkMode ? "#34d399" : "#065f46",
      borderWidth: "1px"
    };
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setIsDropdownOpen((p) => !p)}
        className="relative flex h-9 w-9 items-center justify-center transition-colors duration-200 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 focus:outline-none"
        title="Order Notifications"
      >
        <Bell size={20} className="stroke-[1.5]" />
        {pendingOrdersCount > 0 && (
          <MotionSpan
            key={pendingOrdersCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="pointer-events-none absolute right-0.5 top-0.5 z-20 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white dark:ring-slate-950"
          >
            {displayCount}
          </MotionSpan>
        )}
      </button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {isDropdownOpen && (
          <MotionDiv
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
              className="max-h-[420px] overflow-y-auto"
              style={{ backgroundColor: bg }}
            >
              {latestOrders.length > 0 ? (
                <div
                  className="divide-y"
                  style={{ borderColor: border }}
                >
                  {latestOrders.map((order, index) => (
                    <MotionDiv
                      key={order._id || index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-150"
                      style={{ borderBottomColor: border }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(239,159,39,0.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Status + Type badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span
                            className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border"
                            style={statusBadge(order.status)}
                          >
                            {String(order.status || "").toLowerCase() === "preparing" ? "Preparing" : "Pending"}
                          </span>
                          <span
                            className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border"
                            style={typeBadge(order.orderType)}
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
                        className="shrink-0 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition-all duration-150 active:scale-[0.97]"
                        style={{
                          backgroundColor: isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff",
                          borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                          color: isDarkMode ? colors.primary : colors.primaryText,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = colors.primary;
                          e.currentTarget.style.color = colors.primaryText;
                          e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}1a` : colors.primaryLight;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isDarkMode ? `${colors.primary}50` : `${colors.primary}33`;
                          e.currentTarget.style.color = isDarkMode ? colors.primary : colors.primaryText;
                          e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff";
                        }}
                      >
                        View Bill
                      </button>
                    </MotionDiv>
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
                    className="mt-4 rounded-xl border px-4 py-1.5 text-xs font-extrabold transition-all duration-150 active:scale-[0.97] shadow-sm"
                    style={{
                      backgroundColor: isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff",
                      borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                      color: isDarkMode ? colors.primary : colors.primaryText,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.color = colors.primaryText;
                      e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}1a` : colors.primaryLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isDarkMode ? `${colors.primary}50` : `${colors.primary}33`;
                      e.currentTarget.style.color = isDarkMode ? colors.primary : colors.primaryText;
                      e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff";
                    }}
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
                className="text-xs font-black transition-colors"
                style={{
                  color: latestOrders.length > 0 ? colors.primary : textMut,
                  cursor: latestOrders.length > 0 ? "pointer" : "not-allowed",
                }}
                onMouseEnter={(e) => {
                  if (latestOrders.length > 0) e.currentTarget.style.color = colors.primaryHover;
                }}
                onMouseLeave={(e) => {
                  if (latestOrders.length > 0) e.currentTarget.style.color = colors.primary;
                }}
              >
                Clear all
              </button>
              <span className="text-xs font-bold" style={{ color: textMut }}>
                {latestOrders.length} order{latestOrders.length !== 1 ? "s" : ""}
              </span>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
