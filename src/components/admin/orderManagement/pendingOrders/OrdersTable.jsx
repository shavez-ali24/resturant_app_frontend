// src/components/admin/orderManagement/OrdersTable.jsx
import React, { useState, Suspense, lazy } from "react";
import OrderRow from "./OrderRow";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { Utensils, House, Truck } from "lucide-react";
const CustomizationsModal = lazy(() => import("./CustomizationsModal"));
const PendingOrderMobileNote = lazy(() => import("./PendingOrderMobileNote"));
const PendingOrderMobileControls = lazy(() => import("./PendingOrderMobileControls"));
import {
  formatOrderTableId,
  getOrderTypeBadgeClass,
  getOrderTypeKey,
  getOrderTypeLabel,
  getStatusRowClass,
  isEatHereOrder,
} from "../commonOrderFile/utils";

// Utility function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

// Utility function to format time
const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const OrdersTable = ({
  orders,
  loading,
  error,
  setEditingOrder,
  setShowConfirmDelete,
  setOrderForBillModal,
  updateOrder,
  tableType,
  onCustomizationsClick,
  latestOrderId,
  containerVariant = "card",
}) => {
  const dispatch = useDispatch();
  const [selectedCustomizations, setSelectedCustomizations] = useState(null);
  const [seenBillOrderId, setSeenBillOrderId] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("billViewedOrderId") || "";
  });
  const columnCount = tableType === "pending" ? 8 : 6;
  const skeletonRows = Array.from({ length: 8 });
  const mobileSkeletons = Array.from({ length: 4 });

  // Function to handle customizations button click
  const handleCustomizationsClick = (customizations) => {
    if (customizations && customizations.trim() !== "") {
      setSelectedCustomizations(customizations);
    }
  };

  // Modal background click handler
  const handleModalClose = () => {
    setSelectedCustomizations(null);
  };

  const getOrderId = (order) =>
    order?._id || order?.id || order?.orderId || order?.createdAt || "";
  const latestId = latestOrderId ? String(latestOrderId) : "";
  const isLatestUnseen = (order) => {
    if (!latestId) return false;
    const id = String(getOrderId(order) || "");
    return id && id === latestId && id !== seenBillOrderId;
  };
  const markLatestSeen = (order) => {
    if (typeof window === "undefined") return;
    const id = String(getOrderId(order) || "");
    if (!id || id !== latestId) return;
    localStorage.setItem("billViewedOrderId", id);
    setSeenBillOrderId(id);
  };

  const containerClassName =
    containerVariant === "plain"
      ? "min-h-[460px] md:min-h-[560px] rounded-2xl bg-transparent shadow-none"
      : "min-h-[460px] md:min-h-[560px] rounded-2xl border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-none";

  return (
    <div className={containerClassName}>
      {/* Customizations Modal */}
      {selectedCustomizations && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
          onClick={handleModalClose}
        >
          <Suspense fallback={null}>
            <CustomizationsModal
              customizations={selectedCustomizations}
              onClose={handleModalClose}
            />
          </Suspense>
        </div>
      )}

      {/* Desktop / Tablet */}
      <div className="hidden md:block">
        <table className="min-w-full">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-xs uppercase tracking-wide text-white shadow-sm dark:from-orange-600 dark:via-orange-600 dark:to-orange-600 dark:text-white">
            <tr>
              {tableType !== "pending" && (
                <th className="border border-orange-300 p-2 text-center text-sm font-semibold dark:border-orange-300/40 dark:!text-white">Date</th>
              )}
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold dark:border-orange-300/40 dark:!text-white">Time</th>
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold dark:border-orange-300/40 dark:!text-white">Customer</th>
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold dark:border-orange-300/40 dark:!text-white">Phone</th>
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold dark:border-orange-300/40 dark:!text-white">Order Type</th>
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold dark:border-orange-300/40 dark:!text-white">Items</th>
              {tableType === "pending" && (
                <th className="border border-orange-300 p-2 text-center text-sm font-semibold dark:border-orange-300/40 dark:!text-white">Note</th>
              )}

              {tableType === "pending" && (
                <>
                  <th className="border border-orange-300 p-2 text-center text-sm font-semibold dark:border-orange-300/40 dark:!text-white">Status</th>
                  <th className="border border-orange-300 p-2 text-center text-sm font-semibold dark:border-orange-300/40 dark:!text-white">Actions</th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-orange-100 bg-white/95 dark:divide-slate-700 dark:bg-slate-900/95">
            {loading ? (
              skeletonRows.map((_, rowIndex) => (
                <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
                  {Array.from({ length: columnCount }).map((__, colIndex) => (
                    <td
                      key={`skeleton-cell-${rowIndex}-${colIndex}`}
                      className="border border-orange-100 px-2 py-3 dark:border-slate-700"
                    >
                      <div className="h-4 w-full rounded bg-orange-100/80 dark:bg-slate-800/80" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columnCount} className="py-6 text-center text-red-500 dark:text-red-400">
                  {error}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="py-6 text-center italic text-gray-500 dark:text-slate-300">
                  No orders yet
                </td>
              </tr>
            ) : (
              orders.map((order, index) => (
                <OrderRow
                  key={order._id}
                  order={{
                    ...order,
                    formattedDate: formatDate(order.createdAt),
                    formattedTime: formatTime(order.createdAt),
                  }}
                  index={index}
                  setEditingOrder={setEditingOrder}
                  setShowConfirmDelete={setShowConfirmDelete}
                  setOrderForBillModal={setOrderForBillModal}
                  updateOrder={updateOrder}
                  tableType={tableType}
                  onCustomizationsClick={onCustomizationsClick || handleCustomizationsClick}
                  showBillAttention={isLatestUnseen(order)}
                  onBillOpen={() => markLatestSeen(order)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden px-2 sm:px-3">
        {loading ? (
          <div className="space-y-3.5 pb-2">
            {mobileSkeletons.map((_, idx) => (
              <div
                key={`mobile-skeleton-${idx}`}
                className="min-h-[240px] w-full space-y-3 rounded-2xl border border-orange-100 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] dark:border-slate-700 dark:shadow-none sm:p-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 rounded bg-orange-100/80 dark:bg-slate-800/80" />
                  <div className="h-5 w-28 rounded-full bg-orange-100/80 dark:bg-slate-800/80" />
                </div>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  <div className="h-10 rounded-lg bg-orange-50/70 dark:bg-slate-800/70" />
                  <div className="h-10 rounded-lg bg-orange-50/70 dark:bg-slate-800/70" />
                </div>
                <div className="h-9 w-44 rounded-xl bg-orange-100/80 dark:bg-slate-800/80" />
                <div className="grid grid-cols-1 gap-2">
                  <div className="h-10 rounded-xl bg-orange-100/80 dark:bg-slate-800/80" />
                  <div className="h-10 rounded-xl bg-orange-100/80 dark:bg-slate-800/80" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="py-6 text-center text-red-500 dark:text-red-400">{error}</p>
        ) : orders.length === 0 ? (
          <p className="py-6 text-center italic text-gray-500 dark:text-slate-300">No orders yet</p>
        ) : (
          <div className="space-y-3.5 pb-2">
            {orders.map((order) => {
              const getOrderTypeIcon = (type) => {
                switch (getOrderTypeKey(type)) {
                  case "eat_here":
                    return <Utensils size={14} />;
                  case "take_away":
                    return <House size={14} />;
                  case "delivery":
                    return <Truck size={14} />;
                  default:
                    return <Utensils size={14} />;
                }
              };
              const orderTypeLabel = getOrderTypeLabel(order.orderType);
              const orderTypeClass = getOrderTypeBadgeClass(order.orderType);
              const tableLabel = formatOrderTableId(order.tableId);

              const handlePendingCustomizationsClick =
                onCustomizationsClick || handleCustomizationsClick;

              return (
                <div
                  key={order._id}
                  className={`min-h-[240px] w-full space-y-3 rounded-2xl border border-orange-100 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] dark:border-slate-700 dark:shadow-none sm:p-3.5 ${getStatusRowClass(
                    order.status
                  )}`}
                >
                  <div className="flex flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <h3 className="font-bold text-gray-900 text-[15px] leading-tight">
                      Order
                    </h3>
                    <span className="inline-flex w-fit rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {tableType === "pending"
                        ? formatTime(order.createdAt)
                        : `${formatDate(order.createdAt)} | ${formatTime(order.createdAt)}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-orange-50/50 px-2.5 py-2 dark:bg-slate-800/80">
                      <span className="font-medium text-gray-600 dark:text-slate-300">Customer:</span>
                      <p className="mt-0.5 break-words text-gray-800 dark:text-slate-100">{order.customerName || "N/A"}</p>
                    </div>
                    <div className="rounded-lg bg-orange-50/50 px-2.5 py-2 dark:bg-slate-800/80">
                      <span className="font-medium text-gray-600 dark:text-slate-300">Phone:</span>
                      <p className="mt-0.5 break-all text-gray-800 dark:text-slate-100">{order.customerPhone || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 min-[360px]:flex-row min-[360px]:items-center">
                    <span className="shrink-0 text-sm font-medium text-gray-600 dark:text-slate-300">Type:</span>
                    <div
                      className={`inline-flex h-9 w-40 items-center rounded-xl px-3 text-sm font-semibold ring-1 ring-black/5 dark:ring-white/10 ${orderTypeClass}`}
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {getOrderTypeIcon(order.orderType)}
                        <span>{orderTypeLabel}</span>
                        {isEatHereOrder(order.orderType) && tableLabel && (
                          <span className="ml-0.5">: {tableLabel}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                    {tableType === "pending" && (
                      <Suspense fallback={null}>
                        <PendingOrderMobileNote
                          order={order}
                          onCustomizationsClick={handlePendingCustomizationsClick}
                        />
                      </Suspense>
                    )}

                    <button
                      onClick={() => {
                        markLatestSeen(order);
                        dispatch(showBill(order));
                      }}
                      className={`flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 ${isLatestUnseen(order) ? "bill-border-animate" : ""}`}
                    >
                      View Items & Bill
                    </button>
                  </div>

                  {tableType === "pending" && (
                    <Suspense fallback={null}>
                      <PendingOrderMobileControls
                        order={order}
                        updateOrder={updateOrder}
                        setEditingOrder={setEditingOrder}
                        setShowConfirmDelete={setShowConfirmDelete}
                      />
                    </Suspense>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;
