

import React from "react";
import OrderRow from "./OrderRow";
import { MdModeEdit } from "react-icons/md";
import { MdDelete } from "react-icons/md";

const OrdersTable = ({
  orders,
  loading,
  error,
  setEditingOrder,
  setShowConfirmDelete,
  setOrderForBillModal,
  updateOrder,
  tableType,
}) => {
  // ✅ 12-hour format time with AM/PM
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // 👈 12-hour format with AM/PM
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* ✅ Desktop / Tablet View (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide text-xs">
            <tr>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Order No</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Table ID</th>
              <th className="px-6 py-4">Order Type</th>
              {/* <th className="px-6 py-4">Status</th> */}
              {/* 👇 Only show Actions column if tableType is "pending" */}
              <th className="px-6 py-4">Items</th>
              {tableType === "pending" && (
                <>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-red-500">
                  {error}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center py-6 text-gray-400 italic"
                >
                  No orders yet
                </td>
              </tr>
            ) : (
              orders.map((order, index) => (
                <OrderRow
                  key={order._id}
                  order={{
                    ...order,
                    // 👇 formatted 12-hour time
                    formattedTime: formatTime(order.createdAt),
                  }}
                  index={index}
                  orderNum={300 + orders.length - index - 1}
                  setEditingOrder={setEditingOrder}
                  setShowConfirmDelete={setShowConfirmDelete}
                  setOrderForBillModal={setOrderForBillModal}
                  updateOrder={updateOrder}
                  tableType={tableType}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Mobile View (Cards) */}
      <div className="block md:hidden">
        {loading ? (
          <p className="text-center py-6 text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-center py-6 text-red-500">{error}</p>
        ) : orders.length === 0 ? (
          <p className="text-center py-6 text-gray-400 italic">No orders yet</p>
        ) : (
          <div className="space-y-4 p-4">
            {orders.map((order, index) => (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-4 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">
                    Order #{300 + orders.length - index - 1}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {formatTime(order.createdAt)}
                  </span>
                </div>

                <p className="text-gray-700">
                  <span className="font-medium">Customer:</span>{" "}
                  {order.customerName}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Phone:</span>{" "}
                  {order.customerPhone}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Table:</span>{" "}
                  {order.tableId || "N/A"}
                </p>
                <button
                  onClick={() => setOrderForBillModal(order)}
                  className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition font-medium"
                >
                  View Items
                </button>
                {tableType === "pending" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <div className="flex-1">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrder(order._id, {
                              tableId: order.tableId,
                              items: order.items,
                              totalAmount: order.totalAmount,
                              status: e.target.value,
                            })
                          }
                          className="px-3 py-1 rounded-full text-xs font-medium border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="completed">🏁 Completed</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">


                      <button
                        onClick={() => setEditingOrder(order)}
                        className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition font-medium"
                      >
                        <MdModeEdit />
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(order)}
                        className="px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition font-medium"
                      >
                        <MdDelete />
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
