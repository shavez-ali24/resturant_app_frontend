import React from "react";
import StatusDropdown from "./StatusDropdown";

const PendingOrderMobileControls = ({
  order,
  updateOrder,
  setEditingOrder,
  setShowConfirmDelete,
}) => {
  return (
    <>
      <div className="flex flex-col gap-1.5 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
          Status
        </span>
        <div data-tour="orders-mobile-status" className="w-full min-[360px]:w-auto">
          <StatusDropdown
            data-tour="orders-status-dropdown"
            order={order}
            updateOrder={updateOrder}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setEditingOrder?.(order)}
          className="h-10 w-full rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Edit
        </button>

        <button
          onClick={() => setShowConfirmDelete?.(order)}
          className="h-10 w-full rounded-xl bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25"
        >
          Delete
        </button>
      </div>
    </>
  );
};

export default PendingOrderMobileControls;
