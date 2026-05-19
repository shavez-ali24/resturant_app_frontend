// src/components/admin/orderManagement/pendingOrders/LayoutView/CreateOrderModal.jsx
import React, { useState } from "react";
import { X, ArrowRight } from "lucide-react";

/**
 * Modal shown when a blank table is clicked in the Layout View.
 * Pre-fills table info, allows optional customer name and phone,
 * then navigates to the full AdminOrderPanel with pre-selected table.
 *
 * @param {object} props
 * @param {object} props.table - { tableId, tableNumber, sectionName }
 * @param {boolean} props.isDarkMode
 * @param {function} props.onClose
 * @param {function} props.onProceed - Called with { tableId, tableNumber, sectionName, customerName, customerPhone }
 */
export default function CreateOrderModal({
  table,
  isDarkMode = false,
  onClose,
  onProceed,
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onProceed({
      tableId: table.tableId,
      tableNumber: table.tableNumber,
      sectionName: table.sectionName,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-xl shadow-2xl overflow-hidden ${
          isDarkMode ? "bg-[#1e293b]" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b ${
            isDarkMode ? "border-slate-700" : "border-[#ede8e3]"
          }`}
        >
          <h3
            className={`text-base font-semibold ${
              isDarkMode ? "text-slate-100" : "text-[#1c1917]"
            }`}
          >
            New Order — Table {table.tableNumber}
          </h3>
          <button
            onClick={onClose}
            className={`rounded-lg p-1.5 transition-colors ${
              isDarkMode
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-[#f7f3ef] text-[#78716c]"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Table Info */}
          <div
            className={`rounded-lg px-3.5 py-2.5 text-sm ${
              isDarkMode
                ? "bg-slate-800 text-slate-300"
                : "bg-[#f7f3ef] text-[#78716c]"
            }`}
          >
            <span className="font-medium">
              Section: {table.sectionName}
            </span>
            <span className="mx-2">•</span>
            <span className="font-medium">
              Table #{table.tableNumber}
            </span>
          </div>

          {/* Customer Name (optional) */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? "text-slate-300" : "text-[#1c1917]"
              }`}
            >
              Customer Name{" "}
              <span
                className={
                  isDarkMode ? "text-slate-500" : "text-[#a8a29e]"
                }
              >
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Doe"
              className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200 border ${
                isDarkMode
                  ? "bg-slate-800 text-slate-200 border-slate-600 placeholder-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  : "bg-white text-[#1c1917] border-[#ede8e3] placeholder-[#a8a29e] focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              }`}
            />
          </div>

          {/* Customer Phone (optional) */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? "text-slate-300" : "text-[#1c1917]"
              }`}
            >
              Phone Number{" "}
              <span
                className={
                  isDarkMode ? "text-slate-500" : "text-[#a8a29e]"
                }
              >
                (optional)
              </span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="e.g. 9876543210"
              maxLength={10}
              className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200 border ${
                isDarkMode
                  ? "bg-slate-800 text-slate-200 border-slate-600 placeholder-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  : "bg-white text-[#1c1917] border-[#ede8e3] placeholder-[#a8a29e] focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              }`}
            />
          </div>

          {/* Order Type (read-only) */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? "text-slate-300" : "text-[#1c1917]"
              }`}
            >
              Order Type
            </label>
            <div
              className={`w-full rounded-lg px-3 py-2.5 text-sm font-medium flex items-center gap-2 ${
                isDarkMode
                  ? "bg-slate-800 text-slate-400 border border-slate-600"
                  : "bg-[#f7f3ef] text-[#78716c] border border-[#ede8e3]"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                <path d="m12 4 4 5H8l4-5Z" />
                <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
              </svg>
              Dine-in
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                isDarkMode
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-[#f7f3ef] text-[#78716c] hover:bg-[#ede8e3]"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              Proceed
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}