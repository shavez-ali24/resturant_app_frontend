import React from "react";
import StatusDropdown from "./StatusDropdown";
import { IndianRupee, Move } from "lucide-react";

const PendingOrderMobileControls = ({
  order,
  updateOrder,
  setEditingOrder,
  setShowConfirmDelete,
  setPayModalOrder,
  setMoveModalOrder,
  isDarkMode = false,
}) => {
  const isCompleted = order?.status === "completed";
  const isCancelled = order?.status === "cancelled";
  const isEatHere = order?.orderType === "Eat Here";
  const alreadyPaid = Boolean(order?.paymentMethod || (order?.paymentMethods && order.paymentMethods.length > 0));

  const btnSecondary = `flex h-9 w-full items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
    isDarkMode
      ? "border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700"
      : "border-[#ede8e3] bg-white text-[#1c1917] hover:bg-[#f7f3ef]"
  }`;

  return (
    <>
      {/* Status */}
      <div className="flex flex-col gap-1.5">
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-[#a8a29e]"}`}>
          Status
        </span>
        <div data-tour="orders-mobile-status" className="w-full">
          <StatusDropdown order={order} updateOrder={updateOrder} />
        </div>
      </div>

      {/* Pay / Move / Edit / Delete */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        {/* Pay button */}
        {isCompleted && !alreadyPaid && (
          <button
            onClick={() => setPayModalOrder?.(order)}
            className="flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-green-200 bg-green-50 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
          >
            <IndianRupee size={14} />
            Pay
          </button>
        )}
        {/* Move button */}
        {isEatHere && !isCancelled && !isCompleted && (
          <button
            onClick={() => setMoveModalOrder?.(order)}
            className="flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            <Move size={14} />
            Move
          </button>
        )}
        {/* Edit */}
        {!isCompleted && !isCancelled && (
          <button
            onClick={() => setEditingOrder?.(order)}
            className={btnSecondary}
          >
            Edit
          </button>
        )}
        {/* Cancel */}
        {!isCancelled && (
          <button
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
