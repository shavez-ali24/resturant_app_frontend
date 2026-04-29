import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import audio from "@/assets/orderRing.mp3";
import { useNotification } from "../../Bell/NotificationContext";
import { useGetOrdersQuery, useUpdateOrderMutation } from "../../../../redux/adminRedux/adminAPI";
import {
  Activity,
  ChefHat,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CheckCircle2,
  Inbox,
  Clock,
  Moon,
  Sun
} from "lucide-react";
import KitchenDisplayCard from "./KitchenDisplayCard";
import ReadyOrdersView from "./ReadyOrdersView";
import {
  clearOrderPreparingStartedAt,
  getOrderPreparingStartedAt,
  rememberOrderPreparingStartedAt,
} from "../commonOrderFile/utils";

const POLLING_INTERVAL = 60000;
const NEW_ORDER_HIGHLIGHT_MS = 12000;

const getOrders = (response) => (Array.isArray(response?.orders) ? response.orders : []);
const getOrderId = (order) => String(order?._id || order?.id || order?.orderId || "");
const getOrderCreatedAt = (order) =>
  new Date(order?.createdAt || order?.updatedAt || Date.now()).getTime();
const getOrderStatus = (order) => String(order?.status || "").trim().toLowerCase();
const mergeOrderData = (baseOrder = {}, incomingOrder = {}) => {
  const mergedOrder = { ...baseOrder };

  Object.entries(incomingOrder).forEach(([key, value]) => {
    if (value !== undefined) {
      mergedOrder[key] = value;
    }
  });

  return mergedOrder;
};
const normalizeIncomingOrder = (incomingOrder) => {
  const incomingId =
    incomingOrder?._id ||
    incomingOrder?.id ||
    incomingOrder?.orderId;

  if (!incomingId) return null;

  return {
    ...incomingOrder,
    _id: incomingOrder?._id ? String(incomingOrder._id) : String(incomingId),
    createdAt: incomingOrder?.createdAt || new Date().toISOString(),
    status: incomingOrder?.status || "pending",
  };
};
const areSetsEqual = (left, right) => {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
};
const keepKitchenStatusesOnly = (orders) =>
  (Array.isArray(orders) ? orders : []).filter((order) =>
    ["pending", "preparing", "ready"].includes(getOrderStatus(order))
  );

const readAdminTheme = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("admin-theme") === "dark";
};

