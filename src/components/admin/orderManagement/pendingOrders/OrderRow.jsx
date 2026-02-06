import React from "react";
import StatusDropdown from "./StatusDropdown";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { House, Pointer, SquarePen, Trash, Truck, Utensils, Eye, Ban , Home } from "lucide-react";

const OrderRow = ({
  order,
  orderNum,
  setEditingOrder,
  setShowConfirmDelete,
  updateOrder,
  tableType,
  onCustomizationsClick,
}) => {
  const dispatch = useDispatch();
  const userRole = localStorage.getItem("userRole") || "";
  const isStaff = userRole === "staff";

  // Check if any item in the order has customizations
  const hasCustomizations = order.items && 
    order.items.some(item => item.customizations && item.customizations.trim() !== "");

  // Count how many items have customizations
  const customizationCount = order.items ? 
    order.items.filter(item => item.customizations && item.customizations.trim() !== "").length : 0;

  // Order Type Badge Helper (same styling as EditOrderModal but only display)
  const getOrderTypeDisplay = (type) => {
    switch(type?.toLowerCase()) {
      case "eat here":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          ring: "ring-green-200",
          icon: <Utensils size={16} />
        };
      case "take away":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          ring: "ring-blue-200",
          icon: <Home size={16} />
        };
      case "delivery":
        return {
          bg: "bg-orange-100",
          text: "text-orange-700",
          ring: "ring-orange-200",
          icon: <Truck size={16} />
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          ring: "ring-gray-200",
          icon: <Utensils size={16} />
        };
    }
  };

  const orderTypeStyle = getOrderTypeDisplay(order.orderType);

  return (
    <tr className="hover:bg-orange-50 border transition">
      {/* Date Column */}
      <td className="text-center border text-gray-700">
        {order.formattedDate || "N/A"}
      </td>

      {/* Time Column */}
      <td className="text-center border text-gray-700">
        {order.formattedTime || "N/A"}
      </td>

      {/* Order ID */}
      <td className="text-center border font-medium text-gray-800">{orderNum}</td>

      {/* Customer */}
      <td className="text-center border text-gray-700">{order.customerName}</td>

      {/* Phone */}
      <td className="text-center border text-gray-700">{order.customerPhone}</td>

      {/* Order Type - DISPLAY ONLY (same styling as EditOrderModal) */}
      <td className="flex items-center justify-center py-2.5">
        <div className={`inline-flex items-center justify-center h-9 px-3 rounded-lg font-medium shadow-sm ring-1 ring-black/5 transition-all ${orderTypeStyle.bg} ${orderTypeStyle.text} ${orderTypeStyle.ring}`}>
          <div className="flex items-center gap-2">
            {orderTypeStyle.icon}
            <span>{order.orderType || "Select Type"}</span>
            {order.orderType?.toLowerCase() === "eat here" && order.tableId && (
              <span className="ml-1">: {order.tableId}</span>
            )}
          </div>
        </div>
      </td>

      {/* View Items / Bill */}
      <td className="text-center border py-2">
        <button
          onClick={() => dispatch(showBill(order))}
          className="px-4 py-2 rounded-lg bg-orange-100 border border-orange-300 hover:bg-orange-200 transition"
        >
          <span className="flex justify-center items-center gap-1">
            View Items & Bill
          </span>
        </button>
      </td>

      {/* C/S Column - Show only for pending orders */}
      {tableType === "pending" && (
        <td className="text-center border py-2">
          {hasCustomizations ? (
            <button
              onClick={() => onCustomizationsClick(order)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-600 transition font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md mx-auto group relative"
              title={`${customizationCount} item(s) have customizations`}
            >
              <Eye size={16} />
              {customizationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {customizationCount}
                </span>
              )}
            </button>
          ) : (
            <span className="text-gray-400 italic text-sm" title="No customizations">
              <Ban size={18} className="mx-auto opacity-50 text-orange-700" />
            </span>
          )}
        </td>
      )}

      {/* For other table types (completed, etc.), don't show C/S column */}

      {/* Pending Table Actions - Show only for pending orders */}
      {tableType === "pending" && (
        <>
          <td className="border">
            {/* Status dropdown - shown for both admin and staff */}
            <div className="flex justify-center items-center w-full">
              <StatusDropdown order={order} updateOrder={updateOrder} />
            </div>
          </td>

          {/* Edit and Delete buttons - shown for both admin and staff */}
          <td className="text-center border">
            <button
              onClick={() => setEditingOrder(order)}
              className="px-3 py-2 text-blue-700 hover:bg-blue-100"
              title="Edit order"
            >
              <SquarePen size={20} />
            </button>

            <button
              onClick={() => setShowConfirmDelete(order)}
              className="px-3 py-2 text-red-700 hover:bg-red-100"
              title="Delete order"
            >
              <Trash size={20} />
            </button>
          </td>
        </>
      )}
    </tr>
  );
};

export default OrderRow;