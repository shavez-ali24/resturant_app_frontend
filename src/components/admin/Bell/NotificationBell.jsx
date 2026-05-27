import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
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
  const { sseEvent, sseConnected } = useNotification();
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
    if (sseEvent?.type === "NEW_ORDER") {
      // Bell directly on SSE event — same as KDS
      try {
        notificationSound.currentTime = 0;
        const p = notificationSound.play();
        if (p?.catch) p.catch(() => {});
      } catch { /* ignore */ }
    }
    if (["NEW_ORDER", "ORDER_STATUS_CHANGED"].includes(sseEvent?.type)) {
      refetchPending(); refetchPreparing();
    }
  }, [sseEvent, refetchPending, refetchPreparing, notificationSound]);

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
        }).catch(() => {});
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

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const bg       = isDarkMode ? "bg-[#0f172a]"  : "bg-white";
  const border   = isDarkMode ? "border-slate-700/60" : "border-[#ede8e3]";
  const divider  = isDarkMode ? "divide-slate-700/60" : "divide-[#f0ebe5]";
  const rowHover = isDarkMode ? "hover:bg-slate-800/60" : "hover:bg-[#faf7f4]";
  const textPri  = isDarkMode ? "text-slate-100"  : "text-[#1c1917]";
  const textSec  = isDarkMode ? "text-slate-400"  : "text-[#78716c]";
  const textMut  = isDarkMode ? "text-slate-500"  : "text-[#a8a29e]";
  const footerBg = isDarkMode ? "bg-[#0f172a]"   : "bg-[#faf7f4]";

  const statusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "preparing") return isDarkMode ? "bg-teal-500/15 text-teal-300" : "bg-teal-50 text-teal-700";
    return isDarkMode ? "bg-yellow-500/15 text-yellow-300" : "bg-yellow-50 text-yellow-700";
  };

  const typeBadge = (type) => {
    const t = String(type || "").toLowerCase().replace(/\s+/g, "");
    if (t === "delivery")  return isDarkMode ? "bg-orange-500/15 text-orange-300" : "bg-orange-50 text-orange-700";
    if (t === "takeaway")  return isDarkMode ? "bg-blue-500/15 text-blue-300"     : "bg-blue-50 text-blue-700";
    if (t === "eathere")   return isDarkMode ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700";
    return isDarkMode ? "bg-slate-700 text-slate-300" : "bg-[#f7f3ef] text-[#78716c]";
  };

  return (
    <div className="relative" ref={bellRef}>
      {/* ── Bell button ── */}
      <button
        onClick={() => setIsDropdownOpen((p) => !p)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors duration-200 ${
          isDarkMode
            ? "border-slate-700/50 bg-slate-900/50 text-orange-300 hover:bg-slate-800"
            : "border-orange-500/40 bg-white text-orange-500 hover:bg-orange-50"
        }`}
        title="Order Notifications"
      >
        <Bell size={17} />
        {pendingOrdersCount > 0 && (
          <MotionSpan
            key={pendingOrdersCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="pointer-events-none absolute -right-1.5 -top-1.5 z-20 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white dark:ring-slate-950"
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
            className={`absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border shadow-xl md:w-96 ${bg} ${border}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between border-b px-4 py-3 ${border} ${isDarkMode ? "bg-[#1e293b]" : "bg-[#f7f3ef]"}`}>
              <div>
                <h4 className={`text-sm font-bold ${textPri}`}>New Orders</h4>
                <p className={`text-xs ${textMut}`}>Real-time notifications</p>
              </div>
              {pendingOrdersCount > 0 && (
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${
                  isDarkMode
                    ? "bg-orange-950/20 border-orange-500/35 text-orange-400"
                    : "bg-orange-50 border-orange-200 text-orange-700"
                }`}>
                  {displayCount} pending
                </span>
              )}
            </div>

            {/* Orders list */}
            <div className={`max-h-[420px] overflow-y-auto ${bg}`}>
              {latestOrders.length > 0 ? (
                <div className={`divide-y ${divider}`}>
                  {latestOrders.map((order, index) => (
                    <MotionDiv
                      key={order._id || index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className={`flex items-start justify-between gap-3 px-4 py-3 transition-colors ${rowHover}`}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Status + Type badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(order.status)}`}>
                            {String(order.status || "").toLowerCase() === "preparing" ? "Preparing" : "Pending"}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeBadge(order.orderType)}`}>
                            {order.orderType || "Unknown"}
                          </span>
                        </div>
                        {/* Customer info */}
                        <p className={`text-sm font-semibold ${textPri}`}>{order.customerName || "Guest"}</p>
                        <p className={`text-xs ${textSec}`}>{order.customerPhone || "—"}</p>
                        <p className={`text-xs ${textMut}`}>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
                            : "Just now"}
                        </p>
                      </div>

                      {/* View Bill button */}
                      <button
                        onClick={() => handleViewBill(order)}
                        className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isDarkMode
                            ? "border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700"
                            : "border-[#ede8e3] bg-white text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                        }`}
                      >
                        View Bill
                      </button>
                    </MotionDiv>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${isDarkMode ? "bg-slate-800" : "bg-[#f7f3ef]"}`}>
                    <Bell size={20} className={textMut} />
                  </div>
                  <p className={`text-sm font-semibold ${textPri}`}>No new orders</p>
                  <p className={`mt-1 text-xs ${textMut}`}>New pending orders will appear here</p>
                  <button
                    onClick={handleManualRefresh}
                    className={`mt-4 rounded-lg border px-4 py-1.5 text-xs font-semibold transition-colors ${
                      isDarkMode
                        ? "border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700"
                        : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"
                    }`}
                  >
                    Check for orders
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between border-t px-4 py-2.5 ${border} ${footerBg}`}>
              <button
                onClick={handleClearAll}
                disabled={latestOrders.length === 0}
                className={`text-xs font-semibold transition-colors ${
                  latestOrders.length > 0
                    ? "text-orange-500 hover:text-orange-600"
                    : `${textMut} cursor-not-allowed`
                }`}
              >
                Clear all
              </button>
              <span className={`text-xs ${textMut}`}>
                {latestOrders.length} order{latestOrders.length !== 1 ? "s" : ""}
              </span>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
