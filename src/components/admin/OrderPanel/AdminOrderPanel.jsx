import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

const getIndicatorColor = (type) => {
  const t = String(type || "").toLowerCase();
  if (t.includes("non")) {
    return "#dc2626"; // Red for non-veg
  }
  if (t.includes("egg")) {
    return "#eab308"; // Yellow/amber for egg
  }
  return "#16a34a"; // Green for veg
};

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
  const colors = useSelector((state) => state.admin.theme.colors);
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
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 outline-none"
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
          borderColor: isOpen
            ? colors.primary
            : (isDarkMode ? "#475569" : "#ede8e3"),
          color: isDarkMode ? "#cbd5e1" : "#1c1917"
        }}
      >
        <span className={selectedOption ? "" : isDarkMode ? "text-slate-500" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : (placeholder || "Select...")}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: isOpen ? colors.primary : (isDarkMode ? "#64748b" : "#a8a29e") }}
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
                  className="w-full text-left px-3 text-sm font-medium transition-all duration-150 flex items-center justify-between gap-2"
                  style={{
                    height: ITEM_HEIGHT,
                    backgroundColor: value === opt.value
                      ? (isDarkMode ? `${colors.primary}25` : `${colors.primary}10`)
                      : "transparent",
                    color: value === opt.value
                      ? (isDarkMode ? "#ffffff" : colors.primary)
                      : (isDarkMode ? "#cbd5e1" : "#1c1917")
                  }}
                  onMouseEnter={(e) => {
                    if (value !== opt.value) {
                      e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(71, 85, 105, 0.4)" : "#f7f3ef";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== opt.value) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0 transition-colors"
                      style={{ backgroundColor: value === opt.value ? colors.primary : isDarkMode ? "#475569" : "#e2e8f0" }}
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
  const colors = useSelector((state) => state.admin.theme.colors);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const variantEntries = Object.entries(item.variantRates || {}).filter(([, v]) => v && v.price !== "" && v.price != null && Number(v.price) > 0);

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
        className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all duration-200 outline-none"
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#f7f3ef",
          borderColor: isOpen
            ? colors.primary
            : (isDarkMode ? "#475569" : "#ede8e3"),
          color: isDarkMode ? "#cbd5e1" : "#1c1917"
        }}
      >
        <span className="truncate">
          {selectedDisplay ? `${selectedDisplay.label} — ₹${selectedDisplay.finalPrice.toFixed(2)}` : "Select variant"}
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: isOpen ? colors.primary : (isDarkMode ? "#64748b" : colors.primary) }}
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
                  className="w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all duration-150"
                  style={{
                    backgroundColor: value === key
                      ? (isDarkMode ? `${colors.primary}25` : `${colors.primary}10`)
                      : "transparent",
                    color: value === key
                      ? (isDarkMode ? "#ffffff" : colors.primary)
                      : (isDarkMode ? "#cbd5e1" : "#1c1917")
                  }}
                  onMouseEnter={(e) => {
                    if (value !== key) {
                      e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(71, 85, 105, 0.4)" : "#f7f3ef";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== key) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
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
  const colors = useSelector((state) => state.admin.theme.colors);
  const variantEntries = Object.entries(item.variantRates || {}).filter(([, v]) => v && v.price !== "" && v.price != null && Number(v.price) > 0);

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
            className="flex-1 min-w-[80px] flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-150 active:scale-95"
            style={{
              backgroundColor: isSelected
                ? (isDarkMode ? `${colors.primary}25` : `${colors.primary}0d`)
                : (isDarkMode ? "#1e293b" : "#f7f3ef"),
              borderColor: isSelected ? colors.primary : (isDarkMode ? "#475569" : "#ede8e3"),
              color: isSelected
                ? (isDarkMode ? "#ffffff" : colors.primary)
                : (isDarkMode ? "#cbd5e1" : "#1c1917")
            }}
          >
            <span className="text-base">{d.label}</span>
            <span className="text-xs font-bold" style={{ color: isSelected ? (isDarkMode ? "#ffffff" : colors.primary) : colors.primary }}>
              ₹{d.finalPrice.toFixed(0)}
              {d.hasDisc && (
                <span className="ml-1 line-through text-[10px]" style={{ color: isSelected ? (isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)") : (isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)") }}>
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
  hasRooms = false,
  restaurant = {},
}) {
  const { notify, newBadgeItemsByOrderId } = useNotification() || {};
  const colors = useSelector((state) => state.admin.theme.colors);
  const isEditing = Boolean(editingOrder?._id);
  const [isFormCollapsed, setIsFormCollapsed] = useState(isEditing);
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

      {/* Scroll Hint if items are scrollable */}
      {Object.keys(cartItems).length > 3 && (
        <div className={`px-4 pt-3 pb-1 text-[10px] font-extrabold flex items-center justify-between shrink-0 ${textSecondary}`}>
          <span className="uppercase tracking-wider">Selected Items ({Object.keys(cartItems).length})</span>
          <span className="animate-pulse text-orange-500 dark:text-orange-400 flex items-center gap-1">
            Scroll for more ↓
          </span>
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
            const orderId = editingOrder?._id;
            const newBadgeSet = orderId && newBadgeItemsByOrderId?.get(String(orderId));
            const isNewItem = newBadgeSet && newBadgeSet.has(id);
            const itemTotal = (item.price || 0) * (item.quantity || 1);
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
                    <span
                      className="text-xs px-2 py-0.5 rounded-md mt-1 inline-block font-semibold"
                      style={{
                        backgroundColor: isDarkMode ? `${colors.primary}33` : `${colors.primary}10`,
                        color: isDarkMode ? "#ffffff" : colors.primary
                      }}
                    >
                      {item.variantLabel}
                    </span>
                  )}
                  {item.customizations && (
                    <div
                      className="text-xs mt-1 italic font-medium"
                      style={{ color: isDarkMode ? "#ffffff" : colors.primary }}
                    >
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
                      : "hover:opacity-90"
                      }`}
                    style={!isBilled ? {
                      borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}60`,
                      backgroundColor: isDarkMode ? "transparent" : "#ffffff",
                      color: isDarkMode ? "#ffffff" : colors.primary
                    } : {}}
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
                      : "hover:opacity-90"
                      }`}
                    style={!isBilled ? {
                      borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}60`,
                      backgroundColor: isDarkMode ? "transparent" : `${colors.primary}10`,
                      color: isDarkMode ? "#ffffff" : colors.primary
                    } : {}}
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
          <div className="px-4 pb-3 space-y-2">
            {/* Order Type */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"}`}>
                Order Type
              </label>
              <div className="flex gap-2">
                {["Eat Here", "Take Away", "Delivery"].map((type) => {
                  const isRoomStay = editingOrder?.orderType === "Room Stay";
                  if (isRoomStay && (type === "Take Away" || type === "Delivery")) {
                    return null;
                  }

                  const orderModes = restaurant?.orderModes || {};
                  if (type === "Eat Here" && orderModes.eathere === false && orderType !== "Eat Here" && orderType !== "Room Stay") {
                    return null;
                  }
                  if (type === "Take Away" && orderModes.takeaway === false && orderType !== "Take Away") {
                    return null;
                  }
                  if (type === "Delivery" && orderModes.delivery === false && orderType !== "Delivery") {
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
                      }}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all border ${isBilled ? "opacity-60 cursor-not-allowed" : ""}`}
                      style={{
                        backgroundColor: isActive
                          ? colors.primary
                          : (isDarkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff"),
                        borderColor: isActive
                          ? colors.primary
                          : (isDarkMode ? "#475569" : "#ede8e3"),
                        color: isActive
                          ? "#ffffff"
                          : (isDarkMode ? "#94a3b8" : "#78716c"),
                        fontWeight: isActive ? "800" : "500"
                      }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table / Room selector — only when Eat Here or Room Stay, and showTableSelector is true */}
            {(orderType === "Eat Here" || orderType === "Room Stay") && showTableSelector && (
              <div className="grid grid-cols-2 gap-3">
                {/* Dine In Type sub-toggle (only when showTableSelector is true and hasRooms is true) */}
                {showTableSelector && hasRooms && (
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"}`}>
                      Unit Type
                    </label>
                    <div className="flex gap-1">
                      {[
                        { key: "TABLE", label: "Table", orderTypeTarget: "Eat Here" },
                        { key: "ROOM", label: "Room", orderTypeTarget: "Room Stay" },
                      ].map(({ key, label, orderTypeTarget }) => (
                        <button
                          key={key}
                          type="button"
                          disabled={isBilled}
                          onClick={() => {
                            setDineInType(key);
                            setOrderType(orderTypeTarget);
                            setTableId(""); // clear table selection when switching types
                          }}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all border ${isBilled ? "opacity-60 cursor-not-allowed" : ""}`}
                          style={{
                            backgroundColor: dineInType === key
                              ? colors.primary
                              : (isDarkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff"),
                            borderColor: dineInType === key
                              ? colors.primary
                              : (isDarkMode ? "#475569" : "#ede8e3"),
                            color: dineInType === key
                              ? "#ffffff"
                              : (isDarkMode ? "#94a3b8" : "#78716c"),
                            fontWeight: dineInType === key ? "800" : "500"
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={!(showTableSelector && hasRooms) ? "col-span-2" : ""}>
                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-slate-300" : "text-[#1c1917]"}`}>
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

            {/* Customer name & phone in two columns */}
            <div className="grid grid-cols-2 gap-3">
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
                  rows={2}
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
          <span className="font-bold text-lg" style={{ color: colors.primary }}>₹{total.toFixed(2)}</span>
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
            onClick={() => setShowPayModal(editingOrder)}
            className="w-full h-12 rounded-xl text-sm font-black transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] text-white hover:opacity-90 bg-emerald-600 border border-emerald-600"
          >
            <IndianRupee className="h-4 w-4 shrink-0 text-white" />
            Record Payment
          </button>
        ) : (
          <>
            <button
              onClick={() => handleSubmit("print_bill")}
              disabled={
                cartCount === 0 ||
                isSubmitting ||
                !isRestaurantOpen ||
                ((orderType === "Eat Here" || orderType === "Room Stay") && (() => { const [s, n] = (tableId || "").split(":"); return !s || !n; })())
              }
              className="flex-1 h-12 rounded-xl border text-sm font-black transition-all duration-200 flex items-center justify-center shadow-sm active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed text-white hover:opacity-90"
              style={{
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
                  Processing...
                </span>
              ) : (
                "Bill Order"
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
              className="flex-1 h-12 rounded-xl border text-sm font-black transition-all duration-200 flex items-center justify-center shadow-sm active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed text-white hover:opacity-90"
              style={{
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
                  Processing...
                </span>
              ) : (
                "KOT & Add"
              )}
            </button>
            <button
              onClick={() => handleSubmit("save")}
              disabled={
                cartCount === 0 ||
                isSubmitting ||
                !isRestaurantOpen ||
                ((orderType === "Eat Here" || orderType === "Room Stay") && (() => { const [s, n] = (tableId || "").split(":"); return !s || !n; })())
              }
              className="flex-1 h-12 rounded-xl border text-sm font-black transition-all duration-200 flex items-center justify-center shadow-sm active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "#ffffff",
                borderColor: isDarkMode ? "#475569" : "#ede8e3",
                color: isDarkMode ? "#cbd5e1" : "#57524e"
              }}
              onMouseEnter={(e) => {
                if (cartCount > 0 && !isSubmitting && isRestaurantOpen) {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.color = isDarkMode ? "#ffffff" : colors.primary;
                  e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}15` : `${colors.primary}0a`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDarkMode ? "#475569" : "#ede8e3";
                e.currentTarget.style.color = isDarkMode ? "#cbd5e1" : "#57524e";
                e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(30, 41, 59, 0.4)" : "#ffffff";
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: isDarkMode ? "#ffffff" : "#57524e", borderTopColor: 'transparent' }} />
                  Processing...
                </span>
              ) : (
                "Save"
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
                  className={`w-full h-10 px-3 rounded-xl border text-sm transition-all outline-none theme-focus ${isDarkMode
                    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                    : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
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
                  className={`w-full h-10 px-3 rounded-xl border text-sm transition-all outline-none theme-focus ${isDarkMode
                    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                    : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
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
                  className="flex-1 h-10 rounded-xl border text-sm font-extrabold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90"
                  style={{
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  }}
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
  const colors = useSelector((state) => state.admin.theme.colors);
  const dispatch = useDispatch();
  const { notify, newItemsByOrderId, sseEvent } = useNotification() || {};
  useAdminTour(TOUR_KEYS.orderPanel, getOrderPanelSteps, isDarkMode, 900);

  const cartItems = useSelector((state) => state.client?.cart?.items || {});
  const cartCount = Object.values(cartItems).reduce(
    (acc, item) => acc + (item?.quantity || 0),
    0
  );

  const { data: restaurantData, refetch: refetchPublicRestaurant } = useGetPublicRestaurantQuery();
  const { data: liveUnitsData } = useGetLiveOccupancyQuery();
  const { data: menuData, isLoading: menuLoading } = useGetMenuQuery();

  useEffect(() => {
    if (sseEvent?.type === "RESTAURANT_UPDATED") {
      refetchPublicRestaurant?.();
    }
  }, [sseEvent, refetchPublicRestaurant]);

  const [createOrder, { isLoading: isCreating }] = useCreateOrderByAdminMutation();
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();
  const [billOrder] = useBillOrderMutation();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
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
  const [showPayModal, setShowPayModal] = useState(null);
  const [bookingOrderId, setBookingOrderId] = useState(null);

  const isEditing = Boolean(editingOrder?._id);
  const isBilled = editingOrder && editingOrder.status === "completed" && !editingOrder.paymentMethod && (!editingOrder.paymentMethods || editingOrder.paymentMethods.length === 0);
  const isSubmitting = isCreating || isUpdating;
  const restaurant = restaurantData?.restaurant || {};

  // Auto-fallback order type based on enabled orderModes settings
  useEffect(() => {
    if (!restaurantData) return;
    const modes = restaurantData?.restaurant?.orderModes || restaurantData?.orderModes || {};
    if (orderType === "Eat Here" || orderType === "Room Stay") {
      if (modes.eathere === false) {
        if (modes.takeaway !== false) {
          setOrderType("Take Away");
        } else if (modes.delivery !== false) {
          setOrderType("Delivery");
        }
      }
    } else if (orderType === "Take Away") {
      if (modes.takeaway === false) {
        if (modes.eathere !== false) {
          setOrderType("Eat Here");
        } else if (modes.delivery !== false) {
          setOrderType("Delivery");
        }
      }
    } else if (orderType === "Delivery") {
      if (modes.delivery === false) {
        if (modes.eathere !== false) {
          setOrderType("Eat Here");
        } else if (modes.takeaway !== false) {
          setOrderType("Take Away");
        }
      }
    }
  }, [restaurantData, orderType]);

  const hasRooms = useMemo(() => {
    const sections = Array.isArray(restaurant.sections) ? restaurant.sections : [];
    return sections.some((section) => {
      const units = Array.isArray(section.units) ? section.units : [];
      return units.some((unit) => unit.type === "ROOM" && unit.isActive !== false);
    });
  }, [restaurant.sections]);

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

  const categories = restaurantCategories
    .map((c) => String(c.name).trim())
    .filter((catName) => {
      const catKey = catName.toLowerCase();
      return groupedMenu[catKey] && groupedMenu[catKey].length > 0;
    });

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
      const mergeDuplicateOrderItems = (itemsList) => {
        const mergedMap = new Map();
        for (const item of itemsList) {
          const key = `${item.menuItemId}_${item.variant || "default"}`;
          if (mergedMap.has(key)) {
            const existing = mergedMap.get(key);
            existing.quantity += item.quantity;
            const currentCust = String(item.customizations || "").trim();
            const existingCust = String(existing.customizations || "").trim();
            if (currentCust && existingCust) {
              if (existingCust.toLowerCase() !== currentCust.toLowerCase()) {
                existing.customizations = `${existingCust}, ${currentCust}`;
              }
            } else if (currentCust) {
              existing.customizations = currentCust;
            }
          } else {
            mergedMap.set(key, { ...item });
          }
        }
        return Array.from(mergedMap.values());
      };

      const currentCartItems = Object.values(cartItems);
      const rawOrderItems = currentCartItems.map((cartItem) => buildOrderItemFromCartItem(cartItem));
      const orderItems = mergeDuplicateOrderItems(rawOrderItems);
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
          const billResponse = await billOrder(finalOrder._id).unwrap();
          const billedOrder = billResponse?.order || billResponse || finalOrder;
          setShowPayModal({
            ...finalOrder,
            ...billedOrder,
            status: "completed",
          });
        } catch (err) {
          console.error("Billing failed", err);
          setShowPayModal({
            ...finalOrder,
            status: "completed",
          });
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

      const finalBilledOrder = (mode === "print_bill" && typeof billedOrder !== "undefined") ? billedOrder : finalOrder;

      if (mode !== "print_bill" && onOrderSuccess) {
        onOrderSuccess(mode, finalBilledOrder);
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
    ? "border border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-1.5 md:py-2 text-sm outline-none transition w-full theme-focus"
    : "border border-[#ede8e3] bg-white text-[#1c1917] placeholder-[#a8a29e] rounded-lg px-3 py-1.5 md:py-2 text-sm outline-none transition w-full theme-focus";

  const bg = isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]";
  const border = isDarkMode ? "border-slate-700/60" : "border-[#ede8e3]";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-[#78716c]";
  const cardBg = isDarkMode
    ? "bg-[#1e293b] border-slate-700/60 theme-card-hover"
    : "bg-white border-[#ede8e3] theme-card-hover hover:shadow-sm shadow-none";
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
    hasRooms,
    restaurant,
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    // style prop forces the bg color even if a parent has conflicting bg
    <div
      className={`flex flex-col ${asModal ? "h-full" : "h-screen"} overflow-hidden ${bg}`}
      style={{ backgroundColor: isDarkMode ? "#0f172a" : "#f7f3ef" }}
    >
      <style>{`
        .theme-focus:focus {
          border-color: ${colors.primary} !important;
          box-shadow: 0 0 0 1px ${colors.primary}80 !important;
        }
        .theme-card-hover:hover {
          border-color: ${colors.primary}60 !important;
        }
      `}</style>

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
                style={{ backgroundColor: colors.primary, color: "#ffffff" }}
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
              ? ""
              : isDarkMode
                ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-slate-100"
                : "bg-white text-[#57524e] border-[#ede8e3] hover:bg-[#f7f3ef] hover:text-[#1c1917]"
              }`}
            style={selectedCategory === cat ? {
              backgroundColor: isDarkMode ? `${colors.primary}25` : `${colors.primary}0d`,
              borderColor: isDarkMode ? `${colors.primary}60` : `${colors.primary}33`,
              color: isDarkMode ? "#ffffff" : colors.primary
            } : {}}
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
            <div key={cat} className="flex flex-col">
              <button
                onClick={() => {
                  setSelectedCategory(cat);
                  setExpandedCategory(prev => prev === cat ? null : cat);
                }}
                className={`w-full text-left px-4 py-3 text-sm font-extrabold transition-all duration-150 border rounded-r-xl rounded-l-none ${selectedCategory === cat
                  ? ""
                  : isDarkMode
                    ? "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    : "border-transparent text-[#57524e] hover:bg-[#fbfaf8] hover:text-[#1c1917] pl-4 border-l-4 border-l-transparent"
                  }`}
                style={selectedCategory === cat ? {
                  backgroundColor: isDarkMode ? `${colors.primary}25` : `${colors.primary}0d`,
                  borderColor: isDarkMode ? `${colors.primary}60` : `${colors.primary}33`,
                  color: isDarkMode ? "#ffffff" : colors.primary,
                  borderLeft: `4px solid ${colors.primary}`,
                  paddingLeft: "12px"
                } : {}}
              >
                <span className={expandedCategory === cat ? "block whitespace-normal break-words" : "block truncate"}>
                  {cat}
                </span>
              </button>
              <div className={`h-px w-full my-1 ${isDarkMode ? "bg-slate-600" : "bg-stone-300"}`} />
            </div>
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
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
                    className={`relative flex flex-col justify-between min-h-[110px] rounded-lg border p-3 pl-5 transition-all duration-200 overflow-hidden ${isUnavailable ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer"
                      } ${quantity > 0
                        ? "shadow-sm"
                        : isDarkMode
                          ? "border-slate-700/60 bg-[#1e293b] hover:border-slate-600"
                          : "border-[#ede8e3] bg-[#ffffff] hover:border-slate-300"
                      }`}
                    style={quantity > 0 ? {
                      borderColor: colors.primary,
                      backgroundColor: isDarkMode ? "#1e293b" : "#ffffff"
                    } : {}}
                  >
                    {/* Left edge Veg/Non-Veg solid line indicator */}
                    <div
                      className="absolute left-0 top-0 bottom-0 z-10"
                      style={{
                        backgroundColor: getIndicatorColor(item.type),
                        width: "4px",
                        borderRadius: "8px 0 0 8px"
                      }}
                    />

                    <div className="relative z-20 flex flex-col justify-between h-full flex-1">
                      <div>
                        <div className="flex items-start gap-1.5 mb-1.5">
                          <h3 className={`text-sm font-extrabold leading-snug line-clamp-2 flex-1 min-w-0 break-words ${textPrimary}`}>
                            {item.name}
                          </h3>
                        </div>

                        {item.pricingType === "combo" && (
                          <span
                            className="self-start text-[9px] px-1.5 py-0.5 rounded-md font-semibold mb-1 inline-block"
                            style={{
                              backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}10`,
                              color: isDarkMode ? "#ffffff" : colors.primary
                            }}
                          >
                            Combo
                          </span>
                        )}

                        <div className="flex flex-wrap items-center gap-1">
                          {item.pricingType === "variant" && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                              style={{
                                backgroundColor: isDarkMode ? "rgba(71, 85, 105, 0.4)" : `${colors.primary}10`,
                                color: isDarkMode ? "#cbd5e1" : colors.primary
                              }}
                            >
                              Variant
                            </span>
                          )}
                        </div>
                      </div>

                      {isUnavailable && (
                        <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center z-30">
                          <span className="text-[10px] font-semibold text-white bg-black/50 px-2 py-1 rounded-full">
                            Unavailable
                          </span>
                        </div>
                      )}

                      <div className="mt-auto pt-1">
                        {item.pricingType === "variant" && Object.entries(item.variantRates || {}).some(([, v]) => v && v.price !== "" && v.price != null && Number(v.price) > 0) ? (
                          <button
                            onClick={() => setVariantPickerItem(item)}
                            disabled={!isRestaurantOpen || isBilled}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${isBilled ? "opacity-45 cursor-not-allowed" : "hover:opacity-90"}`}
                            style={!isBilled ? {
                              backgroundColor: isDarkMode ? "#334155" : "#ffffff",
                              borderColor: isDarkMode ? "#475569" : `${colors.primary}60`,
                              color: isDarkMode ? "#ffffff" : colors.primary
                            } : {}}
                          >
                            + Add
                          </button>
                        ) : quantity === 0 ? (
                          <button
                            onClick={() => handleAddItem(item)}
                            disabled={!isRestaurantOpen || isBilled}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${isBilled ? "opacity-45 cursor-not-allowed" : "hover:opacity-90"}`}
                            style={!isBilled ? {
                              backgroundColor: isDarkMode ? "#334155" : "#ffffff",
                              borderColor: isDarkMode ? "#475569" : `${colors.primary}60`,
                              color: isDarkMode ? "#ffffff" : colors.primary
                            } : {}}
                          >
                            + Add
                          </button>
                        ) : (
                          <div className="flex items-center justify-between gap-1">
                            <button
                              disabled={isBilled}
                              onClick={() => dispatch(removeFromCart(cartKey))}
                              className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all ${isBilled
                                ? isDarkMode
                                  ? "border-slate-700 bg-slate-800/40 text-slate-500 cursor-not-allowed opacity-55"
                                  : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-55"
                                : "hover:opacity-90"
                                }`}
                              style={!isBilled ? {
                                borderColor: isDarkMode ? "#475569" : `${colors.primary}40`,
                                backgroundColor: isDarkMode ? "#334155" : "#ffffff",
                                color: isDarkMode ? "#ffffff" : colors.primary
                              } : {}}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span 
                              className={`h-7 min-w-[1.75rem] px-1 rounded-md flex items-center justify-center border text-xs font-extrabold shadow-sm transition-all ${
                                isDarkMode 
                                  ? "bg-slate-800 border-slate-700 text-slate-100" 
                                  : "bg-white/95 backdrop-blur-sm border-[#ede8e3] text-[#1c1917]"
                              }`}
                              style={!isBilled ? {
                                borderColor: isDarkMode ? "#475569" : `${colors.primary}40`,
                              } : {}}
                            >
                              {quantity}
                            </span>
                            <button
                              disabled={!isRestaurantOpen || isBilled}
                              onClick={() => handleAddItem(item)}
                              className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all ${isBilled
                                ? isDarkMode
                                  ? "border-slate-700 bg-slate-800/40 text-slate-500 cursor-not-allowed opacity-55"
                                  : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-55"
                                : "hover:opacity-90"
                                }`}
                              style={!isBilled ? {
                                borderColor: isDarkMode ? "#475569" : `${colors.primary}40`,
                                backgroundColor: isDarkMode ? "#334155" : "#ffffff",
                                color: isDarkMode ? "#ffffff" : colors.primary
                              } : {}}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
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
              {Object.entries(variantPickerItem.variantRates || {}).filter(([, v]) => v && v.price !== "" && v.price != null && Number(v.price) > 0).map(([key, v]) => {
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
                    className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl text-base font-bold transition-all active:scale-[0.97]"
                    style={{
                      backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.6)" : "#ffffff",
                      borderColor: isDarkMode ? "#475569" : "#ede8e3",
                      color: isDarkMode ? "#cbd5e1" : "#1c1917"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}20` : `${colors.primary}0d`;
                      e.currentTarget.style.color = isDarkMode ? "#ffffff" : colors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isDarkMode ? "#475569" : "#ede8e3";
                      e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(30, 41, 59, 0.6)" : "#ffffff";
                      e.currentTarget.style.color = isDarkMode ? "#cbd5e1" : "#1c1917";
                    }}
                  >
                    <span>{label}</span>
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
          order={showPayModal}
          onClose={() => {
            setShowPayModal(null);
            if (onOrderSuccess) {
              onOrderSuccess("print_bill", showPayModal);
            }
          }}
        />
      )}
    </div>
  );
}
