import React, { useEffect, useState, useMemo, useRef, Suspense, lazy } from "react";
import { useNotification } from "../../Bell/NotificationContext";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const OrdersTable = lazy(() => import("./OrdersTable"));
const EditOrderModal = lazy(() => import("./EditOrderModal"));
const DeleteModal = lazy(() => import("./DeleteModal"));
const ItemsModal = lazy(() => import("../commonOrderFile/ItemsModal"));
const CustomizationsModal = lazy(() => import("./CustomizationsModal"));

import {
  useGetOrdersQuery,
  useGetMenuQuery,
  useGetRestaurantProfileQuery,
  useUpdateOrderMutation,
  useDeleteOrderMutation
} from "../../../../redux/adminRedux/adminAPI";

const Orders = () => {
  const { notify } = useNotification();

  const RefreshIcon = ({ size = 16, className = "" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  );

  // --- Local States ---
  const [currentPage, setCurrentPage] = useState(1);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [orderForBillModal, setOrderForBillModal] = useState(null);
  const [selectedOrderForCustomizations, setSelectedOrderForCustomizations] = useState(null);
  const [isRefreshCoolingDown, setIsRefreshCoolingDown] = useState(false);
  const refreshCooldownRef = useRef(null);
  const [autoRefresh, setAutoRefresh] = useState(
    () => {
      const saved = localStorage.getItem("autoRefresh");
      return ["OFF", "1", "2", "5"].includes(saved) ? saved : "OFF";
    }
  );
  const itemsPerPage = 10;
  const combinedFetchLimit = itemsPerPage * 25;
  const autoRefreshMinutes = useMemo(() => {
    if (autoRefresh === "OFF") return 0;
    const mins = parseInt(autoRefresh, 10);
    return Number.isNaN(mins) ? 0 : mins;
  }, [autoRefresh]);
  const pollingIntervalMs = autoRefreshMinutes > 0 ? autoRefreshMinutes * 60 * 1000 : 0;

  // --- RTK Query Hook with API parameters ---
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
      pollingInterval: pollingIntervalMs,
      refetchOnFocus: true,
      refetchOnReconnect: true,
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
      pollingInterval: pollingIntervalMs,
      refetchOnFocus: true,
      refetchOnReconnect: true,
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
    pollingInterval: pollingIntervalMs,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  
  const [updateOrderApi] = useUpdateOrderMutation();
  const [deleteOrderApi] = useDeleteOrderMutation();

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
  const combinedOrders = useMemo(() => {
    const orderMap = new Map();
    [...pendingOrders, ...preparingOrders].forEach((order) => {
      const key = order?._id || order?.id || order?.orderId || order?.createdAt;
      if (!key) return;
      orderMap.set(key, order);
    });

    return Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [pendingOrders, preparingOrders]);

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

  // Manual Refresh
  const handleManualRefresh = async () => {
    try {
      await refetchPendingOrders();
      await refetchPreparingOrders();
      await refetchRestaurant(); // ✅ Restaurant profile bhi refresh karein
      notify("Orders & Restaurant data refreshed", "success");
    } catch (err) {
      notify(getFriendlyOrderError(err, "refresh"), "error");
    }
  };
  const handleDebouncedRefresh = () => {
    if (isRefreshCoolingDown) return;

    setIsRefreshCoolingDown(true);
    handleManualRefresh();

    if (refreshCooldownRef.current) {
      clearTimeout(refreshCooldownRef.current);
    }

    refreshCooldownRef.current = setTimeout(() => {
      setIsRefreshCoolingDown(false);
      refreshCooldownRef.current = null;
    }, 2000);
  };

  // Update Order
  const updateOrder = async (orderId, updatedData) => {
    try {
      // ✅ FIX: Ensure orderId is a string
      const orderIdString = String(orderId);
      
      // console.log("Updating order:", { orderIdString, updatedData });
      
      // ✅ FIX: Call API with correct parameters
      await updateOrderApi({ 
        orderId: orderIdString, 
        updatedData 
      }).unwrap();
      
      const nextStatus = String(updatedData?.status || "").toLowerCase();
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
      setEditingOrder(null);
    } catch (err) {
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
      setShowConfirmDelete(null);
    } catch (err) {
      notify(getFriendlyOrderError(err, "delete"), "error");
    }
  };

  // Function to handle customizations click
  const handleCustomizationsClick = (order) => {
    if (order && order.items) {
      setSelectedOrderForCustomizations(order);
    }
  };

  // --- Auto Refresh ---
  const handleAutoRefreshChange = (value) => {
    setAutoRefresh(value);
    localStorage.setItem("autoRefresh", value);

    if (value === "OFF") {
      notify("Auto-refresh turned off", "info");
      return;
    }

    notify(`Auto-refresh set to every ${value} min`, "success");
    refetchPendingOrders();
    refetchPreparingOrders();
    refetchRestaurant();
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

  useEffect(() => {
    return () => {
      if (refreshCooldownRef.current) {
        clearTimeout(refreshCooldownRef.current);
      }
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30 sm:px-2 lg:px-2">
      {/* Header */}
      <div className="mx-2 mb-2 mt-2 flex flex-shrink-0 flex-row items-center justify-between gap-2 rounded-2xl border border-orange-100 bg-white/95 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:mx-4">
        <Heading title="Pending Orders" />

        <div className="flex items-center gap-2">
          <button
            onClick={handleDebouncedRefresh}
            disabled={isRefreshCoolingDown}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white ${
              isRefreshCoolingDown ? "pointer-events-none" : ""
            }`}
          >
            <RefreshIcon size={16} />
            <span className="hidden text-xs sm:inline">Refresh</span>
          </button>

          {/* Auto Refresh */}
          <Select
            value={autoRefresh}
            onValueChange={handleAutoRefreshChange}
          >
            <SelectTrigger className="h-10 w-[130px] rounded-xl border border-orange-200 bg-white px-3 text-xs font-semibold uppercase text-gray-700 shadow-sm transition-all outline-none hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200">
              <SelectValue placeholder="Auto Refresh" />
            </SelectTrigger>

            <SelectContent className="min-w-[130px] cursor-pointer rounded-xl border border-orange-200 bg-white p-1 shadow-xl">
              <SelectGroup>
                <SelectItem value="OFF" className="cursor-pointer rounded-lg text-xs font-medium text-gray-700 hover:bg-orange-100 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Off</SelectItem>
                <SelectItem value="1" className="cursor-pointer rounded-lg text-xs font-medium text-gray-700 hover:bg-orange-100 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Every 1 min</SelectItem>
                <SelectItem value="2" className="cursor-pointer rounded-lg text-xs font-medium text-gray-700 hover:bg-orange-100 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Every 2 min</SelectItem>
                <SelectItem value="5" className="cursor-pointer rounded-lg text-xs font-medium text-gray-700 hover:bg-orange-100 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Every 5 min</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="mx-2 mt-2 flex-1 overflow-auto rounded-2xl border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:mx-4 sm:mt-4">
        <Suspense
          fallback={
            <div className="min-h-[420px] md:min-h-[520px] p-4">
              <div className="h-6 w-40 rounded bg-orange-100/80 dark:bg-slate-800/80" />
              <div className="mt-4 h-4 w-full rounded bg-orange-100/70 dark:bg-slate-800/70" />
              <div className="mt-2 h-4 w-full rounded bg-orange-100/70 dark:bg-slate-800/70" />
              <div className="mt-2 h-4 w-full rounded bg-orange-100/70 dark:bg-slate-800/70" />
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
            latestOrderId={
              combinedOrders[0]?._id ||
              combinedOrders[0]?.id ||
              combinedOrders[0]?.orderId ||
              combinedOrders[0]?.createdAt
            }
          />
        </Suspense>
      </div>

      {/* Server-side Pagination */}
      <div className="flex flex-shrink-0 justify-center px-2 py-2 min-h-[44px]">
        {totalPages > 1 && (
          <div className="w-full max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Pagination className="min-w-max">
              <PaginationContent className="w-max min-w-max gap-1 rounded-xl border border-orange-200 bg-white/95 px-1.5 py-1 shadow-sm sm:px-2">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={`h-7 rounded-md border border-orange-200 bg-white px-1.5 text-xs hover:bg-orange-50 cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:h-9 sm:rounded-lg sm:px-3 sm:text-sm sm:[&>span]:inline sm:[&_svg]:h-4 sm:[&_svg]:w-4 ${
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                />
              </PaginationItem>

              {pageNumbers.map((pageNum, index) => {
                if (typeof pageNum === "string") {
                  return (
                    <PaginationItem key={`${pageNum}-${index}`}>
                      <PaginationEllipsis className="h-7 w-7 cursor-pointer sm:h-9 sm:w-9" />
                    </PaginationItem>
                  );
                }

                return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === pageNum}
                        className={`h-7 w-7 rounded-md border border-orange-200 p-0 text-[11px] cursor-pointer sm:h-9 sm:w-9 sm:rounded-lg sm:text-sm ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 hover:from-orange-600 hover:to-orange-600"
                            : "bg-white text-gray-700 hover:bg-orange-50"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) handlePageChange(currentPage + 1);
                  }}
                  className={`h-7 rounded-md border border-orange-200 bg-white px-1.5 text-xs hover:bg-orange-50 cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:h-9 sm:rounded-lg sm:px-3 sm:text-sm sm:[&>span]:inline sm:[&_svg]:h-4 sm:[&_svg]:w-4 ${
                    currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                  }`}
                />
              </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Modals */}
      
      <Suspense fallback={null}>
        {/* Customizations Modal */}
        {selectedOrderForCustomizations && (
          <CustomizationsModal
            order={selectedOrderForCustomizations}
            onClose={() => setSelectedOrderForCustomizations(null)}
          />
        )}

        {/* Items Modal */}
        {orderForBillModal && (
          <ItemsModal
            order={orderForBillModal}
            restaurantDetails={restaurantData}
            onClose={() => setOrderForBillModal(null)}
          />
        )}

        {/* Edit Order Modal */}
        {editingOrder && (
          <EditOrderModal
            editingOrder={editingOrder}
            setEditingOrder={setEditingOrder}
            updateOrder={updateOrder}
            getFriendlyErrorMessage={getFriendlyOrderError}
            menuItems={menuItems}
            tables={tables} // ✅ Passing tables from restaurant profile
          />
        )}

        {/* Delete Modal */}
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
