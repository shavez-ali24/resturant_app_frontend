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
  const [formErrors, setFormErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = {};
    if (!customerName.trim()) {
      errors.customerName = "Customer name is required";
    }
    if (!customerPhone || customerPhone.length !== 10) {
      errors.customerPhone = "Valid 10-digit phone number is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
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
        className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border ${
          isDarkMode ? "bg-[#1e293b] border-slate-700" : "bg-white border-[#ede8e3]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDarkMode ? "border-slate-700" : "border-[#ede8e3]"
          }`}
        >
          <h3
            className={`text-base font-extrabold ${
              isDarkMode ? "text-slate-100" : "text-[#1c1917]"
            }`}
          >
            New Order — {table.unitType === "ROOM" ? "Room" : "Table"} {table.tableNumber}
          </h3>
          <button
            onClick={onClose}
            className={`rounded-xl p-1.5 transition-colors border border-transparent ${
              isDarkMode
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-[#f7f3ef] text-[#78716c] hover:border-stone-200"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">


          {/* Customer Name (optional) */}
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isDarkMode ? "text-slate-300" : "text-[#87807b]"
              }`}
            >
              Customer Name *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (formErrors.customerName) {
                  setFormErrors((prev) => ({ ...prev, customerName: undefined }));
                }
              }}
              placeholder="Customer name"
              className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 border font-medium ${
                isDarkMode
                  ? "bg-[#0f172a]/30 text-slate-100 border-slate-700/80 placeholder-slate-400/60 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  : "bg-white text-[#1c1917] border-[#ede8e3] placeholder-[#a8a29e] focus:border-orange-400 focus:ring-2 focus:ring-orange-105"
              }`}
            />
            {formErrors.customerName && (
              <p className="mt-1 text-xs text-red-500">{formErrors.customerName}</p>
            )}
          </div>

          {/* Customer Phone */}
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isDarkMode ? "text-slate-300" : "text-[#87807b]"
              }`}
            >
              Phone Number *
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                if (formErrors.customerPhone) {
                  setFormErrors((prev) => ({ ...prev, customerPhone: undefined }));
                }
              }}
              placeholder="Phone number"
              maxLength={10}
              className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 border font-medium ${
                isDarkMode
                  ? "bg-[#0f172a]/30 text-slate-100 border-slate-700/80 placeholder-slate-400/60 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  : "bg-white text-[#1c1917] border-[#ede8e3] placeholder-[#a8a29e] focus:border-orange-400 focus:ring-2 focus:ring-orange-105"
              }`}
            />
            {formErrors.customerPhone && (
              <p className="mt-1 text-xs text-red-500">{formErrors.customerPhone}</p>
            )}
          </div>

          {/* Order Type (read-only) */}
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isDarkMode ? "text-slate-300" : "text-[#87807b]"
              }`}
            >
              Order Type
            </label>
            <div
              className={`w-full rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2 border ${
                isDarkMode
                  ? "bg-slate-800 text-slate-400 border-slate-700"
                  : "bg-[#fbfaf8] text-[#57524e] border-[#ede8e3]"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                <path d="m12 4 4 5H8l4-5Z" />
                <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
              </svg>
              Eat Here
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-xl py-3 text-sm font-extrabold border transition-all duration-150 ${
                isDarkMode
                  ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-slate-100"
                  : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef] hover:text-[#1c1917]"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl py-3 text-sm font-black border border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300 dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400 dark:hover:bg-orange-950/40 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm"
            >
              Proceed
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}