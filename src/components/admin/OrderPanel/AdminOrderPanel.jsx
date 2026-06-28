import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus, Plus, Trash2, ShoppingBag,
  AlertCircle, CheckCircle2, X, ChevronDown, IndianRupee
} from "lucide-react";
import PayModal from "../orderManagement/pendingOrders/PayModal";
import {
  addToCart,
  removeFromCart,
  clearCart
} from "../../../redux/clientRedux/clientSlice";
import {
  useGetPublicRestaurantQuery,
} from "../../../redux/clientRedux/clientAPI";
import {
  useCreateOrderByAdminMutation,
  useUpdateOrderMutation,
  useBillOrderMutation,
  useGetLiveOccupancyQuery,
  useCreateRoomBookingMutation,
  useGetMenuQuery,
} from "../../../redux/adminRedux/adminAPI";
import { showBill } from "../../../redux/adminRedux/billSlice";
import { useAdminTour } from "../../../hooks/useAdminTour";
import { TOUR_KEYS, getOrderPanelSteps } from "../../../utils/adminTour";
import { ADMIN_COLORS } from "../../../redux/adminRedux/adminSlice";
import { useNotification } from "../Bell/NotificationContext";

// ─── Validation ───────────────────────────────────────────────────────────────
const NAME_VALID_PATTERN = /^[A-Za-z\s]+$/;
const PHONE_VALID_PATTERN = /^\d{10}$/;
const ORDER_PANEL_DRAFT_KEY = "adminOrderPanelDraft";
const ORDER_PANEL_FRESH_CREATE_KEY = "adminOrderPanelFreshCreate";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const capitalizeFirst = (val) =>
  String(val || "").replace(/^(\s*)([a-z])/, (_, s, c) => `${s}${c.toUpperCase()}`);

const formatVariantLabel = (key) =>
  key ? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

const calculateDiscountedPrice = (item, variantKey = null) => {
  if (!item) return 0;
  let basePrice = 0;
  let discount = null;
  if (item.pricingType === "single") {
    basePrice = Number(item.price) || 0;
    discount = item.discount;
  } else if (item.pricingType === "variant" && variantKey) {
    basePrice = Number(item.variantRates?.[variantKey]?.price) || 0;
    discount = item.variantRates?.[variantKey]?.discount;
  } else if (item.pricingType === "combo") {
    basePrice = Number(item.comboPrice) || 0;
    discount = item.discount;
  } else {
    basePrice = Number(item.price) || 0;
    discount = item.discount;
  }
  if (!discount?.active || !discount?.value || basePrice === 0) return basePrice;
  const dv = Number(discount.value);
  if (dv <= 0) return basePrice;
  return discount.type?.toLowerCase() === "percentage"
    ? basePrice - (basePrice * dv) / 100
    : basePrice - dv;
};

const hasActiveDiscount = (item, variantKey = null) => {
  if (!item) return false;
  let discount = null;
  if (item.pricingType === "single") discount = item.discount;
  else if (item.pricingType === "variant" && variantKey)
    discount = item.variantRates?.[variantKey]?.discount;
  else if (item.pricingType === "combo") discount = item.discount;
  else discount = item.discount;
  return (
    discount?.active === true &&
    discount?.value !== undefined &&
    discount?.value !== null &&
    Number(discount.value) > 0
  );
};

const getCartItemKey = (item) => {
  if (!item) return "";
  const variantPart = item.variantKey ? `${item._id}-${item.variantKey}` : `${item._id}`;
  const customizations = item.customizations ? `:${String(item.customizations).trim()}` : "";
  return `${variantPart}${customizations}`;
};

const buildComparableItemKey = (menuItemId, variant = null, customizations = "") => {
  const normalizedId = String(menuItemId || "").trim();
  const normalizedVariant = variant ? String(variant).trim() : "default";
  const normalizedCustomizations = String(customizations || "").trim();
  return `${normalizedId}::${normalizedVariant}::${normalizedCustomizations}`;
};

const getComparableOrderItemKey = (item) =>
  buildComparableItemKey(
    item?.menuItemId || item?._id,
    item?.variant || item?.variantName,
    item?.customizations
  );

const getComparableCartItemKey = (item) =>
  buildComparableItemKey(item?._id, item?.variantKey || item?.variant, item?.customizations);

const buildOrderItemFromCartItem = (cartItem, quantityOverride = null) => {
  const variantData =
    cartItem?.variantKey && cartItem?.variantRates?.[cartItem.variantKey]
      ? cartItem.variantRates[cartItem.variantKey]
      : null;
  const isCombo = cartItem?.isCombo || cartItem?.pricingType === "combo";
  const variantBasePrice = Number(variantData?.price) || 0;
  const price =
    Number(
      cartItem?.originalPrice ??
      (isCombo ? cartItem?.comboPrice : variantBasePrice || cartItem?.price) ??
      0
    ) || 0;
  const discountedPrice =
    Number(
      cartItem?.price ??
      (isCombo ? cartItem?.comboPrice : variantBasePrice || price) ??
      0
    ) || 0;

  const orderItem = {
    menuItemId: cartItem?._id,
    name: cartItem?.name,
    quantity: Number(quantityOverride ?? cartItem?.quantity ?? 1) || 1,
    customizations: cartItem?.customizations || "",
    price,
    discountedPrice,
    discountApplied: variantData?.discount || cartItem?.discount || null,
  };

  if (cartItem?.variantKey) orderItem.variant = cartItem.variantKey;
  if (cartItem?.isCombo && cartItem?.comboItems) orderItem.comboItems = cartItem.comboItems;

  return orderItem;
};

const buildAddedItemsPreview = (currentCartItems = [], originalItems = []) => {
  const originalByKey = new Map(
    (originalItems || []).map((item) => [getComparableOrderItemKey(item), item])
  );

  return currentCartItems.reduce((acc, cartItem) => {
    const existingItem = originalByKey.get(getComparableCartItemKey(cartItem));
    const currentQty = Number(cartItem?.quantity || 0);
    const existingQty = Number(existingItem?.quantity || 0);
    const addedQty = existingItem ? currentQty - existingQty : currentQty;

    if (addedQty > 0) {
      acc.push(buildOrderItemFromCartItem(cartItem, addedQty));
    }

    return acc;
  }, []);
};

const createKotPreviewOrder = ({ finalOrder, previewItems, restaurantDetails }) => {
  const items = Array.isArray(previewItems) ? previewItems : [];
  const subtotal = items.reduce(
    (sum, item) =>
      sum + (Number(item?.discountedPrice ?? item?.price ?? 0) || 0) * (Number(item?.quantity || 1) || 1),
    0
  );
  const gstRate = Number(finalOrder?.gstRate ?? restaurantDetails?.gstRate ?? 0) || 0;
  const gstAmount = gstRate > 0 ? (subtotal * gstRate) / 100 : 0;

  return {
    ...finalOrder,
    source: {
      ...finalOrder?.source,
      section: finalOrder?.source?.section || finalOrder?.source?.sectionName || null,
      number: finalOrder?.source?.number || finalOrder?.source?.unitName || null,
    },
    stay: {
      ...finalOrder?.stay,
      roomCharge: 0,
    },
    items,
    subtotal,
    gstRate,
    gstAmount,
    deliveryCharges: 0,
    totalAmount: subtotal + gstAmount,
    createdAt: new Date().toISOString(),
    previewMode: "new-items-only",
    previewLabel: "New Items Only",
  };
};

const makeUnitSelectValue = (sectionName, unitName) => {
  const sectionKey = String(sectionName || "").toLowerCase().replace(/\s+/g, "_");
  const unitKey = String(unitName || "").toLowerCase().replace(/\s+/g, "_");
  return sectionKey && unitKey ? `${sectionKey}:${unitKey}` : "";
};
// 

const makeCartItemFromOrderItem = (orderItem) => {
  return {
    _id: orderItem.menuItemId,
    name: orderItem.name,
    price: Number(orderItem.discountedPrice ?? orderItem.price ?? 0),
    originalPrice: Number(orderItem.price ?? orderItem.discountedPrice ?? 0),
    customizations: orderItem.customizations || "",
    quantity: Number(orderItem.quantity || 1),
    variantKey: orderItem.variant || undefined,
    variantLabel: orderItem.variant ? formatVariantLabel(orderItem.variant) : undefined,
    isCombo: Boolean(orderItem.comboItems),
    comboItems: orderItem.comboItems,
  };
};

