import React, { useEffect, useMemo, useRef, useState } from "react";
import audio from "@/assets/orderRing.mp3";
import { useNotification } from "../../Bell/NotificationContext";
import { useGetOrdersQuery, useUpdateOrderMutation } from "../../../../redux/adminRedux/adminAPI";
import { Activity, ChefHat, Wifi, WifiOff } from "lucide-react";
import KitchenDisplayCard from "./KitchenDisplayCard";
import {
  clearOrderPreparingStartedAt,
  getOrderPreparingStartedAt,
  rememberOrderPreparingStartedAt,
} from "../commonOrderFile/utils";

const POLLING_INTERVAL = 60000;
const NEW_ORDER_HIGHLIGHT_MS = 12000;
const KDS_ACTIVE_ORDER_CACHE_KEY = "kds-active-order-cache-v1";
const KDS_CARD_ORDER_KEY = "kds-card-order-v1";

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
const areIdArraysEqual = (left, right) => {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};
const readStorageJson = (key, fallback = []) => {
  if (typeof window === "undefined") return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return fallback;
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch {
    return fallback;
  }
};
const writeStorageJson = (key, value) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota/access issues.
  }
};
const keepKitchenStatusesOnly = (orders) =>
  (Array.isArray(orders) ? orders : []).filter((order) =>
    ["pending", "preparing"].includes(getOrderStatus(order))
  );

const readAdminTheme = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("admin-theme") === "dark";
};

