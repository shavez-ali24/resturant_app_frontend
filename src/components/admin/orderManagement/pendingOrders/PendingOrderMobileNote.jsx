import React from "react";
import { useSelector } from "react-redux";
import { Eye } from "lucide-react";
import {
  getItemCustomizationText,
  getOrderItemsList,
} from "../commonOrderFile/utils";

const PendingOrderMobileNote = ({ order, onCustomizationsClick }) => {
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const colors = useSelector((state) => state.admin.theme.colors);

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

  const bgColor = isDarkMode ? `${colors.primary}1a` : colors.primaryLight;
  const borderColor = isDarkMode ? `${colors.primary}40` : `${colors.primary}25`;
  const textColor = isDarkMode ? colors.primary : colors.primaryText;
  const badgeBg = isDarkMode ? `${colors.primary}33` : `${colors.primary}15`;

  return (
    <button
      onClick={() => onCustomizationsClick?.(order)}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-black transition-all shadow-sm active:scale-[0.98]"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        color: textColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}30` : `${colors.primary}12`;
        e.currentTarget.style.borderColor = isDarkMode ? `${colors.primary}60` : `${colors.primary}50`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = bgColor;
        e.currentTarget.style.borderColor = borderColor;
      }}
    >
      <Eye size={16} strokeWidth={2.5} />
      <span>Note</span>
      <span
        className="flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full text-[10px] font-black"
        style={{
          backgroundColor: badgeBg,
          color: isDarkMode ? "#ffffff" : colors.primaryText,
        }}
      >
        {customizationCount}
      </span>
    </button>
  );
};

export default PendingOrderMobileNote;
