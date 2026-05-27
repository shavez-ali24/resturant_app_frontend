import React from "react";
import { Eye } from "lucide-react";
import {
  getItemCustomizationText,
  getOrderItemsList,
} from "../commonOrderFile/utils";

const PendingOrderMobileNote = ({ order, onCustomizationsClick }) => {
  const isDarkMode = localStorage.getItem("admin-theme") === "dark";
  const orderItems = getOrderItemsList(order);
  const customizationCount = orderItems.filter((item) =>
    getItemCustomizationText(item)
  ).length;
  const hasCustomizations = customizationCount > 0;

  if (!hasCustomizations) {
    return (
      <div className={`flex h-10 w-full items-center justify-center rounded-xl border border-dashed text-xs font-semibold ${
        isDarkMode ? "border-slate-700 bg-slate-800/30 text-slate-500" : "border-[#ede8e3] bg-white text-[#a8a29e]"
      }`}>
        No Note
      </div>
    );
  }

  return (
    <button
      onClick={() => onCustomizationsClick?.(order)}
      className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition-all shadow-sm active:scale-[0.98] ${
        isDarkMode
          ? "border-orange-500/35 bg-orange-950/20 text-orange-400 hover:bg-orange-950/30"
          : "border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300"
      }`}
    >
      <Eye size={16} strokeWidth={2.5} />
      <span>Note</span>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
        isDarkMode ? "bg-orange-900/60 text-orange-355" : "bg-orange-100 text-orange-850"
      }`}>
        {customizationCount}
      </span>
    </button>
  );
};

export default PendingOrderMobileNote;
