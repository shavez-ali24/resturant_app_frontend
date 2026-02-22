// src/components/admin/orderManagement/OrdersTable.jsx
import React, { useState } from "react";
import OrderRow from "./OrderRow";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { Utensils, House, Truck } from "lucide-react";
import StatusDropdown from "./StatusDropdown";
import CustomizationsModal from "./CustomizationsModal";
import { Eye } from "lucide-react";

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
    <div className="rounded-2xl border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
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
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white uppercase tracking-wide text-xs">
            <tr>
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold">Date</th>
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold">Time</th>
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold">Customer</th>
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold">Phone</th>
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold">Order Type</th>
              <th className="border border-orange-300 p-2 text-center text-sm font-semibold">Items</th>
              {tableType === "pending" && (
                <th className="border border-orange-300 p-2 text-center text-sm font-semibold">Note</th>
              )}

              {tableType === "pending" && (
                <>
                  <th className="border border-orange-300 p-2 text-center text-sm font-semibold">Status</th>
                  <th className="border border-orange-300 p-2 text-center text-sm font-semibold">Actions</th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-orange-100 bg-white/95">
            {loading ? (
              <tr>
                <td colSpan={tableType === "pending" ? 10 : 8} className="py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={tableType === "pending" ? 10 : 8} className="py-6 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={tableType === "pending" ? 10 : 8} className="py-6 text-center italic text-gray-400">
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
                  orderNum={order._id.slice(-6)}
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
          <p className="py-6 text-center text-gray-500">Loading...</p>
        ) : error ? (
          <p className="py-6 text-center text-red-500">{error}</p>
        ) : orders.length === 0 ? (
          <p className="py-6 text-center italic text-gray-400">No orders yet</p>
        ) : (
          <div className="space-y-3.5 pb-2">
            {orders.map((order) => {
              // Order Type styling helper for mobile
              const getOrderTypeStyle = (type) => {
                switch (type?.toLowerCase()) {
                  case "eat here":
                    return "bg-green-100 text-green-700 ring-green-200";
                  case "take away":
                    return "bg-blue-100 text-blue-700 ring-blue-200";
                  case "delivery":
                    return "bg-orange-100 text-orange-700 ring-orange-200";
                  default:
                    return "bg-gray-100 text-gray-700 ring-gray-200";
                }
              };

              const getOrderTypeIcon = (type) => {
                switch (type?.toLowerCase()) {
                  case "eat here":
                    return <Utensils size={14} />;
                  case "take away":
                    return <House size={14} />;
                  case "delivery":
                    return <Truck size={14} />;
                  default:
                    return <Utensils size={14} />;
                }
              };

              const hasCustomizations =
                tableType === "pending" &&
                order.items &&
                order.items.some(
                  (item) => item.customizations && item.customizations.trim() !== ""
                );

              return (
                <div
                  key={order._id}
                  className="w-full space-y-3 rounded-2xl border border-orange-100 bg-white/95 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:p-3.5"
                >
                  <div className="flex flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <h3 className="font-bold text-gray-900 text-[15px] leading-tight">
                      {/* Order #{order._id.slice(-6)} */}
                    </h3>
                    <span className="inline-flex w-fit rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs text-gray-600">
                      {formatDate(order.createdAt)} | {formatTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 text-sm">
                    <div className="bg-orange-50/50 rounded-lg px-2.5 py-2">
                      <span className="font-medium text-gray-600">Customer:</span>
                      <p className="text-gray-800 mt-0.5 break-words">{order.customerName || "N/A"}</p>
                    </div>
                    <div className="bg-orange-50/50 rounded-lg px-2.5 py-2">
                      <span className="font-medium text-gray-600">Phone:</span>
                      <p className="text-gray-800 mt-0.5 break-all">{order.customerPhone || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 min-[360px]:flex-row min-[360px]:items-center">
                    <span className="font-medium text-gray-600 text-sm shrink-0">Type:</span>
                    <div
                      className={`inline-flex w-fit items-center h-9 px-3 rounded-xl font-semibold text-sm ring-1 ring-black/5 ${getOrderTypeStyle(order.orderType)}`}
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {getOrderTypeIcon(order.orderType)}
                        <span>{order.orderType}</span>
                        {order.orderType?.toLowerCase() === "eat here" && order.tableId && (
                          <span className="ml-0.5">: {order.tableId}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {tableType === "pending" && (
                      hasCustomizations ? (
                        <button
                          onClick={() => (onCustomizationsClick || handleCustomizationsClick)(order)}
                          className="h-10 w-full px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Eye size={16} />
                          Note
                        </button>
                      ) : (
                        <div className="h-10 w-full px-4 rounded-xl border border-dashed border-gray-300 text-center text-sm text-gray-400 italic bg-gray-50 flex items-center justify-center">
                          No Note
                        </div>
                      )
                    )}

                    <button
                      onClick={() => dispatch(showBill(order))}
                      className="flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50"
                    >
                      View Items & Bill
                    </button>
                  </div>

                  {tableType === "pending" && (
                    <>
                      <div className="flex flex-col gap-1.5 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                        <span className="font-medium text-sm text-gray-700">Status</span>
                        <div className="w-full min-[360px]:w-auto">
                          <StatusDropdown order={order} updateOrder={updateOrder} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setEditingOrder(order)}
                          className="h-10 w-full rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => setShowConfirmDelete(order)}
                          className="h-10 w-full px-4 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition text-sm font-medium"
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
