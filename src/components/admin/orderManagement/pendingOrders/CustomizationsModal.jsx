import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { X, ScrollText, MessageSquareText, User, Phone, ShoppingBag, PieChart } from "lucide-react";
import {
  getItemCustomizationText,
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderItemsList,
} from "../commonOrderFile/utils";

// --- Clean sub-components to keep code modular and readable ---

function SummaryCard({ title, value, icon: Icon, color, isDarkMode, colors }) {
  return (
    <div
      className={`rounded-xl border p-2.5 flex items-center gap-3 transition-all ${
        isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-gray-50/70 border-gray-150/70"
      }`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          backgroundColor: isDarkMode ? `${color}20` : `${color}12`,
          color: color,
        }}
      >
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] font-black uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
          {title}
        </p>
        <p className="text-sm font-black mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

function CustomizationCard({ item, index, isDarkMode, colors, border, textPri, textSec, textMut }) {
  return (
    <div
      className="rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
      style={{
        backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.2)" : "#ffffff",
        borderColor: border,
      }}
    >
      {/* Item Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{
          backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : colors.primaryLight || "#fff7ed",
          borderBottomColor: border,
        }}
      >
        <h4
          className="text-sm font-extrabold tracking-tight truncate mr-2"
          style={{ color: isDarkMode ? colors.primary || "#f97316" : colors.primaryText || "#c2410c" }}
        >
          {item.itemName}
        </h4>
        <div className="flex items-center gap-2 shrink-0">
          {item.variant && (
            <span
              className="rounded-lg px-2 py-0.5 text-xs font-black border truncate max-w-[80px]"
              style={{
                backgroundColor: isDarkMode ? `${colors.primary || "#f97316"}20` : "#ffffff",
                borderColor: isDarkMode ? `${colors.primary || "#f97316"}40` : `${colors.primary || "#f97316"}33`,
                color: isDarkMode ? colors.primary || "#f97316" : colors.primaryText || "#c2410c",
              }}
            >
              {item.variant}
            </span>
          )}
          <span className="text-xs font-bold whitespace-nowrap" style={{ color: textMut }}>
            Item #{index + 1}
          </span>
        </div>
      </div>

      {/* Customization Text Area */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <MessageSquareText size={13} style={{ color: colors.primary || "#f97316" }} />
          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: textSec }}>
            Customer Request
          </p>
        </div>
        <div
          className="rounded-xl px-4 py-3 border-l-4 shadow-inner"
          style={{
            backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "#fffcf7",
            borderColor: colors.primary || "#f97316",
            borderTopColor: border,
            borderRightColor: border,
            borderBottomColor: border,
            borderWidth: "1px",
            borderLeftWidth: "4px",
          }}
        >
          <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap break-words" style={{ color: textPri }}>
            {item.customizations}
          </p>
        </div>
      </div>
    </div>
  );
}

