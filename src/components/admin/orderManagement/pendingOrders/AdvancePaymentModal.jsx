import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  X,
  Loader2,
  Trash2,
  SquarePen,
  Plus,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Receipt,
  Wallet,
} from "lucide-react";
import {
  useAddAdvancePaymentMutation,
  useEditAdvancePaymentMutation,
  useDeleteAdvancePaymentMutation,
  useGetOrderByIdQuery,
} from "@/redux/adminRedux/adminAPI";
import { useNotification } from "../../Bell/NotificationContext";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "UPI", label: "UPI", icon: Smartphone },
  { id: "CARD", label: "Card", icon: CreditCard },
];

/**
 * Format timestamp safely for en-IN locale
 */
function formatSafeDate(dateVal) {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdvancePaymentModal({ orderId, isDarkMode = false, onClose }) {
  const themeColors = useSelector((state) => state.admin?.theme?.colors) || {};
  const primaryColor = themeColors.primary || "#f97316";
  const { notify } = useNotification();

  // Queries & Mutations
  const {
    data: orderData,
    isLoading: isOrderLoading,
    isError: isOrderError,
    error: orderErrorObj,
    refetch,
  } = useGetOrderByIdQuery(orderId, {
    skip: !orderId,
  });

  const [addAdvance, { isLoading: isAdding }] = useAddAdvancePaymentMutation();
  const [editAdvance, { isLoading: isEditing }] = useEditAdvancePaymentMutation();
  const [deleteAdvance, { isLoading: isDeleting }] = useDeleteAdvancePaymentMutation();

  const isSubmitting = isAdding || isEditing;

  // Local Form States
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

  // Refs
  const amountInputRef = useRef(null);
  const paymentsContainerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const prevCount = useRef(0);

  // Extract advance payments safely
  const advancePayments = useMemo(() => {
    return Array.isArray(orderData?.advancePayments) ? orderData.advancePayments : [];
  }, [orderData?.advancePayments]);

  // Financial calculations
  const totalAmount = useMemo(() => Number(orderData?.totalAmount || 0), [orderData?.totalAmount]);

  const totalAdvancePaid = useMemo(() => {
    return advancePayments.reduce((sum, p) => sum + Number(p?.amount || 0), 0);
  }, [advancePayments]);

  const remainingAmount = useMemo(() => {
    return Math.max(0, totalAmount - totalAdvancePaid);
  }, [totalAmount, totalAdvancePaid]);

  // Auto-scroll when new payment is added
  useEffect(() => {
    if (advancePayments.length > prevCount.current) {
      scrollTimeoutRef.current = setTimeout(() => {
        if (paymentsContainerRef.current) {
          paymentsContainerRef.current.scrollTop = paymentsContainerRef.current.scrollHeight;
        }
      }, 100);
    }
    prevCount.current = advancePayments.length;

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [advancePayments.length]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (deletingPaymentId) {
          setDeletingPaymentId(null);
        } else if (editingPayment) {
          handleCancelEdit();
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deletingPaymentId, editingPayment, onClose]);

  // Amount input handler with decimal formatting limit
  const handleAmountChange = (e) => {
    const val = e.target.value;
    // Allow empty or positive numbers with up to 2 decimal places
    if (val === "" || /^\d+(\.\d{0,2})?$/.test(val)) {
      setAmount(val);
    }
  };

  const handleStartEdit = useCallback((payment) => {
    setDeletingPaymentId(null);
    setEditingPayment(payment);
    setAmount(String(payment.amount || ""));
    setMethod(payment.paymentMethod || "CASH");
    setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }, 50);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingPayment(null);
    setAmount("");
    setMethod("CASH");
  }, []);

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (isSubmitting || isDeleting) return;

    const enteredAmount = Number(amount);
    if (!amount || isNaN(enteredAmount) || enteredAmount <= 0) {
      notify("Please enter a valid amount greater than 0", "error");
      amountInputRef.current?.focus();
      return;
    }

  


    try {
      if (editingPayment) {
        // Edit existing payment
        await editAdvance({
          orderId,
          advancePaymentId: editingPayment._id,
          amount: enteredAmount,
          paymentMethod: method,
        }).unwrap();

        notify("Advance payment updated successfully", "success");
        setEditingPayment(null);
      } else {
        // Add new payment
        await addAdvance({
          orderId,
          amount: enteredAmount,
          paymentMethod: method,
        }).unwrap();

        notify("Advance payment added successfully", "success");
      }

      setAmount("");
      setMethod("CASH");
      refetch();
    } catch (err) {
      notify(err?.data?.message || err?.message || "Operation failed. Please try again.", "error");
    }
  };

  const handleDelete = async (paymentId) => {
    if (isDeleting) return;
    try {
      await deleteAdvance({ orderId, advancePaymentId: paymentId }).unwrap();
      notify("Advance payment deleted successfully", "success");
      setDeletingPaymentId(null);
      refetch();
    } catch (err) {
      notify(err?.data?.message || err?.message || "Failed to delete advance payment", "error");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="advance-payment-title"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-[3px] transition-all animate-in fade-in duration-150"
    >
      <style>{`
        .custom-focus:focus {
          border-color: ${primaryColor} !important;
          box-shadow: 0 0 0 2px ${primaryColor}33 !important;
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isDarkMode
            ? "bg-slate-900 border border-slate-800 text-slate-100"
            : "bg-white border border-gray-100 text-gray-900"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
            isDarkMode ? "border-slate-800/80 bg-slate-900/50" : "border-gray-100 bg-gray-50/50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: isDarkMode ? `${primaryColor}20` : `${primaryColor}15`,
                color: primaryColor,
              }}
            >
              <Wallet size={16} />
            </div>
            <div>
              <h3 id="advance-payment-title" className="text-sm font-extrabold tracking-tight">
                Manage Advance Payments
              </h3>
              <p className={`text-[10px] font-semibold ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                {advancePayments.length} transaction{advancePayments.length === 1 ? "" : "s"} recorded
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={`rounded-xl p-1.5 transition-colors ${
              isDarkMode
                ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                : "hover:bg-gray-200/60 text-gray-500 hover:text-gray-800"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0">
          {isOrderLoading ? (
            <div className="flex flex-col items-center justify-center py-14 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
              <p className={`text-xs font-semibold ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                Loading order details...
              </p>
            </div>
          ) : isOrderError ? (
            <div
              className={`p-6 rounded-2xl border text-center space-y-3 my-4 ${
                isDarkMode ? "bg-red-950/20 border-red-900/40 text-red-300" : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <AlertCircle size={28} className="mx-auto text-red-500" />
              <div>
                <p className="text-xs font-bold">Failed to load order financial data</p>
                <p className="text-[11px] opacity-75 mt-0.5">
                  {orderErrorObj?.data?.message || orderErrorObj?.message || "Server communication error"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-800 border shadow-sm hover:bg-gray-50"
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <>


              {/* Recorded Payments Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-0.5">
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                    Recorded Payments
                  </h4>
                  {advancePayments.length > 0 && (
                    <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
                      {advancePayments.length} Total
                    </span>
                  )}
                </div>

                {advancePayments.length === 0 ? (
                  <div
                    className={`text-center py-7 px-4 border border-dashed rounded-xl ${
                      isDarkMode
                        ? "border-slate-800 bg-slate-900/30 text-slate-400"
                        : "border-gray-200 bg-gray-50/50 text-gray-500"
                    }`}
                  >
                    <Receipt size={24} className="mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs font-bold">No advance payments recorded yet</p>
                    <p className="text-[11px] opacity-75 mt-0.5">Use the form below to record an advance</p>
                  </div>
                ) : (
                  <div
                    ref={paymentsContainerRef}
                    className="space-y-2 max-h-[190px] overflow-y-auto pr-1 select-none"
                  >
                    {advancePayments.map((payment) => {
                      const paymentDate =
                        payment?.paidAt ||
                        payment?.createdAt ||
                        payment?.date ||
                        orderData?.createdAt;
                      const dateStr = formatSafeDate(paymentDate);

                      const isConfirmingDelete = deletingPaymentId === payment?._id;
                      const isCurrentlyEditing = editingPayment?._id === payment?._id;

                      if (isConfirmingDelete) {
                        return (
                          <div
                            key={payment._id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all animate-in fade-in duration-100 ${
                              isDarkMode
                                ? "bg-red-950/30 border-red-900/40 text-red-200"
                                : "bg-red-50 border-red-200/80 text-red-900"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <AlertCircle size={14} className="text-red-500 shrink-0" />
                              <span className="text-xs font-bold">Delete ₹{payment.amount}?</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDelete(payment._id)}
                                aria-label="Confirm delete"
                                className="px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center min-w-[42px] disabled:opacity-50 shadow-sm"
                                style={{ backgroundColor: "#ef4444", color: "#ffffff" }}
                              >
                                {isDeleting ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  "Yes"
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeletingPaymentId(null)}
                                aria-label="Cancel delete"
                                className="px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all border disabled:opacity-50"
                                style={{
                                  borderColor: isDarkMode ? "#475569" : "#d1d5db",
                                  backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                                  color: isDarkMode ? "#e2e8f0" : "#4b5563",
                                }}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={payment._id}
                          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                            isCurrentlyEditing
                              ? isDarkMode
                                ? "bg-slate-800/80 border-orange-500/60 ring-1 ring-orange-500/40"
                                : "bg-orange-50/60 border-orange-300 ring-1 ring-orange-400/30"
                              : isDarkMode
                              ? "bg-slate-800/40 border-slate-800 hover:border-slate-700"
                              : "bg-gray-50/70 border-gray-150 hover:border-gray-200"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold truncate">
                                ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
                              </span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                                  isDarkMode
                                    ? "bg-slate-700/80 text-slate-200"
                                    : "bg-gray-200/70 text-gray-700"
                                }`}
                              >
                                {payment.paymentMethod || "CASH"}
                              </span>
                            </div>
                            <div
                              className={`flex items-center gap-1 text-[10px] font-semibold ${
                                isDarkMode ? "text-slate-400" : "text-gray-500"
                              }`}
                            >
                              <Calendar size={10} className="shrink-0 opacity-70" />
                              <span className="truncate">{dateStr}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={isSubmitting || isDeleting}
                              onClick={() => handleStartEdit(payment)}
                              className={`p-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                                isDarkMode
                                  ? "hover:bg-slate-700 border-slate-700 text-slate-300"
                                  : "hover:bg-white border-gray-200/60 text-gray-600 shadow-sm"
                              }`}
                              title="Edit transaction"
                              aria-label={`Edit payment of ${payment.amount}`}
                            >
                              <SquarePen size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={isSubmitting || isDeleting}
                              onClick={() => setDeletingPaymentId(payment._id)}
                              className={`p-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                                isDarkMode
                                  ? "hover:bg-red-950/40 border-slate-700 text-red-400"
                                  : "hover:bg-red-50 border-gray-200/60 text-red-500 shadow-sm"
                              }`}
                              title="Delete transaction"
                              aria-label={`Delete payment of ${payment.amount}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add / Edit Form */}
              <form
                onSubmit={handleAddOrUpdate}
                className={`p-3.5 sm:p-4 rounded-xl border space-y-3.5 transition-all ${
                  isDarkMode
                    ? "bg-slate-800/20 border-slate-800/80"
                    : "bg-orange-50/15 border-orange-100/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-black uppercase tracking-wide flex items-center gap-1.5 ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    {editingPayment ? (
                      <>
                        <ShieldCheck size={14} className="text-orange-500" />
                        <span>Edit Transaction</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} style={{ color: primaryColor }} />
                        <span>Record Advance</span>
                      </>
                    )}
                  </h4>
                  {editingPayment && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className={`text-[10px] font-bold hover:underline flex items-center gap-1 ${
                        isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      <ArrowLeft size={10} /> Cancel
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="advance-amount-input"
                      className={`block text-[11px] font-black uppercase tracking-wider mb-1 ${
                        isDarkMode ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      Advance Amount (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black opacity-60">
                        ₹
                      </span>
                      <input
                        id="advance-amount-input"
                        ref={amountInputRef}
                        type="text"
                        inputMode="decimal"
                        required
                        disabled={isSubmitting || isDeleting}
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                        className={`w-full rounded-xl py-2 pl-7 pr-3 text-sm font-bold outline-none border transition-all custom-focus disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                            : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-[11px] font-black uppercase tracking-wider mb-1 ${
                        isDarkMode ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      Payment Method *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map((m) => {
                        const isMethodActive = method === m.id;
                        const MethodIcon = m.icon;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            disabled={isSubmitting || isDeleting}
                            onClick={() => setMethod(m.id)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
                            style={{
                              backgroundColor: isMethodActive
                                ? primaryColor
                                : isDarkMode
                                ? "#1e293b"
                                : "#ffffff",
                              borderColor: isMethodActive
                                ? primaryColor
                                : isDarkMode
                                ? "#334155"
                                : "#e2e8f0",
                              color: isMethodActive
                                ? "#ffffff"
                                : isDarkMode
                                ? "#f8fafc"
                                : "#334155",
                            }}
                          >
                            <MethodIcon size={13} className="shrink-0" />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isDeleting}
                  className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPayment ? "Update Payment" : "Add Payment"}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
