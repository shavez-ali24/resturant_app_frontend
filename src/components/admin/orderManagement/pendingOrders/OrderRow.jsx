import React from "react";
import StatusDropdown from "./StatusDropdown";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { SquarePen, Trash, Truck, Utensils, Eye, Ban, House } from "lucide-react";
import {
  formatOrderTableId,
  getOrderTypeBadgeClass,
  getOrderTypeKey,
  getOrderTypeLabel,
  getStatusRowClass,
  isEatHereOrder,
} from "../commonOrderFile/utils";

const OrderRow = ({
  order,
  setEditingOrder,
  setShowConfirmDelete,
  updateOrder,
  tableType,
  onCustomizationsClick,
}) => {
  const dispatch = useDispatch();

  // Check if any item in the order has customizations
  const hasCustomizations = order.items && 
    order.items.some(item => item.customizations && item.customizations.trim() !== "");

  // Count how many items have customizations
  const customizationCount = order.items ? 
    order.items.filter(item => item.customizations && item.customizations.trim() !== "").length : 0;

  const getOrderTypeIcon = (type) => {
    switch (getOrderTypeKey(type)) {
      case "eat_here":
        return <Utensils size={16} />;
      case "take_away":
        return <House size={16} />;
      case "delivery":
        return <Truck size={16} />;
      default:
        return <Utensils size={16} />;
    }
  };

  const orderTypeLabel = getOrderTypeLabel(order.orderType);
  const orderTypeClass = getOrderTypeBadgeClass(order.orderType);
  const tableLabel = formatOrderTableId(order.tableId);

  return (
    <tr
      className={`border-b border-orange-100 transition-colors hover:brightness-95 dark:border-slate-700 dark:hover:brightness-110 ${getStatusRowClass(
        order.status
      )}`}
    >
      {/* Date Column */}
      <td className="text-center border px-1 text-sm text-gray-700 dark:border-slate-700 dark:text-slate-200">
        {order.formattedDate || "N/A"}
      </td>

      {/* Time Column */}
      <td className="text-center border px-1 text-sm text-gray-700 dark:border-slate-700 dark:text-slate-200">
        {order.formattedTime || "N/A"}
      </td>

      {/* Customer */}
      <td className="text-center border px-1 text-sm text-gray-700 dark:border-slate-700 dark:text-slate-200">{order.customerName}</td>

      {/* Phone */}
      <td className="text-center border px-1 text-sm text-gray-700 dark:border-slate-700 dark:text-slate-200">{order.customerPhone}</td>

      {/* Order Type - DISPLAY ONLY (same styling as EditOrderModal) */}
      <td className="px-1 py-2 text-center border dark:border-slate-700">
        <div className={`inline-flex h-9 w-full items-center justify-center rounded-xl px-3 text-sm font-semibold ring-1 ring-black/5 dark:ring-white/10 ${orderTypeClass}`}>
          <div className="flex items-center gap-1.5">
            {getOrderTypeIcon(order.orderType)}
            <span>{orderTypeLabel}</span>
            {isEatHereOrder(order.orderType) && tableLabel && (
              <span className="ml-0.5">: {tableLabel}</span>
            )}
          </div>
        </div>
      </td>

      {/* View Items / Bill */}
      <td className="text-center border py-2">
        <button
          onClick={() => dispatch(showBill(order))}
          className="rounded-xl border border-orange-200 bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50"
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
              className="mx-auto flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600"
              title={`${customizationCount} item(s) have customizations`}
            >
              <Eye size={14} />
              Note
              {customizationCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold ml-1">
                  {customizationCount}
                </span>
              )}
            </button>
          ) : (
            <span className="text-gray-400 italic text-xs" title="No customizations">
              <Ban size={16} className="mx-auto opacity-50 text-orange-700" />
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
          <td className="text-center border py-2">
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => setEditingOrder(order)}
                className="rounded-lg p-1.5 text-orange-700 transition-colors hover:bg-orange-100"
                title="Edit order"
              >
                <SquarePen size={16} />
              </button>

              <button
                onClick={() => setShowConfirmDelete(order)}
                className="rounded-lg p-1.5 text-red-700 transition-colors hover:bg-red-100"
                title="Delete order"
              >
                <Trash size={16} />
              </button>
            </div>
          </td>
        </>
      )}
    </tr>
  );
};

export default OrderRow;