const CustomizationsModal = ({ order, onClose, isDarkMode }) => {
  const isDarkModeResolved =
    typeof isDarkMode === "boolean"
      ? isDarkMode
      : typeof document !== "undefined" &&
        (document.documentElement.classList.contains("admin-dark") ||
          document.documentElement.classList.contains("dark"));
  const colors = useSelector((state) => state.admin?.theme?.colors) || {};

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock body scroll when modal is open and restore it cleanly on unmount
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const orderItems = useMemo(() => getOrderItemsList(order) || [], [order]);

  const customizations = useMemo(() => {
    return orderItems
      .filter((item) => getItemCustomizationText(item))
      .map((item) => ({
        itemName: item.name || item.menuItem?.name || "Item",
        variant: item.variant || item.variantName || null,
        customizations: getItemCustomizationText(item),
      }));
  }, [orderItems]);

  if (!order || !orderItems.length) return null;

  // -- Dynamic Theme Tokens from Redux --
  const bg = isDarkModeResolved ? colors.dark?.cardBg || "#1e293b" : "#ffffff";
  const border = isDarkModeResolved ? colors.dark?.border || "#334155" : colors.border || "#ede8e3";
  const textPri = isDarkModeResolved ? colors.dark?.textPrimary || "#f1f5f9" : colors.textPrimary || "#1c1917";
  const textSec = isDarkModeResolved ? colors.dark?.textSecondary || "#94a3b8" : colors.textSecondary || "#57524e";
  const textMut = isDarkModeResolved ? "#64748b" : colors.textMuted || "#87807b";
  const pageBg = isDarkModeResolved ? colors.dark?.pageBg || "#0f172a" : colors.pageBg || "#fbfaf8";
  const primaryColor = colors.primary || "#f97316";

  const customerName = getOrderCustomerName(order) || "Not provided";
  const customerPhone = getOrderCustomerPhone(order) || "Not provided";
  const totalCount = orderItems.length;
  const customizedCount = customizations.length;
  const customPercentage = totalCount > 0 ? Math.round((customizedCount / totalCount) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customizations-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm transition-all animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl border shadow-2xl transition-all duration-200 flex flex-col"
        style={{
          backgroundColor: bg,
          borderColor: border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* -- Header -- */}
        <div
          className="flex items-center justify-between border-b px-5 py-4 shrink-0"
          style={{
            backgroundColor: isDarkModeResolved ? "rgba(15, 23, 42, 0.4)" : "#ffffff",
            borderBottomColor: border,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: isDarkModeResolved ? `${primaryColor}20` : `${primaryColor}12`,
                color: primaryColor,
              }}
            >
              <ScrollText size={16} />
            </div>
            <div className="min-w-0">
              <h2 id="customizations-modal-title" className="text-sm font-extrabold tracking-tight truncate" style={{ color: textPri }}>
                Order Customizations
              </h2>
              <p className="text-[10px] font-semibold truncate" style={{ color: textMut }}>
                {customizedCount} of {totalCount} items customized ({customPercentage}%)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customizations"
            className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150 active:scale-[0.9] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 shrink-0"
            style={{ color: textMut, backgroundColor: isDarkModeResolved ? "rgba(51,65,85,0.3)" : "#f5f5f4" }}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* -- Content -- */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4 min-h-0">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard
              title="Customized"
              value={customizedCount}
              icon={ScrollText}
              color={primaryColor}
              isDarkMode={isDarkModeResolved}
              colors={colors}
            />
            <SummaryCard
              title="Total Items"
              value={totalCount}
              icon={ShoppingBag}
              color={isDarkModeResolved ? "#38bdf8" : "#0284c7"}
              isDarkMode={isDarkModeResolved}
              colors={colors}
            />
            <SummaryCard
              title="Custom Ratio"
              value={`${customPercentage}%`}
              icon={PieChart}
              color={isDarkModeResolved ? "#34d399" : "#059669"}
              isDarkMode={isDarkModeResolved}
              colors={colors}
            />
          </div>

          {/* Customer Information Card */}
          <div
            className="rounded-xl border p-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between shadow-sm"
            style={{
              backgroundColor: isDarkModeResolved ? "rgba(15, 23, 42, 0.2)" : pageBg,
              borderColor: border,
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-slate-500"
                style={{ backgroundColor: isDarkModeResolved ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
              >
                <User size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Customer Name</p>
                <p className="text-xs font-black truncate" style={{ color: textPri }}>
                  {customerName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 min-w-0 sm:border-l sm:pl-4 sm:border-slate-800/10 dark:sm:border-slate-300/10">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-slate-500"
                style={{ backgroundColor: isDarkModeResolved ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
              >
                <Phone size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</p>
                <p className="text-xs font-black truncate" style={{ color: textPri }}>
                  {customerPhone}
                </p>
              </div>
            </div>
          </div>

          {/* Customization items list */}
          {customizedCount === 0 ? (
            <div
              className="text-center py-10 px-4 border border-dashed rounded-xl space-y-2"
              style={{
                backgroundColor: isDarkModeResolved ? "rgba(15, 23, 42, 0.2)" : "rgba(0,0,0,0.01)",
                borderColor: border,
              }}
            >
              <MessageSquareText size={28} className="mx-auto text-slate-400 opacity-60" />
              <div>
                <p className="text-xs font-bold" style={{ color: textPri }}>
                  No Customizations
                </p>
                <p className="text-[11px] opacity-70 mt-0.5" style={{ color: textSec }}>
                  This order doesn't contain any special customer requests.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {customizations.map((item, index) => (
                <CustomizationCard
                  key={`${item.itemName}-${item.variant || ""}-${index}`}
                  item={item}
                  index={index}
                  isDarkMode={isDarkModeResolved}
                  colors={colors}
                  border={border}
                  textPri={textPri}
                  textSec={textSec}
                  textMut={textMut}
                />
              ))}
            </div>
          )}
        </div>

        {/* -- Footer -- */}
        <div
          className="flex justify-end border-t px-5 py-3 shrink-0"
          style={{
            backgroundColor: isDarkModeResolved ? "rgba(15, 23, 42, 0.4)" : pageBg,
            borderTopColor: border,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-xs font-black uppercase tracking-wider transition-all duration-150 active:scale-[0.97] border shadow-sm"
            style={{
              backgroundColor: isDarkModeResolved ? "rgba(30,41,59,0.6)" : "#ffffff",
              borderColor: isDarkModeResolved ? `${primaryColor}50` : `${primaryColor}33`,
              color: isDarkModeResolved ? primaryColor : colors.primaryText || "#c2410c",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = primaryColor;
              e.currentTarget.style.backgroundColor = isDarkModeResolved ? `${primaryColor}1a` : colors.primaryLight || "#fff7ed";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDarkModeResolved ? `${primaryColor}50` : `${primaryColor}33`;
              e.currentTarget.style.backgroundColor = isDarkModeResolved ? "rgba(30,41,59,0.6)" : "#ffffff";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationsModal;
