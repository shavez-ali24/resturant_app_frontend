import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { X, IndianRupee, Loader2, CheckCircle, Percent } from "lucide-react";
import { usePayOrderMutation, useBillOrderMutation, useLazyGetOrderByIdQuery } from "@/redux/adminRedux/adminAPI";
import { useNotification } from "../../Bell/NotificationContext";

const PAYMENT_METHODS = [
  { key: "CASH", label: "CASH" },
  { key: "UPI", label: "UPI" },
  { key: "CARD", label: "CARD" },
];

export default function PayModal({ order, onClose }) {
  const colors = useSelector((state) => state.admin.theme.colors);
  const { notify } = useNotification();
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

  const [payOrder, { isLoading }] = usePayOrderMutation();
  const [billOrder, { isLoading: isBilling }] = useBillOrderMutation();
  const [fetchOrderById] = useLazyGetOrderByIdQuery();

  const [currentOrder, setCurrentOrder] = useState(order);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [settlementMode, setSettlementMode] = useState("percent");
  const [settlementPercent, setSettlementPercent] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("");

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  const totalAmount = Number(currentOrder?.totalAmount || 0);
  const isAlreadyPaid = Boolean(currentOrder?.paymentMethod);

  const percentValue =
    settlementPercent === "" ? 0 : Number(settlementPercent);
  const manualAmountValue =
    settlementAmount === "" ? totalAmount : Number(settlementAmount);
  const settlementValue =
    settlementMode === "percent"
      ? totalAmount - (totalAmount * percentValue) / 100
      : manualAmountValue;

  const isValid =
    paymentMethod &&
    Number.isFinite(settlementValue) &&
    settlementValue >= 0 &&
    settlementValue <= totalAmount &&
    (settlementMode !== "percent" ||
      (Number.isFinite(percentValue) && percentValue >= 0 && percentValue <= 100)) &&
    !isAlreadyPaid;
  const hasSettlementInput =
    settlementMode === "percent" ? settlementPercent !== "" : settlementAmount !== "";
  const settlementInputInvalid =
    hasSettlementInput &&
    (!Number.isFinite(settlementValue) ||
      settlementValue < 0 ||
      settlementValue > totalAmount ||
      (settlementMode === "percent" && (percentValue < 0 || percentValue > 100)));

  const handleGenerateBill = async () => {
    if (!currentOrder?._id) return;
    try {
      await billOrder(currentOrder._id).unwrap();
      const updatedOrder = await fetchOrderById(currentOrder._id).unwrap();
      if (updatedOrder) {
        setCurrentOrder(updatedOrder);
        notify("Bill generated successfully!", "success");
      }
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Failed to generate bill";
      notify(msg, "error");
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!isValid || !paymentMethod || !currentOrder?._id) return;

    try {
      await payOrder({
        orderId: currentOrder._id,
        paymentMethod,
        settlementAmount:
          settlementValue === totalAmount ? undefined : Number(settlementValue.toFixed(2)),
      }).unwrap();
      notify("Payment recorded successfully!", "success");
      onClose();
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Payment failed";
      if (msg.toLowerCase().includes("already")) {
        notify("Payment already completed for this order.", "error");
      } else if (
        msg.toLowerCase().includes("bill") ||
        msg.toLowerCase().includes("first") ||
        msg.toLowerCase().includes("not completed")
      ) {
        notify("Please bill the order first before payment.", "error");
      } else if (
        msg.toLowerCase().includes("exceed") ||
        msg.toLowerCase().includes("settlement") ||
        msg.toLowerCase().includes("greater")
      ) {
        notify("Settlement amount cannot exceed the total.", "error");
      } else {
        notify(msg, "error");
      }
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px] cursor-pointer"
    >
      <style>{`
        .theme-focus:focus {
          border-color: ${colors.primary} !important;
          box-shadow: 0 0 0 1px ${colors.primary}80 !important;
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 cursor-default"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-800 dark:text-slate-100">
            Pay Order
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {isAlreadyPaid ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-700 dark:bg-green-900/30">
            <CheckCircle className="mx-auto mb-2 h-10 w-10 text-green-500" />
            <p className="font-bold text-green-700 dark:text-green-300">
              Payment already completed
            </p>
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
              Paid via {currentOrder.paymentMethod}
            </p>
          </div>
        ) : currentOrder?.status !== "completed" ? (
          <div className="rounded-xl border border-orange-200 bg-[#fff8f5] p-5 text-center dark:border-orange-950/20 dark:bg-orange-950/10">
            <p className="font-extrabold text-orange-700 dark:text-orange-400 text-base mb-2">
              Order not billed yet
            </p>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-5">
              To process payment, the order must first be billed to finalize room stay charges (if any) and food totals.
            </p>
            <button
              onClick={handleGenerateBill}
              disabled={isBilling}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold border text-white hover:opacity-90 shadow-sm transition-all"
              style={{
                backgroundColor: colors.primary,
                borderColor: colors.primary
              }}
            >
              {isBilling && <Loader2 size={16} className="animate-spin" />}
              {isBilling ? "Generating Bill..." : "Generate Bill & Proceed"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-5">
            {/* Total */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-600 dark:bg-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-slate-300">
                  Total Amount
                </span>
                <span className="flex items-center gap-1 text-xl font-extrabold text-gray-800 dark:text-slate-100">
                  <IndianRupee size={18} />
                  {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-slate-200">
                Payment Method
              </label>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map(({ key, label }) => {
                  const isActive = paymentMethod === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentMethod(key)}
                      className="flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wider transition-all"
                      style={{
                        backgroundColor: isActive
                          ? colors.primary
                          : (isDarkMode ? "#334155" : "#ffffff"),
                        borderColor: isActive
                          ? colors.primary
                          : (isDarkMode ? "#475569" : "#e5e7eb"),
                        color: isActive
                          ? "#ffffff"
                          : (isDarkMode ? "#94a3b8" : "#6b7280")
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settlement */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-200">
                  Settlement <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-slate-600 dark:bg-slate-700">
                  <button
                    type="button"
                    onClick={() => setSettlementMode("percent")}
                    className="rounded-md px-2.5 py-1 text-xs font-extrabold transition-all"
                    style={{
                      backgroundColor: settlementMode === "percent" ? colors.primary : "transparent",
                      color: settlementMode === "percent" ? "#ffffff" : (isDarkMode ? "#94a3b8" : "#6b7280"),
                      boxShadow: settlementMode === "percent" ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)" : "none"
                    }}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettlementMode("amount")}
                    className="rounded-md px-2.5 py-1 text-xs font-extrabold transition-all"
                    style={{
                      backgroundColor: settlementMode === "amount" ? colors.primary : "transparent",
                      color: settlementMode === "amount" ? "#ffffff" : (isDarkMode ? "#94a3b8" : "#6b7280"),
                      boxShadow: settlementMode === "amount" ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)" : "none"
                    }}
                  >
                    ₹
                  </button>
                </div>
              </div>
              <p className="mb-2 text-xs text-gray-400 dark:text-slate-400">
                Use a percentage discount or enter the final settlement amount.
              </p>
              <div className="relative">
                {settlementMode === "percent" ? (
                  <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                ) : (
                  <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                )}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={settlementMode === "percent" ? 100 : totalAmount}
                  placeholder={settlementMode === "percent" ? "Discount percent" : "Final amount"}
                  value={settlementMode === "percent" ? settlementPercent : settlementAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || Number(val) >= 0) {
                      if (settlementMode === "percent") {
                        setSettlementPercent(val === "" ? "" : val);
                      } else {
                        setSettlementAmount(val === "" ? "" : val);
                      }
                    }
                  }}
                  className={`w-full rounded-xl border-2 py-2.5 pl-9 pr-3 text-sm font-bold outline-none transition-all theme-focus ${
                    settlementInputInvalid
                      ? "border-red-400 bg-red-50 text-red-600 dark:border-red-500 dark:bg-red-900/20 dark:text-red-300"
                      : "border-gray-200 bg-white text-gray-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  }`}
                />
              </div>
              {settlementMode === "percent" && percentValue > 100 && (
                <p className="mt-1 text-xs font-semibold text-red-500">
                  Percentage cannot exceed 100
                </p>
              )}
              {settlementMode === "amount" && settlementAmount && Number(settlementAmount) > totalAmount && (
                <p className="mt-1 text-xs font-semibold text-red-500">
                  Settlement cannot exceed total
                </p>
              )}
              {settlementValue >= 0 && settlementValue <= totalAmount && settlementValue !== totalAmount && (
                <p className="mt-1 text-xs font-semibold" style={{ color: colors.primary }}>
                  Final settlement: ₹{settlementValue.toFixed(2)}
                </p>
              )}
            </div>

            {/* Confirm button */}
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-extrabold transition-all active:scale-[0.97] ${
                isValid && !isLoading
                  ? "text-white hover:opacity-90 shadow-sm"
                  : "cursor-not-allowed bg-gray-200 text-gray-400 border border-transparent dark:bg-slate-700 dark:text-slate-500"
              }`}
              style={isValid && !isLoading ? {
                backgroundColor: colors.primary,
                borderColor: colors.primary
              } : {}}
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading
                ? "Processing..."
                : `Confirm ₹${Number.isFinite(settlementValue) ? settlementValue.toFixed(2) : "0.00"} via ${paymentMethod || "..."}`}
            </button>
          </form>
        )}

        {/* Cancel button */}
        <button
          onClick={onClose}
          disabled={isLoading || isBilling}
          className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
