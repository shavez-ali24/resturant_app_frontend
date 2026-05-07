import React from "react";
import StatusDropdown from "./StatusDropdown";

const PendingOrderMobileControls = ({
  order,
  updateOrder,
  setEditingOrder,
  setShowConfirmDelete,
  isDarkMode = false,
}) => {
  return (
    <>
      {/* Status */}
      <div className="flex flex-col items-center gap-1.5">
        <span className={`text-center text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-[#a8a29e]"}`}>
          Status
        </span>
        <div data-tour="orders-mobile-status" className="w-full">
          <StatusDropdown order={order} updateOrder={updateOrder} />
        </div>
      </div>

      {/* Edit / Delete */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <button
          onClick={() => setEditingOrder?.(order)}
          className={`flex h-9 w-full items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
            isDarkMode
              ? "border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700"
              : "border-[#ede8e3] bg-white text-[#1c1917] hover:bg-[#f7f3ef]"
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => setShowConfirmDelete?.(order)}
          className="flex h-9 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </>
  );
};

export default PendingOrderMobileControls;
