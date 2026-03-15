import React from "react";
import { Eye } from "lucide-react";

const PendingOrderMobileNote = ({ order, onCustomizationsClick }) => {
  const hasCustomizations =
    order.items &&
    order.items.some(
      (item) => item.customizations && item.customizations.trim() !== ""
    );

  if (!hasCustomizations) {
    return (
      <div className="flex h-10 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm italic text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
        No Note
      </div>
    );
  }

  return (
    <button
      onClick={() => onCustomizationsClick?.(order)}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-medium text-white transition hover:from-orange-600 hover:to-orange-700"
    >
      <Eye size={16} />
      Note
    </button>
  );
};

export default PendingOrderMobileNote;
