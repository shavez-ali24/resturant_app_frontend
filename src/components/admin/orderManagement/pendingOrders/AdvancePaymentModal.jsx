import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { X, Loader2, Trash2, SquarePen, Plus, ArrowLeft, Calendar, ShieldCheck } from "lucide-react";
import {
  useAddAdvancePaymentMutation,
  useEditAdvancePaymentMutation,
  useDeleteAdvancePaymentMutation,
  useGetOrderByIdQuery,
} from "@/redux/adminRedux/adminAPI";
import { useNotification } from "../../Bell/NotificationContext";

const PAYMENT_METHODS = ["CASH", "UPI", "CARD"];

export default function AdvancePaymentModal({ orderId, isDarkMode = false, onClose }) {
  const colors = useSelector((state) => state.admin.theme.colors);
  const { notify } = useNotification();

  // Queries & Mutations
  const { data: orderData, isLoading: isOrderLoading, refetch } = useGetOrderByIdQuery(orderId, {
    skip: !orderId,
  });

  const [addAdvance, { isLoading: isAdding }] = useAddAdvancePaymentMutation();
  const [editAdvance, { isLoading: isEditing }] = useEditAdvancePaymentMutation();
  const [deleteAdvance, { isLoading: isDeleting }] = useDeleteAdvancePaymentMutation();

  // Local Form States
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [editingPayment, setEditingPayment] = useState(null); // holds advance payment object when editing
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

  const paymentsEndRef = useRef(null);
  const prevCount = useRef(0);

  // List of advance payments from order
  const advancePayments = orderData?.advancePayments || [];

  useEffect(() => {
    if (advancePayments.length > prevCount.current) {
      setTimeout(() => {
        paymentsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
    prevCount.current = advancePayments.length;
  }, [advancePayments.length]);

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      return notify("Please enter a valid amount", "error");
    }

    try {
      if (editingPayment) {
        // Edit existing payment
        await editAdvance({
          orderId,
          advancePaymentId: editingPayment._id,
          amount: Number(amount),
          paymentMethod: method,
        }).unwrap();
        notify("Advance payment updated successfully", "success");
        setEditingPayment(null);
      } else {
        // Add new payment
        await addAdvance({
          orderId,
          amount: Number(amount),
          paymentMethod: method,
        }).unwrap();
        notify("Advance payment added successfully", "success");
      }
      setAmount("");
      refetch();
    } catch (err) {
      notify(err?.data?.message || err?.message || "Operation failed", "error");
    }
  };

  const handleStartEdit = (payment) => {
    setEditingPayment(payment);
    setAmount(String(payment.amount));
    setMethod(payment.paymentMethod);
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
    setAmount("");
    setMethod("CASH");
  };

  const handleDelete = async (paymentId) => {
    try {
      await deleteAdvance({ orderId, advancePaymentId: paymentId }).unwrap();
      notify("Advance payment deleted successfully", "success");
      refetch();
    } catch (err) {
      notify(err?.data?.message || err?.message || "Delete failed", "error");
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] cursor-pointer"
    >
      <style>{`
        .theme-focus:focus {
          border-color: ${colors.primary} !important;
          box-shadow: 0 0 0 1px ${colors.primary}80 !important;
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden cursor-default flex flex-col ${
          isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-100" : "bg-white text-gray-900"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? "border-slate-800" : "border-gray-100"}`}>
          <div>
            <h3 className="text-base font-extrabold">Manage Advance Payments</h3>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-1.5 transition-colors ${
              isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
          {isOrderLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2.5">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
              <p className="text-xs font-semibold opacity-70">Loading payments details...</p>
            </div>
          ) : (
            <>
              {/* List of Payments */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">Recorded Payments</h4>
                {advancePayments.length === 0 ? (
                  <div className={`text-center py-6 border border-dashed rounded-xl ${
                    isDarkMode ? "border-slate-800 bg-slate-900/30 text-slate-500" : "border-gray-200 bg-gray-50/50 text-gray-400"
                  }`}>
                    <p className="text-xs font-medium">No advance payments recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {advancePayments.map((payment) => {
                      const paymentDate = payment.paidAt || payment.createdAt || payment.date || orderData?.createdAt || new Date();
                      const dateStr = new Date(paymentDate).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });

                      const isConfirmingDelete = deletingPaymentId === payment._id;

                      if (isConfirmingDelete) {
                        return (
                          <div
                            key={payment._id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                              isDarkMode ? "bg-red-950/20 border-red-900/30 text-red-200" : "bg-red-50 border-red-100 text-red-800"
                            }`}
                          >
                            <span className="text-xs font-bold">Delete this payment?</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletingPaymentId(null);
                                  handleDelete(payment._id);
                                }}
                                className="px-3.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all"
                                style={{ backgroundColor: "#ef4444", color: "#ffffff" }}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingPaymentId(null)}
                                className="px-3.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all border"
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
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-gray-50/80 border-gray-100"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold">₹{payment.amount}</span>
                              <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                ({payment.paymentMethod})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-800 dark:text-slate-200 opacity-90">
                              <Calendar size={11} className="shrink-0" />
                              <span>{dateStr}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(payment)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isDarkMode ? "hover:bg-slate-700 border-slate-700 text-slate-350" : "hover:bg-white border-transparent text-gray-500 shadow-sm"
                              }`}
                              title="Edit Transaction"
                            >
                              <SquarePen size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPaymentId(payment._id)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isDarkMode ? "hover:bg-red-950/30 border-slate-700 text-red-400" : "hover:bg-white border-transparent text-red-500 shadow-sm"
                              }`}
                              title="Delete Transaction"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={paymentsEndRef} />
                  </div>
                )}
              </div>

              {/* Add / Edit Form */}
              <form onSubmit={handleAddOrUpdate} className={`p-4 rounded-xl border space-y-4 ${
                isDarkMode ? "bg-slate-800/20 border-slate-800/80" : "bg-orange-50/10 border-orange-100/40"
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wide opacity-65 flex items-center gap-1.5">
                    {editingPayment ? (
                      <>
                        <ShieldCheck size={14} className="text-orange-500" />
                        <span>Edit Transaction</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} style={{ color: colors.primary }} />
                        <span>Record Advance</span>
                      </>
                    )}
                  </h4>
                  {editingPayment && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-[10px] font-bold text-gray-500 hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft size={10} /> Cancel Edit
                    </button>
                  )}
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${isDarkMode ? "text-slate-200" : "text-gray-900"}`}>
                      Advance Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold opacity-65">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className={`w-full rounded-xl py-2 pl-7 pr-3 text-sm font-bold outline-none border transition-all theme-focus ${
                          isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-200"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${isDarkMode ? "text-slate-200" : "text-gray-900"}`}>
                      Payment Method *
                    </label>
                    <div className="flex gap-2">
                      {PAYMENT_METHODS.map((m) => {
                        const isMethodActive = method === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMethod(m)}
                            className="flex-1 rounded-xl border-2 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all"
                            style={{
                              backgroundColor: isMethodActive ? colors.primary : (isDarkMode ? "#1e293b" : "#ffffff"),
                              borderColor: isMethodActive ? colors.primary : (isDarkMode ? "#334155" : "#d1d5db"),
                              color: isMethodActive ? "#ffffff" : (isDarkMode ? "#f8fafc" : "#1e293b"),
                            }}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAdding || isEditing}
                  className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  style={{ backgroundColor: colors.primary }}
                >
                  {(isAdding || isEditing) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
