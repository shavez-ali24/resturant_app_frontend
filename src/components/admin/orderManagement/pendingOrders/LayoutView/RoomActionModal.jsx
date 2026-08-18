// src/components/admin/orderManagement/pendingOrders/LayoutView/RoomActionModal.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { X, IndianRupee, SquarePen, Printer, Move, Coins } from "lucide-react";
import AdvancePaymentModal from "../AdvancePaymentModal";
import { useLazyGetOrderByIdQuery } from "@/redux/adminRedux/adminAPI";

export default function RoomActionModal({
  room,
  isDarkMode = false,
  onClose,
  onBook,
  onCheckout,
  onEdit,
  onView,
  onMove,
  onPay,
  onCancelBooking,
  isLoading = false,
}) {
  const colors = useSelector((state) => state.admin.theme.colors);
  const isOccupied = room?.rawStatus === "OCCUPIED";
  const isBilled = room?.rawStatus === "BILLED";
  const price = room?.roomCategory?.pricePerNight || room?.roomCategory?.priceConfig?.pricePerNight || 0;

  const [getOrder, { data: orderData, isLoading: isOrderLoading, error: orderError }] = useLazyGetOrderByIdQuery();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [includeRoomCharges, setIncludeRoomCharges] = useState(true);
  const orderId = room?.currentOrderId || room?.orderId;

  const handlePreviewClick = (e) => {
    e.stopPropagation();
    setShowPreviewModal(true);
    if (orderId) {
      getOrder(orderId);
    }
  };

  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceMethod, setAdvanceMethod] = useState("CASH");
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!guestName.trim()) {
      errors.guestName = "Customer name is required";
    }
    if (!phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(phone.trim())) {
      errors.phone = "Valid 10-digit phone number is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      unitId: room?.unitId || room?.unitId,
      customerName: guestName.trim(),
      customerPhone: phone.trim(),
    };

    if (advanceAmount && Number(advanceAmount) > 0) {
      payload.advancePayments = [
        {
          amount: Number(advanceAmount),
          paymentMethod: advanceMethod,
        }
      ];
    }

    try {
      await onBook?.(payload, room);
      onClose?.();
    } catch (err) {
      const backendMsg = err?.data?.message || err?.data?.error || "";
      let friendly = "Something went wrong, please try again";
      if (backendMsg.includes("already booked") || backendMsg.includes("occupied")) {
        friendly = "This room is already booked. Please choose another room";
      } else if (backendMsg.includes("not found")) {
        friendly = "Room not found. Please refresh the page and try again";
      } else if (backendMsg.includes("pricing") || backendMsg.includes("price")) {
        friendly = "This room cannot be booked. Please set up room pricing first";
      }
      setFormErrors({ submit: friendly });
    }
  };

  const handleCheckout = async () => {
    setFormErrors({});
    try {
      await onCheckout?.(room);
      onClose?.();
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || err?.message || "Something went wrong, please try again";
      setFormErrors({ submit: msg });
    }
  };

  const handleCancelBookingClick = (e) => {
    e.stopPropagation();
    onCancelBooking?.(room);
    onClose?.();
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit?.(room);
    onClose?.();
  };

  const handleViewClick = (e) => {
    e.stopPropagation();
    onView?.(room);
    onClose?.();
  };

  const handlePayClick = (e) => {
    e.stopPropagation();
    onPay?.(room);
    onClose?.();
  };

  const handleMoveClick = (e) => {
    e.stopPropagation();
    onMove?.(room);
    onClose?.();
  };

  if (!room) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <style>{`
        .theme-focus:focus {
          border-color: ${colors.primary} !important;
          box-shadow: 0 0 0 1px ${colors.primary}80 !important;
        }
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
        className={`w-full max-w-sm rounded-xl shadow-2xl overflow-hidden ${isDarkMode ? "bg-[#1e293b]" : "bg-white"
          }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b ${isDarkMode ? "border-slate-700" : "border-[#ede8e3]"
            }`}
        >
          <h3
            className={`text-base font-semibold ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"
              }`}
          >
            {isOccupied || isBilled ? "Manage Room" : "Book Room"} — {room.tableNumber}
          </h3>
          <button
            onClick={onClose}
            className={`rounded-lg p-1.5 transition-colors ${isDarkMode
              ? "hover:bg-slate-700 text-slate-400"
              : "hover:bg-[#f7f3ef] text-[#78716c]"
              }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {isOccupied || isBilled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                  <path d="m12 4 4 5H8l4-5Z" />
                  <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
                </svg>
                <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"}`}>
                  {isBilled ? "Room Billed" : "Current Booking"}
                </span>
              </div>

              <div className={`text-sm px-3 py-2 rounded-lg border ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-[#f7f3ef] border-[#ede8e3] text-[#78716c]"
                }`}>
                {room?.roomCategory?.name || "Room"} • ₹{price}/night
              </div>

              {(room?.currentOrderId || room?.orderId) && (
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  <button
                    onClick={handleEditClick}
                    className="theme-action-btn flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[9px] font-black shadow-sm transition-all duration-150"
                    title="Edit Order"
                  >
                    <SquarePen size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handlePreviewClick}
                    className="theme-action-btn flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[9px] font-black shadow-sm transition-all duration-150"
                    title="Preview Order"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => setShowAdvanceModal(true)}
                    className="theme-action-btn flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[9px] font-black shadow-sm transition-all duration-150"
                    title="Manage Advance"
                  >
                    <Coins size={13} />
                    <span>Advance</span>
                  </button>
                  <button
                    onClick={handleViewClick}
                    className="theme-action-btn flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[9px] font-black shadow-sm transition-all duration-150"
                    title="View Bill"
                  >
                    <Printer size={13} />
                    <span>Bill</span>
                  </button>
                  <button
                    onClick={handlePayClick}
                    className="theme-action-btn flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[9px] font-black shadow-sm transition-all duration-150"
                    title="Pay Order"
                  >
                    <IndianRupee size={13} />
                    <span>Pay</span>
                  </button>
                </div>
              )}

              {formErrors.submit && (
                <p className="text-xs text-red-500">{formErrors.submit}</p>
              )}

              {isOccupied && (
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold border border-[#ede8e3] bg-white text-[#1c1917] hover:bg-[#f7f3ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isLoading ? "Checking out..." : "Check Out"}
                </button>
              )}

              {(room?.currentOrderId || room?.orderId) && (
                <button
                  onClick={handleCancelBookingClick}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"
                    }`}
                >
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^A-Za-z\s]/g, "").slice(0, 15);
                    const capitalized = filtered.replace(/^(\s*)([a-z])/, (_, s, c) => `${s}${c.toUpperCase()}`);
                    setGuestName(capitalized);
                    if (formErrors.guestName) {
                      setFormErrors((prev) => ({ ...prev, guestName: undefined }));
                    }
                  }}
                  placeholder="Customer name"
                  className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200 border theme-focus ${isDarkMode
                    ? "bg-slate-800 text-slate-200 border-slate-600 placeholder-slate-500"
                    : "bg-white text-[#1c1917] border-[#ede8e3] placeholder-[#a8a29e]"
                    }`}
                />
                {formErrors.guestName && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.guestName}</p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"
                    }`}
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(val);
                    if (formErrors.phone) {
                      setFormErrors((prev) => ({ ...prev, phone: undefined }));
                    }
                  }}
                  placeholder="Phone number"
                  maxLength={10}
                  className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200 border theme-focus ${isDarkMode
                    ? "bg-slate-800 text-slate-200 border-slate-600 placeholder-slate-500"
                    : "bg-white text-[#1c1917] border-[#ede8e3] placeholder-[#a8a29e]"
                    }`}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? "text-slate-400" : "text-[#78716c]"
                  }`}
                >
                  Advance Payment (Optional)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-[1.5]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-60">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      placeholder="0.00"
                      className={`w-full rounded-lg pl-7 pr-3 py-2 text-xs font-bold outline-none transition-all border theme-focus ${
                        isDarkMode
                          ? "bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500"
                          : "bg-white text-gray-800 border-[#ede8e3] placeholder-[#a8a29e]"
                      }`}
                    />
                  </div>
                  <div className="flex-1 flex rounded-lg overflow-hidden border border-[#ede8e3] dark:border-slate-700 bg-gray-50 dark:bg-slate-850 p-0.5">
                    {["CASH", "UPI", "CARD"].map((m) => {
                      const isMethodActive = advanceMethod === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAdvanceMethod(m)}
                          className="flex-1 text-[9px] font-black rounded py-1 transition-all"
                          style={{
                            backgroundColor: isMethodActive ? colors.primary : "transparent",
                            color: isMethodActive ? "#ffffff" : (isDarkMode ? "#94a3b8" : "#6b7280"),
                          }}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {formErrors.submit && (
                <p className="text-xs text-red-500">{formErrors.submit}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold border transition-all duration-150 ${isDarkMode
                    ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                    : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef] hover:text-[#1c1917]"
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-lg py-2.5 text-sm font-extrabold border transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm text-white hover:opacity-90"
                  style={{
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  }}
                >
                  {isLoading ? "Booking..." : "Book Room"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {showAdvanceModal && (
        <AdvancePaymentModal
          orderId={room?.currentOrderId || room?.orderId}
          isDarkMode={isDarkMode}
          onClose={() => setShowAdvanceModal(false)}
        />
      )}

      {showPreviewModal && (
        <div
          onClick={() => setShowPreviewModal(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
              isDarkMode ? "bg-slate-800 text-slate-100 border border-slate-700" : "bg-white text-gray-800 border"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? "border-slate-700" : "border-[#ede8e3]"}`}>
              <h3 className="text-base font-bold flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Billing Preview — {room.tableNumber}
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className={`rounded-lg p-1.5 transition-colors ${isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-gray-100 text-gray-500"}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {isOrderLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-orange-500 animate-spin" style={{ borderTopColor: colors.primary }} />
                  <span className="text-xs font-semibold">Fetching billing details...</span>
                </div>
              ) : orderError ? (
                <div className="text-center py-8 text-sm text-red-500 font-semibold">
                  Failed to fetch order details. Please try again.
                </div>
              ) : !orderData ? (
                <div className="text-center py-8 text-sm text-gray-400">
                  No active booking order found for this room.
                </div>
              ) : (() => {
                const foodTotal = orderData?.items?.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0) || 0;
                let roomCharge = 0;
                let projectedNights = 0;
                const rate = orderData?.stay?.pricing?.rate || 0;
                
                if (orderData?.stay?.enabled && includeRoomCharges) {
                  roomCharge = orderData?.stay?.roomCharge || 0;
                  if (roomCharge === 0) {
                    const checkIn = orderData.stay.checkInTime ? new Date(orderData.stay.checkInTime) : new Date();
                    const checkOut = new Date();
                    const diffMs = checkOut - checkIn;
                    projectedNights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                    roomCharge = projectedNights * rate;
                  }
                }
                
                let displayTotalAmount = Number(orderData?.totalAmount || 0);
                if (orderData?.stay?.enabled) {
                  if (orderData?.stay?.roomCharge === 0) {
                    if (includeRoomCharges) {
                      displayTotalAmount += roomCharge;
                    }
                  } else {
                    if (!includeRoomCharges) {
                      displayTotalAmount = Math.max(0, displayTotalAmount - orderData.stay.roomCharge);
                    }
                  }
                }

                const totalAdvance = orderData?.advancePayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
                const netPayable = Math.max(0, displayTotalAmount - totalAdvance);

                return (
                  <div className="space-y-5">
                    {/* Include Room Charges Switch */}
                    {orderData?.stay?.enabled && (
                      <div className="flex items-center justify-between pb-3 border-b border-[#ede8e3] dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Include Room Charges</span>
                        <button
                          onClick={() => setIncludeRoomCharges(!includeRoomCharges)}
                          className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                          style={{
                            backgroundColor: includeRoomCharges ? colors.primary : (isDarkMode ? "#334155" : "#e2e8f0")
                          }}
                        >
                          <span
                            className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
                            style={{
                              transform: includeRoomCharges ? "translateX(16px)" : "translateX(0px)"
                            }}
                          />
                        </button>
                      </div>
                    )}
                    {/* Stay details */}
                    {orderData?.stay?.enabled && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#78716c] dark:text-slate-400">Stay Details</span>
                        <div className={`rounded-xl p-3 text-xs space-y-1.5 ${isDarkMode ? "bg-slate-800/40" : "bg-[#faf9f7]"}`}>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Category:</span>
                            <span className="font-bold">{orderData.stay.roomCategory?.name || "Room Stay"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Rate:</span>
                            <span className="font-bold">₹{orderData.stay.pricing?.rate || 0}/night</span>
                          </div>
                          <div className="flex justify-between border-t border-dashed border-[#ede8e3] dark:border-slate-700 pt-1.5 mt-1">
                            <span className="font-extrabold text-orange-500">Stay Charge:</span>
                            <span className="font-extrabold text-orange-500">₹{roomCharge}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Food Items */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#78716c] dark:text-slate-400">Food Items</span>
                      {(!orderData.items || orderData.items.length === 0) ? (
                        <div className="text-xs text-slate-400 dark:text-slate-500 italic py-1">No food items ordered</div>
                      ) : (
                        <div className={`rounded-xl p-3 text-xs space-y-2 ${isDarkMode ? "bg-slate-800/40" : "bg-[#faf9f7]"}`}>
                          {orderData.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="font-medium">{item.name} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold ml-1">x{item.quantity}</span></span>
                              <span className="font-bold text-slate-700 dark:text-slate-350">₹{Number(item.price) * Number(item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Advance Payments */}
                    {orderData.advancePayments && orderData.advancePayments.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#78716c] dark:text-slate-400">Advance Payments</span>
                        <div className={`rounded-xl p-3 text-xs space-y-2 ${isDarkMode ? "bg-slate-800/40" : "bg-[#faf9f7]"}`}>
                          {orderData.advancePayments.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="font-medium text-slate-600 dark:text-slate-400">Paid via {p.paymentMethod}</span>
                              <span className="font-extrabold text-emerald-500">- ₹{p.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grand Total breakdown */}
                    <div className="pt-4 border-t border-[#ede8e3] dark:border-slate-700 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#78716c] dark:text-slate-400 block mb-1">Billing Summary</span>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Food Subtotal:</span>
                          <span className="font-bold">₹{foodTotal}</span>
                        </div>
                        {orderData.stay?.enabled && (
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Room Stay Total:</span>
                            <span className="font-bold">₹{roomCharge}</span>
                          </div>
                        )}
                        {(Number(orderData.gstAmount) > 0) && (
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">GST / Tax:</span>
                            <span className="font-bold">₹{orderData.gstAmount}</span>
                          </div>
                        )}
                        {(Number(orderData.deliveryCharges) > 0) && (
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Delivery / other:</span>
                            <span className="font-bold">₹{orderData.deliveryCharges}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-[#ede8e3] dark:border-slate-700 pt-2 font-extrabold text-slate-800 dark:text-slate-200">
                          <span>Total Amount:</span>
                          <span>₹{displayTotalAmount}</span>
                        </div>
                        {totalAdvance > 0 && (
                          <div className="flex justify-between font-extrabold text-emerald-500">
                            <span>Less Advance Paid:</span>
                            <span>- ₹{totalAdvance}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-dashed border-[#ede8e3] dark:border-slate-700 pt-2 text-sm font-black text-orange-500">
                          <span>Balance Due:</span>
                          <span>₹{netPayable}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className={`p-4 bg-gray-50 dark:bg-slate-900/60 border-t flex justify-end ${isDarkMode ? "border-slate-700" : "border-[#ede8e3]"}`}>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 text-xs font-extrabold rounded-lg text-white"
                style={{ backgroundColor: colors.primary }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
