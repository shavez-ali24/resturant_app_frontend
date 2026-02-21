// src/components/admin/orderManagement/OrdersTable.jsx
import React, { useState } from "react";
import OrderRow from "./OrderRow";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { Utensils, House, Truck, Pointer } from "lucide-react";
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
  const userRole = localStorage.getItem("userRole") || "";

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
    <div className="shadow-sm">
      {/* Customizations Modal */}
      {selectedCustomizations && (
        <div 
          className="fixed inset-0 z-50" 
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
          <thead className="bg-gradient-to-r from-orange-300 to-orange-500 text-gray-800 uppercase tracking-wide text-xs">
            <tr>
              <th className="text-center border p-2 text-sm font-semibold">Date</th>
              <th className="text-center border p-2 text-sm font-semibold">Time</th>
              <th className="text-center p-2 border text-sm font-semibold">Customer</th>
              <th className="text-center p-2 border text-sm font-semibold">Phone</th>
              <th className="text-center p-2 border text-sm font-semibold">Order Type</th>
              <th className="text-center p-2 border text-sm font-semibold">Items</th>
              {tableType === "pending" && (
      <th className="text-center p-2 border text-sm font-semibold">Note</th>
    )}

              {tableType === "pending" && (
                <>
                  <th className="text-center p-2 border text-sm font-semibold">Status</th>
                  <th className="text-center p-2 border text-sm font-semibold">Actions</th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={tableType === "pending" ? 10 : 8} className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={tableType === "pending" ? 10 : 8} className="text-center py-6 text-red-500">
                  {error}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={tableType === "pending" ? 10 : 8} className="text-center py-6 text-gray-400 italic">
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
     
{/* Mobile View */}
<div className="block md:hidden px-2 sm:px-3">
  {loading ? (
    <p className="text-center py-6 text-gray-500">Loading...</p>
  ) : error ? (
    <p className="text-center py-6 text-red-500">{error}</p>
  ) : orders.length === 0 ? (
    <p className="text-center py-6 text-gray-400 italic">No orders yet</p>
  ) : (
    <div className="space-y-3">
      {orders.map((order) => {
        // Order Type styling helper for mobile
        const getOrderTypeStyle = (type) => {
          switch(type?.toLowerCase()) {
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
          switch(type?.toLowerCase()) {
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

        return (
          <div
            key={order._id}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-3 space-y-2"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-base">
                Order #{order._id.slice(-6)}
              </h3>
              <span className="text-sm text-gray-500">
                {formatDate(order.createdAt)} {formatTime(order.createdAt)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Customer:</span>
                <span className="text-gray-800 ml-1">{order.customerName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="text-gray-800 ml-1">{order.customerPhone}</span>
              </div>
            </div>

            {/* Order Type in Mobile - Same size for all */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600 text-sm">Type:</span>
              <div className={`inline-flex items-center justify-center h-9 px-3 rounded-xl font-semibold text-sm ring-1 ring-black/5 ${getOrderTypeStyle(order.orderType)}`}>
                <div className="flex items-center gap-1.5">
                  {getOrderTypeIcon(order.orderType)}
                  <span>{order.orderType}</span>
                  {order.orderType?.toLowerCase() === "eat here" && order.tableId && (
                    <span className="ml-0.5">: {order.tableId}</span>
                  )}
                </div>
              </div>
            </div>

            {/* C/S Button for Mobile (ONLY PENDING) */}
            {tableType === "pending" &&
            order.items &&
            order.items.some(
              (item) => item.customizations && item.customizations.trim() !== ""
            ) ? (
              <button
                onClick={() => (onCustomizationsClick || handleCustomizationsClick)(order)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition text-sm font-medium flex items-center gap-2"
              >
                <Eye size={16} />
                Note
              </button>
            ) : tableType === "pending" ? (
              <span className="text-sm text-gray-400 italic">No Note</span>
            ) : null}

            {/* View Items Button - Same size as Note button */}
            <button
              onClick={() => dispatch(showBill(order))}
              className="rounded-xl bg-orange-100 border border-orange-300 hover:bg-orange-200 transition text-sm font-medium flex items-center justify-center gap-1 py-2 px-4"
            >
              View Items & Bill
            </button>

            {tableType === "pending" && (
              <>
                {/* Status dropdown for mobile view */}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Status:</span>
                  <StatusDropdown order={order} updateOrder={updateOrder} />
                </div>

                {/* Edit and Delete buttons - only for admin */}
                {userRole !== "staff" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingOrder(order)}
                      className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-sm"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => setShowConfirmDelete(order)}
                      className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
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