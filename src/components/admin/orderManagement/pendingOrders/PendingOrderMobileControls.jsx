import React from "react";
import StatusDropdown from "./StatusDropdown";
import { IndianRupee, Move } from "lucide-react";
import { isEatHereOrder } from "../commonOrderFile/utils";

const PendingOrderMobileControls = ({
  order,
  updateOrder,
  setEditingOrder,
  setShowConfirmDelete,
  setPayModalOrder,
  setMoveModalOrder,
  isDarkMode = false,
}) => {
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

  const btnSecondary = `flex h-9 w-full items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
    isDarkMode
      ? "border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700"
      : "border-[#ede8e3] bg-white text-[#1c1917] hover:bg-[#f7f3ef]"
  }`;

  return (
    <>
      {/* Status */}
      <div className="flex flex-col gap-1.5">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider ${
            isDarkMode ? "text-slate-500" : "text-gray-500"
          }`}
        >
          Status
        </span>

        <div data-tour="orders-mobile-status" className="w-full">
          <StatusDropdown
            order={order}
            updateOrder={updateOrder}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        {canPay && (
          <button
            type="button"
            onClick={() => setPayModalOrder?.(order)}
            className="flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-green-200 bg-green-50 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
          >
            <IndianRupee size={14} />
            Pay
          </button>
        )}

        {canMove && (
          <button
            type="button"
            onClick={() => setMoveModalOrder?.(order)}
            className="flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            <Move size={14} />
            Move
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={() => setEditingOrder?.(order)}
            className={btnSecondary}
          >
            Edit
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={() => setShowConfirmDelete?.(order)}
            className="flex h-9 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            Delete
          </button>
        )}
      </div>
    </>
  );
};

export default PendingOrderMobileControls;
