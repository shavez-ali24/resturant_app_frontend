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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });
  const [activeTab, setActiveTab] = useState("active");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const knownOrderIds = useRef(new Set());
  const newOrderTimers = useRef(new Map());
  const hasInitializedOrders = useRef(false);
  const notificationSound = useMemo(
    () => (typeof Audio === "undefined" ? null : new Audio(audio)),
    []
  );

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;
    const update = () =>
      setIsDarkMode(root.classList.contains("admin-dark") || root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

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
      className={`h-[100dvh] w-screen overflow-hidden overscroll-none select-none ${
        isDarkMode ? "bg-[#0f172a] text-slate-100" : "bg-[#f7f3ef] text-[#1c1917]"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="h-full w-full p-2 md:p-3 flex flex-col overflow-hidden">
        <div className={`flex flex-col gap-0 rounded-2xl border shadow-sm flex-1 min-h-0 overflow-hidden ${
          isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white"
        }`}>

          {/* ── Header ── */}
          <div className={`relative flex flex-col gap-2 px-3 py-2 md:flex-row md:items-center md:justify-between md:gap-0 shrink-0 ${
            isDarkMode ? "bg-[#1e293b] border-b border-slate-700" : "bg-[#f7f3ef] border-b border-[#ede8e3]"
          }`}>
            {/* Left: Brand + Title */}
            <div className="flex flex-col shrink-0 md:w-[250px]">
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-slate-500" : "text-[#a8a29e]"}`}>
                TapnBite
              </div>
              <div className="flex items-center justify-between md:justify-start gap-4">
                <div className={`text-xl font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>
                  {activeTab === "ready" ? "Ready Orders" : "Kitchen Display"}
                </div>
                <div className="md:hidden">
                  <div className={`text-base font-black tracking-tighter tabular-nums ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>
                    {formattedTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Time (md+) */}
            <div className="hidden md:flex md:absolute md:left-1/2 md:-translate-x-1/2 md:justify-center">
              <div className={`text-2xl font-black tracking-tighter tabular-nums ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>
                {formattedTime}
              </div>
            </div>

            {/* Right: Pagination + Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end md:gap-4">
              {/* Pagination */}
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${isDarkMode ? "text-slate-500" : "text-[#a8a29e]"}`}>
                  Page {currentPage}/{totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: "PREV", icon: <ChevronLeft size={14} strokeWidth={3} />, action: handlePrevPage, disabled: currentPage === 1, dir: "prev" },
                    { label: "NEXT", icon: <ChevronRight size={14} strokeWidth={3} />, action: handleNextPage, disabled: currentPage === totalPages, dir: "next" },
                  ].map(({ label, icon, action, disabled, dir }) => (
                    <button
                      key={dir}
                      onClick={action}
                      disabled={disabled}
                      className={`flex h-8 items-center gap-1 rounded-lg border px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                        disabled
                          ? isDarkMode
                            ? "border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed"
                            : "border-[#ede8e3] bg-[#f7f3ef] text-[#a8a29e] cursor-not-allowed"
                          : isDarkMode
                            ? "border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600"
                            : "border-[#d6cfc8] bg-white text-[#78716c] hover:bg-[#f7f3ef] hover:text-[#1c1917]"
                      }`}
                    >
                      {dir === "prev" && icon}
                      <span>{label}</span>
                      {dir === "next" && icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab switcher */}
              <div className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 ${
                isDarkMode ? "border-slate-700 bg-slate-800/60" : "border-[#ede8e3] bg-[#f7f3ef]"
              }`}>
                <span className={`text-[10px] font-black uppercase tracking-widest mr-1 ${isDarkMode ? "text-slate-500" : "text-[#a8a29e]"}`}>Orders</span>
                {[
                  { key: "active", color: "green", count: activeTabCount, dot: "bg-green-500" },
                  { key: "ready",  color: "blue",  count: readyCount,     dot: "bg-blue-500" },
                ].map(({ key, color, count, dot }) => {
                  const isActive = activeTab === key;
                  const activeBg = color === "green" ? "bg-green-500" : "bg-blue-500";
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-black uppercase tracking-wide transition-all ${
                        isActive
                          ? `${activeBg} text-white shadow-sm`
                          : isDarkMode
                            ? "text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                            : "text-[#78716c] hover:bg-white hover:text-[#1c1917]"
                      } ${key === "ready" && readyCount > 0 && !isActive ? "ring-1 ring-blue-400" : ""}`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${dot}`}></span>
                      <span>{key === "active" ? "Active" : "Ready"}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive ? "bg-white/20 text-white" : isDarkMode ? "bg-slate-700 text-slate-400" : "bg-white text-[#78716c]"
                      }`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div className={`m-2 rounded-xl border flex-1 min-h-0 flex flex-col ${
            isDarkMode ? "border-slate-700/50 bg-[#0f172a]" : "border-[#ede8e3] bg-[#f7f3ef]"
          }`}>
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-2 shrink-0">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-[#a8a29e]"}`}>Loading...</span>
              </div>
            )}

            <div className="flex-1 w-full overflow-y-auto">
              {paginatedOrders.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 lg:grid-cols-4 pb-10">
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
                <div className={`flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed m-3 px-8 py-12 text-center ${
                  isDarkMode ? "border-slate-700 text-slate-400" : "border-[#d6cfc8] text-[#78716c]"
                }`}>
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    isDarkMode ? "bg-slate-800 text-orange-400" : "bg-orange-100 text-orange-600"
                  }`}>
                    <Activity size={24} />
                  </div>
                  <p className={`text-lg font-bold ${isDarkMode ? "text-slate-200" : "text-[#1c1917]"}`}>Kitchen queue is clear</p>
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
