import React, { useState } from "react";
import { X, IndianRupee, Loader2, CheckCircle, Percent } from "lucide-react";
import { usePayOrderMutation } from "@/redux/adminRedux/adminAPI";
import { useNotification } from "../../Bell/NotificationContext";

const PAYMENT_METHODS = [
  { key: "CASH", label: "CASH" },
  { key: "UPI", label: "UPI" },
  { key: "CARD", label: "CARD" },
];

export default function PayModal({ order, onClose }) {
  const { notify } = useNotification();

  const [payOrder, { isLoading }] = usePayOrderMutation();

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [settlementMode, setSettlementMode] = useState("percent");
  const [settlementPercent, setSettlementPercent] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("");

  const totalAmount = Number(order?.totalAmount || 0);
  const isAlreadyPaid = Boolean(order?.paymentMethod);

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

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!isValid || !paymentMethod) return;

    try {
      await payOrder({
        orderId: order._id,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
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
              Paid via {order.paymentMethod}
            </p>
          </div>
        ) : order?.status !== "completed" ? (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-center dark:border-orange-700 dark:bg-orange-900/30">
            <p className="font-bold text-orange-700 dark:text-orange-300">
              Order not billed yet
            </p>
            <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
              Please bill the order first before accepting payment.
            </p>
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
                {PAYMENT_METHODS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPaymentMethod(key)}
                    className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wider transition-all ${
                      paymentMethod === key
                        ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-900/30 dark:text-orange-300"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
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
                    className={`rounded-md px-2 py-1 text-xs font-bold ${
                      settlementMode === "percent"
                        ? "bg-orange-500 text-white"
                        : "text-gray-500 dark:text-slate-300"
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettlementMode("amount")}
                    className={`rounded-md px-2 py-1 text-xs font-bold ${
                      settlementMode === "amount"
                        ? "bg-orange-500 text-white"
                        : "text-gray-500 dark:text-slate-300"
                    }`}
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
                  className={`w-full rounded-xl border-2 py-2.5 pl-9 pr-3 text-sm font-bold outline-none transition-all ${
                    settlementInputInvalid
                      ? "border-red-400 bg-red-50 text-red-600 dark:border-red-500 dark:bg-red-900/20 dark:text-red-300"
                      : "border-gray-200 bg-white text-gray-800 focus:border-orange-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-orange-400"
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
                <p className="mt-1 text-xs font-semibold text-orange-500">
                  Final settlement: ₹{settlementValue.toFixed(2)}
                </p>
              )}
            </div>

            {/* Confirm button */}
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-extrabold text-white transition-all ${
                isValid && !isLoading
                  ? "bg-orange-500 shadow-[0_8px_18px_rgba(249,115,22,0.3)] hover:bg-orange-600"
                  : "cursor-not-allowed bg-gray-300 dark:bg-slate-600"
              }`}
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
          disabled={isLoading}
          className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
