import React from "react";
import { useSelector } from "react-redux";
import { X, ScrollText, MessageSquareText, User, Phone, ShoppingBag } from "lucide-react";
import {
  getItemCustomizationText,
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderItemsList,
} from "../commonOrderFile/utils";

const CustomizationsModal = ({ order, onClose }) => {
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const colors = useSelector((state) => state.admin.theme.colors);
  
  const orderItems = getOrderItemsList(order);
  if (!order || !orderItems.length) return null;

  const customizations = orderItems
    .filter((item) => getItemCustomizationText(item))
    .map((item) => ({
      itemName: item.name || item.menuItem?.name || "Item",
      variant: item.variant || item.variantName,
      customizations: getItemCustomizationText(item),
    }));

  // ── Dynamic Theme Tokens from Redux ──────────────────────────────────────────
  const bg = isDarkMode ? (colors.dark?.cardBg || "#1e293b") : "#ffffff";
  const border = isDarkMode ? (colors.dark?.border || "#334155") : (colors.border || "#ede8e3");
  const textPri = isDarkMode ? (colors.dark?.textPrimary || "#f1f5f9") : (colors.textPrimary || "#1c1917");
  const textSec = isDarkMode ? (colors.dark?.textSecondary || "#94a3b8") : (colors.textSecondary || "#57524e");
  const textMut = isDarkMode ? "#64748b" : (colors.textMuted || "#87807b");
  const pageBg = isDarkMode ? (colors.dark?.pageBg || "#0f172a") : (colors.pageBg || "#fbfaf8");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-hidden rounded-2xl border shadow-2xl transition-all duration-200"
        style={{
          backgroundColor: bg,
          borderColor: border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{
            backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "#ffffff",
            borderBottomColor: border,
          }}
        >
          <div className="flex items-center gap-2">
            <ScrollText size={18} style={{ color: colors.primary }} />
            <h2 className="text-base font-black tracking-tight" style={{ color: textPri }}>
              Order Customizations
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150 active:scale-[0.9] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            style={{ color: textMut, backgroundColor: isDarkMode ? "rgba(51,65,85,0.3)" : "#f5f5f4" }}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="overflow-y-auto max-h-[calc(88vh-130px)] p-5 space-y-4">
          {customizations.length === 0 ? (
            <p className="py-12 text-center text-sm font-semibold" style={{ color: textMut }}>
              No customizations in this order
            </p>
          ) : (
            <>
              {/* Count banner */}
              <div
                className="rounded-xl border px-4 py-3 flex items-center gap-2 shadow-sm"
                style={{
                  backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.3)" : colors.primaryLight,
                  borderColor: isDarkMode ? `${colors.primary}40` : `${colors.primary}25`,
                }}
              >
                <ScrollText size={16} style={{ color: colors.primary }} />
                <p className="text-sm font-black" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>
                  Items with Customizations ({customizations.length})
                </p>
              </div>

              {/* Items List */}
              {customizations.map((item, index) => (
                <div
                  key={`${item.itemName}-${item.variant || ""}-${index}`}
                  className="rounded-xl border overflow-hidden shadow-sm"
                  style={{
                    backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.2)" : "#ffffff",
                    borderColor: border,
                  }}
                >
                  {/* Item Header */}
                  <div
                    className="flex items-center justify-between border-b px-4 py-2.5"
                    style={{
                      backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : colors.primaryLight,
                      borderBottomColor: border,
                    }}
                  >
                    <h4 className="text-sm font-extrabold tracking-tight" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>
                      {item.itemName}
                    </h4>
                    <div className="flex items-center gap-2">
                      {item.variant && (
                        <span
                          className="rounded-lg px-2 py-0.5 text-xs font-black border"
                          style={{
                            backgroundColor: isDarkMode ? `${colors.primary}20` : "#ffffff",
                            borderColor: isDarkMode ? `${colors.primary}40` : `${colors.primary}33`,
                            color: isDarkMode ? colors.primary : colors.primaryText,
                          }}
                        >
                          {item.variant}
                        </span>
                      )}
                      <span className="text-xs font-bold" style={{ color: textMut }}>
                        Item #{index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Customization Text Area */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MessageSquareText size={13} style={{ color: colors.primary }} />
                      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: textSec }}>
                        Customer Request
                      </p>
                    </div>
                    <div
                      className="rounded-xl px-4 py-3 border-l-4 shadow-inner"
                      style={{
                        backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "#fffcf7",
                        borderColor: colors.primary,
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
              ))}

              {/* Summary Information Grid */}
              <div
                className="rounded-xl border p-4 shadow-sm"
                style={{
                  backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.2)" : pageBg,
                  borderColor: border,
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: textMut }}>
                      Order Summary
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: textSec }}>
                      <ShoppingBag size={14} style={{ color: colors.primary }} />
                      <span>Total Items: <span style={{ color: textPri }}>{orderItems.length}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: textSec }}>
                      <ScrollText size={14} style={{ color: colors.primary }} />
                      <span>Customized: <span style={{ color: textPri }}>{customizations.length}</span></span>
                    </div>
                  </div>
                  <div className="space-y-2 border-l pl-4" style={{ borderColor: border }}>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: textMut }}>
                      Customer Info
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: textSec }}>
                      <User size={14} style={{ color: colors.primary }} />
                      <span className="truncate" style={{ color: textPri }}>{getOrderCustomerName(order)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: textSec }}>
                      <Phone size={14} style={{ color: colors.primary }} />
                      <span style={{ color: textSec }}>{getOrderCustomerPhone(order)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex justify-end border-t px-5 py-3.5"
          style={{
            backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : pageBg,
            borderTopColor: border,
          }}
        >
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-sm font-extrabold transition-all duration-150 active:scale-[0.97] border shadow-sm"
            style={{
              backgroundColor: isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff",
              borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
              color: isDarkMode ? colors.primary : colors.primaryText,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.color = colors.primaryText;
              e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}1a` : colors.primaryLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDarkMode ? `${colors.primary}50` : `${colors.primary}33`;
              e.currentTarget.style.color = isDarkMode ? colors.primary : colors.primaryText;
              e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff";
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
