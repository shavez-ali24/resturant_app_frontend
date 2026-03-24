import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import audio from "@/assets/orderRing.mp3";
import { useGetOrdersQuery } from "@/redux/adminRedux/adminAPI";

const POLLING_INTERVAL = 60000; // 60 seconds for notifications

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
  const notificationSound = useMemo(() => new Audio(audio), []);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });

  // ✅ RTK Query with polling for PENDING orders only
  const { data: pendingResponse = {}, refetch: refetchPending } = useGetOrdersQuery({
    status: "pending",
    page: 1,
    limit: 20, // Get more orders for notifications
    range: "all"
  }, {
    pollingInterval: POLLING_INTERVAL,
  });
  const { data: preparingResponse = {}, refetch: refetchPreparing } = useGetOrdersQuery({
    status: "preparing",
    page: 1,
    limit: 20,
    range: "all"
  }, {
    pollingInterval: POLLING_INTERVAL,
  });

  
  const pendingOrders = useMemo(
    () => extractOrders(pendingResponse),
    [pendingResponse]
  );
  const preparingOrders = useMemo(
    () => extractOrders(preparingResponse),
    [preparingResponse]
  );

  const orders = useMemo(() => {
    const combined = [...pendingOrders, ...preparingOrders];
    if (!combined.length) return [];
    const seen = new Set();
    const deduped = [];
    combined.forEach((order) => {
      const id = order?._id || order?.id || order?.orderId;
      if (id) {
        if (seen.has(id)) return;
        seen.add(id);
      }
      deduped.push(order);
    });
    return deduped;
  }, [pendingOrders, preparingOrders]);

  const pendingOrdersCount = useMemo(() => {
    if (typeof pendingResponse?.totalOrders === "number") {
      return pendingResponse.totalOrders;
    }
    return pendingOrders.length;
  }, [pendingResponse, pendingOrders]);

  useEffect(() => {
    if (!orders.length) return;

    const sortedOrders = [...orders].sort(
      (a, b) => new Date(b.createdAt || b.createdAt) - new Date(a.createdAt || a.createdAt)
    );

  
    const recentOrders = sortedOrders.slice(0, 15);

    
    const freshOrders = recentOrders.filter((order) => {
      if (!order._id || order.status !== "pending") return false;
      
      const isNew = !knownOrderIds.current.has(order._id);
      return isNew;
    });


    if (freshOrders.length > 0) {
      if (audioEnabled) {
        try {
          notificationSound.currentTime = 0;
          const playPromise = notificationSound.play();
          if (playPromise?.catch) {
            playPromise.catch(() => {});
          }
        } catch (err) {
          // Intentionally ignore autoplay errors.
        }
      }

      // Mark these orders as known
      freshOrders.forEach((order) => {
        if (order._id) knownOrderIds.current.add(order._id);
      });
    }

    // Keep dropdown aligned with latest pending orders.
    setLatestOrders(recentOrders.slice(0, 10));

    const currentIds = new Set(recentOrders.map(o => o._id).filter(Boolean));
    knownOrderIds.current = new Set(
      [...knownOrderIds.current].filter(id => currentIds.has(id))
    );

  }, [orders, notificationSound, audioEnabled]);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const enableAudio = () => setAudioEnabled(true);
    window.addEventListener("click", enableAudio, { once: true });
    window.addEventListener("keydown", enableAudio, { once: true });
    window.addEventListener("touchstart", enableAudio, { once: true });
    return () => {
      window.removeEventListener("click", enableAudio);
      window.removeEventListener("keydown", enableAudio);
      window.removeEventListener("touchstart", enableAudio);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;
    const updateMode = () =>
      setIsDarkMode(
        root.classList.contains("admin-dark") || root.classList.contains("dark")
      );

    updateMode();
    const observer = new MutationObserver(updateMode);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleBellClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleViewBill = (order) => {
   
    dispatch(showBill(order));
    setIsDropdownOpen(false);
  };

  const handleClearAll = () => {
    setLatestOrders([]);
    knownOrderIds.current.clear();
    setIsDropdownOpen(false);
  };

  const handleManualRefresh = () => {
    refetchPending();
    refetchPreparing();
  };

  const displayNotificationCount =
    pendingOrdersCount > 99 ? "99+" : String(pendingOrdersCount);

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={handleBellClick}
        className={`relative overflow-visible rounded-full p-2 transition-colors duration-200 ${
          isDarkMode
            ? "border border-slate-700 bg-slate-900 text-orange-300 hover:bg-slate-800 hover:text-orange-200"
            : "bg-orange-50 text-orange-600 hover:bg-orange-50 hover:text-orange-600"
        }`}
        title="Order Notifications"
      >
        <Bell size={26} className="relative z-0" />
        
        {/* Notification counter badge */}
        {pendingOrdersCount > 0 && (
          <MotionSpan
            key={pendingOrdersCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`pointer-events-none absolute -right-1.5 -top-1.5 z-20 inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-[11px] font-black leading-none shadow-md ring-2 ${
              isDarkMode
                ? "bg-slate-100 text-orange-600 ring-slate-950"
                : "bg-red-700 text-white ring-white"
            }`}
          >
            {displayNotificationCount}
          </MotionSpan>
        )}
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <MotionDiv
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] md:w-96 ${
              isDarkMode
                ? "border-slate-700 bg-slate-950 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.95)]"
                : "border-orange-100 bg-white"
            }`}
          >
            {/* Header */}
            <div
              className={`border-b p-4 ${
                isDarkMode
                  ? "border-slate-700 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800"
                  : "border-orange-100 bg-gradient-to-r from-orange-400 to-orange-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4
                    className={`text-lg font-bold ${
                      isDarkMode ? "text-slate-100" : "text-white"
                    }`}
                  >
                    New Orders
                  </h4>
                  <p
                    className={`mt-1 text-sm ${
                      isDarkMode ? "text-slate-300" : "text-orange-50"
                    }`}
                  >
                    Real-time notifications
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {pendingOrdersCount > 0 && (
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-bold ${
                        isDarkMode
                          ? "border-orange-500/40 bg-orange-500/15 text-orange-200"
                          : "border-orange-200 bg-white text-orange-700"
                      }`}
                    >
                      {displayNotificationCount} pending
                    </span>
                  )}
                  {/* <button
                    onClick={handleManualRefresh}
                    className="text-white hover:text-orange-200 p-1"
                    title="Refresh"
                  >
                    ↻
                  </button> */}
                </div>
              </div>
            </div>

            {/* Orders list */}
            <div
              className={`max-h-96 overflow-y-auto ${
                isDarkMode ? "bg-slate-950" : "bg-white"
              }`}
            >
              {latestOrders.length > 0 ? (
                <div
                  className={`divide-y ${
                    isDarkMode ? "divide-slate-700" : "divide-orange-100"
                  }`}
                >
                  {latestOrders.map((order, index) => (
                    <MotionDiv
                      key={order._id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 transition-colors duration-150 ${
                        isDarkMode ? "hover:bg-slate-900" : "hover:bg-orange-50/70"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                String(order.status || "").toLowerCase() === "preparing"
                                  ? isDarkMode
                                    ? "bg-teal-500/20 text-teal-200"
                                    : "bg-teal-100 text-teal-800"
                                  : isDarkMode
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {String(order.status || "").toLowerCase() === "preparing"
                                ? "Preparing"
                                : "Pending"}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                (() => {
                                  const raw = String(order.orderType || "").trim().toLowerCase();
                                  const compact = raw.replace(/\s+/g, "");
                                  if (raw === "delivery") {
                                    return isDarkMode
                                      ? "bg-orange-500/15 text-orange-200"
                                      : "bg-orange-100 text-orange-700";
                                  }
                                  if (compact === "takeaway") {
                                    return isDarkMode
                                      ? "bg-blue-500/15 text-blue-200"
                                      : "bg-blue-100 text-blue-700";
                                  }
                                  if (compact === "eathere") {
                                    return isDarkMode
                                      ? "bg-emerald-500/15 text-emerald-200"
                                      : "bg-emerald-100 text-emerald-700";
                                  }
                                  return isDarkMode
                                    ? "bg-slate-700/70 text-slate-200"
                                    : "bg-slate-100 text-slate-700";
                                })()
                              }`}
                            >
                              {order.orderType || "Unknown"}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <p
                              className={`font-medium ${
                                isDarkMode ? "text-slate-100" : "text-gray-900"
                              }`}
                            >
                              {order.customerName || "Guest"}
                            </p>
                            <p
                              className={`text-sm ${
                                isDarkMode ? "text-slate-300" : "text-gray-600"
                              }`}
                            >
                              {order.customerPhone || "No phone"}
                            </p>
                            <p
                              className={`text-xs ${
                                isDarkMode ? "text-slate-400" : "text-gray-600"
                              }`}
                            >
                              {order.createdAt ? (
                                new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: true
                                })
                              ) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleViewBill(order)}
                          className={`ml-3 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
                            isDarkMode
                              ? "border-orange-500/40 bg-orange-500/20 text-orange-200 hover:bg-orange-500/30"
                              : "border-orange-200 bg-orange-100 text-orange-700 hover:bg-orange-200"
                          }`}
                        >
                          View Bill
                        </button>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div
                    className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                      isDarkMode ? "bg-slate-800" : "bg-orange-100"
                    }`}
                  >
                    <Bell
                      size={24}
                      className={isDarkMode ? "text-orange-300" : "text-orange-500"}
                    />
                  </div>
                  <h3
                    className={`mb-2 font-semibold ${
                      isDarkMode ? "text-slate-100" : "text-gray-800"
                    }`}
                  >
                    No new orders
                  </h3>
                  <p
                    className={`mb-4 text-sm ${
                      isDarkMode ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    New pending orders will appear here
                  </p>
                  <button
                    onClick={handleManualRefresh}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      isDarkMode
                        ? "border-orange-500/40 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20"
                        : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    }`}
                  >
                    Check for orders
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={`border-t ${
                isDarkMode ? "border-slate-700 bg-slate-950" : "border-orange-100 bg-white"
              }`}
            >
              <div className="flex items-center justify-between p-3">
                <button
                  onClick={handleClearAll}
                  disabled={latestOrders.length === 0}
                  className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                    latestOrders.length > 0 
                      ? isDarkMode
                        ? "font-semibold text-orange-200 hover:bg-orange-500/20 hover:text-orange-100"
                        : "font-semibold text-orange-700 hover:bg-orange-200 hover:text-orange-900"
                      : isDarkMode
                        ? "cursor-not-allowed text-slate-500"
                        : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Clear all
                </button>
                
                <div
                  className={`text-xs font-medium ${
                    isDarkMode ? "text-slate-300" : "text-gray-600"
                  }`}
                >
                  {latestOrders.length} order{latestOrders.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
