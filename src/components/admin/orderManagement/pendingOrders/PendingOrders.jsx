import React, { useEffect, useState, useMemo, useCallback, Suspense, lazy } from "react";
import { useDispatch } from "react-redux";
import { useNotification } from "../../Bell/NotificationContext";
import { ArrowLeft, LayoutGrid, Plus } from "lucide-react";
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
} from "../../../../redux/adminRedux/adminAPI";
import { clearCart } from "../../../../redux/clientRedux/clientSlice";

const Orders = () => {
  const { notify, sseEvent, sseConnected } = useNotification();
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
  const closeCreateOrder = () => setSearchParams({});

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
      !["NEW_ORDER", "ORDER_STATUS_CHANGED", "ORDER_UPDATED"].includes(sseEvent?.type) ||
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

      if (!["pending", "preparing"].includes(normalizedStatus)) {
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
      refetchRestaurant();
    }
  }, [sseEvent, combinedFetchLimit, refetchPendingOrders, refetchPreparingOrders, refetchReadyOrders, refetchRestaurant, sseConnected]);

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

  const combinedOrders = useMemo(() => {
    const orderMap = new Map();
    [...pendingOrders, ...preparingOrders, ...readyOrders].forEach((order) => {
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

    // Show all orders (pending, preparing, ready) in live view
    return Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [pendingOrders, preparingOrders, readyOrders, sseOrders]);

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
      units: (section.units || []).map((unit) => {
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
   const loading = pendingLoading || preparingLoading || restaurantLoading;
   const error =
     pendingError || preparingError || restaurantError
       ? getFriendlyOrderError(
           pendingErrorObj || preparingErrorObj || restaurantError,
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
      [...pendingOrders, ...preparingOrders]
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
  }, [pendingOrders, preparingOrders, sseOrders.length]);

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
  const handleViewOrder = useCallback((tableInfo) => {
    if (tableInfo?.orderId) {
      const section = tableInfo.sectionName || "";
      const number = Number(tableInfo.tableNumber);
      const order = combinedOrders.find((o) => {
        const src = o.source || {};
        return (
          String(src.section || "").toLowerCase() === String(section).toLowerCase() &&
          Number(src.number) === number
        );
      });
      if (order) {
        setOrderForBillModal(order);
        setBillModalAutoPrint(false);
      } else {
        notify("Order details not found. Try refreshing.", "error");
      }
    }
  }, [combinedOrders, notify]);

  const handlePrintBillFromLayout = useCallback((tableInfo) => {
    if (!tableInfo?.orderId) return;
    const section = tableInfo.sectionName || "";
    const number = Number(tableInfo.tableNumber);
    const order = combinedOrders.find((o) => {
      const src = o.source || {};
      return (
        String(src.section || "").toLowerCase() === String(section).toLowerCase() &&
        Number(src.number) === number
      );
    });
    if (order) {
      setOrderForBillModal(order);
      setBillModalAutoPrint(true);
    } else {
      notify("Bill not found for this unit. Try refreshing.", "error");
    }
  }, [combinedOrders, notify]);

  const handleCreateOrderFromLayout = useCallback((tableInfo) => {
    try {
      sessionStorage.setItem("selectedTable", JSON.stringify(tableInfo));
    } catch (_) { /* ignore */ }
    setSearchParams({ view: "create", tableId: tableInfo.tableId || tableInfo.tableNumber });
  }, [setSearchParams]);

  const closeEditOrder = useCallback(() => {
    setEditingOrder(null);
    dispatch(clearCart());
  }, [dispatch]);

  const handleEditOrderFromLayout = useCallback((tableInfo) => {
    if (tableInfo?.orderId) {
      const section = tableInfo.sectionName || "";
      const number = Number(tableInfo.tableNumber);
      const order = combinedOrders.find((o) => {
        const src = o.source || {};
        return (
          String(src.section || "").toLowerCase() === String(section).toLowerCase() &&
          Number(src.number) === Number(tableInfo.tableNumber)
        );
      });
      if (order) {
        setEditingOrder(order);
      } else {
        notify("Order not found for editing. Try refreshing.", "error");
      }
    }
  }, [combinedOrders, notify]);

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

    const bookingOrder = combinedOrders.find((o) => {
      const src = o.source || {};
      const matchesThisRoom =
        String(src.unitId || "") === String(roomInfo.unitId || "") ||
        (String(src.section || "").toLowerCase() === String(roomInfo.sectionName || "").toLowerCase() &&
         String(src.number) === String(roomInfo.tableNumber));

      return matchesThisRoom && o.stay?.enabled === true;
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
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Failed to checkout room";
      notify(msg, "error");
    } finally {
      setRoomActionLoadingId(null);
    }
  }, [combinedOrders, checkoutOrderApi, notify, refetchLiveUnits, refetchPendingOrders, refetchPreparingOrders, refetchReadyOrders]);

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
            }}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${isDarkMode ? "text-orange-400 hover:text-orange-300" : "text-orange-500 hover:text-orange-600"}`}
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
              onOrderSuccess={() => {
                closeEditOrder();
                refetchPendingOrders();
                refetchPreparingOrders();
                refetchReadyOrders();
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
            }}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${isDarkMode ? "text-orange-400 hover:text-orange-300" : "text-orange-500 hover:text-orange-600"}`}
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
              onOrderSuccess={() => {
                closeCreateOrder();
                refetchPendingOrders();
                refetchPreparingOrders();
                refetchReadyOrders();
              }}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen flex-col overflow-hidden px-3 py-3 ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>

      {/* ── Header bar ── */}
      <div
        data-tour="orders-heading"
        className="mb-2 flex flex-shrink-0 items-center justify-between gap-3 px-1 py-2"
      >
        <div className="flex items-center gap-2.5">
          <Heading title="Live Orders" showDot />
        </div>
        <div className="flex items-center gap-2">
          {/* ── View Toggle ── */}
          <div className={`flex items-center rounded-lg border p-0.5 ${isDarkMode ? "border-slate-700/60 bg-slate-800" : "border-[#ede8e3] bg-[#f7f3ef]"}`}>
            <button
              onClick={() => { localStorage.setItem("orderViewMode", "table"); setViewMode("table"); }}
              className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:px-2.5 sm:text-sm ${
                viewMode === "table"
                  ? "bg-orange-500 text-white shadow-sm"
                  : isDarkMode
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-[#78716c] hover:text-[#44403c]"
              }`}
              title="Table View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              <span>Table</span>
            </button>
            <button
              onClick={() => { localStorage.setItem("orderViewMode", "layout"); setViewMode("layout"); }}
              className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:px-2.5 sm:text-sm ${
                viewMode === "layout"
                  ? "bg-orange-500 text-white shadow-sm"
                  : isDarkMode
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-[#78716c] hover:text-[#44403c]"
              }`}
              title="Layout View"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Layout</span>
            </button>
          </div>
          {/* ── Create Order Button (right side) ── */}
          <button
            onClick={() => setSearchParams({ view: "create" })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:text-sm shadow-sm active:scale-[0.97] bg-orange-500 text-white hover:bg-orange-600`}
            title="Create New Order"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Order</span>
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
               onPrintBill={handlePrintBillFromLayout}
               onBookRoom={handleBookRoomPrompt}
               onCheckoutRoom={handleCheckoutRoom}
               roomActionLoadingId={roomActionLoadingId}
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
              setEditingOrder={setEditingOrder}
              setShowConfirmDelete={setShowConfirmDelete}
              setOrderForBillModal={setOrderForBillModal}
              updateOrder={updateOrder}
              tableType="pending"
              onCustomizationsClick={handleCustomizationsClick}
              containerVariant="plain"
              isDarkMode={isDarkMode}
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
                        className={`h-8 w-8 rounded-md border p-0 text-xs cursor-pointer sm:text-sm ${
                          currentPage === pageNum
                            ? "bg-orange-500 text-white border-orange-500"
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
            onOrderSuccess={() => {
              closeEditOrder();
              refetchPendingOrders();
              refetchPreparingOrders();
              refetchReadyOrders();
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
      </Suspense>
    </div>
  );
};

export default Orders;