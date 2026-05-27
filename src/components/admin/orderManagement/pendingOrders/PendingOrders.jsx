import React, { useEffect, useState, useMemo, useCallback, Suspense, lazy } from "react";
import { useDispatch } from "react-redux";
import { useNotification } from "../../Bell/NotificationContext";
import { ArrowLeft, LayoutGrid, Plus, IndianRupee, Move } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAdminTour } from "../../../../hooks/useAdminTour";
import { TOUR_KEYS, getOrdersSteps } from "../../../../utils/adminTour";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getCompactPageNumbers } from "@/lib/pagination";

import Heading from "../../common/Heading";
import {
  clearOrderPreparingStartedAt,
  getOrderPreparingStartedAt,
  getOrderIdValue,
  getOrderItemsList,
  rememberOrderPreparingStartedAt,
} from "../commonOrderFile/utils";

const OrdersTable = lazy(() => import("./OrdersTable"));
const DeleteModal = lazy(() => import("./DeleteModal"));
const ItemsModal = lazy(() => import("../commonOrderFile/ItemsModal"));
const CustomizationsModal = lazy(() => import("./CustomizationsModal"));
const AdminOrderPanel = lazy(() => import("../../OrderPanel/AdminOrderPanel"));
const LayoutView = lazy(() => import("./LayoutView/LayoutView"));
const PayModal = lazy(() => import("./PayModal"));
const MoveTableModal = lazy(() => import("./MoveTableModal"));

const ORDER_PANEL_DRAFT_KEY = "adminOrderPanelDraft";
const ORDER_PANEL_FRESH_CREATE_KEY = "adminOrderPanelFreshCreate";

import {
  useGetOrdersQuery,
  useGetMenuQuery,
  useGetRestaurantProfileQuery,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useToggleItemReadyMutation,
  useGetLiveUnitsQuery,
  useBookRoomMutation,
  useCheckoutOrderMutation,
  useLazyGetOrderByIdQuery,
} from "../../../../redux/adminRedux/adminAPI";
const getOrderItemCartKey = (orderItem) => {
  if (!orderItem) return "";
  const itemId = orderItem.menuItemId || orderItem._id || orderItem.id;
  const variant = orderItem.variant || orderItem.variantKey || orderItem.variantName;
  const variantPart = variant ? `${itemId}-${variant}` : `${itemId}`;
  const customizations = orderItem.customizations ? `:${String(orderItem.customizations).trim()}` : "";
  return `${variantPart}${customizations}`;
};

