import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  const { notify } = useNotification();

  const [payOrder, { isLoading }] = usePayOrderMutation();
  const [billOrder, { isLoading: isBilling }] = useBillOrderMutation();
  const [fetchOrderById] = useLazyGetOrderByIdQuery();

  const [currentOrder, setCurrentOrder] = useState(order);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [settlementMode, setSettlementMode] = useState("percent");
  const [settlementPercent, setSettlementPercent] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("");

  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({
    CASH: "",
    UPI: "",
    CARD: "",
  });

  // Safe Redux theme selection with reliable default fallbacks
  const colors = useSelector((state) => state.admin.theme?.colors || {
    primary: "#f97316",
    primaryHover: "#ea580c",
    primaryLight: "#fff7ed",
    primaryText: "#ea580c",
  });

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  // Escape key close handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading && !isBilling) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isLoading, isBilling]);

  // Lock body scrolling when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const totalAmount = Number(currentOrder?.totalAmount || 0);
  const isAlreadyPaid = Boolean(currentOrder?.paymentMethod || (currentOrder?.paymentMethods && currentOrder.paymentMethods.length > 0));
  const totalAdvancePaid = currentOrder?.advancePayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const netPayable = Math.max(0, totalAmount - totalAdvancePaid);

  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

  const getPaymentMethodName = (orderObj) => {
    if (orderObj?.paymentMethods && orderObj.paymentMethods.length > 0) {
      return orderObj.paymentMethods.map(p => p.method).join(" + ");
    }
    return orderObj?.paymentMethod || "";
  };

  const percentValue = settlementPercent === "" ? 0 : Number(settlementPercent);
  const flatDiscountValue = settlementAmount === "" ? 0 : Number(settlementAmount);

  const settlementValue = useMemo(() => {
    return settlementMode === "percent"
      ? netPayable - (netPayable * percentValue) / 100
      : netPayable - flatDiscountValue;
  }, [settlementMode, netPayable, percentValue, flatDiscountValue]);

  const cashAmountNum = Number(splitAmounts.CASH || 0);
  const upiAmountNum = Number(splitAmounts.UPI || 0);
  const cardAmountNum = Number(splitAmounts.CARD || 0);

  const totalEnteredSplitAmount = useMemo(() => {
    return Number((cashAmountNum + upiAmountNum + cardAmountNum).toFixed(2));
  }, [cashAmountNum, upiAmountNum, cardAmountNum]);

  const remainingSplitAmount = useMemo(() => {
    return Number((settlementValue - totalEnteredSplitAmount).toFixed(2));
  }, [settlementValue, totalEnteredSplitAmount]);

  const isValid = useMemo(() => {
    return (
      Number.isFinite(settlementValue) &&
      settlementValue >= 0 &&
      settlementValue <= netPayable &&
      (settlementMode !== "percent" ||
        (Number.isFinite(percentValue) && percentValue >= 0 && percentValue <= 100)) &&
      (settlementMode !== "amount" ||
        (Number.isFinite(flatDiscountValue) && flatDiscountValue >= 0 && flatDiscountValue <= netPayable)) &&
      !isAlreadyPaid &&
      (isSplitPayment
        ? totalEnteredSplitAmount === Number(settlementValue.toFixed(2)) &&
        [cashAmountNum, upiAmountNum, cardAmountNum].every(a => a >= 0)
        : paymentMethod !== null
      )
    );
  }, [
    settlementValue,
    netPayable,
    settlementMode,
    percentValue,
    flatDiscountValue,
    isAlreadyPaid,
    isSplitPayment,
    totalEnteredSplitAmount,
    cashAmountNum,
    upiAmountNum,
    cardAmountNum,
    paymentMethod
  ]);

  const hasSettlementInput = settlementMode === "percent" ? settlementPercent !== "" : settlementAmount !== "";

  const settlementInputInvalid = useMemo(() => {
    return (
      hasSettlementInput &&
      (!Number.isFinite(settlementValue) ||
        settlementValue < 0 ||
        settlementValue > netPayable ||
        (settlementMode === "percent" && (percentValue < 0 || percentValue > 100)) ||
        (settlementMode === "amount" && (flatDiscountValue < 0 || flatDiscountValue > netPayable)))
    );
  }, [hasSettlementInput, settlementValue, netPayable, settlementMode, percentValue, flatDiscountValue]);

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
    if (!isValid || (!isSplitPayment && !paymentMethod) || !currentOrder?._id) return;

    try {
      const discount = netPayable - settlementValue;
      const overallSettledAmount = totalAmount - discount;
      const payArgs = {
        orderId: currentOrder._id,
        settlementAmount:
          overallSettledAmount === totalAmount ? undefined : Number(overallSettledAmount.toFixed(2)),
        totalAmount,
      };

      if (isSplitPayment) {
        const methods = [];
        if (cashAmountNum > 0) methods.push({ method: "CASH", amount: cashAmountNum });
        if (upiAmountNum > 0) methods.push({ method: "UPI", amount: upiAmountNum });
        if (cardAmountNum > 0) methods.push({ method: "CARD", amount: cardAmountNum });
        payArgs.paymentMethods = methods;
      } else {
        payArgs.paymentMethods = [{ method: paymentMethod, amount: Number(settlementValue.toFixed(2)) }];
      }

      await payOrder(payArgs).unwrap();
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

  const handleClose = useCallback(() => {
    if (isLoading || isBilling) return;
    onClose();
  }, [isLoading, isBilling, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading && !isBilling) {
      onClose();
    }
  };

  // Modern dynamic CSS variables container style
  const modalStyle = useMemo(() => ({
    "--primary": colors.primary,
    "--primary-alpha": `${colors.primary}26`, // 15% opacity primary
  }), [colors.primary]);

  return (
    <div
      onMouseDown={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      style={modalStyle}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between shrink-0">
          <h2 id="pay-modal-title" className="text-lg font-extrabold text-gray-800 dark:text-slate-100">
            Pay Order
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading || isBilling}
            aria-label="Close pay modal"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 min-h-0 flex flex-col">
          {isAlreadyPaid ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-700 dark:bg-green-900/30">
              <CheckCircle className="mx-auto mb-2 h-10 w-10 text-green-500" />
              <p className="font-bold text-green-700 dark:text-green-300">
                Payment already completed
              </p>
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                <span className="font-semibold">Paid via: </span>
                <span className="uppercase font-bold">{getPaymentMethodName(currentOrder)}</span>
                {currentOrder?.paymentMethods && currentOrder.paymentMethods.length > 0 && (
                  <div className="mt-3.5 space-y-1.5 border-t border-dashed border-green-300 dark:border-green-800 pt-3 text-xs">
                    <p className="font-extrabold uppercase text-[10px] tracking-wider text-green-800 dark:text-green-300 text-left mb-1.5 px-1.5">
                      Payment Breakdown:
                    </p>
                    {currentOrder.paymentMethods.map((p, idx) => (
                      <div key={idx} className="flex justify-between font-bold px-2 py-0.5 rounded bg-green-100/50 dark:bg-green-950/20">
                        <span className="uppercase text-green-700 dark:text-green-300">{p.method}</span>
                        <span className="text-green-800 dark:text-green-200">₹{Number(p.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                type="button"
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
            <form onSubmit={handleConfirm} className="space-y-5" noValidate>
              {/* Total breakdown */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-slate-650 dark:bg-slate-700/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-slate-350">
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                {totalAdvancePaid > 0 && (
                  <div className="flex items-center justify-between text-xs font-semibold text-red-500 dark:text-red-450">
                    <span>Advance Deductions</span>
                    <span>-₹{totalAdvancePaid.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-2 border-gray-200/60 dark:border-slate-650/60">
                  <span className="text-sm font-extrabold text-gray-700 dark:text-slate-200">
                    Net Balance Due
                  </span>
                  <span className="flex items-center gap-1 text-lg font-black text-gray-800 dark:text-slate-100">
                    <IndianRupee size={16} />
                    {netPayable.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="mb-2.5 block text-sm font-bold text-gray-700 dark:text-slate-200">
                  Payment Method
                </label>
                <div className="flex gap-2 mb-3">
                  {PAYMENT_METHODS.map(({ key, label }) => {
                    const isActive = !isSplitPayment && paymentMethod === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setIsSplitPayment(false);
                          setPaymentMethod(key);
                        }}
                        className="flex-1 rounded-xl border-2 px-2 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all"
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
                  <button
                    type="button"
                    onClick={() => {
                      setIsSplitPayment(true);
                      setPaymentMethod(null);
                      setSplitAmounts({ CASH: "", UPI: "", CARD: "" });
                    }}
                    className="flex-1 rounded-xl border-2 px-2 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all"
                    style={{
                      backgroundColor: isSplitPayment
                        ? colors.primary
                        : (isDarkMode ? "#334155" : "#ffffff"),
                      borderColor: isSplitPayment
                        ? colors.primary
                        : (isDarkMode ? "#475569" : "#e5e7eb"),
                      color: isSplitPayment
                        ? "#ffffff"
                        : (isDarkMode ? "#94a3b8" : "#6b7280")
                    }}
                  >
                    SPLIT
                  </button>
                </div>

                {isSplitPayment && (
                  <div className="space-y-3 rounded-xl border border-dashed border-gray-300 p-4 dark:border-slate-700 bg-gray-50/20 dark:bg-slate-800/10">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                      Enter split amounts below:
                    </p>
                    {["CASH", "UPI", "CARD"].map((method) => {
                      const amountStr = splitAmounts[method];
                      return (
                        <div key={method} className="flex items-center gap-2">
                          <span className="w-14 text-xs font-extrabold text-gray-500 dark:text-slate-350">
                            {method}
                          </span>
                          <div className="relative flex-1">
                            <IndianRupee size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="0.00"
                              value={amountStr}
                              onWheel={(e) => e.currentTarget.blur()}
                              onChange={(e) => {
                                const valStr = e.target.value;
                                if (valStr === "" || Number(valStr) >= 0) {
                                  setSplitAmounts(prev => ({
                                    ...prev,
                                    [method]: valStr
                                  }));
                                }
                              }}
                              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-7 pr-2.5 text-xs font-bold outline-none transition-all border-solid focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary-alpha)] dark:border-slate-700 dark:bg-slate-900"
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between border-t border-dashed border-gray-200 dark:border-slate-700 pt-2.5 mt-1">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Total Split:
                      </span>
                      <span className="text-xs font-extrabold text-gray-700 dark:text-slate-200">
                        ₹{totalEnteredSplitAmount.toFixed(2)} / ₹{settlementValue.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-center">
                      {remainingSplitAmount === 0 ? (
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ Split matches exact bill!
                        </p>
                      ) : remainingSplitAmount > 0 ? (
                        <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 animate-pulse">
                          Remaining: ₹{remainingSplitAmount.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                          Exceeds by: ₹{Math.abs(remainingSplitAmount).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
                  Use a percentage discount or enter a flat discount amount.
                </p>
                <div className="relative">
                  {settlementMode === "percent" ? (
                    <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  ) : (
                    <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  )}
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={settlementMode === "percent" ? 100 : totalAmount}
                    placeholder={settlementMode === "percent" ? "Discount percent" : "Flat discount amount (₹)"}
                    value={settlementMode === "percent" ? settlementPercent : settlementAmount}
                    onWheel={(e) => e.currentTarget.blur()}
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
                    className={`w-full rounded-xl border-2 py-2.5 pl-9 pr-3 text-sm font-bold outline-none transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary-alpha)] ${settlementInputInvalid
                        ? "border-red-400 bg-red-50 text-red-600 dark:border-red-500 dark:bg-red-900/20 dark:text-red-300"
                        : "border-gray-200 bg-white text-gray-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      }`}
                  />
                </div>
                {settlementMode === "percent" && percentValue > 100 && (
                  <p className="mt-1 text-xs font-semibold text-red-500 animate-in fade-in duration-200">
                    Percentage cannot exceed 100
                  </p>
                )}
                {settlementMode === "amount" && settlementAmount && Number(settlementAmount) > netPayable && (
                  <p className="mt-1 text-xs font-semibold text-red-500 animate-in fade-in duration-200">
                    Discount cannot exceed net payable amount
                  </p>
                )}
                {settlementValue >= 0 && settlementValue <= netPayable && settlementValue !== netPayable && (
                  <p className="mt-1 text-xs font-semibold animate-in fade-in duration-200" style={{ color: colors.primary }}>
                    Final settlement: ₹{settlementValue.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {!isValid && (
                <p className="text-center text-xs font-bold text-red-500 animate-pulse bg-red-50 dark:bg-red-950/20 py-2 px-3 rounded-lg border border-red-200 dark:border-red-900/30">
                  {!isSplitPayment && !paymentMethod
                    ? "⚠ Please select a payment method"
                    : isSplitPayment && remainingSplitAmount !== 0
                      ? `⚠ Split total must match bill (₹${settlementValue.toFixed(2)}). Current sum is ₹${totalEnteredSplitAmount.toFixed(2)}`
                      : "⚠ Invalid payment values"}
                </p>
              )}

              {/* Confirm button */}
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-extrabold transition-all active:scale-[0.97] ${isValid && !isLoading
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
                  : `Confirm ₹${Number.isFinite(settlementValue) ? settlementValue.toFixed(2) : "0.00"} via ${isSplitPayment ? "SPLIT" : (paymentMethod || "...")}`}
              </button>
            </form>
          )}

          {/* Cancel button */}
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading || isBilling}
            className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700 shrink-0"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