// ─── VegDot ───────────────────────────────────────────────────────────────────
// FIX: Use inline style for color — Tailwind JIT can purge dynamic class combos
// like "border-red-500" if they only appear in conditional expressions at runtime.
// Inline style guarantees the color always renders regardless of purge.
function VegDot({ type }) {
  const color =
    type === "veg" ? "#16a34a" : type === "non-veg" ? "#ef4444" : "#f97316";
  return (
    <div
      style={{ borderColor: color, borderWidth: 2, borderStyle: "solid" }}
      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm flex items-center justify-center"
    >
      <div style={{ backgroundColor: color }} className="h-1.5 w-1.5 rounded-full" />
    </div>
  );
}

// ─── StyledSelect (Table dropdown) ───────────────────────────────────────────
// Opens UPWARD — sits near bottom of panel so upward avoids clipping
// Shows 4 rows (~176px) then scrolls for more tables
function StyledSelect({ value, onChange, options, placeholder, isDarkMode, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  // Each row is ~44px; show 4 rows = 176px, then scroll
  const ITEM_HEIGHT = 44;
  const VISIBLE_ROWS = 4;
  const dropdownHeight = Math.min(options.length * ITEM_HEIGHT, VISIBLE_ROWS * ITEM_HEIGHT);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 outline-none ${isDarkMode
          ? `bg-slate-800 text-slate-200 ${isOpen ? "border-orange-500 ring-2 ring-orange-500/20" : "border-slate-600 hover:border-orange-400"}`
          : `bg-white text-[#1c1917] ${isOpen ? "border-orange-400 ring-2 ring-orange-100" : "border-[#ede8e3] hover:border-orange-300"}`
          }`}
      >
        <span className={selectedOption ? "" : isDarkMode ? "text-slate-500" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : (placeholder || "Select...")}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            // UPWARD: bottom: "calc(100% + 6px)" positions the dropdown above the trigger
            className={`absolute z-[200] w-full rounded-lg border shadow-lg overflow-hidden ${isDarkMode
              ? "bg-[#1e293b] border-slate-600 shadow-black/70"
              : "bg-white border-[#ede8e3] shadow-md"
              }`}
            style={{
              bottom: "calc(100% + 6px)",
              top: "auto",
              maxHeight: dropdownHeight,
              overflowY: options.length > VISIBLE_ROWS ? "auto" : "hidden",
            }}
          >
            {options.map((opt) => {
              const isDisabled = Boolean(opt.disabled);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { if (!isDisabled) { onChange(opt.value); setIsOpen(false); } }}
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  style={{ height: ITEM_HEIGHT }}
                  className={`w-full text-left px-3 text-sm font-medium transition-all duration-150 flex items-center justify-between gap-2 ${isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : value === opt.value
                      ? isDarkMode ? "bg-orange-500/25 text-orange-300" : "bg-[#f7f3ef] text-orange-500"
                      : isDarkMode ? "text-slate-200 hover:bg-slate-700" : "text-[#1c1917] hover:bg-[#f7f3ef]"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0 transition-colors"
                      style={{ backgroundColor: value === opt.value ? "#f97316" : isDarkMode ? "#475569" : "#e2e8f0" }}
                    />
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isDisabled && (
                    <span className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Occupied</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── VariantSelect ────────────────────────────────────────────────────────────
function VariantSelect({ item, value, onChange, isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const variantEntries = Object.entries(item.variantRates || {}).filter(([, v]) => v != null);

  const getVariantDisplay = (key, v) => {
    const vBasePrice = Number(v.price) || 0;
    const vDiscount = v.discount;
    let vFinalPrice = vBasePrice;
    if (vDiscount?.active && vDiscount?.value && Number(vDiscount.value) > 0) {
      const dv = Number(vDiscount.value);
      vFinalPrice = vDiscount.type?.toLowerCase() === "percentage"
        ? vBasePrice - (vBasePrice * dv) / 100
        : vBasePrice - dv;
    }
    return { label: formatVariantLabel(key), finalPrice: vFinalPrice, basePrice: vBasePrice, hasDisc: vFinalPrice < vBasePrice };
  };

  const selectedEntry = variantEntries.find(([k]) => k === value);
  const selectedDisplay = selectedEntry ? getVariantDisplay(selectedEntry[0], selectedEntry[1]) : null;

  return (
    <div ref={ref} className="relative mb-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen((p) => !p); }}
        className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all duration-200 outline-none ${isDarkMode
          ? `bg-slate-800 text-slate-200 ${isOpen ? "border-orange-500" : "border-slate-700 hover:border-orange-400"}`
          : `bg-[#f7f3ef] text-[#1c1917] ${isOpen ? "border-orange-400" : "border-[#ede8e3] hover:border-orange-300"}`
          }`}
      >
        <span className="truncate">
          {selectedDisplay ? `${selectedDisplay.label} — ₹${selectedDisplay.finalPrice.toFixed(2)}` : "Select variant"}
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isDarkMode ? "text-slate-400" : "text-orange-500"}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
            className={`absolute z-50 w-full mt-1 rounded-lg border shadow-lg overflow-hidden ${isDarkMode ? "bg-[#1e293b] border-slate-600 shadow-black/50" : "bg-white border-[#ede8e3] shadow-md"
              }`}
            style={{ maxHeight: 140, overflowY: "auto" }}
          >
            {variantEntries.map(([key, v]) => {
              const d = getVariantDisplay(key, v);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(key); setIsOpen(false); }}
                  className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all duration-150 ${value === key
                    ? isDarkMode ? "bg-orange-500/20 text-orange-300" : "bg-[#f7f3ef] text-orange-500"
                    : isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-[#1c1917] hover:bg-[#f7f3ef]"
                    }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{d.label}</span>
                    <span className="shrink-0 font-bold">
                      ₹{d.finalPrice.toFixed(2)}
                      {d.hasDisc && (
                        <span className={`ml-1 line-through text-[9px] ${isDarkMode ? "text-slate-400/70" : "text-slate-400"}`}>
                          ₹{d.basePrice.toFixed(2)}
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── VariantPills ────────────────────────────────────────────────────────────
// Big tappable buttons — instant selection, no dropdown
function VariantPills({ item, value, onChange, isDarkMode }) {
  const variantEntries = Object.entries(item.variantRates || {}).filter(([, v]) => v != null);

  const getVariantDisplay = (key, v) => {
    const vBasePrice = Number(v.price) || 0;
    0;
    const vDiscount = v.discount;
    let vFinalPrice = vBasePrice;
    if (vDiscount?.active && vDiscount?.value && Number(vDiscount.value) > 0) {
      const dv = Number(vDiscount.value);
      vFinalPrice = vDiscount.type?.toLowerCase() === "percentage"
        ? vBasePrice - (vBasePrice * dv) / 100
        : vBasePrice - dv;
    }
    return { label: formatVariantLabel(key), finalPrice: vFinalPrice, basePrice: vBasePrice, hasDisc: vFinalPrice < vBasePrice };
  };

  return (
    <div className="flex flex-wrap gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
      {variantEntries.map(([key, v]) => {
        const d = getVariantDisplay(key, v);
        const isSelected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(key); }}
            className={`flex-1 min-w-[80px] flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-150 active:scale-95 ${isSelected
              ? isDarkMode
                ? "bg-orange-950/40 border-orange-500/60 text-orange-400 font-extrabold"
                : "bg-orange-50 border-orange-400 text-orange-700 font-extrabold shadow-none"
              : isDarkMode
                ? "bg-slate-800 border-slate-600 text-slate-200 hover:border-orange-400 hover:bg-slate-700"
                : "bg-[#f7f3ef] border-[#ede8e3] text-[#1c1917] hover:border-orange-300 hover:bg-white"
              }`}
          >
            <span className="text-base">{d.label}</span>
            <span className={`text-xs font-bold ${isSelected ? "text-white/90" : "text-orange-500"}`}>
              ₹{d.finalPrice.toFixed(0)}
              {d.hasDisc && (
                <span className={`ml-1 line-through text-[10px] ${isSelected ? "text-white/60" : isDarkMode ? "text-slate-400/70" : "text-slate-400"}`}>
                  ₹{d.basePrice.toFixed(0)}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── OrderSummaryPanel ────────────────────────────────────────────────────────
// !! CRITICAL: Defined at MODULE LEVEL — NOT inside AdminOrderPanel !!
// If defined inside as `const X = () => ...`, React treats it as a NEW component
// type every render → unmount + remount → inputs lose focus after 1 character.
// Module-level definition = stable component identity = focus never lost.
function OrderSummaryPanel({
  isDarkMode, cartItems, cartCount, orderType, setOrderType,
  tableId, setTableId, address, setAddress,
  customerName, setCustomerName, customerPhone, setCustomerPhone,
  subtotal, gstEnabled, gstRate, gstAmount, deliveryCharges, total,
  isRestaurantOpen, tableOptions, error, success, isSubmitting,
  dispatch, handleRemoveAll, handleSubmit, handleClear,
  handleNameChange, handlePhoneChange,
  inputStyle, border, textPrimary, textSecondary, summaryBg,
  isMobile = false, // stickies buttons on mobile only
  editingOrder,
  dineInType, setDineInType,
  isBilled = false,
  setShowPayModal,
  setBookingOrderId,
}) {
  const { notify, newItemsByOrderId } = useNotification() || {};
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const isEditing = Boolean(editingOrder?._id);
  const showTableSelector = !isEditing || (editingOrder?.orderType !== "Eat Here" && editingOrder?.orderType !== "Room Stay");

  const [createRoomBooking, { isLoading: isBookingRoom }] = useCreateRoomBookingMutation();
  const [bookingRoomOpt, setBookingRoomOpt] = useState(null);
  const [bookingGuestName, setBookingGuestName] = useState("");
  const [bookingGuestPhone, setBookingGuestPhone] = useState("");
  const [bookingErrors, setBookingErrors] = useState({});

  const handleConfirmBooking = async (e) => {
    e?.preventDefault?.();
    setBookingErrors({});
    const errors = {};
    if (!bookingGuestName.trim()) {
      errors.name = "Customer name is required";
    }
    if (!bookingGuestPhone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(bookingGuestPhone.trim())) {
      errors.phone = "Valid 10-digit phone number is required";
    }

    if (Object.keys(errors).length > 0) {
      setBookingErrors(errors);
      return;
    }

    try {
      const payload = {
        unitId: bookingRoomOpt.unitId,
        customerName: bookingGuestName.trim(),
        customerPhone: bookingGuestPhone.trim(),
      };
      const bookingResponse = await createRoomBooking(payload).unwrap();
      const bookedOrder = bookingResponse?.order || bookingResponse;
      if (bookedOrder?._id) {
        setBookingOrderId(bookedOrder._id);
      }

      setTableId(bookingRoomOpt.value);
      setCustomerName(bookingGuestName.trim());
      setCustomerPhone(bookingGuestPhone.trim());
      notify(`Room ${bookingRoomOpt.unitName || bookingRoomOpt.label} booked successfully`, "success");
      setBookingRoomOpt(null);
    } catch (err) {
      console.error("Room booking failed:", err);
      const errMsg = err?.data?.message || err?.data?.error || "Booking failed. Please try again.";
      setBookingErrors({ submit: errMsg });
    }
  };
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {isBilled && (
        <div className={`mx-3 mt-3 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 shadow-sm transition-all duration-350 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:bg-emerald-500/5 dark:border-emerald-500/20 dark:text-emerald-400 shrink-0`}>
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-wider">Billed (Awaiting Payment)</p>
            <p className="text-[11px] font-medium opacity-80 mt-0.5">Order items are locked. Please record final payment below.</p>
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="overflow-y-auto p-3 space-y-2 flex-1">
        {cartCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <ShoppingBag className={`h-8 w-8 ${isDarkMode ? "text-slate-600" : "text-slate-300"}`} />
            <p className={`text-sm ${textSecondary}`}>No items added yet</p>
          </div>
        ) : (
          Object.entries(cartItems).map(([id, item]) => {
            if (!item) return null;
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            const orderId = editingOrder?._id;
            const newItemsSet = orderId && newItemsByOrderId?.get(String(orderId));
            const isNewItem = newItemsSet && newItemsSet.has(id);
            return (
              <div
                key={id}
                className={`flex items-center gap-3 rounded-xl p-3 border transition-all duration-350 ${isNewItem
                  ? isDarkMode
                    ? "border-rose-500/50 bg-rose-950/20 shadow-[0_0_12px_rgba(244,63,94,0.15)] animate-pulse"
                    : "border-rose-300 bg-rose-50/45 shadow-[0_0_12px_rgba(244,63,94,0.06)]"
                  : isDarkMode
                    ? "border-slate-700/60 bg-slate-800/60"
                    : "border-[#ede8e3] bg-[#f7f3ef]"
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-bold line-clamp-1 ${textPrimary}`}>{item.name}</p>
                    {isNewItem && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-rose-500 text-white animate-bounce shadow-sm">
                        New
                      </span>
                    )}
                  </div>
                  {item.variantLabel && (
                    <span className={`text-xs px-2 py-0.5 rounded-md mt-1 inline-block font-semibold ${isDarkMode ? "bg-orange-500/20 text-orange-300" : "bg-[#f7f3ef] text-orange-500"
                      }`}>
                      {item.variantLabel}
                    </span>
                  )}
                  {item.customizations && (
                    <div className={`text-xs mt-1 italic font-medium ${isDarkMode ? "text-orange-300" : "text-orange-600"}`}>
                      Customization: {item.customizations}
                    </div>
                  )}
                  <p className={`text-sm mt-1 ${textSecondary}`}>
                    ₹{(item.price || 0).toFixed(2)} × {item.quantity} ={" "}
                    <span className={`font-bold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                      ₹{itemTotal.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={isBilled}
                    onClick={() => dispatch(removeFromCart(id))}
                    className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${isBilled
                      ? isDarkMode
                        ? "border-slate-700 bg-slate-800/40 text-slate-500 cursor-not-allowed opacity-55"
                        : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-55"
                      : isDarkMode
                        ? "border-slate-600 bg-slate-800 text-orange-400 hover:bg-slate-700"
                        : "border-orange-200 bg-white text-orange-600 hover:bg-[#fff8f5] hover:border-orange-350"
                      }`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className={`w-5 text-center text-sm font-bold ${textPrimary}`}>{item.quantity}</span>
                  <button
                    disabled={isBilled}
                    onClick={() => dispatch(addToCart({ id, item, quantity: 1 }))}
                    className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${isBilled
                      ? isDarkMode
                        ? "border-slate-705 bg-slate-800/40 text-slate-500 cursor-not-allowed opacity-55"
                        : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-55"
                      : isDarkMode
                        ? "border-slate-700 bg-slate-800 text-orange-400 hover:bg-slate-700"
                        : "border-orange-200 bg-[#fff8f5] text-orange-600 hover:bg-[#ffedd5] hover:border-orange-300"
                      }`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    disabled={isBilled}
                    onClick={() => handleRemoveAll(id, item.quantity)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${isBilled
                      ? "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-40"
                      : isDarkMode
                        ? "text-red-400 hover:bg-red-900/20"
                        : "text-red-400 hover:bg-red-50"
                      }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Order Form (collapsible on mobile) ── */}
      <div className={`border-t shrink-0 ${isDarkMode ? "border-slate-700/60 bg-slate-800/30" : "border-[#ede8e3] bg-[#f7f3ef]"
        }`}>
        {/* Toggle Header */}
        <button
          type="button"
          onClick={() => setIsFormCollapsed(!isFormCollapsed)}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors ${isDarkMode ? "text-slate-300 hover:bg-slate-700/40" : "text-[#1c1917] hover:bg-[#ede8e3]/60"
            }`}
        >
          <span>Order Details</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isFormCollapsed ? "" : "rotate-180"} ${isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
          />
        </button>

        {/* Collapsible Content — hidden when collapsed */}
        {!isFormCollapsed && (
          <div className="px-4 pb-3 space-y-3">
            {/* Order Type */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"}`}>
                Order Type
              </label>
              <div className="flex gap-2">
                {["Eat Here", "Take Away", "Delivery"].map((type) => {
                  const isRoomStay = editingOrder?.orderType === "Room Stay";
                  if (isRoomStay && (type === "Take Away" || type === "Delivery")) {
                    return null;
                  }
                  const isActive = orderType === type || (type === "Eat Here" && orderType === "Room Stay");
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={isBilled}
                      onClick={() => {
                        if (type === "Eat Here") {
                          setOrderType(dineInType === "ROOM" ? "Room Stay" : "Eat Here");
                        } else {
                          setOrderType(type);
                          setTableId("");
                        }
                        notify(`Order type changed to ${type}!`, "success");
                      }}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all border ${isActive
                        ? isDarkMode
                          ? "bg-orange-950/30 border-orange-500/40 text-orange-400 font-extrabold"
                          : "bg-orange-50 border-orange-200 text-orange-700 font-extrabold shadow-none"
                        : isDarkMode
                          ? "bg-slate-800 text-slate-300 border-slate-600 hover:border-orange-400"
                          : "bg-white text-[#78716c] border-[#ede8e3] hover:border-orange-300"
                        } ${isBilled ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table / Room selector — only when Eat Here or Room Stay, and showTableSelector is true */}
            {(orderType === "Eat Here" || orderType === "Room Stay") && showTableSelector && (
              <div className="space-y-3">
                {/* Dine In Type sub-toggle (only when showTableSelector is true) */}
                {showTableSelector && (
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"}`}>
                      Unit Type
                    </label>
                    <div className="flex gap-2">
                      {[
                        { key: "TABLE", label: "Table (Dine In)", orderTypeTarget: "Eat Here" },
                        { key: "ROOM", label: "Room (Stay)", orderTypeTarget: "Room Stay" },
                      ].map(({ key, label, orderTypeTarget }) => (
                        <button
                          key={key}
                          type="button"
                          disabled={isBilled}
                          onClick={() => {
                            setDineInType(key);
                            setOrderType(orderTypeTarget);
                            setTableId(""); // clear table selection when switching types
                            notify(`Switched to ${label} mode`, "success");
                          }}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all border ${dineInType === key
                            ? isDarkMode
                              ? "bg-orange-950/30 border-orange-500/40 text-orange-400 font-extrabold"
                              : "bg-orange-50 border-orange-200 text-orange-700 font-extrabold shadow-none"
                            : isDarkMode
                              ? "bg-slate-800 text-slate-300 border-slate-600 hover:border-orange-400"
                              : "bg-white text-[#78716c] border-[#ede8e3] hover:border-orange-300"
                            } ${isBilled ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"}`}>
                    {dineInType === "ROOM" ? "Room Number" : "Table Number"}
                  </label>
                  <StyledSelect
                    value={tableId}
                    onChange={(val) => {
                      const opt = tableOptions.find((o) => o.value === val);
                      if (dineInType === "ROOM" && opt) {
                        setBookingRoomOpt(opt);
                        setBookingGuestName(customerName || "");
                        setBookingGuestPhone(customerPhone || "");
                        setBookingErrors({});
                      } else {
                        setTableId(val);
                        if (opt) {
                          notify(`Selected ${dineInType === "ROOM" ? "room" : "table"}: ${opt.label}`, "success");
                        }
                      }
                    }}
                    options={tableOptions}
                    placeholder={dineInType === "ROOM" ? "Select room" : "Select table"}
                    isDarkMode={isDarkMode}
                    disabled={isBilled}
                  />
                </div>
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"}`}>
                Customer name
              </label>
              <input
                value={customerName}
                onChange={handleNameChange}
                placeholder="Customer name"
                className={inputStyle}
                disabled={isBilled}
              />
            </div>

            {/* Phone */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"}`}>
                Phone number
              </label>
              <input
                value={customerPhone}
                onChange={handlePhoneChange}
                placeholder="10-digit phone"
                maxLength={10}
                className={inputStyle}
                disabled={isBilled}
              />
            </div>

            {/* Delivery Address */}
            {orderType === "Delivery" && (
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"}`}>
                  Delivery address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Delivery address"
                  rows={3}
                  className={`${inputStyle} resize-none`}
                  disabled={isBilled}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className={`px-4 py-3 space-y-2 border-t border-b shrink-0 ${isDarkMode ? "border-slate-700/60 bg-slate-800/30" : "border-[#ede8e3] bg-[#f7f3ef]"
        }`}>
        <div className="flex justify-between">
          <span className={`text-sm ${textSecondary}`}>Subtotal</span>
          <span className={`text-sm font-semibold ${textPrimary}`}>₹{subtotal.toFixed(2)}</span>
        </div>
        {gstEnabled && gstAmount > 0 && (
          <div className="flex justify-between">
            <span className={`text-sm ${textSecondary}`}>GST ({gstRate}%)</span>
            <span className={`text-sm font-semibold ${textPrimary}`}>+ ₹{gstAmount.toFixed(2)}</span>
          </div>
        )}
        {orderType === "Delivery" && deliveryCharges > 0 && (
          <div className="flex justify-between">
            <span className={`text-sm ${textSecondary}`}>Delivery</span>
            <span className={`text-sm font-semibold ${textPrimary}`}>+ ₹{deliveryCharges.toFixed(2)}</span>
          </div>
        )}
        <div className={`flex justify-between pt-2 border-t ${isDarkMode ? "border-slate-700/60" : "border-[#ede8e3]"}`}>
          <span className={`font-bold text-base ${textPrimary}`}>Total</span>
          <span className="font-bold text-lg text-orange-500">₹{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Banners */}
      <div className="px-3 space-y-2 shrink-0">
        {!isRestaurantOpen && (
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isDarkMode ? "bg-red-900/20 border-red-800/60 text-red-300" : "bg-red-50 border-red-200 text-red-700"
            }`}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-xs font-medium">Restaurant is currently closed</p>
          </div>
        )}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isDarkMode ? "bg-red-900/20 border-red-800/60 text-red-300" : "bg-red-50 border-red-200 text-red-700"
                }`}
            >
              <X className="h-4 w-4 shrink-0" />
              <p className="text-xs">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isDarkMode ? "bg-green-900/20 border-green-800/60 text-green-300" : "bg-green-50 border-green-200 text-green-700"
                }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="text-xs font-medium">Order placed successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons — sticky bottom on mobile only (isMobile prop), mt-auto on desktop */}
      <div className={`flex gap-2.5 p-4 border-t shrink-0 ${isMobile ? "sticky bottom-0" : "mt-auto"
        } ${isDarkMode ? `${summaryBg} border-slate-700/60` : `${summaryBg} border-[#ede8e3]`
        }`}>
        {isBilled ? (
          <button
            type="button"
            onClick={() => setShowPayModal(true)}
            className={`w-full h-12 rounded-xl text-sm font-black transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] ${isDarkMode
              ? "bg-emerald-950/20 border-emerald-500/35 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500/50"
              : "bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-350"
              }`}
          >
            <IndianRupee className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
            Record Payment
          </button>
        ) : (
          <>
            <button
              onClick={() => handleSubmit("save")}
              disabled={
                cartCount === 0 ||
                isSubmitting ||
                !isRestaurantOpen ||
                ((orderType === "Eat Here" || orderType === "Room Stay") && (() => { const [s, n] = (tableId || "").split(":"); return !s || !n; })())
              }
              className={`flex-1 h-12 rounded-xl border text-sm font-black transition-all duration-200 flex items-center justify-center shadow-sm active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed ${isDarkMode
                ? "bg-orange-950/20 border-orange-500/35 text-orange-400 hover:bg-orange-950/40 hover:border-orange-500/50"
                : "bg-[#fff8f5] border-orange-200 text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300"
                }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className={`h-4 w-4 rounded-full border-2 border-t-transparent animate-spin ${isDarkMode ? 'border-orange-400' : 'border-orange-700'}`} />
                  Processing...
                </span>
              ) : (
                "Save"
              )}
            </button>
            <button
              onClick={() => handleSubmit("kot")}
              disabled={
                cartCount === 0 ||
                isSubmitting ||
                !isRestaurantOpen ||
                ((orderType === "Eat Here" || orderType === "Room Stay") && (() => { const [s, n] = (tableId || "").split(":"); return !s || !n; })())
              }
              className={`flex-1 h-12 rounded-xl border text-sm font-black transition-all duration-200 flex items-center justify-center shadow-sm active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed ${isDarkMode
                ? "bg-orange-950/20 border-orange-500/35 text-orange-400 hover:bg-orange-950/40 hover:border-orange-500/50"
                : "bg-[#fff8f5] border-[#ede8e3] text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300"
                }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className={`h-4 w-4 rounded-full border-2 border-t-transparent animate-spin ${isDarkMode ? 'border-orange-400' : 'border-orange-700'}`} />
                  Processing...
                </span>
              ) : (
                "KOT & Add"
              )}
            </button>
            <button
              onClick={() => handleSubmit("print_bill")}
              disabled={
                cartCount === 0 ||
                isSubmitting ||
                !isRestaurantOpen ||
                ((orderType === "Eat Here" || orderType === "Room Stay") && (() => { const [s, n] = (tableId || "").split(":"); return !s || !n; })())
              }
              className={`flex-1 h-12 rounded-xl border text-sm font-black transition-all duration-200 flex items-center justify-center shadow-sm active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed ${isDarkMode
                ? "bg-orange-950/20 border-orange-500/35 text-orange-400 hover:bg-orange-950/40 hover:border-orange-500/50"
                : "bg-[#fff8f5] border-orange-200 text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300"
                }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className={`h-4 w-4 rounded-full border-2 border-t-transparent animate-spin ${isDarkMode ? 'border-orange-400' : 'border-orange-700'}`} />
                  Processing...
                </span>
              ) : (
                "Bill Order"
              )}
            </button>
          </>
        )}
      </div>

      {bookingRoomOpt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setBookingRoomOpt(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden p-6 space-y-5 transition-all duration-300 ${isDarkMode
                ? "bg-slate-900 border-slate-700/60 text-slate-100"
                : "bg-white border-[#ede8e3] text-gray-800"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3.5">
              <h3 className="text-lg font-black tracking-wide">
                Book Room — {bookingRoomOpt.unitName}
              </h3>
              <button
                type="button"
                onClick={() => setBookingRoomOpt(null)}
                className={`p-1.5 rounded-lg transition-all ${isDarkMode
                    ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Prompt */}
            <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
              Do you want to book this room? Please enter customer details to confirm the stay.
            </p>

            {/* Form */}
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={bookingGuestName}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^A-Za-z\s]/g, "").slice(0, 15);
                    const capitalized = filtered.replace(/^(\s*)([a-z])/, (_, s, c) => `${s}${c.toUpperCase()}`);
                    setBookingGuestName(capitalized);
                    if (bookingErrors.name) setBookingErrors(p => ({ ...p, name: null }));
                  }}
                  placeholder="Enter guest name"
                  className={`w-full h-10 px-3 rounded-xl border text-sm transition-all outline-none ${isDarkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                    }`}
                  required
                />
                {bookingErrors.name && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{bookingErrors.name}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={bookingGuestPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setBookingGuestPhone(val);
                    if (bookingErrors.phone) setBookingErrors(p => ({ ...p, phone: null }));
                  }}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  className={`w-full h-10 px-3 rounded-xl border text-sm transition-all outline-none ${isDarkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                    }`}
                  required
                />
                {bookingErrors.phone && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{bookingErrors.phone}</p>
                )}
              </div>

              {bookingErrors.submit && (
                <p className="text-xs text-red-500 font-semibold text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{bookingErrors.submit}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2.5">
                <button
                  type="button"
                  onClick={() => setBookingRoomOpt(null)}
                  className={`flex-1 h-10 rounded-xl border text-sm font-semibold transition-all ${isDarkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                      : "bg-white border-gray-200 text-gray-650 hover:bg-gray-55"
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBookingRoom}
                  className="flex-1 h-10 rounded-xl border text-sm font-extrabold text-white bg-orange-600 hover:bg-orange-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isBookingRoom ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
                      Booking...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminOrderPanel({ isDarkMode = false, onOrderSuccess, asModal = false, editingOrder = null }) {
  const dispatch = useDispatch();
  const { notify, newItemsByOrderId } = useNotification() || {};
  useAdminTour(TOUR_KEYS.orderPanel, getOrderPanelSteps, isDarkMode, 900);

  const cartItems = useSelector((state) => state.client?.cart?.items || {});
  const cartCount = Object.values(cartItems).reduce(
    (acc, item) => acc + (item?.quantity || 0),
    0
  );

  const { data: restaurantData } = useGetPublicRestaurantQuery();
  const { data: liveUnitsData } = useGetLiveOccupancyQuery();
  const { data: menuData, isLoading: menuLoading } = useGetMenuQuery();
  const [createOrder, { isLoading: isCreating }] = useCreateOrderByAdminMutation();
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();
  const [billOrder] = useBillOrderMutation();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedVariants, setSelectedVariants] = useState({});
  const [variantPickerItem, setVariantPickerItem] = useState(null);
  const [orderType, setOrderType] = useState("Eat Here");
  const [dineInType, setDineInType] = useState("TABLE"); // "TABLE" | "ROOM"
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableId, setTableId] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [originalOrderItems, setOriginalOrderItems] = useState([]);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [bookingOrderId, setBookingOrderId] = useState(null);

  const isEditing = Boolean(editingOrder?._id);
  const isBilled = editingOrder && editingOrder.status === "completed" && !editingOrder.paymentMethod;
  const isSubmitting = isCreating || isUpdating;
  const restaurant = restaurantData?.restaurant || {};

  const tableOptions = (() => {
    const sections = Array.isArray(restaurant.sections) ? restaurant.sections : [];
    const opts = [];

    // Build set of occupied unit keys from liveUnitsData (UI-only)
    const occupiedSet = new Set();
    try {
      const liveSections = (liveUnitsData && Array.isArray(liveUnitsData.sections)) ? liveUnitsData.sections : [];
      liveSections.forEach((s) => {
        (s.units || []).forEach((u) => {
          const key = makeUnitSelectValue(s.name, u.name || u.unitId);
          if (String(u.status || "").toUpperCase() === "OCCUPIED") occupiedSet.add(key);
        });
      });
    } catch (_) { /* ignore */ }

    // 🔧 Segregate options by dineInType (TABLE vs ROOM)
    const allowedUnitType = dineInType;

    sections.forEach((section) => {
      const units = Array.isArray(section.units) ? section.units : [];
      units.forEach((unit) => {
        if (unit?.isActive === false) return;

        // Filter out non-matching types if selection exists
        if (allowedUnitType && unit.type !== allowedUnitType) return;

        const value = makeUnitSelectValue(section.name, unit.name || unit.unitId);
        opts.push({
          value,
          label: `${section.name} - ${unit.name}`,
          sectionName: section.name,
          unitName: unit.name,
          unitType: unit.type,
          unitId: unit._id,
          disabled: occupiedSet.has(value),
        });
      });
    });
    return opts;
  })();

  // ── Pre-fill from CreateOrderModal (Layout View) ──────────────────────────
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("selectedTable");
      if (stored) {
        if (sessionStorage.getItem(ORDER_PANEL_FRESH_CREATE_KEY) === "1") {
          dispatch(clearCart());
          setOriginalOrderItems([]);
          sessionStorage.removeItem(ORDER_PANEL_FRESH_CREATE_KEY);
        }
        const tableInfo = JSON.parse(stored);
        if (tableInfo.sectionName && tableInfo.tableNumber) {
          setTableId(makeUnitSelectValue(tableInfo.sectionName, tableInfo.tableNumber));
          setOrderType("Eat Here");
        } else if (tableInfo.tableId) {
          setTableId(tableInfo.tableId);
          setOrderType(tableInfo.orderType || "Eat Here");
        } else if (tableInfo.orderType) {
          setOrderType(tableInfo.orderType);
        }
        if (tableInfo.customerName) setCustomerName(tableInfo.customerName);
        if (tableInfo.customerPhone) setCustomerPhone(tableInfo.customerPhone);
        if (tableInfo.address) setAddress(tableInfo.address);

        if (tableInfo.unitType) {
          setDineInType(tableInfo.unitType);
        } else if (tableInfo.type) {
          setDineInType(tableInfo.type);
        }

        sessionStorage.removeItem("selectedTable");
      } else {
        // 🔧 FRESH START: If not pre-filled and not editing, always start fresh and clear any stale local state/cart
        if (!isEditing) {
          dispatch(clearCart());
          setCustomerName("");
          setCustomerPhone("");
          setTableId("");
          setAddress("");
          setOrderType("Eat Here");
          setDineInType("TABLE");
        }
      }
    } catch (_) { /* ignore parse errors */ }
    setDraftHydrated(true);
  }, [isEditing, dispatch]);

  useEffect(() => {
    if (!editingOrder) return;

    dispatch(clearCart());
    const oType = editingOrder.orderType || "Eat Here";
    setOrderType(oType);
    setCustomerName(editingOrder.customerName || "");
    setCustomerPhone(editingOrder.customerPhone || "");
    setAddress(editingOrder.address || "");
    setOriginalOrderItems(editingOrder.items || []);

    const uType = editingOrder.source?.type || (oType === "Room Stay" ? "ROOM" : "TABLE");
    setDineInType(uType);

    // 🔧 FIX: tableOptions use sectionKey:unitKey format, match by unitId if available
    if ((oType === "Eat Here" || oType === "Room Stay") && editingOrder.source) {
      const unitId = editingOrder.source.unitId;
      if (unitId) {
        let matchValue = "";
        const sections = Array.isArray(restaurant.sections) ? restaurant.sections : [];
        for (const section of sections) {
          const units = Array.isArray(section.units) ? section.units : [];
          const matchUnit = units.find(u => String(u._id) === String(unitId));
          if (matchUnit) {
            matchValue = makeUnitSelectValue(section.name, matchUnit.name || matchUnit.unitId);
            break;
          }
        }
        if (matchValue) {
          setTableId(matchValue);
        }
      } else {
        // Fallback: match by sectionName + unitName
        const section = editingOrder.source.sectionName || editingOrder.source.section || "";
        const number = editingOrder.source.unitName || editingOrder.source.number || "";
        if (section && number) {
          setTableId(makeUnitSelectValue(section, number));
        }
      }
    }

    (editingOrder.items || []).forEach((orderItem) => {
      const cartItem = makeCartItemFromOrderItem(orderItem);
      const cartKey = getCartItemKey(cartItem);
      dispatch(addToCart({ id: cartKey, item: cartItem, quantity: Number(orderItem.quantity || 1) }));
    });
  }, [dispatch, editingOrder, restaurant.sections]);

  // ── Menu Data ────────────────────────────────────────────────────────────────
  const menuItems = Array.isArray(menuData) ? menuData : (menuData?.menu || []);
  const restaurantCategories = restaurantData?.restaurant?.categories || [];

  const groupedMenu = menuItems.reduce((acc, item) => {
    const cat = String(item.category || "Other").trim().toLowerCase();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = restaurantCategories.map((c) => String(c.name).trim());

  useEffect(() => {
    if (categories.length && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories.join(",")]);

  // Removed auto-select — user picks variant via the modal

  const selectedCategoryKey = String(selectedCategory || "").trim().toLowerCase();
  const currentItems = groupedMenu[selectedCategoryKey] || [];

  // ── Price Calc ───────────────────────────────────────────────────────────────
  const subtotal = Object.values(cartItems).reduce(
    (acc, item) => acc + (item?.price || 0) * (item?.quantity || 1),
    0
  );
  const gstRate = Number(restaurant.gstRate) || 0;
  const gstEnabled = restaurant.gstEnabled || false;
  const gstAmount = gstEnabled ? (subtotal * gstRate) / 100 : 0;
  const deliveryCharges = orderType === "Delivery" ? Number(restaurant.deliveryCharges) || 0 : 0;
  const total = subtotal + gstAmount + deliveryCharges;
  const isRestaurantOpen = restaurant.isOpen !== false;

  // ── Cart Helpers ─────────────────────────────────────────────────────────────
  const getCartKeyAndQty = (item) => {
    const selectedVariant = item.pricingType === "variant" ? selectedVariants[item._id] : null;
    const cartKey = selectedVariant ? `${item._id}-${selectedVariant}` : item._id;
    const quantity = cartItems[cartKey]?.quantity || 0;
    return { cartKey, quantity, selectedVariant };
  };

  const handleAddItem = (item) => {
    if (isBilled) return;
    const selectedVariant = item.pricingType === "variant" ? selectedVariants[item._id] : null;
    const cartKey = selectedVariant ? `${item._id}-${selectedVariant}` : item._id;
    let basePrice = Number(item.price) || 0;
    if (item.pricingType === "variant" && selectedVariant) {
      basePrice = Number(item.variantRates?.[selectedVariant]?.price) || 0;
    } else if (item.pricingType === "combo") {
      basePrice = Number(item.comboPrice) || 0;
    }
    const discountedPrice = calculateDiscountedPrice(item, selectedVariant);
    const hasDiscount = hasActiveDiscount(item, selectedVariant);
    dispatch(addToCart({
      id: cartKey,
      item: {
        ...item,
        price: discountedPrice || basePrice,
        originalPrice: basePrice,
        hasDiscount,
        variantKey: selectedVariant,
        variantLabel: selectedVariant ? formatVariantLabel(selectedVariant) : null,
        customizations: "",
      },
      quantity: 1,
    }));
  };

  // useCallback = stable reference = OrderSummaryPanel won't re-render unnecessarily
  const handleRemoveAll = useCallback((id, qty) => {
    for (let i = 0; i < qty; i++) dispatch(removeFromCart(id));
  }, [dispatch]);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  // useCallback = stable reference passed as prop to OrderSummaryPanel (module-level component)
  // This ensures the input onChange prop reference is stable → no re-render → no focus loss
  const handleNameChange = useCallback((e) => {
    const filtered = e.target.value.replace(/[^A-Za-z\s]/g, "").slice(0, 15);
    const capitalized = filtered.replace(/^(\s*)([a-z])/, (_, s, c) => `${s}${c.toUpperCase()}`);
    setCustomerName(capitalized);
  }, []);

  const handlePhoneChange = useCallback((e) => {
    setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
  }, []);

  const buildOrderUpdatePayload = () => {
    const normalizedOrderType = orderType;
    const currentCartItems = Object.values(cartItems);
    const originalItems = originalOrderItems || [];

    const existingByKey = new Map(
      originalItems.map((item) => [getComparableOrderItemKey(item), item])
    );
    const currentByKey = new Map(
      currentCartItems.map((item) => [getComparableCartItemKey(item), item])
    );

    const removeItemIds = [];
    const updateQuantities = [];
    const newItems = [];

    for (const [key, existingItem] of existingByKey.entries()) {
      const currentItem = currentByKey.get(key);
      if (!currentItem) {
        removeItemIds.push(existingItem._id?.toString?.() || existingItem._id);
        continue;
      }
      if ((currentItem.quantity || 0) !== (existingItem.quantity || 0)) {
        updateQuantities.push({ itemId: existingItem._id?.toString?.() || existingItem._id, quantity: currentItem.quantity || 0 });
      }
    }

    for (const [key, currentItem] of currentByKey.entries()) {
      if (!existingByKey.has(key)) {
        newItems.push(buildOrderItemFromCartItem(currentItem));
      }
    }

    const isOriginalEatHere = editingOrder?.orderType === "Eat Here" || editingOrder?.orderType === "Room Stay";
    const payload = {
      orderType: normalizedOrderType,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
    };

    if ((normalizedOrderType === "Eat Here" || normalizedOrderType === "Room Stay") && !isOriginalEatHere && tableId) {
      const selectedOption = tableOptions.find((o) => o.value === tableId);
      payload.source = { unitId: selectedOption?.unitId || null };
    }

    if (normalizedOrderType === "Delivery") {
      payload.address = address;
      payload.source = { section: null, number: null, type: "NONE", unitId: null };
    } else if (normalizedOrderType === "Take Away") {
      payload.source = { section: null, number: null, type: "NONE", unitId: null };
      payload.address = null;
    }

    if (removeItemIds.length) payload.removeItemIds = removeItemIds;
    if (updateQuantities.length) payload.updateQuantities = updateQuantities;
    if (newItems.length) payload.items = newItems;

    return payload;
  };

  const handleSubmit = async (mode = "kot") => {
    const normalizedOrderType = orderType;
    if (!customerName.trim()) {
      showError("Customer name is required.");
      return;
    }
    if (!PHONE_VALID_PATTERN.test(customerPhone)) {
      showError("Valid 10-digit phone is required.");
      return;
    }

    let errorMessage = "";
    const isDineInOrStay = normalizedOrderType === "Eat Here" || normalizedOrderType === "Room Stay";
    if (isDineInOrStay && !tableId) {
      errorMessage = `Please select a ${dineInType === "ROOM" ? "room" : "table"}.`;
    } else if (isDineInOrStay && tableId) {
      const [sec, num] = tableId.split(":");
      if (!sec || !num) errorMessage = `Please select a ${dineInType === "ROOM" ? "room" : "table"} number.`;
    }
    if (normalizedOrderType === "Delivery" && !address.trim()) {
      errorMessage = "Please provide a delivery address.";
    }
    if (errorMessage) { showError(errorMessage); return; }

    try {
      const currentCartItems = Object.values(cartItems);
      const orderItems = currentCartItems.map((cartItem) => buildOrderItemFromCartItem(cartItem));
      const addedItemsPreview = buildAddedItemsPreview(currentCartItems, originalOrderItems);

      const orderData = {
        items: orderItems,
        orderType: normalizedOrderType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      };

      // 🔧 FIX: Backend createOrderByAdminOrStaff expects source.unitId (MongoDB _id), not {section, number, type}
      if ((normalizedOrderType === "Eat Here" || normalizedOrderType === "Room Stay") && tableId) {
        const selectedOption = tableOptions.find((o) => o.value === tableId);
        orderData.source = { unitId: selectedOption?.unitId || null };
      }

      if (normalizedOrderType === "Delivery") {
        orderData.address = address;
      }

      let response;
      if (bookingOrderId) {
        const updatePayload = buildOrderUpdatePayload();
        response = await updateOrder({ orderId: bookingOrderId, updatedData: updatePayload }).unwrap();
        setBookingOrderId(null);
      } else if (isEditing && editingOrder?._id) {
        const updatePayload = buildOrderUpdatePayload();
        response = await updateOrder({ orderId: editingOrder._id, updatedData: updatePayload }).unwrap();
      } else {
        response = await createOrder(orderData).unwrap();
      }

      const finalOrder = response?.order || response;

      if (mode === "kot" && finalOrder) {
        if (isEditing) {
          if (addedItemsPreview.length > 0) {
            dispatch(
              showBill(
                createKotPreviewOrder({
                  finalOrder,
                  previewItems: addedItemsPreview,
                  restaurantDetails: restaurant,
                })
              )
            );
          } else {
            dispatch(showBill(finalOrder));
          }
        } else {
          dispatch(showBill(finalOrder));
        }
      }

      if (mode === "print_bill" && finalOrder) {
        try {
          await billOrder(finalOrder._id).unwrap();
        } catch (err) {
          console.error("Billing failed", err);
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      dispatch(clearCart());
      setCustomerName("");
      setCustomerPhone("");
      setTableId("");
      setAddress("");
      setOrderType("Take Away");
      setOriginalOrderItems([]);

      if (onOrderSuccess) {
        onOrderSuccess(mode);
      }
    } catch (err) {
      const backendMsg = err?.data?.message || err?.message || "";
      if (backendMsg.includes("Order validation failed") && backendMsg.includes("source.")) {
        showError("Unable to save this order due to a system configuration issue. Please contact the admin to verify the restaurant setup.");
      } else {
        showError(backendMsg || "Failed to place order");
      }
    }
  };

  const handleClear = () => {
    dispatch(clearCart());
    setCustomerName("");
    setCustomerPhone("");
    setTableId("");
    setAddress("");
    setOrderType("Take Away");
    setError("");
    setBookingOrderId(null);
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const inputStyle = isDarkMode
    ? "border border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-1.5 md:py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition w-full"
    : "border border-[#ede8e3] bg-white text-[#1c1917] placeholder-[#a8a29e] rounded-lg px-3 py-1.5 md:py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition w-full";

  const bg = isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]";
  const border = isDarkMode ? "border-slate-700/60" : "border-[#ede8e3]";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-[#78716c]";
  const cardBg = isDarkMode
    ? "bg-[#1e293b] border-slate-700/60 hover:border-orange-500/40"
    : "bg-white border-[#ede8e3] hover:border-orange-300 hover:shadow-sm shadow-none";
  const summaryBg = isDarkMode ? "bg-[#1e293b]" : "bg-white";
  const headerBg = isDarkMode ? "bg-[#0f172a] border-slate-700/60" : "bg-white border-[#ede8e3]";

  // All props for OrderSummaryPanel (module-level component)
  const summaryProps = {
    isDarkMode, cartItems, cartCount, orderType, setOrderType,
    tableId, setTableId, address, setAddress,
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    subtotal, gstEnabled, gstRate, gstAmount, deliveryCharges, total,
    isRestaurantOpen, tableOptions, error, success, isSubmitting,
    dispatch, handleRemoveAll, handleSubmit, handleClear,
    handleNameChange, handlePhoneChange,
    inputStyle, border, textPrimary, textSecondary, summaryBg,
    editingOrder,
    dineInType, setDineInType,
    isBilled,
    setShowPayModal,
    setBookingOrderId,
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    // style prop forces the bg color even if a parent has conflicting bg
    <div
      className={`flex flex-col ${asModal ? "h-full" : "h-screen"} overflow-hidden ${bg}`}
      style={{ backgroundColor: isDarkMode ? "#0f172a" : "#f7f3ef" }}
    >

      {/* STICKY HEADER — hidden when used as modal */}
      {!asModal && (
        <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 sticky top-0 z-20 ${headerBg}`}>
          <h2 className={`text-base font-bold leading-tight ${textPrimary}`}>
            {selectedCategory || "Menu"}
          </h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-[#f7f3ef] text-[#78716c]"
              }`}>
              {currentItems.length} item{currentItems.length !== 1 ? "s" : ""}
            </span>
            {cartCount > 0 && (
              <span
                style={{ backgroundColor: "#f97316", color: "#ffffff" }}
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
              >
                {cartCount} in cart
              </span>
            )}
          </div>
        </div>
      )}

      {/* MOBILE: Category strip */}
      <div
        className={`flex flex-row overflow-x-auto gap-2 px-3 py-2.5 border-b shrink-0 md:hidden ${isDarkMode ? "border-slate-700/60 bg-[#0f172a]" : "border-[#ede8e3] bg-white"
          }`}
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 transition-all duration-150 border ${selectedCategory === cat
              ? isDarkMode ? "bg-orange-950/30 border-orange-500/50 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-700 font-extrabold shadow-sm"
              : isDarkMode
                ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-slate-100"
                : "bg-white text-[#57524e] border-[#ede8e3] hover:bg-[#f7f3ef] hover:text-[#1c1917]"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MAIN BODY */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* DESKTOP: Category sidebar */}
        <div
          data-tour="orderpanel-categories"
          className={`hidden md:flex md:flex-col w-44 shrink-0 overflow-y-auto border-r p-2 gap-0.5 ${isDarkMode ? "border-slate-700/60 bg-[#0f172a]" : "border-[#ede8e3] bg-white"
            }`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-4 py-2.5 text-xs font-extrabold transition-all duration-150 border ${selectedCategory === cat
                ? isDarkMode ? "bg-orange-950/30 border-orange-500/40 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-700 font-bold pl-3 shadow-none border-l-4 border-l-orange-500 rounded-r-xl rounded-l-none"
                : isDarkMode
                  ? "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  : "border-transparent text-[#57524e] hover:bg-[#fbfaf8] hover:text-[#1c1917] pl-4 border-l-4 border-l-transparent"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ITEMS GRID */}
        <div
          data-tour="orderpanel-items"
          className={`flex-1 overflow-y-auto p-3 ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}
          style={{ WebkitOverflowScrolling: "touch", backgroundColor: isDarkMode ? "#0f172a" : "#f7f3ef" }}
        >
          {menuLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-36 rounded-xl animate-pulse ${isDarkMode ? "bg-slate-700/50" : "bg-[#f0ebe5]"}`}
                />
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-slate-800" : "bg-[#f7f3ef]"}`}>
                <ShoppingBag className={`h-6 w-6 ${isDarkMode ? "text-slate-500" : "text-[#a8a29e]"}`} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${textPrimary}`}>No items here</p>
                <p className={`text-xs mt-1 ${textSecondary}`}>"{selectedCategory}" has no menu items yet</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {currentItems.map((item) => {
                const { cartKey, quantity, selectedVariant } = getCartKeyAndQty(item);
                let basePrice = Number(item.price) || 0;
                if (item.pricingType === "variant" && selectedVariant && item.variantRates?.[selectedVariant]) {
                  basePrice = Number(item.variantRates[selectedVariant].price) || 0;
                } else if (item.pricingType === "combo") {
                  basePrice = Number(item.comboPrice) || 0;
                }
                const discountedPrice = calculateDiscountedPrice(item, selectedVariant);
                const hasDiscount = hasActiveDiscount(item, selectedVariant);
                const isUnavailable = !item.available;

                return (
                  <div
                    key={item._id}
                    className={`relative flex flex-col justify-between min-h-[135px] rounded-2xl border p-3 transition-all duration-200 ${isUnavailable ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer"
                      } ${quantity > 0
                        ? isDarkMode
                          ? "border-orange-500/50 bg-[#1e293b] shadow-sm"
                          : "border-orange-400 bg-white shadow-sm"
                        : isDarkMode
                          ? "border-slate-700/60 bg-[#1e293b] hover:border-slate-600"
                          : "border-[#ede8e3] bg-white hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <VegDot type={item.type} />
                      <h3 className={`text-xs font-semibold leading-tight line-clamp-2 flex-1 min-w-0 break-words ${textPrimary}`}>
                        {item.name}
                      </h3>
                    </div>

                    {item.pricingType === "combo" && (
                      <span className={`self-start text-[9px] px-1.5 py-0.5 rounded-md font-semibold mb-1 ${isDarkMode ? "bg-orange-500/20 text-orange-300" : "bg-orange-50 text-orange-500"
                        }`}>
                        Combo
                      </span>
                    )}

                    <div className="flex flex-wrap items-center gap-1 mb-1.5">
                      {item.pricingType === "variant" ? (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-orange-50/50 text-orange-600"
                          }`}>
                          Variant
                        </span>
                      ) : hasDiscount ? (
                        <>
                          <span className={`text-[10px] line-through ${isDarkMode ? "text-slate-400/70" : "text-slate-400"}`}>
                            ₹{basePrice.toFixed(2)}
                          </span>
                          <span className={`text-xs font-bold ${isDarkMode ? "text-orange-400" : "text-orange-500"}`}>₹{discountedPrice.toFixed(2)}</span>
                          <span className={`text-[9px] px-1 py-0.5 rounded-full font-semibold ${isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                            }`}>
                            OFF
                          </span>
                        </>
                      ) : (
                        <span className={`text-xs font-semibold ${isDarkMode ? "text-slate-200" : "text-stone-500"}`}>₹{basePrice.toFixed(2)}</span>
                      )}
                    </div>

                    {isUnavailable && (
                      <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-white bg-black/50 px-2 py-1 rounded-full">
                          Unavailable
                        </span>
                      </div>
                    )}

                    <div className="mt-auto pt-1">
                      {item.pricingType === "variant" && Object.keys(item.variantRates || {}).length > 0 ? (
                        <button
                          onClick={() => setVariantPickerItem(item)}
                          disabled={!isRestaurantOpen || isBilled}
                          className={`w-full py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${isDarkMode
                            ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                            : "bg-white border-orange-200/90 text-orange-600 hover:bg-[#fff8f5] hover:border-orange-350"
                            } ${isBilled ? "opacity-45 cursor-not-allowed" : ""}`}
                        >
                          + Add
                        </button>
                      ) : quantity === 0 ? (
                        <button
                          onClick={() => handleAddItem(item)}
                          disabled={!isRestaurantOpen || isBilled}
                          className={`w-full py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${isDarkMode
                            ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                            : "bg-white border-orange-200/90 text-orange-600 hover:bg-[#fff8f5] hover:border-orange-350"
                            } ${isBilled ? "opacity-45 cursor-not-allowed" : ""}`}
                        >
                          + Add
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-1.5">
                          <button
                            disabled={isBilled}
                            onClick={() => dispatch(removeFromCart(cartKey))}
                            className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${isBilled
                              ? isDarkMode
                                ? "border-slate-700 bg-slate-800/40 text-slate-500 cursor-not-allowed opacity-55"
                                : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-55"
                              : isDarkMode
                                ? "border-orange-500/30 bg-[#ea580c]/10 text-orange-400 hover:bg-[#ea580c]/20"
                                : "border-orange-200 bg-[#fff8f5] text-orange-600 hover:bg-[#ffedd5] hover:border-orange-300"
                              }`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className={`text-sm font-extrabold px-1 ${isDarkMode ? 'text-slate-100' : 'text-[#1c1917]'}`}>{quantity}</span>
                          <button
                            disabled={!isRestaurantOpen || isBilled}
                            onClick={() => handleAddItem(item)}
                            className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${isBilled
                              ? isDarkMode
                                ? "border-slate-700 bg-slate-800/40 text-slate-500 cursor-not-allowed opacity-55"
                                : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-55"
                              : isDarkMode
                                ? "border-orange-500/30 bg-[#ea580c]/15 text-orange-400 hover:bg-[#ea580c]/25"
                                : "border-orange-200 bg-[#fff8f5] text-orange-600 hover:bg-[#ffedd5] hover:border-orange-300"
                              }`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DESKTOP: Order Summary sidebar */}
        <div
          data-tour="orderpanel-summary"
          className={`hidden md:flex md:flex-col w-[440px] shrink-0 border-l overflow-hidden ${isDarkMode ? `border-slate-700/60 ${summaryBg}` : `border-[#ede8e3] ${summaryBg}`
            }`}
        >
          <OrderSummaryPanel {...summaryProps} />
        </div>
      </div>

      {/* MOBILE: Order Summary */}
      {/* Fixed h-[50vh] + overflow-y-auto + sticky bottom-0 on action buttons ensures
          Save / KOT / Print BILL always stay pinned at the bottom of the panel even
          when Order Details form is expanded (Eat Here / Delivery).
          isMobile={true} enables conditional sticky bottom on buttons (shared component). */}
      <div
        className={`md:hidden border-t shrink-0 h-[50vh] overflow-y-auto flex flex-col ${isDarkMode ? `border-slate-700/60 ${summaryBg}` : `border-[#ede8e3] ${summaryBg}`
          }`}
      >
        <OrderSummaryPanel {...summaryProps} isMobile={true} />
      </div>

      {/* ── Variant Picker Modal ── */}
      {variantPickerItem && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50"
          onClick={() => setVariantPickerItem(null)}
        >
          <div
            className={`w-[90%] max-w-sm rounded-2xl border p-6 shadow-2xl ${isDarkMode ? "bg-[#1e293b] border-slate-600" : "bg-white border-[#ede8e3]"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className={`text-lg font-bold mb-1 text-center ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>
              {variantPickerItem.name}
            </h4>
            <p className={`text-xs text-center mb-4 ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>
              Select a variant
            </p>

            <div className="flex flex-col gap-3">
              {Object.entries(variantPickerItem.variantRates || {}).filter(([, v]) => v != null).map(([key, v]) => {
                const vBasePrice = Number(v.price) || 0;
                const vDiscount = v.discount;
                let vFinal = vBasePrice;
                if (vDiscount?.active && vDiscount?.value && Number(vDiscount.value) > 0) {
                  const dv = Number(vDiscount.value);
                  vFinal = vDiscount.type?.toLowerCase() === "percentage"
                    ? vBasePrice - (vBasePrice * dv) / 100
                    : vBasePrice - dv;
                }
                const hasDisc = vFinal < vBasePrice;
                const label = formatVariantLabel(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedVariants((prev) => ({ ...prev, [variantPickerItem._id]: key }));
                      setVariantPickerItem(null);
                      // Direct add with chosen variant
                      const cartKey = `${variantPickerItem._id}-${key}`;
                      let basePrice = Number(v.price) || 0;
                      const discountedPrice = calculateDiscountedPrice(variantPickerItem, key);
                      const hasDiscount = hasActiveDiscount(variantPickerItem, key);
                      dispatch(addToCart({
                        id: cartKey,
                        item: {
                          ...variantPickerItem,
                          price: discountedPrice || basePrice,
                          originalPrice: basePrice,
                          hasDiscount,
                          variantKey: key,
                          variantLabel: formatVariantLabel(key),
                          customizations: "",
                        },
                        quantity: 1,
                      }));
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-xl text-base font-bold transition-all active:scale-[0.97] ${isDarkMode
                      ? "bg-slate-800/80 border border-slate-700 text-slate-100 hover:border-orange-500/50 hover:bg-orange-950/20 hover:text-orange-400"
                      : "bg-white border border-[#ede8e3] text-[#1c1917] hover:border-orange-300 hover:bg-[#fff8f5] hover:text-orange-700 shadow-sm"
                      }`}
                  >
                    <span>{label}</span>
                    <span className="text-right">
                      ₹{vFinal.toFixed(0)}
                      {hasDisc && (
                        <span className={`ml-2 line-through text-sm font-semibold ${isDarkMode ? "text-slate-400/70" : "text-gray-400"
                          }`}>₹{vBasePrice.toFixed(0)}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setVariantPickerItem(null)}
              className={`w-full mt-3 py-3 rounded-xl text-sm font-semibold transition-colors ${isDarkMode
                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                : "bg-[#f7f3ef] text-[#78716c] hover:bg-[#ede8e3]"
                }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPayModal && (
        <PayModal
          order={editingOrder}
          onClose={() => {
            setShowPayModal(false);
            if (onOrderSuccess) {
              onOrderSuccess("pay");
            }
          }}
        />
      )}
    </div>
  );
}
