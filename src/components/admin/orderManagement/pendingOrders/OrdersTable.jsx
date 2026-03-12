// src/components/admin/orderManagement/OrdersTable.jsx
import React, { useState } from "react";
import OrderRow from "./OrderRow";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { Utensils, House, Truck } from "lucide-react";
import StatusDropdown from "./StatusDropdown";
import CustomizationsModal from "./CustomizationsModal";
import { Eye } from "lucide-react";
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
}) => {
  const dispatch = useDispatch();
  const [selectedCustomizations, setSelectedCustomizations] = useState(null);

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

  return (
    <div className="rounded-2xl border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-none">
      {/* Customizations Modal */}
      {selectedCustomizations && (
        <div 
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" 
          onClick={handleModalClose}
        >
          <CustomizationsModal
            customizations={selectedCustomizations}
            onClose={handleModalClose}
          />
        </div>
      )}

      {/* Desktop / Tablet */}
      <div className="hidden md:block">
        <table className="min-w-full">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-xs uppercase tracking-wide text-white shadow-sm dark:from-orange-600 dark:via-orange-600 dark:to-orange-600 dark:text-white">
            <tr>
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold dark:border-orange-300/40 dark:!text-white">Date</th>
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
              <tr>
                <td colSpan={tableType === "pending" ? 10 : 8} className="py-6 text-center text-gray-500 dark:text-slate-300">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={tableType === "pending" ? 10 : 8} className="py-6 text-center text-red-500 dark:text-red-400">
                  {error}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={tableType === "pending" ? 10 : 8} className="py-6 text-center italic text-gray-400 dark:text-slate-400">
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
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden px-2 sm:px-3">
        {loading ? (
          <p className="py-6 text-center text-gray-500 dark:text-slate-300">Loading...</p>
        ) : error ? (
          <p className="py-6 text-center text-red-500 dark:text-red-400">{error}</p>
        ) : orders.length === 0 ? (
          <p className="py-6 text-center italic text-gray-400 dark:text-slate-400">No orders yet</p>
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

              const hasCustomizations =
                tableType === "pending" &&
                order.items &&
                order.items.some(
                  (item) => item.customizations && item.customizations.trim() !== ""
                );

              return (
                <div
                  key={order._id}
                  className={`w-full space-y-3 rounded-2xl border border-orange-100 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] dark:border-slate-700 dark:shadow-none sm:p-3.5 ${getStatusRowClass(
                    order.status
                  )}`}
                >
                  <div className="flex flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <h3 className="font-bold text-gray-900 text-[15px] leading-tight">
                      Order
                    </h3>
                    <span className="inline-flex w-fit rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {formatDate(order.createdAt)} | {formatTime(order.createdAt)}
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
                      className={`inline-flex h-9 w-fit items-center rounded-xl px-3 text-sm font-semibold ring-1 ring-black/5 dark:ring-white/10 ${orderTypeClass}`}
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

                  <div className="grid grid-cols-1 gap-2">
                    {tableType === "pending" && (
                      hasCustomizations ? (
                        <button
                          onClick={() => (onCustomizationsClick || handleCustomizationsClick)(order)}
                          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-medium text-white transition hover:from-orange-600 hover:to-orange-700"
                        >
                          <Eye size={16} />
                          Note
                        </button>
                      ) : (
                        <div className="flex h-10 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 text-center text-sm italic text-gray-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          No Note
                        </div>
                      )
                    )}

                    <button
                      onClick={() => dispatch(showBill(order))}
                      className="flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      View Items & Bill
                    </button>
                  </div>

                  {tableType === "pending" && (
                    <>
                      <div className="flex flex-col gap-1.5 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Status</span>
                        <div className="w-full min-[360px]:w-auto">
                          <StatusDropdown order={order} updateOrder={updateOrder} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setEditingOrder(order)}
                          className="h-10 w-full rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => setShowConfirmDelete(order)}
                          className="h-10 w-full rounded-xl bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25"
                        >
                          Delete
                        </button>
                      </div>
                    </>
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