const KitchenDisplaySystem = () => {
  const { notify, sseEvent, sseConnected } = useNotification();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [eventOrdersById, setEventOrdersById] = useState({});
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem("kds_current_page");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    localStorage.setItem("kds_current_page", currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const [hiddenOrderIds, setHiddenOrderIds] = useState(new Set());
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [optimisticStatusById, setOptimisticStatusById] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(readAdminTheme);
  const [activeTab, setActiveTab] = useState("active"); // "active" (pending/preparing) or "ready"
  const [audioEnabled, setAudioEnabled] = useState(false);
  const knownOrderIds = useRef(new Set());
  const newOrderTimers = useRef(new Map());
  const hasInitializedOrders = useRef(false);
  const notificationSound = useMemo(
    () => (typeof Audio === "undefined" ? null : new Audio(audio)),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncTheme = () => setIsDarkMode(readAdminTheme());
    syncTheme();
    window.addEventListener("storage", syncTheme);

    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const root = document.documentElement;
    const body = document.body;

    if (isDarkMode) {
      root.classList.add("admin-dark", "dark");
      body.classList.add("admin-dark");
    } else {
      root.classList.remove("admin-dark", "dark");
      body.classList.remove("admin-dark");
    }

    return () => {
      root.classList.remove("admin-dark", "dark");
      body.classList.remove("admin-dark");
    };
  }, [isDarkMode]);

  const pollingInterval = sseConnected ? 0 : POLLING_INTERVAL;
  const refetchOnAction = !sseConnected;

  const {
    data: pendingData = {},
    isLoading: loadingPending,
    refetch: refetchPending,
  } = useGetOrdersQuery(
    { status: "pending", page: 1, limit: 100, range: "all" },
    {
      pollingInterval,
      refetchOnFocus: refetchOnAction,
      refetchOnReconnect: refetchOnAction,
      refetchOnMountOrArgChange: true,
    }
  );
  const {
    data: preparingData = {},
    isLoading: loadingPreparing,
    refetch: refetchPreparing,
  } = useGetOrdersQuery(
    { status: "preparing", page: 1, limit: 100, range: "all" },
    {
      pollingInterval,
      refetchOnFocus: refetchOnAction,
      refetchOnReconnect: refetchOnAction,
      refetchOnMountOrArgChange: true,
    }
  );
  const {
    data: readyData = {},
    isLoading: loadingReady,
    refetch: refetchReady,
  } = useGetOrdersQuery(
    { status: "ready", page: 1, limit: 100, range: "all" },
    {
      pollingInterval,
      refetchOnFocus: refetchOnAction,
      refetchOnReconnect: refetchOnAction,
      refetchOnMountOrArgChange: true,
    }
  );

  const [updateOrderApi] = useUpdateOrderMutation();

  const pendingOrders = useMemo(() => getOrders(pendingData), [pendingData]);
  const preparingOrders = useMemo(() => getOrders(preparingData), [preparingData]);
  const readyOrders = useMemo(() => getOrders(readyData), [readyData]);

  const fetchedActiveOrderMap = useMemo(() => {
    const orderMap = new Map();
    [...pendingOrders, ...preparingOrders, ...readyOrders].forEach((order) => {
      const id = getOrderId(order);
      if (!id) return;
      orderMap.set(id, order);
    });
    return orderMap;
  }, [pendingOrders, preparingOrders, readyOrders]);

  const activeOrders = useMemo(() => {
    const orderMap = new Map();
    [...pendingOrders, ...preparingOrders, ...readyOrders].forEach((order) => {
      const id = getOrderId(order);
      if (!id) return;
      orderMap.set(id, order);
    });

    Object.values(eventOrdersById).forEach((order) => {
      const id = getOrderId(order);
      if (!id) return;
      const existingOrder = orderMap.get(id);
      orderMap.set(id, existingOrder ? mergeOrderData(existingOrder, order) : order);
    });

    return keepKitchenStatusesOnly(
      Array.from(orderMap.values()).map((order) => {
        const id = getOrderId(order);
        const nextStatus = optimisticStatusById[id];
        return nextStatus ? { ...order, status: nextStatus } : order;
      })
    ).sort((a, b) => getOrderCreatedAt(a) - getOrderCreatedAt(b));
  }, [eventOrdersById, optimisticStatusById, pendingOrders, preparingOrders, readyOrders]);

  const visibleOrders = useMemo(() => {
    return activeOrders.filter((order) => {
      const id = getOrderId(order);
      if (hiddenOrderIds.has(id)) return false;

      // Filter based on activeTab
      if (activeTab === "active") {
        // Show only pending and preparing in active tab (exclude ready)
        return ["pending", "preparing"].includes(getOrderStatus(order));
      } else if (activeTab === "ready") {
        // Show only ready orders in ready tab
        return getOrderStatus(order) === "ready";
      }

      return true;
    });
  }, [hiddenOrderIds, activeOrders, activeTab]);

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
    if (!["NEW_ORDER", "ORDER_STATUS_CHANGED", "ORDER_UPDATED"].includes(sseEvent?.type)) return;
    refetchPending();
    refetchPreparing();
    refetchReady();
  }, [sseEvent, refetchPending, refetchPreparing, refetchReady]);

  useEffect(() => {
    if (
      !["NEW_ORDER", "ORDER_STATUS_CHANGED", "ORDER_UPDATED"].includes(sseEvent?.type) ||
      !sseEvent?.data
    ) {
      return;
    }

    const normalizedOrder = normalizeIncomingOrder(sseEvent.data);
    if (!normalizedOrder) return;

    const incomingId = getOrderId(normalizedOrder);
    const incomingStatus = getOrderStatus(normalizedOrder);
    const eventTimestamp = sseEvent?.ts || Date.now();

    // Debug: Log all order status changes
    console.log("KDS SSE received:", {
      type: sseEvent.type,
      orderId: incomingId,
      status: incomingStatus,
      willRemove: !["pending", "preparing", "ready"].includes(incomingStatus)
    });



    if (incomingStatus === "preparing") {
      const preparingStartedAtMs =
        getOrderPreparingStartedAt(normalizedOrder) ||
        rememberOrderPreparingStartedAt(incomingId, eventTimestamp);

      if (preparingStartedAtMs && !normalizedOrder.preparingStartedAt) {
        normalizedOrder.preparingStartedAt = new Date(
          preparingStartedAtMs
        ).toISOString();
      }
    } else if (incomingStatus) {
      clearOrderPreparingStartedAt(incomingId);
    }

    setEventOrdersById((prev) => {
      const next = { ...prev };
      if (["pending", "preparing", "ready"].includes(incomingStatus)) {
        next[incomingId] = mergeOrderData(prev[incomingId], normalizedOrder);
      } else {
        // Order is completed or cancelled - remove from KDS view immediately
        delete next[incomingId];
      }
      return next;
    });

    // Also update optimistic status to ensure immediate UI update
    setOptimisticStatusById((prev) => {
      const next = { ...prev };
      if (!["pending", "preparing", "ready"].includes(incomingStatus)) {
        delete next[incomingId];
      } else {
        next[incomingId] = incomingStatus;
      }
      return next;
    });

    if (
      sseEvent.type === "NEW_ORDER" &&
      incomingStatus === "pending" &&
      !knownOrderIds.current.has(incomingId)
    ) {
      setHiddenOrderIds((prev) => {
        if (!prev.has(incomingId)) return prev;
        const next = new Set(prev);
        next.delete(incomingId);
        return next;
      });

      setNewOrderIds((prev) => {
        const next = new Set(prev);
        next.add(incomingId);
        const existingTimer = newOrderTimers.current.get(incomingId);
        if (existingTimer) window.clearTimeout(existingTimer);
        const timer = window.setTimeout(() => {
          setNewOrderIds((current) => {
            const updated = new Set(current);
            updated.delete(incomingId);
            return updated;
          });
          newOrderTimers.current.delete(incomingId);
        }, NEW_ORDER_HIGHLIGHT_MS);
        newOrderTimers.current.set(incomingId, timer);
        return next;
      });

      if (audioEnabled && notificationSound) {
        try {
          notificationSound.currentTime = 0;
          const playPromise = notificationSound.play();
          if (playPromise?.catch) playPromise.catch(() => {});
        } catch {
          // Ignore autoplay interruptions.
        }
      }

      notify(`New kitchen order #${incomingId.slice(-4)} received.`, "success");
      knownOrderIds.current.add(incomingId);
    }
  }, [audioEnabled, notificationSound, notify, sseEvent]);

  useEffect(() => {
    setEventOrdersById((prev) => {
      const next = { ...prev };
      let changed = false;

      Object.entries(prev).forEach(([id, eventOrder]) => {
        const fetchedOrder = fetchedActiveOrderMap.get(id);
        if (fetchedOrder && getOrderStatus(fetchedOrder) === getOrderStatus(eventOrder)) {
          delete next[id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [fetchedActiveOrderMap]);

  useEffect(() => {
    const currentOrderIds = activeOrders.map(getOrderId).filter(Boolean);
    const currentOrderIdSet = new Set(currentOrderIds);

    setHiddenOrderIds((prev) => {
      const next = new Set([...prev].filter((id) => currentOrderIdSet.has(id)));
      return areSetsEqual(prev, next) ? prev : next;
    });

    setNewOrderIds((prev) => {
      const next = new Set([...prev].filter((id) => currentOrderIdSet.has(id)));
      return areSetsEqual(prev, next) ? prev : next;
    });

    if (!hasInitializedOrders.current) return;

    const freshPendingOrders = activeOrders.filter((order) => {
      const id = getOrderId(order);
      return id && getOrderStatus(order) === "pending" && !knownOrderIds.current.has(id);
    });

    if (freshPendingOrders.length > 0) {
      const incomingIds = freshPendingOrders.map(getOrderId);

      setNewOrderIds((prev) => {
        const next = new Set(prev);
        incomingIds.forEach((id) => {
          if (!id) return;
          next.add(id);
          const existingTimer = newOrderTimers.current.get(id);
          if (existingTimer) window.clearTimeout(existingTimer);
          const timer = window.setTimeout(() => {
            setNewOrderIds((current) => {
              const updated = new Set(current);
              updated.delete(id);
              return updated;
            });
            newOrderTimers.current.delete(id);
          }, NEW_ORDER_HIGHLIGHT_MS);
          newOrderTimers.current.set(id, timer);
        });
        return next;
      });

      if (audioEnabled && notificationSound) {
        try {
          notificationSound.currentTime = 0;
          const playPromise = notificationSound.play();
          if (playPromise?.catch) playPromise.catch(() => {});
        } catch {
          // Ignore autoplay interruptions.
        }
      }

      const latestIncomingOrder = freshPendingOrders[0];
      const latestIncomingOrderId = getOrderId(latestIncomingOrder);
      notify(
        freshPendingOrders.length === 1
          ? `New kitchen order #${latestIncomingOrderId.slice(-4)} received.`
          : `${freshPendingOrders.length} new kitchen orders received.`,
        "success"
      );
    }

    knownOrderIds.current = currentOrderIdSet;
  }, [activeOrders, audioEnabled, notificationSound, notify]);

  useEffect(() => {
    const allLoadingFinished = !loadingPending && !loadingPreparing;
    if (!allLoadingFinished || hasInitializedOrders.current) return;

    knownOrderIds.current = new Set(activeOrders.map(getOrderId).filter(Boolean));
    hasInitializedOrders.current = true;
  }, [activeOrders, loadingPending, loadingPreparing]);

  useEffect(() => {
    activeOrders.forEach((order) => {
      const orderId = getOrderId(order);
      if (!orderId) return;

      if (getOrderStatus(order) === "preparing") {
        const preparingStartedAtMs = getOrderPreparingStartedAt(order);
        if (preparingStartedAtMs) {
          rememberOrderPreparingStartedAt(orderId, preparingStartedAtMs);
        }
        return;
      }

      clearOrderPreparingStartedAt(orderId);
    });
  }, [activeOrders]);

  useEffect(() => {
    const timers = newOrderTimers.current;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const handleOrderStatusChange = async (orderId, updatedData, options = {}) => {
    const normalizedOrderId = String(orderId);
    const nextStatus = String(updatedData?.status || "").trim().toLowerCase();
    const existingOrder = activeOrders.find(
      (order) => getOrderId(order) === normalizedOrderId
    );
    const previousPreparingStartedAt = getOrderPreparingStartedAt(existingOrder);

    try {
      // Optimistic update
      if (nextStatus) {
        if (nextStatus === "preparing") {
          const preparingStartedAtMs =
            previousPreparingStartedAt || Date.now();
          rememberOrderPreparingStartedAt(normalizedOrderId, preparingStartedAtMs);

          setEventOrdersById((prev) => ({
            ...prev,
            [normalizedOrderId]: mergeOrderData(existingOrder || {}, {
              ...updatedData,
              _id: normalizedOrderId,
              preparingStartedAt: new Date(preparingStartedAtMs).toISOString(),
            }),
          }));
        } else if (nextStatus === "pending" || nextStatus === "ready") {
          clearOrderPreparingStartedAt(normalizedOrderId);
          setEventOrdersById((prev) => ({
            ...prev,
            [normalizedOrderId]: mergeOrderData(existingOrder || {}, {
              ...updatedData,
              _id: normalizedOrderId,
            }),
          }));
        } else {
          // completed or cancelled - remove from view
          clearOrderPreparingStartedAt(normalizedOrderId);
          setEventOrdersById((prev) => {
            const next = { ...prev };
            delete next[normalizedOrderId];
            return next;
          });
        }

        setOptimisticStatusById((prev) => ({
          ...prev,
          [normalizedOrderId]: nextStatus,
        }));
      }

      // API Call
      await updateOrderApi({ 
        orderId: normalizedOrderId, 
        updatedData 
      }).unwrap();

      if (options?.successMessage) {
        notify(options.successMessage, "success");
      } else if (!options?.silentSuccess) {
        notify("Order status updated.", "success");
      }
      
      // Refetch for consistency
      refetchPending();
      refetchPreparing();
      refetchReady();
      
      return true;
    } catch (error) {
      // Rollback
      if (previousPreparingStartedAt) {
        rememberOrderPreparingStartedAt(normalizedOrderId, previousPreparingStartedAt);
      } else {
        clearOrderPreparingStartedAt(normalizedOrderId);
      }

      console.error("KDS update failed", error);
      notify("Unable to update order status. Please try again.", "error");
      
      // Refetch to sync state
      refetchPending();
      refetchPreparing();
      refetchReady();
      
      return false;
    } finally {
      setOptimisticStatusById((prev) => {
        const next = { ...prev };
        delete next[normalizedOrderId];
        return next;
      });
    }
  };

  const pendingCount = activeOrders.filter((order) => getOrderStatus(order) === "pending").length;
  const preparingCount = activeOrders.filter((order) => getOrderStatus(order) === "preparing").length;
  const readyCount = activeOrders.filter((order) => getOrderStatus(order) === "ready").length;
  const activeTabCount = pendingCount + preparingCount;
  const orderCount = visibleOrders.length;
  const isLoading = loadingPending || loadingPreparing || loadingReady;

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(visibleOrders.length / ITEMS_PER_PAGE));
  
  // Refined Pagination Clamping: Only clamp AFTER initial load to avoid resetting to Page 1 on refresh
  useEffect(() => {
    if (hasInitializedOrders.current && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return visibleOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleOrders, currentPage]);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div
      className={`h-[100dvh] w-screen overflow-hidden font-mostrate overscroll-none select-none ${
        isDarkMode
          ? "bg-[#0a0a0a] text-white"
          : "bg-[#FFF5F0] text-slate-900"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="h-full w-full p-2 md:p-3 flex flex-col overflow-hidden">
        <div
          className={`flex flex-col gap-0 rounded-2xl border shadow-sm flex-1 min-h-0 overflow-hidden ${
            isDarkMode
              ? "border-slate-800 bg-[#141414]"
              : "border-orange-200 bg-[#FFF8F3]"
          }`}
        >
          {/* Header Area - Small & Compact (Fixed) */}
          <div className={`relative flex flex-col gap-2 px-3 py-2 md:flex-row md:items-center md:justify-between md:gap-0 shrink-0 ${
            isDarkMode ? "bg-[#1a1a1a] border-b border-slate-800" : "bg-[#FFF0E6] border-b border-orange-200"
          }`}>
            {/* Left Section: Brand & View */}
            <div className="flex flex-col shrink-0 md:w-[250px]">
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                TapnBite
              </div>
              <div className="flex items-center justify-between md:justify-start gap-4">
              <div className={`text-xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                {activeTab === "ready" ? "Ready Orders" : "Kitchen Display"}
              </div>
                {/* Time for mobile only */}
                <div className="md:hidden">
                  <div className={`text-base font-black tracking-tighter tabular-nums ${isDarkMode ? "text-white" : "text-slate-700"}`}>
                    {formattedTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Global Time - Centered on MD+ */}
            <div className="hidden md:flex md:absolute md:left-1/2 md:-translate-x-1/2 md:justify-center">
              <div className={`text-2xl font-black tracking-tighter tabular-nums ${isDarkMode ? "text-white" : "text-slate-700"}`}>
                {formattedTime}
              </div>
            </div>

            {/* Right Section: Pagination & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end md:gap-6">
              {/* Pagination Info & Buttons */}
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  Page {currentPage}/{totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`flex h-8 items-center gap-1 rounded-lg border-2 px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                      currentPage === 1
                        ? isDarkMode
                          ? "border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed"
                          : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        : isDarkMode
                          ? "border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
                          : "border-[#D32F2F] bg-white text-[#D32F2F] hover:bg-[#D32F2F] hover:text-white"
                    }`}
                  >
                    <ChevronLeft size={14} strokeWidth={3} />
                    <span>PREV</span>
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`flex h-8 items-center gap-1 rounded-lg border-2 px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                      currentPage === totalPages
                        ? isDarkMode
                          ? "border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed"
                          : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        : isDarkMode
                          ? "border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
                          : "border-[#D32F2F] bg-white text-[#D32F2F] hover:bg-[#D32F2F] hover:text-white"
                    }`}
                  >
                    <span>NEXT</span>
                    <ChevronRight size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>

            <div className={`flex items-center gap-2 min-w-fit px-3 py-2 rounded-xl border ${
              isDarkMode
                ? "bg-[#1f1f1f] border-slate-800"
                : "bg-slate-50 border-slate-200"
            }`}>
              <span className={`text-[11px] font-black tracking-wider uppercase ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}>Orders</span>
              <div className="flex items-center gap-2 ml-1">
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                      activeTab === "active"
                        ? "bg-green-500 text-white shadow-lg scale-105"
                        : isDarkMode
                          ? "bg-[#2a2a2a] text-slate-300 hover:bg-[#333333] hover:text-white"
                          : "bg-white text-slate-600 hover:bg-slate-200 hover:text-slate-800 border border-slate-200"
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full bg-green-400 shadow-sm"></span>
                    <span className="text-[13px] font-black uppercase tracking-wide">Active</span>
                     <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                       activeTab === "active" ? "bg-white/20 text-white" : isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-600"
                     }`}>
                       {activeTabCount}
                     </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("ready")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 relative ${
                      activeTab === "ready"
                        ? "bg-blue-500 text-white shadow-lg scale-105"
                        : isDarkMode
                          ? "bg-[#2a2a2a] text-slate-300 hover:bg-[#333333] hover:text-white"
                          : "bg-white text-slate-600 hover:bg-slate-200 hover:text-slate-800 border border-slate-200"
                    } ${readyCount > 0 ? "ring-2 ring-blue-400 ring-opacity-50" : ""}`}
                  >
                    <span className="h-3 w-3 rounded-full bg-blue-400 shadow-sm"></span>
                    <span className="text-[13px] font-black uppercase tracking-wide">Ready</span>
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === "ready" ? "bg-white/20 text-white" : isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-600"
                    }`}>
                      {readyCount}
                    </span>
                  </button>
              </div>
            </div>
            </div>
          </div>

          <div
            className={`m-2 rounded-xl border flex-1 min-h-0 flex flex-col ${
              isDarkMode ? "border-slate-800/50 bg-[#0f0f0f]" : "border-orange-100 bg-white"
            }`}
          >
            {isLoading && (
              <div className="mb-2 flex items-center justify-center gap-2 py-1 shrink-0">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">TapnBite Loading...</span>
              </div>
            )}

            <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
              {paginatedOrders.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 pb-10">
                  {paginatedOrders.map((order) => {
                    const orderId = getOrderId(order);
                    return (
                      <KitchenDisplayCard
                        key={orderId}
                        order={order}
                        isDarkMode={isDarkMode}
                        isNewOrder={newOrderIds.has(orderId)}
                        updateOrder={handleOrderStatusChange}
                        onDismiss={(dismissedOrderId) =>
                          setHiddenOrderIds((prev) => new Set(prev).add(String(dismissedOrderId)))
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                <div
                  className={`flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed px-8 py-12 text-center ${
                    isDarkMode
                      ? "border-slate-700 bg-slate-900 text-slate-300"
                      : "border-slate-300 bg-white text-slate-500"
                  }`}
                >
                  <div
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isDarkMode ? "bg-slate-800 text-orange-300" : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    <Activity size={24} />
                  </div>
                  <p className="text-lg font-bold">Kitchen queue is clear</p>
                  <p className="mt-2 max-w-md text-sm">
                    {isLoading
                      ? "Active orders are loading."
                      : "New pending orders will appear here automatically with sound and highlight."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenDisplaySystem;
