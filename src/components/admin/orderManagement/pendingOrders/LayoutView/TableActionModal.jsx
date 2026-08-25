// src/components/admin/orderManagement/pendingOrders/LayoutView/TableActionModal.jsx
import React from "react";
import { useSelector } from "react-redux";
import { X, IndianRupee, SquarePen, Printer, Trash2 } from "lucide-react";

export default function TableActionModal({
  table,
  isDarkMode = false,
  onClose,
  onEdit,
  onView,
  onPay,
  onCancelBooking,
  isLoading = false,
}) {
  const colors = useSelector((state) => state.admin.theme.colors);
  const isBilled = table?.rawStatus === "BILLED" || table?.status === "billed";
  const orderId = table?.currentOrderId || table?.orderId;
  const tableNumDisplay = /^\d+$/.test(String(table?.tableNumber || ""))
    ? `T${table.tableNumber}`
    : table?.tableNumber || "Table";

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit?.(table);
    onClose?.();
  };

  const handleViewClick = (e) => {
    e.stopPropagation();
    onView?.(table);
    onClose?.();
  };

  const handlePayClick = (e) => {
    e.stopPropagation();
    onPay?.(table);
    onClose?.();
  };

  const handleCancelClick = (e) => {
    e.stopPropagation();
    onCancelBooking?.(table);
    onClose?.();
  };

  if (!table) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <style>{`
        .theme-action-btn {
          border-color: ${colors.primary}40 !important;
          color: ${colors.primary} !important;
          background-color: ${isDarkMode ? "rgba(30, 41, 59, 0.4)" : "#ffffff"} !important;
        }
        .theme-action-btn:hover {
          background-color: ${isDarkMode ? `${colors.primary}20` : `${colors.primary}10`} !important;
          border-color: ${colors.primary} !important;
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-xl shadow-2xl overflow-hidden ${
          isDarkMode ? "bg-[#1e293b]" : "bg-white"
        }`}
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
            Manage Table — {tableNumDisplay}
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
        <div className="p-5 space-y-4">
          <div className="space-y-3">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isBilled ? "bg-green-500 animate-pulse" : "bg-yellow-500 animate-pulse"
                }`}
              />
              <span
                className={`text-sm font-bold ${
                  isDarkMode ? "text-slate-350" : "text-[#78716c]"
                }`}
              >
                {isBilled ? "Table Billed" : "Table Occupied"}
              </span>
            </div>

            {/* Current Amount Card */}
            <div
              className={`text-sm px-4 py-2.5 rounded-lg border font-bold ${
                isDarkMode
                  ? "bg-slate-800/50 border-slate-700 text-slate-300"
                  : "bg-[#f7f3ef] border-[#ede8e3] text-[#78716c]"
              }`}
            >
              Order Total: ₹{Number(table?.currentAmount || 0).toLocaleString("en-IN")}
            </div>

            {/* Button grid (3 buttons: Edit, Bill, Pay) */}
            {orderId && (
              <div className="grid grid-cols-3 gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="theme-action-btn flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-black shadow-sm transition-all duration-150 active:scale-95"
                  title="Edit Order"
                >
                  <SquarePen size={16} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={handleViewClick}
                  className="theme-action-btn flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-black shadow-sm transition-all duration-150 active:scale-95"
                  title="Print Bill"
                >
                  <Printer size={16} />
                  <span>Bill</span>
                </button>
                <button
                  type="button"
                  onClick={handlePayClick}
                  className="theme-action-btn flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-black shadow-sm transition-all duration-150 active:scale-95"
                  title="Pay Order"
                >
                  <IndianRupee size={16} />
                  <span>Pay</span>
                </button>
              </div>
            )}

            {/* Bottom cancel action button */}
            {orderId && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCancelClick}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg text-xs font-black border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <Trash2 size={14} />
                  <span>Delete Order</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
