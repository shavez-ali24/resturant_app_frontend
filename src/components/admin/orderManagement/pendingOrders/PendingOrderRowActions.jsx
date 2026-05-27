import React from "react";
import StatusDropdown from "./StatusDropdown";
import { SquarePen, Trash, Eye, Ban, IndianRupee, Move } from "lucide-react";
import {
  getItemCustomizationText,
  getOrderItemsList,
} from "../commonOrderFile/utils";

const PendingOrderRowActions = ({
  order,
  setEditingOrder,
  setShowConfirmDelete,
  setPayModalOrder,
  setMoveModalOrder,
  updateOrder,
  onCustomizationsClick,
  isDarkMode = false,
}) => {
  const orderItems = getOrderItemsList(order);
  const customizationCount = orderItems.filter((item) =>
    getItemCustomizationText(item)
  ).length;
  const hasCustomizations = customizationCount > 0;

  const isCompleted = order?.status === "completed";
  const isCancelled = order?.status === "cancelled";
  const isEatHere = order?.orderType === "Eat Here";
  const isReady = order?.status === "ready";
  const alreadyPaid = Boolean(order?.paymentMethod);

  const btnBase = `rounded-lg p-1.5 transition-colors`;
  const btnLight = `${btnBase} text-[#78716c] hover:bg-[#f7f3ef] hover:text-[#1c1917]`;
  const btnDark = `${btnBase} text-slate-400 hover:bg-slate-700 hover:text-slate-100`;

  return (
    <>
      {/* Kitchen Note */}
      <td className="px-4 py-3 text-center">
        {hasCustomizations ? (
          <button
            onClick={() => onCustomizationsClick?.(order)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-[#fff8f5] px-3 py-1.5 text-xs font-black text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300 dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400 dark:hover:bg-orange-950/40 shadow-sm transition-all duration-150"
            title={`${customizationCount} item(s) have customizations`}
          >
            <Eye size={13} strokeWidth={2.5} />
            <span>Note</span>
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-black text-orange-800 dark:bg-orange-900/60 dark:text-orange-355">
              {customizationCount}
            </span>
          </button>
        ) : (
          <span className={`text-xs font-bold opacity-30 ${isDarkMode ? "text-slate-500" : "text-[#a8a29e]"}`}>
            —
          </span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center">
          <StatusDropdown order={order} updateOrder={updateOrder} />
        </div>
      </td>

      {/* Manage column */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {/* Pay button: visible for completed+not paid */}
          {isCompleted && !alreadyPaid && (
            <button
              onClick={() => setPayModalOrder?.(order)}
              className={`rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 hover:text-green-700 ${isDarkMode ? "hover:bg-green-900/30" : ""}`}
              title="Pay order"
            >
              <IndianRupee size={15} />
            </button>
          )}
          {/* Move button: visible for Eat Here, not cancelled/completed */}
          {isEatHere && !isCancelled && !isCompleted && (
            <button
              onClick={() => setMoveModalOrder?.(order)}
              className={`rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 ${isDarkMode ? "hover:bg-blue-900/30" : ""}`}
              title="Move table/room"
            >
              <Move size={15} />
            </button>
          )}
          {/* Edit */}
          {!isCompleted && !isCancelled && (
            <button
              onClick={() => setEditingOrder?.(order)}
              className={isDarkMode ? btnDark : btnLight}
              title="Edit order"
            >
              <SquarePen size={15} />
            </button>
          )}
          {/* Delete */}
          {!isCancelled && (
            <button
              onClick={() => setShowConfirmDelete?.(order)}
              className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
              title="Cancel order"
            >
              <Trash size={15} />
            </button>
          )}
        </div>
      </td>
    </>
  );
};

export default PendingOrderRowActions;
