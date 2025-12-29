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
      <div className="hidden md:block">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-orange-300 to-orange-500 text-gray-800 uppercase tracking-wide text-xs">
            <tr>
              <th className="text-center border p-2">Date</th>
              <th className="text-center border p-2">Time</th>
              <th className="text-center p-3 border">Order ID</th>
              <th className="text-center p-3 border">Customer</th>
              <th className="text-center p-3 border">Phone</th>
              <th className="text-center p-3 border">Order Type</th>
              <th className="text-center p-3 border">Items</th>
              {tableType === "pending" && (
      <th className="text-center p-3 border">Custom</th>
    )}

              {tableType === "pending" && (
                <>
                  <th className="text-center p-3 border">Status</th>
                  <th className="text-center p-3 border">Actions</th>
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
      <div className="block md:hidden p-4">
        {loading ? (
          <p className="text-center py-6 text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-center py-6 text-red-500">{error}</p>
        ) : orders.length === 0 ? (
          <p className="text-center py-6 text-gray-400 italic">No orders yet</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">
                    Order #{order._id.slice(-6)}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                  </span>
                </div>

                <p className="text-gray-700">
                  <span className="font-medium">Customer:</span> {order.customerName}
                </p>

                <p className="text-gray-700">
                  <span className="font-medium">Phone:</span> {order.customerPhone}
                </p>

                <p className="text-gray-700">
                  <span className="font-medium">Order Type:</span>{" "}
                  {order.orderType === "Eat Here" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-semibold gap-2 bg-green-600">
                      <Utensils size={16} /> Eat Here {order.tableId ? `: ${order.tableId}` : ""}
                    </span>
                  ) : order.orderType === "Take Away" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-semibold gap-2 bg-blue-600">
                      <House size={16} /> Take Away
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-semibold gap-2 bg-orange-500">
                      <Truck size={16} /> Delivery
                    </span>
                  )}
                </p>

              
               {/* C/S Button for Mobile (ONLY PENDING) */}
{tableType === "pending" &&
order.items &&
order.items.some(
  (item) => item.customizations && item.customizations.trim() !== ""
) ? (
  <button
    onClick={() => (onCustomizationsClick || handleCustomizationsClick)(order)}
    className="px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition text-sm font-medium flex items-center gap-2"
  >
    <Eye size={16} />
    View Customizations
  </button>
) : tableType === "pending" ? (
  <span className="text-sm text-gray-400 italic">No customizations</span>
) : null}


                <button
                  onClick={() => dispatch(showBill(order))}
                  className="rounded-lg bg-orange-100 border border-orange-300 hover:bg-orange-200 transition font-medium flex items-center justify-center gap-1 py-2 w-40"
                >
                  View Items <Pointer size={16} />
                </button>

                {tableType === "pending" && (
                  <>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-medium">Status:</span>
                      <StatusDropdown order={order} updateOrder={updateOrder} />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => setEditingOrder(order)}
                        className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => setShowConfirmDelete(order)}
                        className="px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;