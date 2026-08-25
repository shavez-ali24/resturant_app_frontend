import React, { memo, useMemo } from "react";
import { useSelector } from "react-redux";
import { Eye } from "lucide-react";
import {
  getItemCustomizationText,
  getOrderItemsList,
} from "../commonOrderFile/utils";

const PendingOrderMobileNote = memo(({
  order,
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

  const customizationCount = useMemo(() => {
    const orderItems = getOrderItemsList(order);
    return orderItems.reduce((count, item) => {
      return getItemCustomizationText(item) ? count + 1 : count;
    }, 0);
  }, [order]);

  const hasCustomizations = customizationCount > 0;

  const handleClick = () => {
    onCustomizationsClick?.(order);
  };

  if (!hasCustomizations) {
    return (
      <div
        className={`flex h-10 w-full items-center justify-center rounded-xl border border-dashed text-xs font-semibold ${
          isDarkMode
            ? "border-slate-700 bg-slate-800/30 text-slate-500"
            : "border-[#ede8e3] bg-white text-[#a8a29e]"
        }`}
      >
        No Note
      </div>
    );
  }

  const bgColor = isDarkMode
    ? `${colors.primary}1a`
    : colors.primaryLight;

  const borderColor = isDarkMode
    ? `${colors.primary}40`
    : `${colors.primary}25`;

  const textColor = isDarkMode
    ? colors.primary
    : colors.primaryText;

  const badgeBg = isDarkMode
    ? `${colors.primary}33`
    : `${colors.primary}15`;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-black shadow-sm transition-all active:scale-[0.98]"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        color: textColor,
      }}
    >
      <Eye size={16} strokeWidth={2.5} />
      <span>Note</span>
      <span
        className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black"
        style={{
          backgroundColor: badgeBg,
          color: isDarkMode ? "#ffffff" : colors.primaryText,
        }}
      >
        {customizationCount}
      </span>
    </button>
  );
});

PendingOrderMobileNote.displayName = "PendingOrderMobileNote";

export default PendingOrderMobileNote;
