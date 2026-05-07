import React from "react";
import StatusDropdown from "./StatusDropdown";
import { SquarePen, Trash, Eye, Ban } from "lucide-react";
import {
  getItemCustomizationText,
  getOrderItemsList,
} from "../commonOrderFile/utils";

const PendingOrderRowActions = ({
  order,
  setEditingOrder,
  setShowConfirmDelete,
  updateOrder,
  onCustomizationsClick,
  isDarkMode = false,
}) => {
  const orderItems = getOrderItemsList(order);
  const customizationCount = orderItems.filter((item) =>
    getItemCustomizationText(item)
  ).length;
  const hasCustomizations = customizationCount > 0;

  return (
    <>
      {/* Kitchen Note */}
      <td className="px-4 py-3 text-center">
        {hasCustomizations ? (
          <button
            onClick={() => onCustomizationsClick?.(order)}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-orange-600 "
            title={`${customizationCount} item(s) have customizations`}
          >
            <Eye size={12} />
            Note
            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">
              {customizationCount}
            </span>
          </button>
        ) : (
          <Ban size={14} className={`mx-auto opacity-30 ${isDarkMode ? "text-slate-400" : "text-[#a8a29e]"}`} />
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center">
          <StatusDropdown order={order} updateOrder={updateOrder} />
        </div>
      </td>

      {/* Edit / Delete */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setEditingOrder?.(order)}
            className={`rounded-lg p-1.5 transition-colors ${isDarkMode ? "text-slate-400 hover:bg-slate-700 hover:text-slate-100" : "text-[#78716c] hover:bg-[#f7f3ef] hover:text-[#1c1917]"}`}
            title="Edit order"
          >
            <SquarePen size={15} />
          </button>
          <button
            onClick={() => setShowConfirmDelete?.(order)}
            className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
            title="Delete order"
          >
            <Trash size={15} />
          </button>
        </div>
      </td>
    </>
  );
};

export default PendingOrderRowActions;