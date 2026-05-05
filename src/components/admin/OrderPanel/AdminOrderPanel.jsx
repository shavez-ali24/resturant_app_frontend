import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus, Plus, Trash2, ShoppingBag,
  AlertCircle, CheckCircle2, X, ChevronDown
} from "lucide-react";
import {
  addToCart,
  removeFromCart,
  clearCart
} from "../../../redux/clientRedux/clientSlice";
import {
  useGetRestaurantQuery,
  useGetMenuQuery,
} from "../../../redux/clientRedux/clientAPI";
import {
  useCreateOrderByAdminMutation
} from "../../../redux/adminRedux/adminAPI";
import { useAdminTour } from "../../../hooks/useAdminTour";
import { TOUR_KEYS, getOrderPanelSteps } from "../../../utils/adminTour";

// ─── Validation ───────────────────────────────────────────────────────────────
const NAME_VALID_PATTERN = /^[A-Za-z\s]+$/;
const PHONE_VALID_PATTERN = /^\d{10}$/;

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
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 outline-none ${
          isDarkMode
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
            className={`absolute z-[200] w-full rounded-lg border shadow-lg overflow-hidden ${
              isDarkMode
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
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                style={{ height: ITEM_HEIGHT }}
                className={`w-full text-left px-3 text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
                  value === opt.value
                    ? isDarkMode ? "bg-orange-500/25 text-orange-300" : "bg-[#f7f3ef] text-orange-500"
                    : isDarkMode ? "text-slate-200 hover:bg-slate-700" : "text-[#1c1917] hover:bg-[#f7f3ef]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0 transition-colors"
                  style={{ backgroundColor: value === opt.value ? "#f97316" : isDarkMode ? "#475569" : "#e2e8f0" }}
                />
                {opt.label}
              </button>
            ))}
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
        className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all duration-200 outline-none ${
          isDarkMode
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
            className={`absolute z-50 w-full mt-1 rounded-lg border shadow-lg overflow-hidden ${
              isDarkMode ? "bg-[#1e293b] border-slate-600 shadow-black/50" : "bg-white border-[#ede8e3] shadow-md"
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
                  className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all duration-150 ${
                    value === key
                      ? isDarkMode ? "bg-orange-500/20 text-orange-300" : "bg-[#f7f3ef] text-orange-500"
                      : isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-[#1c1917] hover:bg-[#f7f3ef]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{d.label}</span>
                    <span className="shrink-0 font-bold">
                      ₹{d.finalPrice.toFixed(2)}
                      {d.hasDisc && (
                        <span className={`ml-1 line-through text-[9px] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
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
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Order Type Tabs */}
      <div className={`p-3 border-b shrink-0 ${border}`}>
        <div className={`flex rounded-lg overflow-hidden border ${isDarkMode ? "border-slate-700/60" : "border-[#ede8e3]"}`}>
          {["Dine In", "Delivery", "Take Away"].map((type) => (
            <button
              key={type}
              onClick={() => { setOrderType(type); setTableId(""); setAddress(""); }}
              style={orderType === type ? { backgroundColor: "#f97316", color: "#ffffff" } : {}}
              className={`flex-1 py-2 text-xs font-semibold transition-all duration-200 ${
                orderType === type
                  ? ""
                  : isDarkMode
                  ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  : "bg-white text-[#78716c] hover:bg-[#f7f3ef]"
              }`}
            >
              {type === "Dine In" ? "Eat Here" : type}
            </button>
          ))}
        </div>
      </div>

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
            return (
              <div
                key={id}
                className={`flex items-center gap-2 rounded-lg p-2 border ${
                  isDarkMode ? "border-slate-700/60 bg-slate-800/60" : "border-[#ede8e3] bg-[#f7f3ef]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold line-clamp-1 ${textPrimary}`}>{item.name}</p>
                  {item.variantLabel && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md mt-0.5 inline-block ${
                      isDarkMode ? "bg-orange-500/20 text-orange-300" : "bg-[#f7f3ef] text-orange-500"
                    }`}>
                      {item.variantLabel}
                    </span>
                  )}
                  <p className={`text-[10px] mt-0.5 ${textSecondary}`}>
                    ₹{(item.price || 0).toFixed(2)} × {item.quantity} ={" "}
                    <span className={`font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                      ₹{itemTotal.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => dispatch(removeFromCart(id))}
                    className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                      isDarkMode ? "border-slate-600 bg-slate-700 text-orange-400" : "border-[#ede8e3] bg-white text-orange-500"
                    }`}
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className={`w-4 text-center text-xs font-bold ${textPrimary}`}>{item.quantity}</span>
                  <button
                    onClick={() => dispatch(addToCart({ id, item, quantity: 1 }))}
                    className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                      isDarkMode ? "border-slate-600 bg-slate-700 text-orange-400" : "border-[#ede8e3] bg-orange-500 text-white"
                    }`}
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveAll(id, item.quantity)}
                    className={`h-5 w-5 rounded-lg flex items-center justify-center ml-0.5 ${
                      isDarkMode ? "text-red-400 hover:bg-red-900/20" : "text-red-400 hover:bg-red-50"
                    }`}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Price Breakdown */}
      <div className={`px-3 py-2 space-y-1.5 border-t border-b shrink-0 ${
        isDarkMode ? "border-slate-700/60 bg-slate-800/30" : "border-[#ede8e3] bg-[#f7f3ef]"
      }`}>
        <div className="flex justify-between">
          <span className={`text-xs ${textSecondary}`}>Subtotal</span>
          <span className={`text-xs font-medium ${textPrimary}`}>₹{subtotal.toFixed(2)}</span>
        </div>
        {gstEnabled && gstAmount > 0 && (
          <div className="flex justify-between">
            <span className={`text-xs ${textSecondary}`}>GST ({gstRate}%)</span>
            <span className={`text-xs font-medium ${textPrimary}`}>+ ₹{gstAmount.toFixed(2)}</span>
          </div>
        )}
        {orderType === "Delivery" && deliveryCharges > 0 && (
          <div className="flex justify-between">
            <span className={`text-xs ${textSecondary}`}>Delivery</span>
            <span className={`text-xs font-medium ${textPrimary}`}>+ ₹{deliveryCharges.toFixed(2)}</span>
          </div>
        )}
        <div className={`flex justify-between pt-1.5 border-t ${isDarkMode ? "border-slate-700/60" : "border-[#ede8e3]"}`}>
          <span className={`font-bold text-sm ${textPrimary}`}>Total</span>
          <span className="font-bold text-base text-orange-500">₹{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Customer Form */}
      <div className="p-3 space-y-2 shrink-0">
        <div>
          <input
            type="text"
            placeholder="Customer Name *"
            value={customerName}
            onChange={handleNameChange}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            maxLength={15}
            className={inputStyle}
          />
          <p className={`mt-1 text-[11px] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
            Letters only · {15 - customerName.length} chars left
          </p>
        </div>
        <div>
          <input
            type="tel"
            placeholder="Phone Number * (10 digits)"
            value={customerPhone}
            onChange={handlePhoneChange}
            autoComplete="off"
            inputMode="numeric"
            maxLength={10}
            className={inputStyle}
          />
          <p className={`mt-1 text-[11px] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
            {10 - customerPhone.length} digits remaining
          </p>
        </div>

        {orderType === "Dine In" && (() => {
          const sec = tableOptions.reduce((acc, opt) => {
            const [section] = opt.value.split(":");
            if (!acc[section]) acc[section] = [];
            acc[section].push(opt);
            return acc;
          }, {});
          const sectionKeys = Object.keys(sec);
          const sectionLabels = { indoor: "Indoor", outdoor: "Outdoor", rooftop: "Rooftop", rooms: "Rooms" };
          const [selSection, selNum] = tableId ? tableId.split(":") : ["", ""];

          return (
            <div className="space-y-2">
              {/* Section select */}
              <StyledSelect
                value={selSection || ""}
                onChange={(v) => setTableId(v ? `${v}:1` : "")}
                options={sectionKeys.map((k) => ({ value: k, label: sectionLabels[k] || k }))}
                placeholder="Select Section *"
                isDarkMode={isDarkMode}
              />
              {/* Number select — only when section chosen */}
              {selSection && sec[selSection] && (
                <StyledSelect
                  value={tableId}
                  onChange={setTableId}
                  options={sec[selSection]}
                  placeholder={`Select ${selSection === "rooms" ? "Room" : "Table"} *`}
                  isDarkMode={isDarkMode}
                />
              )}
            </div>
          );
        })()}

        {orderType === "Delivery" && (
          <textarea
            rows={2}
            placeholder="Delivery Address *"
            value={address}
            onChange={(e) => setAddress(e.target.value.slice(0, 200))}
            autoComplete="off"
            className={`${inputStyle} resize-none`}
          />
        )}
      </div>

      {/* Banners */}
      <div className="px-3 space-y-2 shrink-0">
        {!isRestaurantOpen && (
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
            isDarkMode ? "bg-red-900/20 border-red-800/60 text-red-300" : "bg-red-50 border-red-200 text-red-700"
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
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                isDarkMode ? "bg-red-900/20 border-red-800/60 text-red-300" : "bg-red-50 border-red-200 text-red-700"
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
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                isDarkMode ? "bg-green-900/20 border-green-800/60 text-green-300" : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="text-xs font-medium">Order placed successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className={`flex gap-2 p-3 mt-auto border-t shrink-0 ${
        isDarkMode ? `${summaryBg} border-slate-700/60` : `${summaryBg} border-[#ede8e3]`
      }`}>
        <button
          onClick={handleClear}
          className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all duration-200 ${
            isDarkMode
              ? "border-slate-600 text-slate-300 hover:bg-slate-700/60"
              : "border-[#ede8e3] text-[#78716c] hover:bg-[#f7f3ef]"
          }`}
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            cartCount === 0 ||
            isSubmitting ||
            !isRestaurantOpen ||
            !customerName.trim() ||
            !PHONE_VALID_PATTERN.test(customerPhone)
          }
          className="flex-1 py-2 rounded-lg bg-orange-500 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Placing...
            </span>
          ) : (
            "Place Order →"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminOrderPanel({ isDarkMode = false, onOrderSuccess, asModal = false }) {
  const dispatch = useDispatch();
  useAdminTour(TOUR_KEYS.orderPanel, getOrderPanelSteps, isDarkMode, 900);

  const cartItems = useSelector((state) => state.client?.cart?.items || {});
  const cartCount = Object.values(cartItems).reduce(
    (acc, item) => acc + (item?.quantity || 0),
    0
  );

  const { data: restaurantData } = useGetRestaurantQuery();
  const { data: menuData, isLoading: menuLoading } = useGetMenuQuery();
  const [createOrder, { isLoading: isSubmitting }] = useCreateOrderByAdminMutation();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedVariants, setSelectedVariants] = useState({});
  const [orderType, setOrderType] = useState("Dine In");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableId, setTableId] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Menu Data ────────────────────────────────────────────────────────────────
  const menuItems = menuData?.menu || [];
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

  useEffect(() => {
    if (!menuItems.length) return;
    setSelectedVariants((prev) => {
      const next = { ...prev };
      let changed = false;
      menuItems.forEach((item) => {
        if (item.pricingType === "variant" && !next[item._id]) {
          const first = Object.keys(item.variantRates || {})[0];
          if (first) { next[item._id] = first; changed = true; }
        }
      });
      return changed ? next : prev;
    });
  }, [menuItems.length]);

  const selectedCategoryKey = String(selectedCategory || "").trim().toLowerCase();
  const currentItems = groupedMenu[selectedCategoryKey] || [];

  // ── Price Calc ───────────────────────────────────────────────────────────────
  const subtotal = Object.values(cartItems).reduce(
    (acc, item) => acc + (item?.price || 0) * (item?.quantity || 1),
    0
  );
  const restaurant = restaurantData?.restaurant || {};
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

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const trimmedName = customerName.trim();
    const trimmedAddress = address.trim();
    const normalizedOrderType = orderType === "Dine In" ? "Eat Here" : orderType;
    let errorMessage = "";
    if (!trimmedName) errorMessage = "Please enter your name.";
    else if (!NAME_VALID_PATTERN.test(trimmedName)) errorMessage = "Name can only have letters and spaces.";
    else if (!PHONE_VALID_PATTERN.test(customerPhone)) errorMessage = "Please enter a valid 10-digit phone number.";
    else if (normalizedOrderType === "Eat Here" && !tableId) errorMessage = "Please select a table.";
    else if (normalizedOrderType === "Delivery" && !trimmedAddress) errorMessage = "Please enter delivery address.";
    if (errorMessage) { showError(errorMessage); return; }

    try {
      const orderItems = Object.values(cartItems).map((cartItem) => {
        const variantData = cartItem.variantKey && cartItem.variantRates?.[cartItem.variantKey]
          ? cartItem.variantRates[cartItem.variantKey] : null;
        const isCombo = cartItem.isCombo || cartItem.pricingType === "combo";
        const variantBasePrice = Number(variantData?.price) || 0;
        const price = Number(cartItem.originalPrice ?? (isCombo ? cartItem.comboPrice : variantBasePrice || cartItem.price) ?? 0) || 0;
        const discountedPrice = Number(cartItem.price ?? (isCombo ? cartItem.comboPrice : variantBasePrice) ?? 0) || 0;
        const orderItem = {
          menuItemId: cartItem._id,
          name: cartItem.name,
          quantity: cartItem.quantity || 1,
          customizations: cartItem.customizations || "",
          price,
          discountedPrice,
          discountApplied: variantData?.discount || cartItem.discount || null,
        };
        if (cartItem.variantKey) orderItem.variant = cartItem.variantKey;
        if (cartItem.isCombo && cartItem.comboItems) orderItem.comboItems = cartItem.comboItems;
        return orderItem;
      });
      // Admin/Staff order — uses protected endpoint, no fingerprint needed
      const formattedName = capitalizeFirst(trimmedName.replace(/\s+/g, " "));
      const orderData = {
        customerName: formattedName,
        customerPhone,
        items: orderItems,
        orderType: normalizedOrderType,
      };
      if (normalizedOrderType === "Eat Here" && tableId) {
        const [section, numStr] = tableId.split(":");
        const number = parseInt(numStr, 10) || 1;
        const type = section === "rooms" ? "ROOM" : "TABLE";
        orderData.source = { section, number, type };
      }
      if (normalizedOrderType === "Delivery" && trimmedAddress) orderData.address = trimmedAddress;
      await createOrder(orderData).unwrap();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      dispatch(clearCart());
      setCustomerName("");
      setCustomerPhone("");
      setTableId("");
      setAddress("");
      setOrderType("Dine In");
      if (onOrderSuccess) {
        onOrderSuccess();
      }
    } catch (err) {
      showError(err?.data?.message || "Failed to place order");
    }
  };

  const handleClear = () => {
    dispatch(clearCart());
    setCustomerName("");
    setCustomerPhone("");
    setTableId("");
    setAddress("");
    setOrderType("Dine In");
    setError("");
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const inputStyle = isDarkMode
    ? "border border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-1.5 md:py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition w-full"
    : "border border-[#ede8e3] bg-white text-[#1c1917] placeholder-[#a8a29e] rounded-lg px-3 py-1.5 md:py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition w-full";

  const bg        = isDarkMode ? "bg-[#0f172a]"  : "bg-[#f7f3ef]";
  const border    = isDarkMode ? "border-slate-700/60" : "border-[#ede8e3]";
  const textPrimary   = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-[#78716c]";
  const cardBg    = isDarkMode
    ? "bg-[#1e293b] border-slate-700/60 hover:border-orange-500/40"
    : "bg-white border-[#ede8e3] hover:border-orange-300 hover:shadow-sm shadow-none";
  const summaryBg = isDarkMode ? "bg-[#1e293b]" : "bg-white";
  const headerBg  = isDarkMode ? "bg-[#0f172a] border-slate-700/60" : "bg-white border-[#ede8e3]";

  const tableOptions = (() => {
    const sec = restaurant.sections || {};
    const opts = [];
    const indoorCount  = sec.indoor?.tables  || restaurant.tableNumbers || 0;
    const outdoorCount = sec.outdoor?.tables || 0;
    const rooftopCount = sec.rooftop?.tables || 0;
    const roomsCount   = sec.rooms?.rooms    || 0;
    for (let i = 1; i <= indoorCount;  i++) opts.push({ value: `indoor:${i}`,  label: `Indoor Table ${i}` });
    for (let i = 1; i <= outdoorCount; i++) opts.push({ value: `outdoor:${i}`, label: `Outdoor Table ${i}` });
    for (let i = 1; i <= rooftopCount; i++) opts.push({ value: `rooftop:${i}`, label: `Rooftop Table ${i}` });
    for (let i = 1; i <= roomsCount;   i++) opts.push({ value: `rooms:${i}`,   label: `Room ${i}` });
    return opts;
  })();

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
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
              isDarkMode ? "bg-slate-700 text-slate-300" : "bg-[#f7f3ef] text-[#78716c]"
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
        className={`flex flex-row overflow-x-auto gap-2 px-3 py-2.5 border-b shrink-0 md:hidden ${
          isDarkMode ? "border-slate-700/60 bg-[#0f172a]" : "border-[#ede8e3] bg-white"
        }`}
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={selectedCategory === cat ? { backgroundColor: "#f97316", color: "#ffffff" } : {}}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-150 ${
              selectedCategory === cat
                ? ""
                : isDarkMode
                ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                : "bg-white text-[#78716c] border border-[#ede8e3] hover:bg-[#f7f3ef]"
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
          className={`hidden md:flex md:flex-col w-44 shrink-0 overflow-y-auto border-r p-2 gap-0.5 ${
            isDarkMode ? "border-slate-700/60 bg-[#0f172a]" : "border-[#ede8e3] bg-white"
          }`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={selectedCategory === cat ? { backgroundColor: "#f97316", color: "#ffffff" } : {}}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                selectedCategory === cat
                  ? ""
                  : isDarkMode
                  ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  : "text-[#78716c] hover:bg-[#f7f3ef] hover:text-[#1c1917]"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
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
                    className={`relative flex flex-col justify-between min-h-[130px] rounded-2xl border p-2.5 transition-all duration-200 ${
                      isUnavailable ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer"
                    } ${cardBg}`}
                  >
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <VegDot type={item.type} />
                      <h3 className={`text-xs font-semibold leading-tight line-clamp-2 flex-1 min-w-0 break-words ${textPrimary}`}>
                        {item.name}
                      </h3>
                    </div>

                    {item.pricingType === "combo" && (
                      <span className={`self-start text-[9px] px-1.5 py-0.5 rounded-md font-semibold mb-1 ${
                        isDarkMode ? "bg-orange-500/20 text-orange-300" : "bg-[#f7f3ef] text-orange-500"
                      }`}>
                        Combo
                      </span>
                    )}

                    <div className="flex flex-wrap items-center gap-1 mb-1.5">
                      {hasDiscount ? (
                        <>
                          <span className={`text-[10px] line-through ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                            ₹{basePrice.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-orange-500">₹{discountedPrice.toFixed(2)}</span>
                          <span className={`text-[9px] px-1 py-0.5 rounded-full font-semibold ${
                            isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                          }`}>
                            OFF
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-orange-500">₹{basePrice.toFixed(2)}</span>
                      )}
                    </div>

                    {item.pricingType === "variant" && Object.keys(item.variantRates || {}).length > 0 && (
                      <VariantSelect
                        item={item}
                        value={selectedVariants[item._id] || ""}
                        onChange={(val) => setSelectedVariants((prev) => ({ ...prev, [item._id]: val }))}
                        isDarkMode={isDarkMode}
                      />
                    )}

                    {isUnavailable && (
                      <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-white bg-black/50 px-2 py-1 rounded-full">
                          Unavailable
                        </span>
                      </div>
                    )}

                    <div className="mt-auto">
                      {quantity === 0 ? (
                        <button
                          onClick={() => handleAddItem(item)}
                          disabled={!isRestaurantOpen}
                          className="w-full py-2 rounded-lg bg-orange-500 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          + Add
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <button
                            onClick={() => dispatch(removeFromCart(cartKey))}
                            className={`h-7 w-7 rounded-lg border flex items-center justify-center ${
                              isDarkMode ? "border-slate-600 bg-slate-700 text-orange-400" : "border-[#ede8e3] bg-white text-orange-500"
                            }`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className={`text-sm font-bold ${textPrimary}`}>{quantity}</span>
                          <button
                            onClick={() => handleAddItem(item)}
                            disabled={!isRestaurantOpen}
                            className="h-7 w-7 rounded-lg bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 disabled:opacity-40 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
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
          className={`hidden md:flex md:flex-col w-80 shrink-0 border-l overflow-hidden ${
            isDarkMode ? `border-slate-700/60 ${summaryBg}` : `border-[#ede8e3] ${summaryBg}`
          }`}
        >
          <OrderSummaryPanel {...summaryProps} />
        </div>
      </div>

      {/* MOBILE: Order Summary */}
      <div
        className={`md:hidden border-t shrink-0 max-h-[55vh] overflow-hidden flex flex-col ${
          isDarkMode ? `border-slate-700/60 ${summaryBg}` : `border-[#ede8e3] ${summaryBg}`
        }`}
      >
        <OrderSummaryPanel {...summaryProps} />
      </div>
    </div>
  );
}