const KitchenDisplaySystem = () => {
  const { notify, sseEvent, sseConnected } = useNotification();
  const [cachedOrders, setCachedOrders] = useState(() =>
    keepKitchenStatusesOnly(readStorageJson(KDS_ACTIVE_ORDER_CACHE_KEY, []))
  );
  const [cardOrderIds, setCardOrderIds] = useState(() =>
    readStorageJson(KDS_CARD_ORDER_KEY, []).map((id) => String(id))
  );
  const [eventOrdersById, setEventOrdersById] = useState({});
  const [hiddenOrderIds, setHiddenOrderIds] = useState(new Set());
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [optimisticStatusById, setOptimisticStatusById] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(readAdminTheme);
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

  const [updateOrderApi] = useUpdateOrderMutation();

  const pendingOrders = useMemo(() => getOrders(pendingData), [pendingData]);
  const preparingOrders = useMemo(() => getOrders(preparingData), [preparingData]);
  const fetchedActiveOrderMap = useMemo(() => {
    const orderMap = new Map();
    [...pendingOrders, ...preparingOrders].forEach((order) => {
      const id = getOrderId(order);
      if (!id) return;
      orderMap.set(id, order);
    });
    return orderMap;
  }, [pendingOrders, preparingOrders]);

  const activeOrders = useMemo(() => {
    const orderMap = new Map();
    [...pendingOrders, ...preparingOrders].forEach((order) => {
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
    ).sort(
      (a, b) => {
        const statusDelta =
          (getOrderStatus(a) === "pending" ? 0 : 1) -
          (getOrderStatus(b) === "pending" ? 0 : 1);

        if (statusDelta !== 0) return statusDelta;
        return getOrderCreatedAt(b) - getOrderCreatedAt(a);
      }
    );
  }, [eventOrdersById, optimisticStatusById, pendingOrders, preparingOrders]);

  const hasLoadedLiveOrders = !loadingPending && !loadingPreparing;
  const sourceOrders = useMemo(() => {
    if (activeOrders.length > 0 || hasLoadedLiveOrders) {
      return activeOrders;
    }

    return cachedOrders;
  }, [activeOrders, cachedOrders, hasLoadedLiveOrders]);

  const orderedOrders = useMemo(() => {
    const orderMap = new Map(
      sourceOrders.map((order) => [getOrderId(order), order]).filter(([id]) => Boolean(id))
    );
    const nextOrders = [];
    const seenIds = new Set();

    cardOrderIds.forEach((id) => {
      const matchedOrder = orderMap.get(id);
      if (!matchedOrder) return;
      nextOrders.push(matchedOrder);
      seenIds.add(id);
    });

    sourceOrders.forEach((order) => {
      const id = getOrderId(order);
      if (!id || seenIds.has(id)) return;
      nextOrders.push(order);
    });

    return nextOrders;
  }, [cardOrderIds, sourceOrders]);

  const visibleOrders = useMemo(() => {
    return orderedOrders.filter((order) => {
      const id = getOrderId(order);
      return !hiddenOrderIds.has(id);
    });
  }, [hiddenOrderIds, orderedOrders]);

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
    if (!["NEW_ORDER", "ORDER_STATUS_CHANGED"].includes(sseEvent?.type)) return;
    refetchPending();
    refetchPreparing();
  }, [sseEvent, refetchPending, refetchPreparing]);

  useEffect(() => {
    if (
      !["NEW_ORDER", "ORDER_STATUS_CHANGED"].includes(sseEvent?.type) ||
      !sseEvent?.data
    ) {
      return;
    }

    const normalizedOrder = normalizeIncomingOrder(sseEvent.data);
    if (!normalizedOrder) return;

    const incomingId = getOrderId(normalizedOrder);
    const incomingStatus = getOrderStatus(normalizedOrder);
    const eventTimestamp = sseEvent?.ts || Date.now();

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
      if (["pending", "preparing"].includes(incomingStatus)) {
        next[incomingId] = mergeOrderData(prev[incomingId], normalizedOrder);
      } else {
        delete next[incomingId];
      }
      return next;
    });

    setCachedOrders((prev) => {
      const existingOrder = prev.find((order) => getOrderId(order) === incomingId);
      const nextOrders = prev.filter((order) => getOrderId(order) !== incomingId);

      if (!["pending", "preparing"].includes(incomingStatus)) {
        return nextOrders;
      }

      const mergedOrder = mergeOrderData(existingOrder, normalizedOrder);
      return [...nextOrders, mergedOrder];
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
    if (!hasLoadedLiveOrders) return;

    const nextCachedOrders = keepKitchenStatusesOnly(activeOrders);
    setCachedOrders(nextCachedOrders);
  }, [activeOrders, hasLoadedLiveOrders]);

  useEffect(() => {
    writeStorageJson(KDS_ACTIVE_ORDER_CACHE_KEY, cachedOrders);
  }, [cachedOrders]);

  useEffect(() => {
    const incomingIds = sourceOrders.map(getOrderId).filter(Boolean);
    const incomingIdSet = new Set(incomingIds);

    setCardOrderIds((prev) => {
      const preservedIds = prev.filter((id) => incomingIdSet.has(id));
      const preservedIdSet = new Set(preservedIds);
      const freshIds = incomingIds.filter((id) => !preservedIdSet.has(id));
      const next = [...preservedIds, ...freshIds];
      return areIdArraysEqual(prev, next) ? prev : next;
    });
  }, [sourceOrders]);

  useEffect(() => {
    writeStorageJson(KDS_CARD_ORDER_KEY, cardOrderIds);
  }, [cardOrderIds]);

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

    if (nextStatus) {
      if (nextStatus === "preparing") {
        rememberOrderPreparingStartedAt(
          normalizedOrderId,
          previousPreparingStartedAt || Date.now()
        );
      } else {
        clearOrderPreparingStartedAt(normalizedOrderId);
      }

      setOptimisticStatusById((prev) => ({
        ...prev,
        [normalizedOrderId]: nextStatus,
      }));
      setCachedOrders((prev) =>
        keepKitchenStatusesOnly(
          prev.map((order) =>
            getOrderId(order) === normalizedOrderId
              ? { ...order, status: nextStatus }
              : order
          )
        )
      );
    }

    try {
      await updateOrderApi({ orderId: normalizedOrderId, updatedData }).unwrap();
      await Promise.allSettled([refetchPending(), refetchPreparing()]);
      if (options?.successMessage) {
        notify(options.successMessage, "success");
      } else if (!options?.silentSuccess) {
        notify("KDS order status updated.", "success");
      }
      return true;
    } catch (error) {
      if (previousPreparingStartedAt) {
        rememberOrderPreparingStartedAt(
          normalizedOrderId,
          previousPreparingStartedAt
        );
      } else {
        clearOrderPreparingStartedAt(normalizedOrderId);
      }

      console.error("KDS update failed", error);
      await Promise.allSettled([refetchPending(), refetchPreparing()]);
      notify("Unable to update order status. Please try again.", "error");
      return false;
    } finally {
      if (nextStatus) {
        setOptimisticStatusById((prev) => {
          const next = { ...prev };
          delete next[normalizedOrderId];
          return next;
        });
      }
    }
  };

  const pendingCount = visibleOrders.filter((order) => getOrderStatus(order) === "pending").length;
  const preparingCount = visibleOrders.filter((order) => getOrderStatus(order) === "preparing").length;
  const orderCount = visibleOrders.length;
  const isLoading = loadingPending || loadingPreparing;

  return (
    <div
      className={`min-h-screen font-mostrate ${
        isDarkMode
          ? "bg-[linear-gradient(180deg,#0f172a_0%,#111827_48%,#020617_100%)] text-slate-100"
          : "bg-[linear-gradient(180deg,#fffaf5_0%,#fffdfb_48%,#ffffff_100%)] text-slate-900"
      }`}
    >
      <div className="mx-auto min-h-screen max-w-[1800px] px-4 py-5 sm:px-6 lg:px-8">
        <div
          className={`flex flex-col gap-6 rounded-[2rem] border p-5 shadow-[0_20px_60px_-40px_rgba(249,115,22,0.35)] sm:p-6 ${
            isDarkMode
              ? "border-slate-800/80 bg-slate-950/90 shadow-[0_24px_70px_-40px_rgba(2,6,23,0.9)]"
              : "border-orange-200/80 bg-white/95 shadow-[0_24px_70px_-40px_rgba(249,115,22,0.22)]"
          }`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.26em] shadow-sm ${
                  isDarkMode
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-200"
                    : "border-orange-300 bg-orange-100 text-orange-700"
                }`}
              >
                <ChefHat size={14} />
                Kitchen Display System
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Live kitchen tickets
                </h1>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className={`rounded-3xl border px-4 py-3 ${
                  isDarkMode
                    ? "border-amber-500/20 bg-amber-500/10"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-200">
                  Pending
                </p>
                <p className="mt-2 text-[1.7rem] font-black">{pendingCount}</p>
              </div>
              <div
                className={`rounded-3xl border px-4 py-3 ${
                  isDarkMode
                    ? "border-sky-500/20 bg-sky-500/10"
                    : "border-sky-200 bg-sky-50"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-200">
                  Preparing
                </p>
                <p className="mt-2 text-[1.7rem] font-black">{preparingCount}</p>
              </div>
              <div
                className={`rounded-3xl border px-4 py-3 ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-900"
                    : "border-orange-200 bg-orange-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {sseConnected ? (
                    <Wifi size={16} className="text-emerald-400" />
                  ) : (
                    <WifiOff size={16} className="text-orange-400" />
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em]">
                  {sseConnected ? "Live Sync" : "Polling"}
                  </p>
                </div>
                <p className="mt-2 text-xl font-black">
                  {isLoading ? "Loading..." : `${orderCount} active`}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-[2rem] border p-4 ${
              isDarkMode ? "border-slate-800 bg-slate-950/70" : "border-orange-200 bg-orange-50/70"
            }`}
          >
            {isLoading && (
              <div
                className={`mb-4 rounded-3xl border px-4 py-4 text-center text-sm ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-900 text-slate-300"
                    : "border-orange-300 bg-orange-50 text-orange-800"
                }`}
              >
                <div className="mx-auto inline-flex items-center gap-3">
                  <span
                    className={`h-4 w-4 animate-spin rounded-full border-2 ${
                      isDarkMode
                        ? "border-orange-300 border-t-transparent"
                        : "border-orange-500 border-t-transparent"
                    }`}
                  />
                  <span className="text-sm font-semibold tracking-wide">TapnBite Loading...</span>
                </div>
              </div>
            )}

            <div className="min-h-[360px]">
              {visibleOrders.length > 0 ? (
                <div className="grid auto-rows-min items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {visibleOrders.map((order) => {
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
