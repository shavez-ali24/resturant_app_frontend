import React from "react";
import { X } from "lucide-react";
import {
  getItemCustomizationText,
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderItemsList,
} from "../commonOrderFile/utils";

const CustomizationsModal = ({ order, onClose }) => {
  const isDarkMode = localStorage.getItem("admin-theme") === "dark";
  const orderItems = getOrderItemsList(order);
  if (!order || !orderItems.length) return null;

  const customizations = orderItems
    .filter((item) => getItemCustomizationText(item))
    .map((item) => ({
      itemName: item.name || item.menuItem?.name || "Item",
      variant: item.variant || item.variantName,
      customizations: getItemCustomizationText(item),
    }));

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const modalBg    = isDarkMode ? "bg-[#1e293b] border-slate-700/60"  : "bg-white border-[#ede8e3]";
  const headerBg   = isDarkMode ? "bg-[#0f172a] border-slate-700/60"  : "bg-[#f7f3ef] border-[#ede8e3]";
  const textPri    = isDarkMode ? "text-slate-100"  : "text-[#1c1917]";
  const textSec    = isDarkMode ? "text-slate-400"  : "text-[#78716c]";
  const textMut    = isDarkMode ? "text-slate-500"  : "text-[#a8a29e]";
  const cardBg     = isDarkMode ? "bg-[#0f172a] border-slate-700/60"  : "bg-white border-[#ede8e3]";
  const cardHeader = isDarkMode ? "bg-slate-800/60 border-slate-700/60" : "bg-[#f7f3ef] border-[#ede8e3]";
  const noteBg     = isDarkMode ? "bg-slate-800/40 border-slate-700/40" : "bg-[#fff7ed] border-orange-100";
  const summaryBg  = isDarkMode ? "bg-slate-800/40 border-slate-700/40" : "bg-[#f7f3ef] border-[#ede8e3]";
  const divider    = isDarkMode ? "border-slate-700/60" : "border-[#ede8e3]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`w-full max-w-lg max-h-[88vh] overflow-hidden rounded-2xl border shadow-xl ${modalBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={`flex items-center justify-between border-b px-5 py-4 ${headerBg}`}>
          <h2 className={`text-base font-bold ${textPri}`}>Order Customizations</h2>
          <button
            onClick={onClose}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              isDarkMode ? "text-slate-400 hover:bg-slate-700 hover:text-slate-100" : "text-[#a8a29e] hover:bg-[#ede8e3] hover:text-[#1c1917]"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="overflow-y-auto max-h-[calc(88vh-120px)] p-5 space-y-4">
          {customizations.length === 0 ? (
            <p className={`py-8 text-center text-sm ${textMut}`}>No customizations in this order</p>
          ) : (
            <>
              {/* Count banner */}
              <div className={`rounded-xl border px-4 py-3 ${summaryBg}`}>
                <p className={`text-sm font-semibold ${textPri}`}>
                  Items with Customizations ({customizations.length})
                </p>
              </div>

              {/* Items */}
              {customizations.map((item, index) => (
                <div key={`${item.itemName}-${item.variant || ''}-${index}`} className={`rounded-xl border overflow-hidden ${cardBg}`}>
                  {/* Item header */}
                  <div className={`flex items-center justify-between border-b px-4 py-3 ${cardHeader}`}>
                    <h4 className={`text-sm font-bold ${textPri}`}>{item.itemName}</h4>
                    <div className="flex items-center gap-2">
                      {item.variant && (
                        <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${
                          isDarkMode ? "border-slate-600 bg-slate-700 text-slate-200" : "border-orange-200 bg-orange-50 text-orange-700"
                        }`}>
                          {item.variant}
                        </span>
                      )}
                      <span className={`text-xs ${textMut}`}>Item #{index + 1}</span>
                    </div>
                  </div>

                  {/* Customization text */}
                  <div className="px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                      <div className="flex-1">
                        <p className={`mb-2 text-xs font-semibold ${textSec}`}>Customer Request:</p>
                        <div className={`rounded-lg border px-3 py-2.5 ${noteBg}`}>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${textPri}`}>
                            {item.customizations}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className={`rounded-xl border px-4 py-3 ${summaryBg}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs font-semibold mb-1.5 ${textMut}`}>Order Details</p>
                    <p className={`text-sm ${textSec}`}>Total Items: <span className={`font-semibold ${textPri}`}>{orderItems.length}</span></p>
                    <p className={`text-sm ${textSec}`}>Customized: <span className={`font-semibold ${textPri}`}>{customizations.length}</span></p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold mb-1.5 ${textMut}`}>Customer</p>
                    <p className={`text-sm font-semibold ${textPri}`}>{getOrderCustomerName(order)}</p>
                    <p className={`text-sm ${textSec}`}>{getOrderCustomerPhone(order)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className={`flex justify-end border-t px-5 py-3 ${divider} ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
          <button
            onClick={onClose}
            className={`rounded-lg px-5 py-2 text-sm font-bold transition-all active:scale-[0.97] ${
              isDarkMode
                ? "border border-orange-500/35 bg-orange-950/20 text-orange-400 hover:bg-orange-950/40"
                : "border border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300 shadow-sm"
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationsModal;