const Orders = () => {
  const { notify, sseEvent, sseConnected, newlyAddedItemsOrderIds, setNewlyAddedItemsOrderIds, newItemsByOrderId, setNewItemsByOrderId } = useNotification();
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () =>
      setIsDarkMode(root.classList.contains("admin-dark") || root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const showCreateOrder = searchParams.get("view") === "create";
  const urlOrderId = searchParams.get("orderId");
  const closeCreateOrder = () => {
    sessionStorage.removeItem("editingOrder");
    sessionStorage.removeItem("selectedTable");
    sessionStorage.removeItem(ORDER_PANEL_DRAFT_KEY);
    sessionStorage.removeItem(ORDER_PANEL_FRESH_CREATE_KEY);
    setUrlFetchedOrder(null);
    setSearchParams({});
  };
  const [urlFetchedOrder, setUrlFetchedOrder] = useState(null);
  const [isUrlFetching, setIsUrlFetching] = useState(false);

  useEffect(() => {
    if (!showCreateOrder || !urlOrderId) {
      setUrlFetchedOrder(null);
    }
  }, [showCreateOrder, urlOrderId]);

  // Auto onboarding tour — first visit only
  useAdminTour(TOUR_KEYS.orders, getOrdersSteps, isDarkMode, 800);

  const normalizeIncomingOrder = (incomingOrder) => {
    const incomingId = getOrderIdValue(incomingOrder);
    if (!incomingId) return null;

    return {
      ...incomingOrder,
      _id: incomingOrder?._id ? String(incomingOrder._id) : incomingId,
      createdAt: incomingOrder?.createdAt || new Date().toISOString(),
      status: incomingOrder?.status || "pending",
    };
  };

  const mergeOrderData = (baseOrder = {}, incomingOrder = {}) => {
    const mergedOrder = { ...baseOrder };

    Object.entries(incomingOrder).forEach(([key, value]) => {
      if (value !== undefined) {
        mergedOrder[key] = value;
      }
    });

    return mergedOrder;
  };

  // --- Local States ---
  const [currentPage, setCurrentPage] = useState(1);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [orderForBillModal, setOrderForBillModal] = useState(null);
  const [payModalOrder, setPayModalOrder] = useState(null);
  const [moveModalOrder, setMoveModalOrder] = useState(null);
  const [billModalAutoPrint, setBillModalAutoPrint] = useState(false);
  const [selectedOrderForCustomizations, setSelectedOrderForCustomizations] = useState(null);
  const dispatch = useDispatch();
  const [sseOrders, setSseOrders] = useState([]);
  const [roomActionLoadingId, setRoomActionLoadingId] = useState(null);
  const [autoRefresh] = useState(() => {
    const saved = localStorage.getItem("autoRefresh");
    return ["1", "2", "5"].includes(saved) ? saved : "1";
  });
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem("orderViewMode");
    return saved === "layout" || saved === "table" ? saved : "table";
  }); // "table" | "layout"
  const itemsPerPage = 10;
  const combinedFetchLimit = itemsPerPage * 25;
  const autoRefreshMinutes = useMemo(() => {
    const mins = parseInt(autoRefresh, 10);
    return Number.isNaN(mins) ? 1 : mins;
  }, [autoRefresh]);
  const pollingIntervalMs = autoRefreshMinutes * 60 * 1000;

  // --- RTK Query Hook with API parameters ---
  const pollingInterval = sseConnected ? 0 : pollingIntervalMs;
  const refetchOnAction = !sseConnected;

  const {
    data: pendingOrdersResponse = {},
    isLoading: pendingLoading,
    isError: pendingError,
    error: pendingErrorObj,
    refetch: refetchPendingOrders,
  } = useGetOrdersQuery(
    {
      status: "pending",
      page: 1,
      limit: combinedFetchLimit,
      range: "all",
    },
    {
      pollingInterval,
      refetchOnFocus: refetchOnAction,
      refetchOnReconnect: refetchOnAction,
    }
  );

  const {
    data: preparingOrdersResponse = {},
    isLoading: preparingLoading,
    isError: preparingError,
    error: preparingErrorObj,
    refetch: refetchPreparingOrders,
   } = useGetOrdersQuery(
     {
       status: "preparing",
       page: 1,
       limit: combinedFetchLimit,
       range: "all",
     },
     {
       pollingInterval,
       refetchOnFocus: refetchOnAction,
       refetchOnReconnect: refetchOnAction,
     }
   );

   const { data: readyOrdersResponse = {}, refetch: refetchReadyOrders } = useGetOrdersQuery(
     {
       status: "ready",
       page: 1,
       limit: combinedFetchLimit,
       range: "all",
     },
     {
       pollingInterval,
       refetchOnFocus: refetchOnAction,
       refetchOnReconnect: refetchOnAction,
     }
   );

   const {
     data: completedOrdersResponse = {},
     isLoading: completedLoading,
     isError: completedError,
     error: completedErrorObj,
     refetch: refetchCompletedOrders,
   } = useGetOrdersQuery(
     {
       status: "completed",
       page: 1,
       limit: combinedFetchLimit,
       range: "all",
     },
     {
       pollingInterval,
       refetchOnFocus: refetchOnAction,
       refetchOnReconnect: refetchOnAction,
     }
   );



  const { data: menuItems = [] } = useGetMenuQuery();
  
  // ✅ Restaurant profile se tables extract karenge
  const { 
    data: restaurantData,
    isLoading: restaurantLoading,
    error: restaurantError,
    refetch: refetchRestaurant
  } = useGetRestaurantProfileQuery(undefined, {
    pollingInterval,
    refetchOnFocus: refetchOnAction,
    refetchOnReconnect: refetchOnAction,
  });
  
  const [updateOrderApi] = useUpdateOrderMutation();
  const [deleteOrderApi] = useDeleteOrderMutation();
  const [toggleItemReadyApi] = useToggleItemReadyMutation();
  const [bookRoomApi] = useBookRoomMutation();
  const [checkoutOrderApi] = useCheckoutOrderMutation();
  const [fetchOrderById] = useLazyGetOrderByIdQuery();

  const {
    data: liveUnitsData,
    isLoading: liveUnitsLoading,
    refetch: refetchLiveUnits,
  } = useGetLiveUnitsQuery(undefined, {
    pollingInterval,
    refetchOnFocus: refetchOnAction,
    refetchOnReconnect: refetchOnAction,
  });

  useEffect(() => {
    if (
      // 🔧 FIX: Backend only emits "NEW_ORDER" and "ORDER_UPDATED" (see orderListener.js)
      // "ORDER_STATUS_CHANGED" does not exist — status changes come via ORDER_UPDATED
      !["NEW_ORDER", "ORDER_UPDATED"].includes(sseEvent?.type) ||
      !sseEvent?.data
    ) {
      return;
    }

    const incoming = sseEvent.data;
    const incomingId = getOrderIdValue(incoming);
    if (!incomingId) return;

    const normalizedOrder = normalizeIncomingOrder(incoming);
    if (!normalizedOrder) return;
    const normalizedStatus = String(normalizedOrder.status || "").toLowerCase();
    const eventTimestamp = sseEvent?.ts || Date.now();

    // ─── SHOW BADGE FOR NEW ORDER OR ADDED ITEMS (admin or client) ───
    const getOrderTotalItemsQuantity = (order) => {
      if (!order || !Array.isArray(order.items)) return 0;
      return order.items.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
    };

    if (sseEvent.type === "NEW_ORDER") {
      // Any new order (from client or admin) → show badge
      setNewlyAddedItemsOrderIds((prevSet) => {
        const next = new Set(prevSet);
        next.add(String(incomingId));
        return next;
      });
      // Store all item keys in this new order as new
      if (Array.isArray(normalizedOrder.items)) {
        const itemKeys = new Set(normalizedOrder.items.map(getOrderItemCartKey));
        setNewItemsByOrderId((prevMap) => {
          const next = new Map(prevMap);
          next.set(String(incomingId), itemKeys);
          return next;
        });
      }
    } else {
      // ORDER_UPDATED — show badge if total quantity increased (admin or client added items)
      const previousVersion = sseOrders.find(
        (order) => getOrderIdValue(order) === incomingId
      ) || [...(pendingOrders || []), ...(preparingOrders || []), ...(readyOrders || []), ...(completedOrders || [])].find(
        (order) => getOrderIdValue(order) === incomingId
      );

      if (previousVersion) {
        const prevQty = getOrderTotalItemsQuantity(previousVersion);
        const newQty = getOrderTotalItemsQuantity(normalizedOrder);
        if (newQty > prevQty) {
          setNewlyAddedItemsOrderIds((prevSet) => {
            const next = new Set(prevSet);
            next.add(String(incomingId));
            return next;
          });

          // Determine which items are new/increased
          const prevItemsMap = new Map();
          if (Array.isArray(previousVersion.items)) {
            previousVersion.items.forEach((item) => {
              const key = getOrderItemCartKey(item);
              prevItemsMap.set(key, (prevItemsMap.get(key) || 0) + (Number(item.quantity) || 0));
            });
          }

          const newKeys = new Set();
          if (Array.isArray(normalizedOrder.items)) {
            normalizedOrder.items.forEach((item) => {
              const key = getOrderItemCartKey(item);
              const prevQtyForItem = prevItemsMap.get(key) || 0;
              const newQtyForItem = Number(item.quantity) || 0;
              if (newQtyForItem > prevQtyForItem) {
                newKeys.add(key);
              }
            });
          }

          if (newKeys.size > 0) {
            setNewItemsByOrderId((prevMap) => {
              const next = new Map(prevMap);
              const existingKeys = next.get(String(incomingId)) || new Set();
              const updatedKeys = new Set([...existingKeys, ...newKeys]);
              next.set(String(incomingId), updatedKeys);
              return next;
            });
          }
        }
      } else {
        // Fallback: if previous version is not found, treat all items in incoming as new
        if (Array.isArray(normalizedOrder.items)) {
          const itemKeys = new Set(normalizedOrder.items.map(getOrderItemCartKey));
          setNewItemsByOrderId((prevMap) => {
            const next = new Map(prevMap);
            next.set(String(incomingId), itemKeys);
            return next;
          });
        }
      }
    }

    if (normalizedStatus === "preparing") {
      const preparingStartedAtMs =
        getOrderPreparingStartedAt(normalizedOrder) ||
        rememberOrderPreparingStartedAt(incomingId, eventTimestamp);

      if (preparingStartedAtMs && !normalizedOrder.preparingStartedAt) {
        normalizedOrder.preparingStartedAt = new Date(
          preparingStartedAtMs
        ).toISOString();
      }
    } else if (normalizedStatus) {
      clearOrderPreparingStartedAt(incomingId);
    }

    setSseOrders((prev) => {
      const remainingOrders = prev.filter(
        (order) => getOrderIdValue(order) !== incomingId
      );

      if (!["pending", "preparing", "ready", "completed"].includes(normalizedStatus)) {
        return remainingOrders;
      }

      const previousVersion = prev.find(
        (order) => getOrderIdValue(order) === incomingId
      );
      return [
        mergeOrderData(previousVersion, normalizedOrder),
        ...remainingOrders,
      ].slice(0, combinedFetchLimit);
    });

    setCurrentPage(1);

    // Use backend SSE event for live updates (no extra refetch when connected)
    if (!sseConnected) {
      refetchPendingOrders();
      refetchPreparingOrders();
      refetchReadyOrders();
      refetchCompletedOrders();
      refetchRestaurant();
    }
  }, [sseEvent, combinedFetchLimit, refetchPendingOrders, refetchPreparingOrders, refetchReadyOrders, refetchCompletedOrders, refetchRestaurant, sseConnected]);

  const getRawErrorText = (errorObj) => {
    if (!errorObj) return "";
    if (typeof errorObj === "string") return errorObj;
    if (typeof errorObj?.data === "string") return errorObj.data;
    return (
      errorObj?.data?.message ||
      errorObj?.error ||
      errorObj?.message ||
      ""
    );
  };

  const getFriendlyOrderError = (errorObj, context = "general") => {
    const status = errorObj?.status || errorObj?.originalStatus;
    const rawMessage = getRawErrorText(errorObj).toLowerCase();

    if (status === 401) {
      return "Your session has expired. Please log in again";
    }
    if (status === 403) {
      return "You don't have permission to perform this action";
    }
    if (status === 404) {
      return context === "update" || context === "delete"
        ? "Order not found. Please refresh and try again."
        : "Orders not found right now. Please refresh.";
    }
    if (status === 429) {
      return "Too many requests. Please wait a moment and try again.";
    }
    if (status === 400) {
      return errorObj?.data?.message || "Invalid request parameters.";
    }
    if (status >= 500) {
      return "Server issue detected. Please try again in a moment.";
    }

    if (
      rawMessage.includes("network") ||
      rawMessage.includes("failed to fetch") ||
      rawMessage.includes("timeout")
    ) {
      return "Network issue. Please check internet connection and retry.";
    }

    if (
      rawMessage.includes("validation") ||
      rawMessage.includes("invalid") ||
      rawMessage.includes("required")
    ) {
      return "Please check order details and try again.";
    }

    if (context === "refresh") {
      return "Unable to refresh pending orders right now.";
    }
    if (context === "update") {
      return "Unable to update order right now.";
    }
    if (context === "delete") {
      return "Unable to delete order right now.";
    }
    if (context === "fetch") {
      return "Unable to load pending orders right now.";
    }

    return "Something went wrong. Please try again.";
  };

  // ✅ FIXED: Extract tables from restaurant profile
  const extractTablesFromRestaurant = () => {
    if (!restaurantData) return [];
    
    const restaurant = restaurantData.restaurant || restaurantData;
    
    // Format 1: Direct tables array in restaurant
    if (Array.isArray(restaurant.tables)) {
      return restaurant.tables;
    }
    
    // Format 2: Tables as separate field
    if (restaurant.tables && Array.isArray(restaurant.tables)) {
      return restaurant.tables;
    }
    
    // Format 3: tableNumbers se generate karna
    if (restaurant.tableNumbers && typeof restaurant.tableNumbers === 'number') {
      const tables = [];
      for (let i = 1; i <= restaurant.tableNumbers; i++) {
        tables.push({
          _id: `T${i}`,
          tableNumber: i,
          name: `T${i}`,
        });
      }
      return tables;
    }
    
    return [];
  };

  const tables = extractTablesFromRestaurant();

  // --- Extract data from API response ---
  const pendingOrders = useMemo(
    () =>
      Array.isArray(pendingOrdersResponse?.orders)
        ? pendingOrdersResponse.orders
        : [],
    [pendingOrdersResponse?.orders]
  );
  const preparingOrders = useMemo(
    () =>
      Array.isArray(preparingOrdersResponse?.orders)
        ? preparingOrdersResponse.orders
        : [],
    [preparingOrdersResponse?.orders]
  );
  const readyOrders = useMemo(
    () =>
      Array.isArray(readyOrdersResponse?.orders)
        ? readyOrdersResponse.orders
        : [],
    [readyOrdersResponse?.orders]
  );
  const completedOrders = useMemo(
    () =>
      Array.isArray(completedOrdersResponse?.orders)
        ? completedOrdersResponse.orders
        : [],
    [completedOrdersResponse?.orders]
  );

  const combinedOrders = useMemo(() => {
    const orderMap = new Map();
    [...pendingOrders, ...preparingOrders, ...readyOrders, ...completedOrders].forEach((order) => {
      const key = getOrderIdValue(order) || order?.createdAt;
      if (!key) return;
      orderMap.set(key, order);
    });

    sseOrders.forEach((order) => {
      const key = getOrderIdValue(order) || order?.createdAt;
      if (!key) return;
      const existingOrder = orderMap.get(key);
      orderMap.set(key, existingOrder ? mergeOrderData(existingOrder, order) : order);
    });

    // Show live kitchen orders plus billed-but-unpaid orders so Pay remains reachable.
    return Array.from(orderMap.values())
      .filter((order) => {
        const status = String(order?.status || "").toLowerCase();
        return status !== "completed" || !order?.paymentMethod;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [pendingOrders, preparingOrders, readyOrders, completedOrders, sseOrders]);

  // ── Primary source: GET /api/restaurant/live-units ─────
  const layoutSections = useMemo(() => {
    const sourceSections = Array.isArray(liveUnitsData?.sections) ? liveUnitsData.sections : [];

    // Build quick lookup for order totals using currentOrderId
    const orderTotalMap = new Map();
    combinedOrders.forEach((o) => {
      const oid = getOrderIdValue(o) || o?._id || o?.id || o?.orderId;
      if (oid != null && o?.totalAmount != null) {
        orderTotalMap.set(String(oid), Number(o.totalAmount) || 0);
      }
    });

    const attachAmount = (unit) => {
      const oid = unit.currentOrderId || unit.orderId;
      return oid != null ? (orderTotalMap.get(String(oid)) ?? null) : null;
    };

    if (sourceSections.length === 0) {
      return [];
    }

    return sourceSections.map((section) => ({
      sectionId: section.name,
      sectionName: section.name,
      units: (section.units || [])
        .filter((unit) => unit?.isActive !== false)
        .map((unit) => {
          const isOccupied = unit.status === "OCCUPIED";
          const isBilled = unit.status === "BILLED";

          let displayStatus = "blank";
          if (isBilled) displayStatus = "billed";
          else if (isOccupied) displayStatus = "booked";

          return {
            tableId: `${section.name}:${unit.name}`,
            tableNumber: unit.name,
            sectionName: section.name,
            status: displayStatus,
            unitId: unit.unitId,
            unitType: unit.type,
            isActive: unit.isActive !== false,
            rawStatus: unit.status,
            roomCategory: unit.roomCategory || null,
            occupiedSince: unit.occupiedSince || null,
            currentOrderId: unit.currentOrderId || null,
            orderId: unit.currentOrderId || null,
            currentAmount: attachAmount(unit),
          };
        }),
    })).filter((sec) => sec.units.length > 0);
  }, [liveUnitsData, combinedOrders]);
  
  // ── Pre-fill sessionStorage for AdminOrderPanel ──
  useEffect(() => {
    if (!restaurantData) return;
    try {
      const stored = sessionStorage.getItem("selectedTable");
      if (stored) {
        const tableInfo = JSON.parse(stored);
        if (tableInfo.sectionName && tableInfo.tableNumber) {
          const restaurant = restaurantData.restaurant || restaurantData;
          const sections = Array.isArray(restaurant.sections) ? restaurant.sections : [];
          const section = sections.find(s => s.name.toLowerCase() === tableInfo.sectionName.toLowerCase());
          if (section) {
            const unit = Array.isArray(section.units) ? section.units.find(u => u.name === tableInfo.tableNumber) : null;
            if (unit) {
              tableInfo.tableId = `${section.name}:${unit.name}`;
              tableInfo.sectionName = section.name;
              tableInfo.tableNumber = unit.name;
              sessionStorage.setItem("selectedTable", JSON.stringify(tableInfo));
            }
          }
        }
      }
    } catch (_) {}
  }, [restaurantData]);

  const totalPages = Math.max(
    1,
    Math.ceil(combinedOrders.length / itemsPerPage)
  );
  const orders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return combinedOrders.slice(start, start + itemsPerPage);
  }, [combinedOrders, currentPage, itemsPerPage]);
   const loading = pendingLoading || preparingLoading || completedLoading || restaurantLoading;
   const error =
     pendingError || preparingError || completedError || restaurantError
       ? getFriendlyOrderError(
           pendingErrorObj || preparingErrorObj || completedErrorObj || restaurantError,
           "fetch"
         )
       : null;

  // Update bill modal live
  useEffect(() => {
    if (orderForBillModal && combinedOrders.length) {
      const updated = combinedOrders.find(
        (o) => o._id === orderForBillModal._id
      );
      setOrderForBillModal(updated ?? null);
    }
  }, [combinedOrders, orderForBillModal]);

  useEffect(() => {
    if (!sseOrders.length) return;

    const fetchedOrderMap = new Map(
      [...pendingOrders, ...preparingOrders, ...readyOrders, ...completedOrders]
        .map((order) => [getOrderIdValue(order), order])
        .filter(([id]) => Boolean(id))
    );
    if (!fetchedOrderMap.size) return;

    setSseOrders((prev) =>
      prev.filter((order) => {
        const id = getOrderIdValue(order);
        const fetchedOrder = fetchedOrderMap.get(id);
        if (!id || !fetchedOrder) return true;
        return (
          String(fetchedOrder?.status || "").toLowerCase() !==
          String(order?.status || "").toLowerCase()
        );
      })
    );
  }, [pendingOrders, preparingOrders, readyOrders, completedOrders, sseOrders.length]);

  useEffect(() => {
    if (!showCreateOrder || urlOrderId) return;
    const tableId = searchParams.get("tableId");
    if (!tableId) return;

    try {
      if (sessionStorage.getItem("selectedTable") || sessionStorage.getItem(ORDER_PANEL_DRAFT_KEY)) {
        return;
      }

      const [sectionName = "", tableNumber = ""] = tableId.split(":");
      sessionStorage.setItem(
        "selectedTable",
        JSON.stringify({
          tableId,
          sectionName,
          tableNumber,
        })
      );
    } catch (_) { /* ignore storage errors */ }
  }, [searchParams, showCreateOrder, urlOrderId]);

  // ── Re-fetch order from API when URL has orderId but no local data ──
  useEffect(() => {
    if (!showCreateOrder || !urlOrderId) return;
    // Only try to fetch if sessionStorage doesn't have editingOrder data
    try {
      const stored = sessionStorage.getItem("editingOrder");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?._id) {
          setUrlFetchedOrder(parsed);
          return;
        }
      }
    } catch (_) {}
    // No sessionStorage data — fetch from API using URL orderId
    setIsUrlFetching(true);
    fetchOrderById(urlOrderId).then(({ data }) => {
      if (data?._id) {
        setUrlFetchedOrder(data);
        // Also restore selectedTable from URL if available
        const tableId = searchParams.get("tableId");
        if (tableId) {
          try {
            sessionStorage.setItem("selectedTable", JSON.stringify({
              tableId,
              tableNumber: tableId.split(":")[1] || "",
              sectionName: tableId.split(":")[0] || "",
            }));
          } catch (_) {}
        }
      }
    }).catch(() => {
      // Silent fail — will show empty panel if API fails
    }).finally(() => {
      setIsUrlFetching(false);
    });
  }, [showCreateOrder, urlOrderId, fetchOrderById, searchParams]);

  // Update Order
  const updateOrder = async (orderId, updatedData) => {
    const orderIdString = String(orderId);
    const nextStatus = String(updatedData?.status || "").toLowerCase();
    const currentOrder = combinedOrders.find(
      (order) => getOrderIdValue(order) === orderIdString
    );
    const previousPreparingStartedAt = getOrderPreparingStartedAt(currentOrder);
    const optimisticTimestamp = Date.now();

    try {
      if (nextStatus === "preparing") {
        const preparingStartedAtMs =
          previousPreparingStartedAt ||
          rememberOrderPreparingStartedAt(orderIdString, optimisticTimestamp);

        setSseOrders((prev) => {
          const existingOverlay = prev.find(
            (order) => getOrderIdValue(order) === orderIdString
          );
          const remainingOrders = prev.filter(
            (order) => getOrderIdValue(order) !== orderIdString
          );
          const baseOrder = existingOverlay || currentOrder || {};

          return [
            mergeOrderData(baseOrder, {
              ...updatedData,
              _id: orderIdString,
              createdAt:
                baseOrder?.createdAt || currentOrder?.createdAt || new Date().toISOString(),
              preparingStartedAt: preparingStartedAtMs
                ? new Date(preparingStartedAtMs).toISOString()
                : undefined,
            }),
            ...remainingOrders,
          ].slice(0, combinedFetchLimit);
        });
      } else if (nextStatus) {
        clearOrderPreparingStartedAt(orderIdString);

        setSseOrders((prev) =>
          prev.filter((order) => getOrderIdValue(order) !== orderIdString)
        );
      }

      // If status is changing to "ready", mark all items as ready
      if (nextStatus === "ready" && currentOrder?.items) {
        try {
          await Promise.all(
            currentOrder.items
              .filter(item => item._id && !item.isReady)
              .map(item =>
                toggleItemReadyApi({
                  orderId: orderIdString,
                  itemId: item._id
                }).unwrap()
              )
          );
        } catch (err) {
          console.error("Failed to mark all items as ready:", err);
        }
      }

      await updateOrderApi({
        orderId: orderIdString,
        updatedData
      }).unwrap();

      if (
        typeof window !== "undefined" &&
        nextStatus &&
        !["pending", "preparing"].includes(nextStatus)
      ) {
        localStorage.removeItem(`bill-item-checks:${orderIdString}`);
      }

      notify("Order updated successfully!", "success");
      refetchPendingOrders();
      refetchPreparingOrders();
      refetchReadyOrders();
      refetchCompletedOrders();
      setEditingOrder(null);
    } catch (err) {
      if (previousPreparingStartedAt) {
        rememberOrderPreparingStartedAt(orderIdString, previousPreparingStartedAt);
      } else {
        clearOrderPreparingStartedAt(orderIdString);
      }

      refetchPendingOrders();
      refetchPreparingOrders();
      refetchReadyOrders();
      refetchCompletedOrders();
      console.error("Update order error:", err);
      notify(getFriendlyOrderError(err, "update"), "error");
    }
  };

  // Delete Order
  const deleteOrder = async (orderId) => {
    try {
      await deleteOrderApi(orderId).unwrap();
      notify("Order deleted successfully!", "success");
      refetchPendingOrders();
      refetchPreparingOrders();
      refetchReadyOrders();
      refetchCompletedOrders();
      setShowConfirmDelete(null);
    } catch (err) {
      notify(getFriendlyOrderError(err, "delete"), "error");
    }
  };

  // Function to handle customizations click
  const handleCustomizationsClick = (order) => {
    if (order && getOrderItemsList(order).length > 0) {
      setSelectedOrderForCustomizations(order);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // ---
  // --- Layout View callbacks ---
  // 🔧 FIX: Backend Order.source uses sectionName & unitName (not section/number)
  const resolveOrderByTableInfo = useCallback((tableInfo) => {
    if (!tableInfo) return null;
    const currentOrderId = tableInfo.currentOrderId || tableInfo.orderId;
    const unitId = tableInfo.unitId;
    const unitName = tableInfo.tableNumber;
    const sectionName = tableInfo.sectionName;
    return combinedOrders.find((o) => {
      // Priority 1: Match by currentOrderId (MongoDB _id) — most reliable
      if (currentOrderId && String(o._id || o.id || o.orderId) === String(currentOrderId)) return true;
      // Priority 2: Match by unitId
      if (unitId && o.source?.unitId && String(o.source.unitId) === String(unitId)) return true;
      // Priority 3: Match by sectionName + unitName
      if (sectionName && unitName &&
          String(o.source?.sectionName || "").toLowerCase() === String(sectionName).toLowerCase() &&
          String(o.source?.unitName || "").toLowerCase() === String(unitName).toLowerCase()) return true;
      return false;
    });
  }, [combinedOrders]);

  const handleViewOrder = useCallback(async (tableInfo) => {
    const orderId = tableInfo?.currentOrderId || tableInfo?.orderId;
    if (!orderId) return;
    try {
      const orderToBill = await fetchOrderById(orderId).unwrap();
      if (orderToBill?._id) {
        setOrderForBillModal(orderToBill);
        setBillModalAutoPrint(false);
        return;
      }
    } catch (_) {
      const order = resolveOrderByTableInfo(tableInfo);
      if (order) {
        setOrderForBillModal(order);
        setBillModalAutoPrint(false);
        return;
      }
    }
    notify("Order details not found. Try refreshing.", "error");
  }, [resolveOrderByTableInfo, notify, fetchOrderById]);

  const handlePrintBillFromLayout = useCallback(async (tableInfo) => {
    const orderId = tableInfo?.currentOrderId || tableInfo?.orderId;
    if (!orderId) return;
    try {
      const orderToBill = await fetchOrderById(orderId).unwrap();
      if (orderToBill?._id) {
        setOrderForBillModal(orderToBill);
        setBillModalAutoPrint(false);
        return;
      }
    } catch (_) {
      const order = resolveOrderByTableInfo(tableInfo);
      if (order) {
        setOrderForBillModal(order);
        setBillModalAutoPrint(false);
        return;
      }
    }
    notify("Bill not found for this unit. Try refreshing.", "error");
  }, [resolveOrderByTableInfo, notify, fetchOrderById]);

  const handlePayOrderFromLayout = useCallback(async (tableInfo) => {
    const orderId = tableInfo?.currentOrderId || tableInfo?.orderId;
    if (!orderId) {
      notify("Billed order not found for this unit. Try refreshing.", "error");
      return;
    }

    try {
      const freshOrder = await fetchOrderById(orderId).unwrap();
      const orderToPay = freshOrder?._id ? freshOrder : resolveOrderByTableInfo(tableInfo);
      if (orderToPay?._id) {
        setPayModalOrder(orderToPay);
        return;
      }
    } catch (_) {
      const order = resolveOrderByTableInfo(tableInfo);
      if (order?._id) {
        setPayModalOrder(order);
        return;
      }
    }

    notify("Billed order not found for this unit. Try refreshing.", "error");
  }, [fetchOrderById, notify, resolveOrderByTableInfo]);

  const handleCreateOrderFromLayout = useCallback((tableInfo) => {
    if (tableInfo?.unitType === "ROOM") {
      notify("Room must be booked first before creating a room order.", "error");
      return;
    }
    try {
      sessionStorage.removeItem("editingOrder");
      sessionStorage.removeItem(ORDER_PANEL_DRAFT_KEY);
      sessionStorage.setItem(ORDER_PANEL_FRESH_CREATE_KEY, "1");
      sessionStorage.setItem("selectedTable", JSON.stringify(tableInfo));
    } catch (_) { /* ignore */ }
    setUrlFetchedOrder(null);
    setEditingOrder(null);
    dispatch(clearCart());
    setSearchParams({ view: "create", tableId: tableInfo.tableId || tableInfo.tableNumber });
  }, [dispatch, notify, setSearchParams]);

  // Pending row edit must use fresh GET /order/:orderId data, not cached table data.
  const handleEditTableRow = useCallback(async (order) => {
    const orderId = order?._id || order?.id || order?.orderId;
    if (!orderId) {
      notify("Order id missing. Try refreshing.", "error");
      return;
    }
    try {
      const freshOrder = await fetchOrderById(orderId).unwrap();
      if (freshOrder?._id) {
        sessionStorage.removeItem("editingOrder");
        sessionStorage.removeItem("selectedTable");
        sessionStorage.removeItem(ORDER_PANEL_DRAFT_KEY);
        setUrlFetchedOrder(null);
        setSearchParams({});
        setEditingOrder(freshOrder);
        return;
      }
      notify("Fresh order data not found. Try refreshing.", "error");
    } catch (err) {
      notify(getFriendlyOrderError(err, "fetch"), "error");
    }
  }, [fetchOrderById, notify, setSearchParams]);

  const closeEditOrder = useCallback(() => {
    setEditingOrder(null);
    dispatch(clearCart());
  }, [dispatch]);

  const clearNewItemsFlag = useCallback((orderId) => {
    if (!orderId) return;
    setNewlyAddedItemsOrderIds((prev) => {
      const oid = String(orderId);
      if (!prev.has(oid)) return prev;
      const next = new Set(prev);
      next.delete(oid);
      return next;
    });
  }, []);

  const clearNewItemsForOrder = useCallback((orderId) => {
    if (!orderId) return;
    setNewItemsByOrderId((prev) => {
      const next = new Map(prev);
      next.delete(String(orderId));
      return next;
    });
  }, [setNewItemsByOrderId]);

  useEffect(() => {
    const activeId = getOrderIdValue(editingOrder) || 
                     getOrderIdValue(selectedOrderForCustomizations) || 
                     getOrderIdValue(orderForBillModal) || 
                     getOrderIdValue(payModalOrder);
    if (activeId) {
      clearNewItemsFlag(activeId);
    }
  }, [editingOrder, selectedOrderForCustomizations, orderForBillModal, payModalOrder, clearNewItemsFlag]);

  // Track previous active order being viewed/edited to clear its new items on close/exit
  const prevActiveOrderIdRef = React.useRef(null);
  useEffect(() => {
    const activeId = getOrderIdValue(editingOrder) || getOrderIdValue(urlFetchedOrder);
    if (!activeId && prevActiveOrderIdRef.current) {
      clearNewItemsForOrder(prevActiveOrderIdRef.current);
    }
    prevActiveOrderIdRef.current = activeId;
  }, [editingOrder, urlFetchedOrder, clearNewItemsForOrder]);

  // 🔧 FIX: Store orderId in URL so data survives page refresh
  const handleEditOrderFromLayout = useCallback(async (tableInfo) => {
    const orderId = tableInfo?.currentOrderId || tableInfo?.orderId;
    if (!orderId) {
      if (tableInfo?.unitType === "ROOM") {
        notify("Book the room first, then edit the room order from layout.", "error");
      }
      return;
    }
    try {
      const { data: freshOrder } = await fetchOrderById(orderId);
      if (freshOrder?._id) {
        try {
          sessionStorage.setItem("selectedTable", JSON.stringify(tableInfo));
          // Keep editingOrder in sessionStorage as fast cache for first visit
          sessionStorage.setItem("editingOrder", JSON.stringify(freshOrder));
        } catch (_) {}
        // ✅ Include orderId in URL params — survives page refresh
        setSearchParams({
          view: "create",
          tableId: tableInfo.tableId || tableInfo.tableNumber,
          orderId: orderId,
        });
        return;
      }
    } catch (_) {
      // fallback: don't navigate if API fails
    }
    const order = resolveOrderByTableInfo(tableInfo);
    if (order) {
      try {
        sessionStorage.setItem("selectedTable", JSON.stringify(tableInfo));
        sessionStorage.setItem("editingOrder", JSON.stringify(order));
      } catch (_) {}
      setSearchParams({
        view: "create",
        tableId: tableInfo.tableId || tableInfo.tableNumber,
        orderId: orderId,
      });
    } else {
      notify("Order not found for editing. Try refreshing.", "error");
    }
  }, [resolveOrderByTableInfo, notify, setSearchParams, fetchOrderById]);

  const handleMoveOrderFromLayout = useCallback((tableInfo) => {
    if (!tableInfo?.currentOrderId && !tableInfo?.orderId) return;
    const order = resolveOrderByTableInfo(tableInfo);
    if (order) {
      setMoveModalOrder(order);
    } else {
      notify("Order not found for moving. Try refreshing.", "error");
    }
  }, [resolveOrderByTableInfo, notify]);

  const handleBookRoom = useCallback(async (payload, roomInfo) => {
    if (!roomInfo?.unitId) {
      notify("Room information missing. Cannot book.", "error");
      return;
    }
    setRoomActionLoadingId(roomInfo.unitId);
    try {
      const requestBody = {
        unitId: roomInfo.unitId,
        customerName: payload.customerName || payload.guest?.name,
        customerPhone: payload.customerPhone || payload.guest?.phone,
      };
      await bookRoomApi(requestBody).unwrap();
      notify(`Room ${roomInfo.tableNumber} booked successfully`, "success");
      refetchLiveUnits?.();
      refetchPendingOrders?.();
      refetchPreparingOrders?.();
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Failed to book room";
      notify(msg, "error");
      throw err;
    } finally {
      setRoomActionLoadingId(null);
    }
  }, [bookRoomApi, notify, refetchLiveUnits, refetchPendingOrders, refetchPreparingOrders]);

  const handleCheckoutRoom = useCallback(async (roomInfo) => {
    if (!roomInfo) {
      return notify("Room information missing", "error");
    }

    // 🔧 FIX: Order.source uses sectionName & unitName (not section/number)
    const bookingOrder = combinedOrders.find((o) => {
      const src = o.source || {};
      const matchesByUnitId =
        roomInfo.unitId && src.unitId && String(src.unitId) === String(roomInfo.unitId);
      const matchesByName =
        roomInfo.sectionName && roomInfo.tableNumber &&
        String(src.sectionName || "").toLowerCase() === String(roomInfo.sectionName || "").toLowerCase() &&
        String(src.unitName || "").toLowerCase() === String(roomInfo.tableNumber || "").toLowerCase();

      return (matchesByUnitId || matchesByName) && o.stay?.enabled === true;
    });

    const orderId =
      bookingOrder?._id ||
      bookingOrder?.id ||
      roomInfo?.orderId ||
      roomInfo?.currentOrderId;

    if (!orderId) {
      return notify("No valid room booking order found for checkout.", "error");
    }

    setRoomActionLoadingId(roomInfo.unitId);
    try {
      await checkoutOrderApi(orderId).unwrap();
      notify(`Room ${roomInfo.tableNumber} checked out successfully`, "success");

      refetchLiveUnits?.();
      refetchPendingOrders?.();
      refetchPreparingOrders?.();
      refetchReadyOrders?.();
      refetchCompletedOrders?.();
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Failed to checkout room";
      notify(msg, "error");
    } finally {
      setRoomActionLoadingId(null);
    }
  }, [combinedOrders, checkoutOrderApi, notify, refetchLiveUnits, refetchPendingOrders, refetchPreparingOrders, refetchReadyOrders, refetchCompletedOrders]);

  const handleBookRoomPrompt = useCallback(async (payload, roomInfo) => {
    if (!roomInfo?.unitId) {
      console.error("Missing unitId in roomInfo", roomInfo);
      throw new Error("Missing unitId");
    }
    setRoomActionLoadingId(roomInfo.unitId);
    try {
      const requestBody = {
        unitId: roomInfo.unitId,
        customerName: payload.customerName || payload.guest?.name,
        customerPhone: payload.customerPhone || payload.guest?.phone,
      };
      console.log("Calling book-room with:", requestBody);
      await bookRoomApi(requestBody).unwrap();
      notify(`Room ${roomInfo.tableNumber} booked`, "success");

      refetchLiveUnits?.();
      refetchPendingOrders?.();
      refetchPreparingOrders?.();
    } catch (err) {
      console.error("Book room API error:", err);
      const message = err?.data?.message || err?.data?.error || err?.message || "Booking failed";
      notify(message, "error");
      throw err;
    } finally {
      setRoomActionLoadingId(null);
    }
  }, [bookRoomApi, notify, refetchLiveUnits, refetchPendingOrders, refetchPreparingOrders]);

  const pageNumbers = useMemo(
    () => getCompactPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (editingOrder) {
    return (
      <div className={`h-screen flex flex-col overflow-hidden ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
        <div className={`flex items-center gap-3 px-4 py-3 border-b shrink-0 ${isDarkMode ? "bg-[#0f172a] border-slate-700/60" : "bg-white border-[#ede8e3]"}`}>
          <button
            onClick={() => {
              closeEditOrder();
              refetchPendingOrders();
              refetchPreparingOrders();
              refetchReadyOrders();
              refetchCompletedOrders();
            }}
            className={`flex items-center gap-1.5 text-sm font-extrabold transition-colors ${isDarkMode ? "text-orange-400 hover:text-orange-350" : "text-orange-700 hover:text-orange-850"}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Live Orders
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={
            <div className={`flex h-full items-center justify-center ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
              <div className="h-8 w-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            </div>
          }>
            <AdminOrderPanel
              asModal={true}
              isDarkMode={isDarkMode}
              editingOrder={editingOrder}
              onOrderSuccess={(mode) => {
                closeEditOrder();
                refetchPendingOrders();
                refetchPreparingOrders();
                refetchReadyOrders();
                refetchCompletedOrders();
                if (mode === "print_bill") {
                  setViewMode("layout");
                  localStorage.setItem("orderViewMode", "layout");
                  notify("Order billed successfully!", "success");
                } else if (mode === "save") {
                  notify("Order saved successfully!", "success");
                } else if (mode === "kot") {
                  notify("KOT generated and items added successfully!", "success");
                }
              }}
            />
          </Suspense>
        </div>
      </div>
    );
  }


  if (showCreateOrder) {
    return (
      <div className={`h-screen flex flex-col overflow-hidden ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
        <div className={`flex items-center gap-3 px-4 py-3 border-b shrink-0 ${isDarkMode ? "bg-[#0f172a] border-slate-700/60" : "bg-white border-[#ede8e3]"}`}>
          <button
            onClick={() => {
              closeCreateOrder();
              refetchPendingOrders();
              refetchPreparingOrders();
              refetchReadyOrders();
              refetchCompletedOrders();
            }}
            className={`flex items-center gap-1.5 text-sm font-extrabold transition-colors ${isDarkMode ? "text-orange-400 hover:text-orange-350" : "text-orange-700 hover:text-orange-850"}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Live Orders
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={
            <div className={`flex h-full items-center justify-center ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
              <div className="h-8 w-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            </div>
          }>
            {isUrlFetching ? (
              <div className={`flex h-full items-center justify-center ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
                <div className="text-center">
                  <div className="h-8 w-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mx-auto mb-3" />
                  <p className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>
                    Loading order details...
                  </p>
                </div>
              </div>
            ) : (
              <AdminOrderPanel
                asModal={true}
                isDarkMode={isDarkMode}
                editingOrder={editingOrder || urlFetchedOrder || (urlOrderId ? (() => {
                  try {
                    const s = sessionStorage.getItem("editingOrder");
                    if (s) {
                      const p = JSON.parse(s);
                      // Keep in sessionStorage as cache for this session
                      return p;
                    }
                  } catch(_) {}
                  return null;
                })() : null)}
                onOrderSuccess={(mode) => {
                  closeCreateOrder();
                  refetchPendingOrders();
                  refetchPreparingOrders();
                  refetchReadyOrders();
                  refetchCompletedOrders();
                  if (mode === "print_bill") {
                    setViewMode("layout");
                    localStorage.setItem("orderViewMode", "layout");
                    notify("Order billed successfully!", "success");
                  } else if (mode === "save") {
                    notify("Order saved successfully!", "success");
                  } else if (mode === "kot") {
                    notify("KOT generated and items added successfully!", "success");
                  }
                }}
              />
            )}
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-5 ${isDarkMode ? "bg-[#0f172a]" : "bg-[#fbfaf8]"}`}>

      {/* ── Header bar ── */}
      <div
        data-tour="orders-heading"
        className="mb-4 flex flex-shrink-0 flex-col gap-3.5 px-1 py-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-2.5">
          <Heading title="Live Orders" showDot />
        </div>
        <div className="flex w-full items-center justify-between gap-2.5 sm:w-auto sm:justify-end sm:gap-3">
          {/* ── View Toggle ── */}
          <div className={`flex items-center rounded-2xl border p-1 shadow-sm ${isDarkMode ? "border-slate-700 bg-slate-800" : "border-[#ede8e3] bg-white"}`}>
            <button
              onClick={() => { localStorage.setItem("orderViewMode", "table"); setViewMode("table"); }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all sm:text-sm whitespace-nowrap shrink-0 ${
                viewMode === "table"
                  ? isDarkMode ? "bg-orange-950/30 border border-orange-500/50 text-orange-400" : "bg-orange-50 border border-orange-200/80 text-orange-700 font-extrabold shadow-sm"
                  : isDarkMode
                    ? "text-slate-400 border border-transparent hover:text-slate-200"
                    : "text-[#57524e] border border-transparent hover:text-[#1c1917]"
              }`}
              title="Table View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              <span>Table</span>
            </button>
            <button
              onClick={() => { localStorage.setItem("orderViewMode", "layout"); setViewMode("layout"); }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all sm:text-sm whitespace-nowrap shrink-0 ${
                viewMode === "layout"
                  ? isDarkMode ? "bg-orange-950/30 border border-orange-500/40 text-orange-400" : "bg-orange-50 border border-orange-200/80 text-orange-700 font-extrabold shadow-sm"
                  : isDarkMode
                    ? "text-slate-400 border border-transparent hover:text-slate-200"
                    : "text-[#57524e] border border-transparent hover:text-[#1c1917]"
              }`}
              title="Layout View"
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>Layout</span>
            </button>
          </div>
          {/* ── Create Order Button (right side) ── */}
          <button
            onClick={() => setSearchParams({ view: "create" })}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition-all sm:text-sm shadow-sm active:scale-[0.97] whitespace-nowrap shrink-0 ${
              isDarkMode
                ? "bg-orange-950/20 border border-orange-500/35 text-orange-400 hover:bg-orange-950/40"
                : "bg-[#fff8f5] border border-orange-200 text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300"
            }`}
            title="Create New Order"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* ── Content Area (Table View or Layout View) ── */}
      {viewMode === "layout" ? (
        <div className="flex-1 min-h-0 overflow-auto">
          <Suspense
            fallback={
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`h-12 w-full rounded-lg animate-pulse ${isDarkMode ? "bg-slate-700/50" : "bg-[#f7f3ef]"}`} />
                ))}
              </div>
            }
          >
            <LayoutView
              sections={layoutSections}
              isLoading={restaurantLoading}
              error={
                restaurantError
                  ? getFriendlyOrderError(restaurantError, "fetch")
                  : null
              }
              onRetry={refetchRestaurant}
              isDarkMode={isDarkMode}
               onViewOrder={handleViewOrder}
               onCreateOrder={handleCreateOrderFromLayout}
               onEditOrder={handleEditOrderFromLayout}
               onMoveOrder={handleMoveOrderFromLayout}
               onPayOrder={handlePayOrderFromLayout}
               onPrintBill={handlePrintBillFromLayout}
               onBookRoom={handleBookRoomPrompt}
               onCheckoutRoom={handleCheckoutRoom}
               roomActionLoadingId={roomActionLoadingId}
               newlyAddedItemsOrderIds={newlyAddedItemsOrderIds}
            />
          </Suspense>
        </div>
      ) : (
        <div
          data-tour="orders-table"
          className={`min-h-0 flex-1 overflow-hidden rounded-xl border ${
            isDarkMode
              ? "border-slate-700/60 bg-[#1e293b]"
              : "border-[#ede8e3] bg-white"
          }`}
        >
          <Suspense
            fallback={
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`h-12 w-full rounded-lg animate-pulse ${isDarkMode ? "bg-slate-700/50" : "bg-[#f7f3ef]"}`} />
                ))}
              </div>
            }
          >
            <OrdersTable
              orders={orders}
              loading={loading}
              error={error}
              setEditingOrder={handleEditTableRow}
              setShowConfirmDelete={setShowConfirmDelete}
              setOrderForBillModal={setOrderForBillModal}
              setPayModalOrder={setPayModalOrder}
              setMoveModalOrder={setMoveModalOrder}
              updateOrder={updateOrder}
              tableType="pending"
              onCustomizationsClick={handleCustomizationsClick}
              containerVariant="plain"
              isDarkMode={isDarkMode}
              newlyAddedItemsOrderIds={newlyAddedItemsOrderIds}
              latestOrderId={
                combinedOrders[0]?._id ||
                combinedOrders[0]?.id ||
                combinedOrders[0]?.orderId ||
                combinedOrders[0]?.createdAt
              }
            />
          </Suspense>
        </div>
      )}

      {/* ── Pagination (only in table view) ── */}
      {viewMode === "table" && (
        <div className="flex flex-shrink-0 justify-center pt-3 min-h-[44px]">
          {totalPages > 1 && (
          <div className="w-full max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Pagination className="min-w-max">
              <PaginationContent className={`w-max min-w-max gap-1 rounded-lg border px-2 py-1 ${isDarkMode ? "border-slate-700/60 bg-[#1e293b]" : "border-[#ede8e3] bg-white"}`}>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (currentPage > 1) handlePageChange(currentPage - 1); }}
                    className={`h-8 rounded-md border px-2 text-xs cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:h-8 sm:px-3 sm:text-sm sm:[&>span]:inline ${
                      currentPage === 1 ? "pointer-events-none opacity-40" : ""
                    } ${isDarkMode ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"}`}
                  />
                </PaginationItem>
                {pageNumbers.map((pageNum, index) => {
                  if (typeof pageNum === "string") {
                    return (
                      <PaginationItem key={`${pageNum}-${index}`}>
                        <PaginationEllipsis className="h-8 w-8" />
                      </PaginationItem>
                    );
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === pageNum}
                        className={`h-8 w-8 rounded-md border p-0 text-xs cursor-pointer sm:text-sm font-extrabold transition-all ${
                          currentPage === pageNum
                            ? isDarkMode
                              ? "bg-orange-950/30 border-orange-500/50 text-orange-400"
                              : "bg-orange-50 border border-orange-200 text-orange-700 font-extrabold shadow-sm"
                            : isDarkMode
                              ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                              : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"
                        }`}
                        onClick={(e) => { e.preventDefault(); handlePageChange(pageNum); }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) handlePageChange(currentPage + 1); }}
                    className={`h-8 rounded-md border px-2 text-xs cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:h-8 sm:px-3 sm:text-sm sm:[&>span]:inline ${
                      currentPage === totalPages ? "pointer-events-none opacity-40" : ""
                    } ${isDarkMode ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
      )}

      {/* ── Modals ── */}
      <Suspense fallback={null}>
        {selectedOrderForCustomizations && (
          <CustomizationsModal
            order={selectedOrderForCustomizations}
            onClose={() => setSelectedOrderForCustomizations(null)}
          />
        )}
        {orderForBillModal && (
          <ItemsModal
            order={orderForBillModal}
            restaurantDetails={restaurantData}
            autoPrint={billModalAutoPrint}
            onClose={() => {
              setOrderForBillModal(null);
              setBillModalAutoPrint(false);
            }}
          />
        )}
        {editingOrder && (
          <AdminOrderPanel
            asModal={true}
            isDarkMode={isDarkMode}
            editingOrder={editingOrder}
            onOrderSuccess={(mode) => {
              closeEditOrder();
              refetchPendingOrders();
              refetchPreparingOrders();
              refetchReadyOrders();
              if (mode === "print_bill") {
                setViewMode("layout");
                localStorage.setItem("orderViewMode", "layout");
                notify("Order billed successfully!", "success");
              } else if (mode === "save") {
                notify("Order saved successfully!", "success");
              } else if (mode === "kot") {
                notify("KOT generated and items added successfully!", "success");
              }
            }}
          />
        )}
        {showConfirmDelete && (
          <DeleteModal
            order={showConfirmDelete}
            onCancel={() => setShowConfirmDelete(null)}
            onDelete={() => deleteOrder(showConfirmDelete._id)}
          />
        )}
        {payModalOrder && (
          <PayModal
            order={payModalOrder}
            onClose={() => {
              setPayModalOrder(null);
              refetchPendingOrders();
              refetchPreparingOrders();
              refetchReadyOrders();
              refetchCompletedOrders();
              refetchLiveUnits?.();
            }}
          />
        )}
        {moveModalOrder && (
          <MoveTableModal
            order={moveModalOrder}
            onClose={() => {
              setMoveModalOrder(null);
              refetchPendingOrders();
              refetchPreparingOrders();
              refetchReadyOrders();
              refetchCompletedOrders();
              refetchLiveUnits?.();
            }}
          />
        )}
      </Suspense>
    </div>
  );
};

export default Orders;
