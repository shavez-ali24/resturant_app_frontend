import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import StatusDropdown from "./StatusDropdown";
import { SquarePen, Trash, Eye, IndianRupee, Move } from "lucide-react";
import {
  getItemCustomizationText,
  getOrderItemsList,
  isEatHereOrder,
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
  // Safe Redux theme selection with reliable default fallbacks
  const colors = useSelector((state) => state.admin.theme?.colors || {
    primary: "#f97316",
    primaryHover: "#ea580c",
    primaryLight: "#fff7ed",
    primaryText: "#ea580c",
  });

  const orderItems = getOrderItemsList(order);
  const customizationCount = orderItems.filter((item) =>
    getItemCustomizationText(item)
  ).length;
  const hasCustomizations = customizationCount > 0;

  const status = String(order?.status || "").toLowerCase();
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";
  const isEatHere = isEatHereOrder(order?.orderType);
  
  const alreadyPaid =
    Boolean(order?.paymentMethod) ||
    (Array.isArray(order?.paymentMethods) &&
      order.paymentMethods.length > 0);

  const canEdit = !isCompleted && !isCancelled;
  const canMove = isEatHere && canEdit;
  const canDelete = !isCancelled;
  const canPay = isCompleted && !alreadyPaid;

  // CSS variables style object for hover states instead of manual DOM mutations
  const hoverStyles = useMemo(() => ({
    "--hover-bg": isDarkMode ? `${colors.primary}30` : `${colors.primary}12`,
    "--hover-border": isDarkMode ? `${colors.primary}60` : `${colors.primary}50`,
    backgroundColor: isDarkMode ? `${colors.primary}1a` : colors.primaryLight,
    borderColor: isDarkMode ? `${colors.primary}40` : `${colors.primary}25`,
    color: isDarkMode ? colors.primary : colors.primaryText,
  }), [isDarkMode, colors]);

  return (
    <>
      {/* Kitchen Note */}
      <td className="px-4 py-3 text-center align-middle">
        {hasCustomizations ? (
          <button
            type="button"
            onClick={() => onCustomizationsClick?.(order)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black shadow-sm transition-all border hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)]"
            style={hoverStyles}
            title={`${customizationCount} item(s) have customizations`}
          >
            <Eye size={12} strokeWidth={2.5} />
            <span>Note</span>
            <span
              className="flex h-4 min-w-[16px] px-0.5 items-center justify-center rounded-full text-[9px] font-black"
              style={{
                backgroundColor: isDarkMode ? `${colors.primary}33` : `${colors.primary}15`,
                color: isDarkMode ? "#ffffff" : colors.primaryText,
              }}
            >
              {customizationCount}
            </span>
          </button>
        ) : (
          <span className={`text-xs font-bold opacity-30 ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}>
            —
          </span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center align-middle">
        <div className="flex items-center justify-center">
          <StatusDropdown order={order} updateOrder={updateOrder} />
        </div>
      </td>

      {/* Manage column */}
      <td className="px-4 py-3 text-center align-middle">
        <div className="flex items-center justify-center gap-1">
          {/* Pay button: visible for completed+not paid */}
          {canPay && (
            <button
              type="button"
              onClick={() => setPayModalOrder?.(order)}
              className="rounded-lg p-2 text-emerald-600 dark:text-emerald-400 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-955/20"
              title="Pay order"
              aria-label="Pay order"
            >
              <IndianRupee size={15} />
            </button>
          )}
          {/* Move button: visible for Eat Here, not cancelled/completed */}
          {canMove && (
            <button
              type="button"
              onClick={() => setMoveModalOrder?.(order)}
              className="rounded-lg p-2 text-sky-600 dark:text-sky-400 transition-colors hover:bg-sky-50 dark:hover:bg-sky-955/20"
              title="Move table/room"
              aria-label="Move table or room"
            >
              <Move size={15} />
            </button>
          )}
          {/* Edit */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditingOrder?.(order)}
              className="rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Edit order"
              aria-label="Edit order"
            >
              <SquarePen size={15} />
            </button>
          )}
          {/* Delete */}
          {canDelete && (
            <button
              type="button"
              onClick={() => setShowConfirmDelete?.(order)}
              className="rounded-lg p-2 text-rose-500 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-955/20"
              title="Cancel order"
              aria-label="Cancel order"
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
