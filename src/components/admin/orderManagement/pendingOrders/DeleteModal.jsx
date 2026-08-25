import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AlertTriangle, X, Utensils, Bed, Trash2, Loader2 } from "lucide-react";

const DeleteModal = ({
  order,
  onCancel,
  onDelete,
  onCancelRoomBooking = () => {},
  onCancelFoodOnly = () => {},
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState(null); // 'food' | 'room' | 'delete'

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, isSubmitting]);

  // Lock body scrolling when modal is open and restore it cleanly on unmount
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const colors = useSelector((state) => state.admin.theme.colors) || {};

  const bg = isDarkMode ? (colors.dark?.cardBg || "#1e293b") : "#ffffff";
  const border = isDarkMode ? (colors.dark?.border || "border-slate-700/60") : (colors.border || "border-[#ede8e3]");
  const textPri = isDarkMode ? (colors.dark?.textPrimary || "text-slate-100") : (colors.textPrimary || "text-[#1c1917]");
  const textSec = isDarkMode ? (colors.dark?.textSecondary || "text-slate-400") : (colors.textSecondary || "text-[#57524e]");
  const textMut = isDarkMode ? "#64748b" : (colors.textMuted || "#a8a29e");

  if (!order) return null;

  const isRoomStay = !!order.stay?.enabled;
  const hasFoodItems = Array.isArray(order.items) && order.items.length > 0;

  const handleAction = async (actionType, callback) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActiveAction(actionType);
    try {
      await callback();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm transition-all animate-in fade-in duration-150"
      onClick={() => {
        if (!isSubmitting) onCancel();
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl transition-all duration-200 flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: bg,
          borderColor: border,
          borderWidth: "1px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4 shrink-0"
          style={{
            backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "#ffffff",
            borderBottomColor: border,
          }}
        >
          <div className="flex items-center space-x-2.5">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm shrink-0">
              <AlertTriangle size={16} />
            </div>
            <h2 id="delete-modal-title" className="text-base font-black tracking-tight" style={{ color: textPri }}>
              {isRoomStay ? "Cancel Room Order" : "Delete Order"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-orange-100 hover:text-orange-700 active:scale-[0.9] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-orange-300 disabled:opacity-40"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Content Wrapper */}
        <div id="delete-modal-description" className="overflow-y-auto p-5 space-y-5 flex-1 min-h-0">
          {isRoomStay ? (
            hasFoodItems ? (
              // Room booking with food items
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center mb-3">
                    <AlertTriangle className="text-amber-500" size={28} />
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-800 dark:text-slate-100 mb-1">
                    Cancel Stay & Food Items
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                    This order for room <strong>{order.source?.unitName || "Stay"}</strong> has both active room check-in and food items. Select an action:
                  </p>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {/* Option 1: Cancel Food Only */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAction('food', onCancelFoodOnly)}
                    className="w-full flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-500/5 p-3.5 text-left transition hover:bg-amber-500/10 dark:border-amber-900/40 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  >
                    <div className="mt-0.5 rounded-lg bg-amber-500 p-2 text-white shrink-0">
                      {isSubmitting && activeAction === 'food' ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Utensils size={15} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-amber-800 dark:text-amber-400">
                        Cancel Food Items Only
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Clear all ordered food items, but keep the room check-in active.
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Cancel Room Booking & Food */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAction('room', onCancelRoomBooking)}
                    className="w-full flex items-start gap-3 rounded-xl border border-red-200 bg-red-500/5 p-3.5 text-left transition hover:bg-red-500/10 dark:border-red-950/40 dark:bg-red-950/10 dark:hover:bg-red-950/20 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <div className="mt-0.5 rounded-lg bg-red-600 p-2 text-white shrink-0">
                      {isSubmitting && activeAction === 'room' ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Bed size={15} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-red-700 dark:text-red-400">
                        Cancel Room Booking & Food
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Cancel check-in stay, free the room, and clear all ordered food items.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              // Room booking ONLY, no food items
              <div className="text-center py-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-3">
                  <Bed className="text-red-500" size={26} />
                </div>
                <h3 className="text-sm font-extrabold text-gray-800 dark:text-slate-100 mb-1">
                  Cancel Room Booking
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to cancel the room booking for room <strong>{order.source?.unitName || "Stay"}</strong>? This will check out the guest and make the room available.
                </p>
              </div>
            )
          ) : (
            // Standard Table/Delivery/Takeaway order
            <div className="text-center py-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-3">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <h3 className="text-sm font-extrabold text-gray-800 dark:text-slate-100 mb-1">
                Permanently Delete Order?
              </h3>
              <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                This action cannot be undone. The order details, food items, and history will be permanently deleted.
              </p>
            </div>
          )}

          {/* Order Summary details */}
          {(!isRoomStay || !hasFoodItems) && (
            <div
              className="rounded-xl border p-4"
              style={{
                backgroundColor: isDarkMode ? "rgba(15,23,42,0.4)" : "#fcfaf7",
                borderColor: border,
              }}
            >
              <h4 className="text-xs font-black text-gray-800 dark:text-slate-200 mb-2.5 uppercase tracking-wider">
                Order Details:
              </h4>
              <div className="space-y-2 text-xs text-gray-700 dark:text-slate-300">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-gray-400 uppercase text-[9px] tracking-wider shrink-0">Customer:</span>
                  <span className="font-bold text-right truncate" style={{ color: textPri }}>{order.customerName || "Walk-in"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-gray-400 uppercase text-[9px] tracking-wider shrink-0">Phone:</span>
                  <span className="font-bold text-right truncate" style={{ color: textPri }}>{order.customerPhone || "Not provided"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-gray-400 uppercase text-[9px] tracking-wider shrink-0">Order Type:</span>
                  <span className="font-bold text-right truncate capitalize" style={{ color: textPri }}>{String(order.orderType || "").toLowerCase()}</span>
                </div>
                {order.source?.unitName && (
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-gray-400 uppercase text-[9px] tracking-wider shrink-0">
                      {isRoomStay ? "Room:" : "Table:"}
                    </span>
                    <span className="font-bold text-right truncate" style={{ color: textPri }}>{order.source.unitName}</span>
                  </div>
                )}
                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-gray-400 uppercase text-[9px] tracking-wider shrink-0">Total Items:</span>
                    <span className="font-bold text-right" style={{ color: textPri }}>{order.items.length}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2 border-t pt-1.5 mt-1" style={{ borderColor: border }}>
                  <span className="font-semibold text-gray-400 uppercase text-[9px] tracking-wider shrink-0">Total Amount:</span>
                  <span className="font-black text-right text-orange-500">₹{order.totalAmount || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="flex justify-end space-x-3 border-t px-5 py-4 shrink-0"
          style={{
            backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "rgba(252, 250, 247, 0.4)",
            borderTopColor: border,
          }}
        >
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="h-10 rounded-xl border px-5 text-sm font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-40"
            style={{
              backgroundColor: isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff",
              borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
              color: isDarkMode ? colors.primary : colors.primaryText,
            }}
            onMouseEnter={(e) => {
              if (isSubmitting) return;
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.color = colors.primaryText;
              e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}1a` : colors.primaryLight;
            }}
            onMouseLeave={(e) => {
              if (isSubmitting) return;
              e.currentTarget.style.borderColor = isDarkMode ? `${colors.primary}50` : `${colors.primary}33`;
              e.currentTarget.style.color = isDarkMode ? colors.primary : colors.primaryText;
              e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff";
            }}
          >
            {isRoomStay && hasFoodItems ? "Close" : "Cancel"}
          </button>
          {(!isRoomStay || (isRoomStay && !hasFoodItems)) && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('delete', isRoomStay ? onCancelRoomBooking : onDelete)}
              className="flex h-10 items-center justify-center space-x-2 rounded-xl bg-red-600 px-5 text-sm font-extrabold text-white shadow-sm transition-all duration-150 hover:bg-red-700 active:scale-[0.97] disabled:opacity-50"
            >
              {isSubmitting && activeAction === 'delete' ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <AlertTriangle size={15} />
              )}
              <span>{isRoomStay ? "Cancel Booking" : "Delete Order"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
