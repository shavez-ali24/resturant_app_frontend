import React, { useEffect, useState, useMemo, Suspense, lazy } from "react";
import { useNotification } from "../../Bell/NotificationContext";
import { Plus, ArrowLeft } from "lucide-react";
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
const EditOrderModal = lazy(() => import("./EditOrderModal"));
const DeleteModal = lazy(() => import("./DeleteModal"));
const ItemsModal = lazy(() => import("../commonOrderFile/ItemsModal"));
const CustomizationsModal = lazy(() => import("./CustomizationsModal"));
const AdminOrderPanel = lazy(() => import("../../OrderPanel/AdminOrderPanel"));

import {
  useGetOrdersQuery,
  useGetMenuQuery,
  useGetRestaurantProfileQuery,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useToggleItemReadyMutation
} from "../../../../redux/adminRedux/adminAPI";

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
  const openCreateOrder = () => setSearchParams({ view: "create" });
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
  const [selectedOrderForCustomizations, setSelectedOrderForCustomizations] = useState(null);
  const [sseOrders, setSseOrders] = useState([]);
  const [autoRefresh] = useState(() => {
    const saved = localStorage.getItem("autoRefresh");
    return ["1", "2", "5"].includes(saved) ? saved : "1";
  });
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
    refetchPendingOrders();
    refetchPreparingOrders();
    refetchReadyOrders();
    refetchRestaurant();
  }, [sseEvent, combinedFetchLimit, refetchPendingOrders, refetchPreparingOrders, refetchReadyOrders, refetchRestaurant]);

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
      return "Session expired. Please login again.";
    }
    if (status === 403) {
      return "You do not have permission for this action.";
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
  // Aapke API response ke format ke hisab se adjust karna
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
          // capacity: 4
        });
      }
      return tables;
    }
    
    // Format 4: Agar koi aur field mein hai
    // Aapke API response ko check karke add karein
    // console.log("Restaurant Object for debugging:", restaurant);
    
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

  const pageNumbers = useMemo(
    () => getCompactPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
        <button
          data-tour="orders-create-btn"
          onClick={() => openCreateOrder()}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-600 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Order</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* ── Table card — flex-1 fills remaining height, no scroll on laptop ── */}
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

      {/* ── Pagination ── */}
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
            onClose={() => setOrderForBillModal(null)}
          />
        )}
        {editingOrder && (
          <EditOrderModal
            editingOrder={editingOrder}
            setEditingOrder={setEditingOrder}
            updateOrder={updateOrder}
            getFriendlyErrorMessage={getFriendlyOrderError}
            menuItems={menuItems}
            tables={tables}
            restaurantData={restaurantData}
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