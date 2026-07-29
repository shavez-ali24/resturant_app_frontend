// src/components/admin/orderManagement/pendingOrders/LayoutView/RoomActionModal.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { X, IndianRupee, SquarePen, Printer, Move } from "lucide-react";

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

  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [formErrors, setFormErrors] = useState({});

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
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <button
                    onClick={handleEditClick}
                    className="theme-action-btn flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[11px] font-bold shadow-sm transition-all duration-150"
                    title="Edit Order"
                  >
                    <SquarePen size={15} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleViewClick}
                    className="theme-action-btn flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[11px] font-bold shadow-sm transition-all duration-150"
                    title="View Bill"
                  >
                    <Printer size={15} />
                    <span>Bill</span>
                  </button>
                  <button
                    onClick={handlePayClick}
                    className="theme-action-btn flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[11px] font-bold shadow-sm transition-all duration-150"
                    title="Pay Order"
                  >
                    <IndianRupee size={15} />
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
                  className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"
                    }`}
                >
                  Room Details
                </label>
                <div
                  className={`w-full rounded-lg px-3 py-2.5 text-sm font-medium border ${isDarkMode
                    ? "bg-slate-800 text-slate-400 border-slate-600"
                    : "bg-[#f7f3ef] text-[#78716c] border-[#ede8e3]"
                    }`}
                >
                  {room?.tableNumber} • {room?.roomCategory?.name || "-"} • ₹{price}/night
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
    </div>
  );
}
