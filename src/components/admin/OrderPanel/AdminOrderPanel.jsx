import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus, Plus, Trash2, ShoppingBag,
  AlertCircle, CheckCircle2, X
} from "lucide-react";
import {
  addToCart,
  removeFromCart,
  clearCart
} from "../../../redux/clientRedux/clientSlice";
import {
  useGetRestaurantQuery,
  useGetMenuQuery,
  useCreateOrderMutation
} from "../../../redux/clientRedux/clientAPI";
import fingerprintService from "../../../service/fingerprintService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Veg Dot ──────────────────────────────────────────────────────────────────

function VegDot({ type }) {
  const color =
    type === "veg"
      ? "border-green-600 bg-green-600"
      : type === "non-veg"
      ? "border-red-500 bg-red-500"
      : "border-orange-500 bg-orange-500";
  return (
    <div
      className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border-2 flex items-center justify-center ${color.split(" ")[0]}`}
    >
      <div className={`h-1.5 w-1.5 rounded-full ${color.split(" ")[1]}`} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminOrderPanel({ isDarkMode = false }) {
  const dispatch = useDispatch();

  const cartItems = useSelector((state) => state.client?.cart?.items || {});
  const cartCount = Object.values(cartItems).reduce(
    (acc, item) => acc + (item?.quantity || 0),
    0
  );

  const { data: restaurantData, isLoading: restaurantLoading } = useGetRestaurantQuery();
  const { data: menuData, isLoading: menuLoading } = useGetMenuQuery();
  const [createOrder, { isLoading: isSubmitting }] = useCreateOrderMutation();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedVariants, setSelectedVariants] = useState({});
  const [orderType, setOrderType] = useState("Dine In");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableId, setTableId] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Menu Data ───────────────────────────────────────────────────────────────
  const menuItems = menuData?.menu || [];
  const restaurantCategories = restaurantData?.restaurant?.categories || [];

  // FIX: Group menu items by category name — case-insensitive trim match
  const groupedMenu = menuItems.reduce((acc, item) => {
    const cat = String(item.category || "Other").trim().toLowerCase();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Categories list from restaurant settings (display order preserved)
  const categories = restaurantCategories.map((c) => String(c.name).trim());

  // Auto-select first category on load
  useEffect(() => {
    if (categories.length && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories.join(",")]);

  // Auto-select first variant for variant items
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

  // FIX: Get items for selected category — normalize both sides
  const selectedCategoryKey = String(selectedCategory || "").trim().toLowerCase();
  const currentItems = groupedMenu[selectedCategoryKey] || [];

  // ── Price Calc ──────────────────────────────────────────────────────────────
  const subtotal = Object.values(cartItems).reduce(
    (acc, item) => acc + (item?.price || 0) * (item?.quantity || 1),
    0
  );
  const restaurant = restaurantData?.restaurant || {};
  const gstRate = Number(restaurant.gstRate) || 0;
  const gstEnabled = restaurant.gstEnabled || false;
  const gstAmount = gstEnabled ? (subtotal * gstRate) / 100 : 0;
  const deliveryCharges =
    orderType === "Delivery" ? Number(restaurant.deliveryCharges) || 0 : 0;
  const total = subtotal + gstAmount + deliveryCharges;
  const isRestaurantOpen = restaurant.isOpen !== false;

  // ── Cart Helpers ────────────────────────────────────────────────────────────
  const getCartKeyAndQty = (item) => {
    const selectedVariant =
      item.pricingType === "variant" ? selectedVariants[item._id] : null;
    const cartKey = selectedVariant ? `${item._id}-${selectedVariant}` : item._id;
    const quantity = cartItems[cartKey]?.quantity || 0;
    return { cartKey, quantity, selectedVariant };
  };

  const handleAddItem = (item) => {
    const selectedVariant =
      item.pricingType === "variant" ? selectedVariants[item._id] : null;
    const cartKey = selectedVariant ? `${item._id}-${selectedVariant}` : item._id;

    let basePrice = Number(item.price) || 0;
    if (item.pricingType === "variant" && selectedVariant) {
      basePrice = Number(item.variantRates?.[selectedVariant]?.price) || 0;
    } else if (item.pricingType === "combo") {
      basePrice = Number(item.comboPrice) || 0;
    }

    const discountedPrice = calculateDiscountedPrice(item, selectedVariant);
    const hasDiscount = hasActiveDiscount(item, selectedVariant);

    dispatch(
      addToCart({
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
      })
    );
  };

  const handleRemoveAll = (id, qty) => {
    for (let i = 0; i < qty; i++) dispatch(removeFromCart(id));
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const NAME_PATTERN = /^[A-Za-z\s]+$/;
    const PHONE_PATTERN = /^\d{10}$/;
    const trimmedName = customerName.trim();

    if (!trimmedName || !NAME_PATTERN.test(trimmedName)) { showError("Enter a valid name (letters only)"); return; }
    if (!PHONE_PATTERN.test(customerPhone)) { showError("Enter a valid 10-digit phone number"); return; }
    if (orderType === "Dine In" && !tableId) { showError("Please select a table"); return; }
    if (orderType === "Delivery" && !address.trim()) { showError("Please enter delivery address"); return; }

    try {
      const orderItems = Object.values(cartItems).map((cartItem) => {
        const variantData =
          cartItem.variantKey && cartItem.variantRates?.[cartItem.variantKey]
            ? cartItem.variantRates[cartItem.variantKey]
            : null;
        const isCombo = cartItem.isCombo || cartItem.pricingType === "combo";
        const variantBasePrice = Number(variantData?.price) || 0;

        const price = Number(
          cartItem.originalPrice ??
          (isCombo ? cartItem.comboPrice : variantBasePrice || cartItem.price) ?? 0
        ) || 0;

        const discountedPrice = Number(
          cartItem.price ??
          (isCombo ? cartItem.comboPrice : variantBasePrice) ?? 0
        ) || 0;

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

      const fp = await fingerprintService.getFingerprint();
      const formattedName = capitalizeFirst(trimmedName.replace(/\s+/g, " "));
      const normalizedOrderType = orderType === "Dine In" ? "Eat Here" : orderType;

      const orderData = {
        fingerPrint: fp,
        customerName: formattedName,
        customerPhone,
        items: orderItems,
        orderType: normalizedOrderType,
      };
      if (orderType === "Dine In" && tableId) orderData.tableId = tableId;
      if (orderType === "Delivery" && address.trim()) orderData.address = address.trim();

      await createOrder(orderData).unwrap();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      dispatch(clearCart());
      setCustomerName("");
      setCustomerPhone("");
      setTableId("");
      setAddress("");
      setOrderType("Dine In");
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

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inputStyle = isDarkMode
    ? "border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition w-full"
    : "border border-orange-200 bg-white text-slate-800 placeholder-slate-400 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition w-full";

  const bg = isDarkMode ? "bg-[#202b3c]" : "bg-[#fffaf4]";
  const border = isDarkMode ? "border-slate-700" : "border-orange-100";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-slate-800";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const cardBg = isDarkMode
    ? "bg-slate-800 border-slate-700 hover:border-orange-500"
    : "bg-white border-orange-100 hover:border-orange-300 hover:shadow-md shadow-sm";
  const summaryBg = isDarkMode ? "bg-slate-900" : "bg-white";
  const headerBg = isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-orange-100";

  // ── Order Summary Panel ─────────────────────────────────────────────────────
  const OrderSummaryPanel = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Order Type Tabs */}
      <div className={`p-3 border-b shrink-0 ${border}`}>
        <div className={`flex rounded-xl overflow-hidden border ${isDarkMode ? "border-slate-700" : "border-orange-200"}`}>
          {["Dine In", "Delivery", "Take Away"].map((type) => (
            <button
              key={type}
              onClick={() => { setOrderType(type); setTableId(""); setAddress(""); }}
              className={`flex-1 py-2 text-xs font-semibold transition-all duration-200 ${
                orderType === type
                  ? "bg-orange-500 text-white shadow-sm"
                  : isDarkMode
                  ? "bg-transparent text-slate-300 hover:bg-orange-500/10"
                  : "text-slate-600 hover:bg-orange-50"
              }`}
            >
              {type === "Dine In" ? "Eat Here" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Cart Items — scrollable */}
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
                className={`flex items-center gap-2 rounded-xl p-2 border ${
                  isDarkMode ? "border-slate-700 bg-slate-800" : "border-orange-100 bg-orange-50/50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold line-clamp-1 ${textPrimary}`}>{item.name}</p>
                  {item.variantLabel && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${
                      isDarkMode ? "bg-orange-500/20 text-orange-300" : "bg-orange-100 text-orange-600"
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
                    className={`h-5 w-5 rounded-lg border flex items-center justify-center ${
                      isDarkMode ? "border-slate-600 bg-slate-700 text-orange-400" : "border-orange-200 bg-white text-orange-600"
                    }`}
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className={`w-4 text-center text-xs font-bold ${textPrimary}`}>{item.quantity}</span>
                  <button
                    onClick={() => dispatch(addToCart({ id, item, quantity: 1 }))}
                    className="client-add-button h-5 w-5 rounded-lg flex items-center justify-center text-white"
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
        isDarkMode ? "border-slate-700 bg-slate-800" : "border-orange-100 bg-orange-50/30"
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
        <div className={`flex justify-between pt-1.5 border-t ${isDarkMode ? "border-slate-600" : "border-orange-200"}`}>
          <span className={`font-bold text-sm ${textPrimary}`}>Total</span>
          <span className="font-bold text-base text-orange-500">₹{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Customer Form */}
      <div className="p-3 space-y-2 shrink-0">
        <input
          type="text"
          placeholder="Customer Name *"
          value={customerName}
          onChange={(e) => {
            const value = e.target.value
              .replace(/[^A-Za-z\s]/g, "")
              .replace(/\s{2,}/g, " ")
              .slice(0, 15);
            setCustomerName(value);
          }}
          onBlur={() => {
            setCustomerName((prev) =>
              capitalizeFirst(prev.trim().replace(/\s+/g, " "))
            );
          }}
          className={inputStyle}
        />
        <input
          type="tel"
          placeholder="Phone Number * (10 digits)"
          value={customerPhone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 10);
            setCustomerPhone(value);
          }}
          className={inputStyle}
        />
        {orderType === "Dine In" && (
          <select
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            className={inputStyle}
          >
            <option value="" disabled>Select Table *</option>
            {Array.from({ length: restaurant.tableNumbers || 0 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={`table-${num}`}>
                Table {num}
              </option>
            ))}
          </select>
        )}
        {orderType === "Delivery" && (
          <textarea
            rows={2}
            placeholder="Delivery Address *"
            value={address}
            onChange={(e) => setAddress(e.target.value.slice(0, 200))}
            className={`${inputStyle} resize-none`}
          />
        )}
      </div>

      {/* Banners */}
      <div className="px-3 space-y-2 shrink-0">
        {!isRestaurantOpen && (
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
            isDarkMode ? "bg-red-900/20 border-red-800 text-red-300" : "bg-red-50 border-red-200 text-red-700"
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
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                isDarkMode ? "bg-red-900/20 border-red-800 text-red-300" : "bg-red-50 border-red-200 text-red-700"
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
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                isDarkMode ? "bg-green-900/20 border-green-800 text-green-300" : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="text-xs font-medium">Order placed successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons — sticky bottom */}
      <div className={`flex gap-2 p-3 mt-auto border-t shrink-0 ${isDarkMode ? `${summaryBg} border-slate-700` : `${summaryBg} border-orange-100`}`}>
        <button
          onClick={handleClear}
          className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
            isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-800" : "border-orange-200 text-orange-600 hover:bg-orange-50"
          }`}
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={cartCount === 0 || isSubmitting || !isRestaurantOpen}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 client-add-button disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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

  // ── RENDER ──────────────────────────────────────────────────────────────────
  // Layout: fixed full height, nothing on the page scrolls except inner panels
  return (
    <div className={`flex flex-col h-screen overflow-hidden ${bg}`}>

      {/* ── STICKY TOP HEADER — Category name + item count ── */}
      <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 sticky top-0 z-20 ${headerBg}`}>
        <div>
         
          <h2 className={`text-base font-bold leading-tight ${textPrimary}`}>
            {selectedCategory || "Menu"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            isDarkMode ? "bg-slate-800 text-slate-300" : "bg-orange-100 text-orange-700"
          }`}>
            {currentItems.length} item{currentItems.length !== 1 ? "s" : ""}
          </span>
          {cartCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-orange-500 text-white">
              {cartCount} in cart
            </span>
          )}
        </div>
      </div>

      {/* ── MOBILE: Category strip (horizontal scroll) — sticky below header ── */}
      <div
        className={`flex flex-row overflow-x-auto gap-2 px-3 py-2.5 border-b shrink-0 md:hidden ${
          isDarkMode ? "border-slate-700 bg-slate-900" : "border-orange-100 bg-orange-50/60"
        }`}
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-150 ${
              selectedCategory === cat
                ? "bg-orange-500 text-white shadow-md scale-[1.02]"
                : isDarkMode
                ? "bg-transparent text-slate-300 border border-slate-600 hover:bg-orange-500/10"
                : "bg-white text-slate-600 border border-orange-200 hover:bg-orange-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── MAIN BODY: flex row — fills remaining height ── */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* ── COL 1: DESKTOP vertical category sidebar ── */}
        <div
          className={`hidden md:flex md:flex-col w-44 shrink-0 overflow-y-auto border-r p-2 gap-0.5 ${
            isDarkMode ? "border-slate-700 bg-slate-900/50" : "border-orange-100 bg-orange-50/30"
          }`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${
              selectedCategory === cat
                ? "bg-orange-500 text-white shadow-md scale-[1.02]"
                : isDarkMode
                ? "text-slate-300 hover:bg-orange-500/10"
                : "text-slate-600 hover:bg-orange-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── COL 2: ITEMS GRID — independently scrollable ── */}
        <div
          className={`flex-1 overflow-y-auto p-3 ${isDarkMode ? 'bg-[#202b3c]' : ''}`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {menuLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-36 rounded-2xl animate-pulse ${isDarkMode ? "bg-slate-700/50" : "bg-orange-100/50"}`}
                />
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
              <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-slate-800" : "bg-orange-50"
              }`}>
                <ShoppingBag className={`h-7 w-7 ${isDarkMode ? "text-slate-500" : "text-orange-300"}`} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${textPrimary}`}>No items here</p>
                <p className={`text-xs mt-1 ${textSecondary}`}>
                  "{selectedCategory}" has no menu items yet
                </p>
              </div>
            </div>
          ) : (
            <div className={`grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 ${isDarkMode ? 'bg-[#202b3c]' : ''}`}>
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
                    className={`relative h-full flex flex-col justify-between min-h-[120px] md:min-h-[130px] rounded-2xl border p-2 transition-all duration-200 ${
                      isUnavailable ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer"
                    } ${cardBg}`}
                  >
                    {/* Veg dot + Name */}
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <VegDot type={item.type} />
                      <h3 className={`text-xs font-semibold leading-tight line-clamp-2 flex-1 ${textPrimary}`}>
                        {item.name}
                      </h3>
                    </div>

                    {/* Combo badge */}
                    {item.pricingType === "combo" && (
                      <span className={`self-start text-[9px] px-1.5 py-0.5 rounded-full font-semibold mb-1 ${
                        isDarkMode ? "bg-orange-500/20 text-orange-300" : "bg-orange-100 text-orange-600"
                      }`}>
                        Combo
                      </span>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-1 mb-1.5">
                      {hasDiscount ? (
                        <>
                          <span className={`text-[10px] line-through ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                            ₹{basePrice.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-orange-500">
                            ₹{discountedPrice.toFixed(2)}
                          </span>
                          <span className={`text-[9px] px-1 py-0.5 rounded-full font-semibold ${
                            isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                          }`}>
                            OFF
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-orange-500">
                          ₹{basePrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Variant Select */}
                    {item.pricingType === "variant" && Object.keys(item.variantRates || {}).length > 0 && (
                        <select
                          value={selectedVariants[item._id] || ""}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedVariants((prev) => ({ ...prev, [item._id]: e.target.value }));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`w-full h-8 text-[10px] rounded-lg px-2 truncate outline-none mb-1.5 font-medium focus:ring-2 focus:ring-orange-500/20 ${
                            isDarkMode
                              ? "border border-slate-700 bg-slate-800 text-slate-200"
                              : "border border-orange-200 bg-orange-50 text-slate-700"
                          }`}
                        >
                        {Object.entries(item.variantRates || {})
                          .filter(([, v]) => v != null)
                          .map(([key, v]) => {
                            const vDiscount = v.discount;
                            const vBasePrice = Number(v.price) || 0;
                            let vFinalPrice = vBasePrice;
                            
                            if (vDiscount?.active && vDiscount?.value && Number(vDiscount.value) > 0) {
                              const dv = Number(vDiscount.value);
                              vFinalPrice = vDiscount.type?.toLowerCase() === "percentage" 
                                ? vBasePrice - (vBasePrice * dv) / 100 
                                : vBasePrice - dv;
                            }
                            
                            return (
                              <option key={key} value={key}>
                                {formatVariantLabel(key)} — ₹{vFinalPrice.toFixed(2)}
                                {vFinalPrice < vBasePrice && ` (₹${vBasePrice.toFixed(2)})`}
                              </option>
                            );
                          })}
                      </select>
                    )}

                    {/* Unavailable overlay */}
                    {isUnavailable && (
                      <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-white bg-black/50 px-2 py-1 rounded-full">
                          Unavailable
                        </span>
                      </div>
                    )}

                    {/* Add / Qty Controls */}
                    <div className="mt-auto">
                      {quantity === 0 ? (
                        <button
                          onClick={() => handleAddItem(item)}
                          disabled={!isRestaurantOpen}
                          className="client-add-button w-full py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                          + Add
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <button
                            onClick={() => dispatch(removeFromCart(cartKey))}
                            className={`h-6 w-6 rounded-lg border flex items-center justify-center ${
                              isDarkMode
                                ? "border-slate-600 bg-slate-700 text-orange-400"
                                : "border-orange-200 bg-orange-50 text-orange-600"
                            }`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className={`text-sm font-bold ${textPrimary}`}>{quantity}</span>
                          <button
                            onClick={() => handleAddItem(item)}
                            disabled={!isRestaurantOpen}
                            className="client-add-button h-6 w-6 rounded-lg flex items-center justify-center text-white disabled:opacity-50"
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

        {/* ── COL 3: DESKTOP Order Summary sidebar — independently scrollable ── */}
        <div
          className={`hidden md:flex md:flex-col w-80 shrink-0 border-l overflow-hidden ${
            isDarkMode ? `border-slate-700 ${summaryBg}` : `border-orange-100 ${summaryBg}`
          }`}
        >
          <OrderSummaryPanel />
        </div>
      </div>

      {/* ── MOBILE: Order Summary below items — independently scrollable ── */}
      <div
        className={`md:hidden border-t shrink-0 max-h-[55vh] overflow-hidden flex flex-col ${
          isDarkMode ? `border-slate-700 ${summaryBg}` : `border-orange-100 ${summaryBg}`
        }`}
      >
        <OrderSummaryPanel />
      </div>
    </div>
  );
}