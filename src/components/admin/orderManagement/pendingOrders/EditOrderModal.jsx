import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  getOrderTypeBadgeClass,
  getOrderTypeItemClass as getOrderTypeSelectItemClass,
  getOrderTypeKey,
  getOrderTypeLabel,
  recalcTotal,
} from "../commonOrderFile/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Truck, Utensils, AlertCircle, Plus, Minus, X } from "lucide-react";

// ==============================================================================
// PRICING & UTILITY FUNCTIONS
// ==============================================================================
const pickPrice = (...candidates) => {
  for (const value of candidates) {
    if (value === undefined || value === null || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return { has: true, value: parsed };
    }
  }
  return { has: false, value: 0 };
};

const getActiveDiscount = (discount) => {
  if (!discount || typeof discount !== "object") return null;
  const type = discount.type;
  const value = Number(discount.value);
  const isActive = discount.active !== false;

  if (!isActive || !Number.isFinite(value) || value <= 0) return null;
  if (type !== "percentage" && type !== "flat") return null;

  return { type, value };
};

const applyDiscount = (price, discount) => {
  const base = Number(price) || 0;
  if (!discount) return base;

  if (discount.type === "percentage") {
    return Math.max(base - (base * discount.value) / 100, 0);
  }
  if (discount.type === "flat") {
    return Math.max(base - discount.value, 0);
  }
  return base;
};

const getVariantDataByName = (variantRates, variantName) => {
  if (!variantRates || !variantName) return null;
  if (variantRates[variantName]) return variantRates[variantName];

  const target = String(variantName).toLowerCase();
  const matched = Object.entries(variantRates).find(
    ([key]) => String(key).toLowerCase() === target
  );
  return matched ? matched[1] : null;
};

const getVariantPriceMeta = (variantData) => {
  if (variantData && typeof variantData === "object" && !Array.isArray(variantData)) {
    const originalPriceMeta = pickPrice(
      variantData.originalPrice,
      variantData.price
    );
    const explicitFinalMeta = pickPrice(
      variantData.discountedPrice,
      variantData.finalPrice
    );

    const originalPrice = originalPriceMeta.has ? originalPriceMeta.value : 0;
    const finalPrice = explicitFinalMeta.has
      ? explicitFinalMeta.value
      : applyDiscount(originalPrice, getActiveDiscount(variantData.discount));

    return { originalPrice, finalPrice };
  }

  const valueMeta = pickPrice(variantData);
  return { originalPrice: valueMeta.value, finalPrice: valueMeta.value };
};

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;

const formatVariantLabel = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getVariantDropdownPriceMeta = (variantKey, variantData) => {
  const variantMeta = getVariantPriceMeta(variantData);
  const originalPrice = Number(variantMeta.originalPrice || 0);
  const finalPrice = Number(variantMeta.finalPrice || 0);

  return {
    label: formatVariantLabel(variantKey),
    originalPrice,
    finalPrice,
    showOldPrice: originalPrice > finalPrice,
  };
};

const getMenuDropdownPriceMeta = (menuItem = {}) => {
  if (!menuItem || typeof menuItem !== "object") {
    return { isVariant: false, originalPrice: 0, finalPrice: 0 };
  }

  if (menuItem.pricingType === "variant") {
    return { isVariant: true, originalPrice: 0, finalPrice: 0 };
  }

  if (menuItem.pricingType === "combo") {
    const comboBase = pickPrice(menuItem.comboPrice, menuItem.price).value;
    const comboFinal = applyDiscount(comboBase, getActiveDiscount(menuItem.discount));
    return { isVariant: false, originalPrice: comboBase, finalPrice: comboFinal };
  }

  const itemPriceMeta = getItemPriceMeta(menuItem, menuItem);
  return {
    isVariant: false,
    originalPrice: Number(itemPriceMeta.originalPrice || 0),
    finalPrice: Number(itemPriceMeta.finalPrice || 0),
  };
};

const getItemPriceMeta = (item = {}, menuItem = null, variantName = null) => {
  const originalPriceMeta = pickPrice(
    item.originalPrice,
    item.menuItem?.originalPrice,
    menuItem?.originalPrice,
    item.price,
    item.menuItem?.price,
    menuItem?.price
  );
  const explicitFinalMeta = pickPrice(
    item.discountedPrice,
    item.finalPrice,
    item.menuItem?.discountedPrice,
    item.menuItem?.finalPrice
  );

  if (explicitFinalMeta.has) {
    return {
      originalPrice: originalPriceMeta.has ? originalPriceMeta.value : explicitFinalMeta.value,
      finalPrice: explicitFinalMeta.value,
    };
  }

  if (menuItem?.pricingType === "variant" && variantName && menuItem?.variantRates) {
    const variantData = getVariantDataByName(menuItem.variantRates, variantName);
    if (variantData) {
      return getVariantPriceMeta(variantData);
    }
  }

  if (menuItem?.pricingType === "single") {
    const menuOriginalMeta = pickPrice(menuItem.originalPrice, menuItem.price);
    const menuExplicitFinalMeta = pickPrice(menuItem.discountedPrice, menuItem.finalPrice);
    const menuOriginal = menuOriginalMeta.has ? menuOriginalMeta.value : 0;
    const menuFinal = menuExplicitFinalMeta.has
      ? menuExplicitFinalMeta.value
      : applyDiscount(menuOriginal, getActiveDiscount(menuItem.discount));
    return {
      originalPrice: menuOriginal,
      finalPrice: menuFinal,
    };
  }

  if (menuItem?.pricingType === "combo") {
    const comboOriginalMeta = pickPrice(menuItem.originalPrice, menuItem.comboPrice, menuItem.price);
    const comboExplicitFinalMeta = pickPrice(menuItem.discountedPrice, menuItem.finalPrice);
    const comboOriginal = comboOriginalMeta.has ? comboOriginalMeta.value : 0;
    const comboFinal = comboExplicitFinalMeta.has
      ? comboExplicitFinalMeta.value
      : applyDiscount(comboOriginal, getActiveDiscount(menuItem.discount));
    return {
      originalPrice: comboOriginal,
      finalPrice: comboFinal,
    };
  }

  const fallback = originalPriceMeta.has ? originalPriceMeta.value : 0;
  return { originalPrice: fallback, finalPrice: fallback };
};

// ==============================================================================
// MODULAR SUB-COMPONENTS
// ==============================================================================

// ─── ORDER TYPE SELECTOR ──────────────────────────────────────────────────────
const OrderTypeSelector = React.memo(({ value, onChange, isDarkMode, dropdownCls, labelCls }) => {
  const getOrderTypeIcon = (type) => {
    switch (getOrderTypeKey(type)) {
      case "eat_here": return <Utensils size={14} />;
      case "take_away": return <Home size={14} />;
      case "delivery": return <Truck size={14} />;
      default: return <Utensils size={14} />;
    }
  };

  return (
    <div>
      <label className={labelCls}>Order Type</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className={`h-10 w-full rounded-lg border px-3 text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-orange-200 ${getOrderTypeBadgeClass(value)}`}
          style={value === "Room Stay" ? {
            backgroundColor: isDarkMode ? 'rgba(71, 85, 105, 0.35)' : '#f5f5f4',
            color: isDarkMode ? '#e2e8f0' : '#57524e',
            borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.25)' : '#e7e5e4'
          } : {}}
        >
          <div className="flex items-center gap-2">
            {getOrderTypeIcon(value)}
            <span>{getOrderTypeLabel(value)}</span>
          </div>
        </SelectTrigger>
        <SelectContent side="top" sideOffset={6} className={`${dropdownCls} w-[var(--radix-select-trigger-width)] max-h-[45dvh]`}>
          <SelectGroup>
            {[["Eat Here", <Utensils size={14} />], ["Take Away", <Home size={14} />], ["Delivery", <Truck size={14} />]].map(([val, icon]) => (
              <SelectItem key={val} value={val} className={`cursor-pointer rounded-md py-2 text-sm font-medium ${getOrderTypeSelectItemClass(val)}`}>
                <div className="flex items-center gap-2">{icon}{val}</div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
});
OrderTypeSelector.displayName = "OrderTypeSelector";

// ─── TABLE / ROOM SELECTOR ───────────────────────────────────────────────────
const TableSelector = React.memo(({
  editingOrder,
  selectedTableId,
  handleTableChange,
  validationErrors,
  isDarkMode,
  labelCls,
  dropdownCls,
  restaurantData
}) => {
  const restaurant = restaurantData?.restaurant || restaurantData || {};
  const sections = Array.isArray(restaurant.sections) ? restaurant.sections : [];

  // Resolve section counts dynamically based on sections array
  const indoorSection = sections.find(s => s.name?.toLowerCase() === "indoor");
  const outdoorSection = sections.find(s => s.name?.toLowerCase() === "outdoor");
  const rooftopSection = sections.find(s => s.name?.toLowerCase() === "rooftop");
  const roomsSection = sections.find(s => s.name?.toLowerCase() === "rooms");

  const indoorCount = indoorSection?.units?.length || restaurant.tableNumbers || 0;
  const outdoorCount = outdoorSection?.units?.length || 0;
  const rooftopCount = rooftopSection?.units?.length || 0;
  const roomsCount = roomsSection?.units?.length || 0;

  const isRoomOrder = editingOrder?.source?.type === "ROOM";

  const sectionDefs = [
    { key: "indoor",  label: "Indoor",  count: indoorCount,  unit: "Table" },
    { key: "outdoor", label: "Outdoor", count: outdoorCount, unit: "Table" },
    { key: "rooftop", label: "Rooftop", count: rooftopCount, unit: "Table" },
    { key: "rooms",   label: "Rooms",   count: roomsCount,   unit: "Room"  },
  ].filter(s => {
    if (s.count <= 0) return false;
    return isRoomOrder ? s.key === "rooms" : s.key !== "rooms";
  });

  const [selSection, selNum] = selectedTableId ? selectedTableId.split(":") : ["", ""];
  const onlyOne = sectionDefs.length === 1;

  if (sectionDefs.length === 0) {
    return (
      <div>
        <label className={labelCls}>Select Table *</label>
        <p className={`rounded-lg border border-dashed p-3 text-sm text-center ${isDarkMode ? "border-slate-600 text-slate-400" : "border-[#ede8e3] text-[#78716c]"}`}>
          No units configured yet.
        </p>
      </div>
    );
  }

  return (
    <div data-error={!!validationErrors.table}>
      <label className={labelCls}>{onlyOne ? "Select Table *" : "Select Section & Table *"}</label>
      {onlyOne ? (
        <Select
          value={selectedTableId || `${sectionDefs[0].key}:1`}
          onValueChange={(v) => handleTableChange(`${sectionDefs[0].key}:${v}`)}
        >
          <SelectTrigger className={`h-9 w-full rounded-lg border text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-orange-200 ${isDarkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#ede8e3] bg-white text-[#1c1917]"}`}>
            <SelectValue placeholder={`Select ${sectionDefs[0].unit}`}>
              {selNum ? `${sectionDefs[0].unit} ${selNum}` : `Select ${sectionDefs[0].unit}`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className={`max-h-[180px] overflow-y-auto rounded-xl border p-1 shadow-xl ${dropdownCls}`}>
            <SelectGroup>
              {Array.from({ length: sectionDefs[0].count }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}
                  className={`cursor-pointer rounded-md py-2 text-sm ${isDarkMode ? "text-slate-200 data-[highlighted]:bg-slate-700" : "text-[#1c1917] data-[highlighted]:bg-[#f7f3ef]"}`}>
                  {sectionDefs[0].unit} {i + 1}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {sectionDefs.map(({ key, label, count, unit }) => {
            const isSelected = selSection === key;
            return (
              <div key={key} className={`flex flex-col gap-1.5 ${isSelected ? "col-span-full" : ""}`}>
                <button
                  type="button"
                  onClick={() => handleTableChange(isSelected ? "" : `${key}:1`)}
                  className={`flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all ${isSelected
                    ? "border-orange-500 bg-orange-500 text-white"
                    : isDarkMode
                      ? "border-slate-600 bg-slate-800 text-slate-200 hover:border-orange-400"
                      : "border-[#ede8e3] bg-white text-[#1c1917] hover:border-orange-400 hover:bg-orange-50"
                  }`}
                >
                  <span className="flex-1 text-left">{label}</span>
                  <span className={`text-xs font-normal ${isSelected ? "text-white/80" : isDarkMode ? "text-slate-400" : "text-[#a8a29e]"}`}>
                    {count} {unit}{count > 1 ? "s" : ""}
                  </span>
                </button>
                {isSelected && (
                  <Select value={selNum || "1"} onValueChange={(v) => handleTableChange(`${key}:${v}`)}>
                    <SelectTrigger className={`h-9 w-full rounded-lg border text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-orange-200 ${isDarkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#ede8e3] bg-white text-[#1c1917]"}`}>
                      <SelectValue placeholder={`Select ${unit}`} />
                    </SelectTrigger>
                    <SelectContent className={`max-h-[180px] overflow-y-auto rounded-xl border p-1 shadow-xl ${dropdownCls}`}>
                      <SelectGroup>
                        {Array.from({ length: count }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}
                            className={`cursor-pointer rounded-md py-2 text-sm ${isDarkMode ? "text-slate-200 data-[highlighted]:bg-slate-700" : "text-[#1c1917] data-[highlighted]:bg-[#f7f3ef]"}`}>
                            {unit} {i + 1}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })}
        </div>
      )}
      {validationErrors.table && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle size={11} />{validationErrors.table}</p>
      )}
    </div>
  );
});
TableSelector.displayName = "TableSelector";

// ─── DELIVERY ADDRESS SELECTOR ────────────────────────────────────────────────
const DeliveryAddress = React.memo(({ address, handleAddressChange, validationErrors, isDarkMode, labelCls, inputCls }) => {
  return (
    <div data-error={!!validationErrors.address}>
      <label className={labelCls}>Delivery Address *</label>
      <textarea
        value={address}
        onChange={handleAddressChange}
        placeholder="Enter delivery address"
        rows={3}
        className={`${inputCls} resize-none ${validationErrors.address ? "border-red-400 bg-red-50" : ""}`}
      />
      {validationErrors.address && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle size={11} />{validationErrors.address}</p>
      )}
    </div>
  );
});
DeliveryAddress.displayName = "DeliveryAddress";

// ─── ORDER ITEM ROW ───────────────────────────────────────────────────────────
const OrderItemRow = React.memo(({
  item,
  index,
  isDarkMode,
  colors,
  textPri,
  textMut,
  itemCardBg,
  variantPillCls,
  dropdownCls,
  handleVariantChange,
  handleQuantityChange,
  handleRemoveItem,
  itemsLength
}) => {
  const unitPrice = Number(item.price || 0);
  const quantity = Number(item.quantity ?? 1);
  const originalUnitPrice = Number(item.originalUnitPrice || unitPrice);
  const showOldPrice = originalUnitPrice > unitPrice;
  const rowTotal = unitPrice * quantity;
  const oldRowTotal = originalUnitPrice * quantity;

  return (
    <div className={`rounded-xl border p-3 ${itemCardBg}`}>
      {/* Name + badges + price */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-sm font-semibold ${textPri}`}>{item.name}</span>
          {item.isReady && !item._isNew && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
              ✓ Ready
            </span>
          )}
          {item._isNew && (
            <span className="inline-flex items-center rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">
              New
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          {showOldPrice && (
            <p className={`text-[11px] line-through ${textMut}`}>₹{oldRowTotal.toFixed(2)}</p>
          )}
          <p className="text-sm font-bold text-orange-500">₹{rowTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Variant Dropdown / Pill */}
      {item.pricingType === "variant" && (
        item._isNew && item.variants && Object.keys(item.variants).length > 0 ? (
          <Select value={item.variantName || ""} onValueChange={(v) => handleVariantChange(index, v)}>
            <SelectTrigger className={`h-8 w-full max-w-[220px] rounded-lg border px-2.5 text-xs outline-none focus:ring-1 focus:ring-orange-200 ${isDarkMode ? "border-slate-600 bg-slate-700 text-slate-200" : "border-[#ede8e3] bg-[#f7f3ef] text-[#1c1917]"}`}>
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent className={`${dropdownCls} max-w-[220px]`}>
              <SelectGroup>
                {Object.entries(item.variants).map(([key, variantData]) => {
                  if (!variantData) return null;
                  const meta = getVariantDropdownPriceMeta(key, variantData);
                  return (
                    <SelectItem key={key} value={key}
                      className={`cursor-pointer rounded-md text-xs ${isDarkMode ? "text-slate-200 data-[highlighted]:bg-slate-700" : "text-[#1c1917] data-[highlighted]:bg-[#f7f3ef]"}`}>
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span>{meta.label}</span>
                        <span className="flex items-center gap-1 text-orange-500">
                          {meta.showOldPrice && (
                            <span className={`text-[10px] line-through ${textMut}`}>{formatCurrency(meta.originalPrice)}</span>
                          )}
                          <span className="font-semibold">{formatCurrency(meta.finalPrice)}</span>
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : (
          <span className={variantPillCls}>
            {formatVariantLabel(item.variantName || item.variant)}
          </span>
        )
      )}

      {/* Qty Controls + Remove */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleQuantityChange(index, Math.max(1, quantity - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-150 active:scale-[0.9]"
            style={{
              backgroundColor: isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff",
              borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
              color: isDarkMode ? colors.primary : colors.primaryText,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}1a` : colors.primaryLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDarkMode ? `${colors.primary}50` : `${colors.primary}33`;
              e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff";
            }}
          >
            <Minus size={12} />
          </button>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onWheel={(e) => e.currentTarget.blur()}
            onChange={(e) => handleQuantityChange(index, e.target.value)}
            className={`w-12 rounded-lg border px-1 py-1 text-center text-sm outline-none focus:ring-1 focus:ring-orange-200 ${isDarkMode ? "border-slate-600 bg-slate-700 text-slate-100" : "border-[#ede8e3] bg-white text-[#1c1917]"}`}
          />
          <button
            type="button"
            onClick={() => handleQuantityChange(index, quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-150 active:scale-[0.9]"
            style={{
              backgroundColor: isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff",
              borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
              color: isDarkMode ? colors.primary : colors.primaryText,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}1a` : colors.primaryLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDarkMode ? `${colors.primary}50` : `${colors.primary}33`;
              e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff";
            }}
          >
            <Plus size={12} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => handleRemoveItem(index)}
          disabled={itemsLength <= 1}
          className="rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-150"
          style={{
            backgroundColor: itemsLength <= 1 ? "transparent" : "rgba(239, 68, 68, 0.08)",
            color: itemsLength <= 1 ? textMut : "#ef4444",
            cursor: itemsLength <= 1 ? "not-allowed" : "pointer"
          }}
          onMouseEnter={(e) => {
            if (itemsLength > 1) {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
            }
          }}
          onMouseLeave={(e) => {
            if (itemsLength > 1) {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
            }
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
});
OrderItemRow.displayName = "OrderItemRow";

// ==============================================================================
// MAIN EXPORTED COMPONENT
// ==============================================================================
const EditOrderModal = ({
  editingOrder,
  setEditingOrder,
  updateOrder,
  getFriendlyErrorMessage,
  menuItems,
  tables,
  restaurantData,
}) => {
  const itemsContainerRef = useRef(null);
  const addItemGuardRef = useRef({ menuItemId: "", ts: 0 });
  const [localOrderData, setLocalOrderData] = useState(null);
  const [initialOrderData, setInitialOrderData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [hasUserChanges, setHasUserChanges] = useState(false);
  const [addItemValue, setAddItemValue] = useState("");
  const [removedItemIds, setRemovedItemIds] = useState([]);
  const [address, setAddress] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [initialAddress, setInitialAddress] = useState("");
  const [initialTableId, setInitialTableId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    table: "",
    address: "",
    items: ""
  });

  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

  // O(1) Lookup Maps
  const menuItemsMap = useMemo(() => {
    return new Map((menuItems || []).map(m => [String(m._id), m]));
  }, [menuItems]);

  const unitMap = useMemo(() => {
    const map = new Map();
    const restaurant = restaurantData?.restaurant || restaurantData;
    restaurant?.sections?.forEach(section => {
      section.units?.forEach(unit => {
        map.set(`${section.name}:${unit.name}`, unit._id);
      });
    });
    return map;
  }, [restaurantData]);

  // =============================
  // INIT ORDER DATA
  // =============================
  useEffect(() => {
    if (editingOrder) {
      const normalizedItems = editingOrder.items.map((item, index) => {
        const targetItemId = item.menuItemId || item.menuItem?._id || item._id;
        const menuItem = menuItemsMap.get(String(targetItemId));
        const selectedVariant = item.variantName || item.variant || null;
        const resolvedPricingType =
          item.pricingType ||
          item.menuItem?.pricingType ||
          menuItem?.pricingType ||
          (selectedVariant ? "variant" : "single");
        const resolvedVariants =
          resolvedPricingType === "variant"
            ? (item.variants || item.menuItem?.variantRates || menuItem?.variantRates || null)
            : null;
        const priceMeta = getItemPriceMeta(item, menuItem, selectedVariant);

        return {
          ...item,
          _id: item._id || null,
          clientId: item._id || `initial-${targetItemId}-${index}`,
          menuItemId: targetItemId,
          name: item.name || item.menuItem?.name || menuItem?.name || "",
          price: priceMeta.finalPrice,
          originalUnitPrice: priceMeta.originalPrice,
          discountedUnitPrice: priceMeta.finalPrice,
          quantity: item.quantity ?? 1,
          _originalQuantity: item.quantity ?? 1,
          pricingType: resolvedPricingType,
          variantName: selectedVariant,
          variant: selectedVariant,
          variants: resolvedVariants,
          customizations: item.customizations || "",
          isReady: item.isReady === true,
          _isNew: false,
        };
      });

      const newLocalOrderData = {
        ...editingOrder,
        items: normalizedItems
      };

      setLocalOrderData(newLocalOrderData);
      setInitialOrderData(JSON.parse(JSON.stringify(newLocalOrderData)));
      setRemovedItemIds([]);

      if (editingOrder.address) {
        setAddress(editingOrder.address);
        setInitialAddress(editingOrder.address);
      } else {
        setAddress("");
        setInitialAddress("");
      }

      if (editingOrder.source?.sectionName && editingOrder.source?.unitName) {
        const val = `${editingOrder.source.sectionName}:${editingOrder.source.unitName}`;
        setSelectedTableId(val);
        setInitialTableId(val);
      } else if (editingOrder.tableId) {
        setSelectedTableId(editingOrder.tableId);
        setInitialTableId(editingOrder.tableId);
      } else {
        setSelectedTableId("");
        setInitialTableId("");
      }

      setIsDirty(false);
      setHasUserChanges(false);
      setAddItemValue("");
      setSubmitError("");
      setValidationErrors({ table: "", address: "", items: "" });
    }
  }, [editingOrder, menuItemsMap]);

  // Escape key close handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setEditingOrder(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setEditingOrder]);

  // Lock body scroll when open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Performance-optimized dirty check (avoiding JSON.stringify deep comparisons)
  const itemsChanged = useMemo(() => {
    if (!localOrderData || !initialOrderData) return false;
    if (localOrderData.items.length !== initialOrderData.items.length) return true;
    return localOrderData.items.some((item, index) => {
      const initial = initialOrderData.items[index];
      if (!initial) return true;
      return (
        item.menuItemId !== initial.menuItemId ||
        item.quantity !== initial.quantity ||
        item.variantName !== initial.variantName ||
        item.customizations !== initial.customizations ||
        item.isReady !== initial.isReady
      );
    });
  }, [localOrderData?.items, initialOrderData?.items]);

  useEffect(() => {
    if (!localOrderData || !initialOrderData) return;

    const orderTypeChanged = localOrderData.orderType !== initialOrderData.orderType;
    const addressChanged = address !== initialAddress;
    const tableChanged = selectedTableId !== initialTableId;

    setIsDirty(orderTypeChanged || itemsChanged || addressChanged || tableChanged || hasUserChanges);
  }, [localOrderData?.orderType, initialOrderData?.orderType, itemsChanged, address, initialAddress, selectedTableId, initialTableId, hasUserChanges]);

  useEffect(() => {
    if (itemsContainerRef.current && localOrderData?.items) {
      itemsContainerRef.current.scrollTop = itemsContainerRef.current.scrollHeight;
    }
  }, [localOrderData?.items]);

  if (!editingOrder) return null;

  if (!localOrderData) {
    return (
      <div
        id="editOrderBackdrop"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      >
        <div className="bg-white rounded-2xl border-2 shadow-lg max-w-md w-full p-6">
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // =============================
  // CALLBACKS (useCallback to preserve identity for child memo rows)
  // =============================
  const handleAddItem = useCallback((menuItemId) => {
    if (!menuItemId) return;

    const now = Date.now();
    const guard = addItemGuardRef.current;
    const isDuplicateEvent = guard.menuItemId === menuItemId && now - guard.ts < 300;
    if (isDuplicateEvent) return;

    addItemGuardRef.current = { menuItemId, ts: now };

    const selected = menuItemsMap.get(String(menuItemId));
    if (!selected) {
      setAddItemValue("");
      return;
    }

    let newItem;
    const stableClientId = `new-${Date.now()}-${menuItemId}`;

    if (selected.pricingType === "variant" && selected.variantRates) {
      const firstVariantKey = Object.keys(selected.variantRates)[0];
      const firstVariantData = selected.variantRates[firstVariantKey];
      const firstVariantMeta = getVariantPriceMeta(firstVariantData);

      newItem = {
        _id: null,
        clientId: stableClientId,
        menuItemId: selected._id,
        name: selected.name,
        quantity: 1,
        _originalQuantity: 0,
        pricingType: "variant",
        variantName: firstVariantKey,
        variant: firstVariantKey,
        variants: selected.variantRates,
        price: firstVariantMeta.finalPrice,
        originalUnitPrice: firstVariantMeta.originalPrice,
        discountedUnitPrice: firstVariantMeta.finalPrice,
        customizations: "",
        isReady: false,
        _isNew: true,
      };
    } else {
      const itemPriceMeta = getItemPriceMeta(selected, selected);
      newItem = {
        _id: null,
        clientId: stableClientId,
        menuItemId: selected._id,
        name: selected.name,
        quantity: 1,
        _originalQuantity: 0,
        pricingType: "single",
        variantName: null,
        variant: null,
        variants: null,
        price: itemPriceMeta.finalPrice,
        originalUnitPrice: itemPriceMeta.originalPrice,
        discountedUnitPrice: itemPriceMeta.finalPrice,
        customizations: "",
        isReady: false,
        _isNew: true,
      };
    }

    setLocalOrderData(prev => {
      if (!prev) return prev;
      const items = [...(prev.items || []), newItem];
      return { ...prev, items, totalAmount: recalcTotal(items) };
    });
    setHasUserChanges(true);
    setAddItemValue("");

    if (validationErrors.items) {
      setValidationErrors(prev => ({ ...prev, items: "" }));
    }

    setTimeout(() => {
      if (addItemGuardRef.current.menuItemId === menuItemId) {
        addItemGuardRef.current = { menuItemId: "", ts: 0 };
      }
    }, 350);
  }, [menuItemsMap, validationErrors.items]);

  const handleVariantChange = useCallback((idx, variant) => {
    setLocalOrderData(prev => {
      if (!prev) return prev;
      const items = [...prev.items];
      const item = items[idx];

      if (!item || !item._isNew || !item.variants || !item.variants[variant]) return prev;

      const variantMeta = getVariantPriceMeta(item.variants[variant]);
      items[idx] = {
        ...item,
        variantName: variant,
        variant: variant,
        price: variantMeta.finalPrice,
        originalUnitPrice: variantMeta.originalPrice,
        discountedUnitPrice: variantMeta.finalPrice,
      };

      return {
        ...prev,
        items,
        totalAmount: recalcTotal(items)
      };
    });
    setHasUserChanges(true);
  }, []);

  const handleQuantityChange = useCallback((idx, qty) => {
    setLocalOrderData(prev => {
      if (!prev) return prev;
      const items = [...prev.items];
      if (!items[idx]) return prev;

      if (qty === "") {
        items[idx] = { ...items[idx], quantity: "" };
      } else {
        const parsedQuantity = parseInt(qty, 10);
        if (Number.isNaN(parsedQuantity)) return prev;
        items[idx] = { ...items[idx], quantity: Math.max(0, parsedQuantity) };
      }

      return {
        ...prev,
        items,
        totalAmount: recalcTotal(items)
      };
    });
    setHasUserChanges(true);
  }, []);

  const handleRemoveItem = useCallback((idx) => {
    setLocalOrderData(prev => {
      if (!prev) return prev;
      if (prev.items.length <= 1) {
        setValidationErrors(v => ({ ...v, items: "Minimum 1 item required" }));
        return prev;
      }

      const removedItem = prev.items[idx];
      if (removedItem?._id && !removedItem._isNew) {
        const removedId = String(removedItem._id);
        setRemovedItemIds(ids => ids.includes(removedId) ? ids : [...ids, removedId]);
      }

      const items = prev.items.filter((_, i) => i !== idx);

      if (items.length > 0 && validationErrors.items) {
        setValidationErrors(v => ({ ...v, items: "" }));
      }

      return {
        ...prev,
        items,
        totalAmount: recalcTotal(items)
      };
    });
    setHasUserChanges(true);
  }, [validationErrors.items]);

  const handleOrderTypeChange = useCallback((orderType) => {
    const currentType = getOrderTypeKey(localOrderData.orderType);
    const newType = getOrderTypeKey(orderType);

    if (currentType === "delivery" && (newType === "eat_here" || newType === "take_away")) {
      setAddress("");
    }
    if (currentType === "eat_here" && (newType === "take_away" || newType === "delivery")) {
      setSelectedTableId("");
    }

    setValidationErrors({ table: "", address: "", items: validationErrors.items });
    setLocalOrderData(prev => ({ ...prev, orderType }));
    setHasUserChanges(true);
  }, [localOrderData?.orderType, validationErrors.items]);

  const handleTableChange = useCallback((tableId) => {
    setSelectedTableId(tableId);
    setHasUserChanges(true);

    if (tableId && validationErrors.table) {
      setValidationErrors(prev => ({ ...prev, table: "" }));
    }
  }, [validationErrors.table]);

  const handleAddressChange = useCallback((e) => {
    const value = e.target.value;
    setAddress(value);
    setHasUserChanges(true);

    if (value.trim() && validationErrors.address) {
      setValidationErrors(prev => ({ ...prev, address: "" }));
    }
  }, [validationErrors.address]);

  // =============================
  // SUBMIT UPDATE
  // =============================
  const handleUpdateOrder = async () => {
    if (isSubmitting || !isDirty) return;

    let errors = { table: "", address: "", items: "" };
    let hasError = false;

    if (localOrderData.items.length === 0) {
      errors.items = "Minimum 1 item required";
      hasError = true;
    }

    const hasInvalidQuantity = localOrderData.items.some(
      (item) => Number(item.quantity) <= 0 || !Number.isFinite(Number(item.quantity))
    );
    if (hasInvalidQuantity) {
      errors.items = "Quantity must be greater than 0 for all items";
      hasError = true;
    }

    const selectedOrderTypeKey = getOrderTypeKey(localOrderData.orderType);

    if (selectedOrderTypeKey === "eat_here" && !selectedTableId) {
      errors.table = "Please select a table for Eat Here order";
      hasError = true;
    }

    if (selectedOrderTypeKey === "delivery" && !address.trim()) {
      errors.address = "Please enter address for Delivery order";
      hasError = true;
    }

    setValidationErrors(errors);
    setSubmitError("");

    if (hasError) {
      setTimeout(() => {
        const errorElements = document.querySelectorAll('[data-error="true"]');
        if (errorElements.length > 0) {
          errorElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setIsSubmitting(true);

    try {
      const initialStatus = initialOrderData?.status;
      const currentStatus = localOrderData.status;

      const payload = {
        orderType: localOrderData.orderType,
      };

      // Naye Items
      const newItems = localOrderData.items.filter(item => item._isNew || !item._id);
      if (newItems.length > 0) {
        payload.items = newItems.map(item => {
          const itemPayload = {
            menuItemId: item.menuItemId,
            quantity: Number(item.quantity),
            customizations: item.customizations || "",
          };

          if (item.variantName || item.variant) {
            itemPayload.variant = item.variantName || item.variant;
          }

          return itemPayload;
        });
      }

      // Quantity Changes
      const quantityChanges = localOrderData.items.filter(item => {
        if (item._isNew || !item._id) return false;
        return Number(item.quantity) !== Number(item._originalQuantity);
      });
      if (quantityChanges.length > 0) {
        payload.updateQuantities = quantityChanges.map(item => ({
          itemId: String(item._id),
          quantity: Number(item.quantity),
        }));
      }

      // Removed Items
      if (removedItemIds.length > 0) {
        payload.removeItemIds = removedItemIds;
      }

      // Status
      if (initialStatus === "ready" && newItems.length > 0) {
        payload.status = "preparing";
      } else if (currentStatus !== initialStatus) {
        payload.status = currentStatus;
      }

      // Source Table/Room (O(1) Map lookup)
      if (selectedOrderTypeKey === "eat_here" && selectedTableId) {
        const resolvedUnitId = unitMap.get(selectedTableId) || null;
        payload.source = { unitId: resolvedUnitId };
      }

      // Address
      if (selectedOrderTypeKey === "delivery" && address.trim()) {
        payload.address = address.trim();
      }

      if (selectedOrderTypeKey === "take_away") {
        payload.source = { section: null, number: null, type: "NONE" };
        payload.address = null;
      }

      await updateOrder(localOrderData._id, payload);

      setRemovedItemIds([]);
      setEditingOrder(null);

    } catch (err) {
      console.error("Update Order Failed:", err);
      const errorMsg =
        typeof getFriendlyErrorMessage === "function"
          ? getFriendlyErrorMessage(err, "update")
          : "Unable to update order right now.";
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpdateDisabled = isSubmitting || localOrderData.items.length === 0 || !isDirty;
  const itemsSubtotal = useMemo(() => recalcTotal(localOrderData?.items || []), [localOrderData?.items]);

  const handleBackdropClick = (e) => {
    if (e.target.id === "editOrderBackdrop") setEditingOrder(null);
  };

  // ── Theme tokens from Redux ──────────────────────────────────────────────────
  const colors = useSelector((state) => state.admin.theme.colors);
  
  const bg               = isDarkMode ? (colors.dark?.cardBg || "#1e293b") : "#ffffff";
  const border           = isDarkMode ? (colors.dark?.border || "border-slate-700/60") : (colors.border || "border-[#ede8e3]");
  const textPri          = isDarkMode ? (colors.dark?.textPrimary || "text-slate-100") : (colors.textPrimary || "text-[#1c1917]");
  const textSec          = isDarkMode ? (colors.dark?.textSecondary || "text-slate-400") : (colors.textSecondary || "text-[#57524e]");
  const textMut          = isDarkMode ? "#64748b" : (colors.textMuted || "#a8a29e");
  
  const labelCls         = `block text-[10px] font-black uppercase tracking-wider mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`;
  const inputCls         = `w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition-all ${
    isDarkMode
      ? "border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
      : "border-[#ede8e3] bg-white text-[#1c1917] placeholder-[#a8a29e] focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
  }`;
  
  const itemCardBg       = isDarkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-white border-[#ede8e3]";
  const itemsContainerBg = isDarkMode ? "bg-[#0f172a] border-slate-700/60" : "bg-[#fcfaf7] border-[#ede8e3]";
  const totalBg          = isDarkMode ? "bg-slate-800/40 border-slate-700/40" : colors.primaryLight;
  const footerBg         = isDarkMode ? "bg-[#0f172a] border-slate-700/60" : "bg-[#fcfaf7] border-[#ede8e3]";
  const dropdownCls      = `z-[10050] rounded-xl border p-1 shadow-lg ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-[#ede8e3] bg-white"}`;
  
  const variantPillCls   = isDarkMode
    ? "bg-slate-700 text-slate-300 border border-slate-600 rounded-lg px-2 py-0.5 text-xs font-semibold"
    : "bg-[#f7f3ef] text-[#78716c] border border-[#e7e1db] rounded-lg px-2 py-0.5 text-xs font-semibold";

  return (
    <div
      id="editOrderBackdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/45 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-2 sm:p-4 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-order-modal-title"
    >
      <div
        className="w-full max-w-[calc(100vw-1rem)] sm:max-w-md max-h-[92dvh] sm:max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col transition-all duration-200"
        style={{
          backgroundColor: bg,
          borderColor: border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{
            backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "#ffffff",
            borderBottomColor: border,
          }}
        >
          <h3 id="edit-order-modal-title" className="text-base font-black tracking-tight" style={{ color: textPri }}>Edit Order</h3>
          <button
            type="button"
            aria-label="Close edit order"
            onClick={() => setEditingOrder(null)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150 active:scale-[0.9] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            style={{ color: textMut, backgroundColor: isDarkMode ? "rgba(51,65,85,0.3)" : "#f5f5f4" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Submission Error Banner */}
          {submitError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-500/10 p-3.5 text-red-700 dark:border-red-950/45 dark:bg-red-950/20 dark:text-red-400 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="text-xs font-semibold leading-normal">{submitError}</p>
            </div>
          )}

          {/* Order Type Selector */}
          <OrderTypeSelector
            value={localOrderData.orderType}
            onChange={handleOrderTypeChange}
            isDarkMode={isDarkMode}
            dropdownCls={dropdownCls}
            labelCls={labelCls}
          />

          {/* Table / Room Selector (Eat Here) */}
          {getOrderTypeKey(localOrderData.orderType) === "eat_here" && (
            <TableSelector
              editingOrder={editingOrder}
              selectedTableId={selectedTableId}
              handleTableChange={handleTableChange}
              validationErrors={validationErrors}
              isDarkMode={isDarkMode}
              labelCls={labelCls}
              dropdownCls={dropdownCls}
              restaurantData={restaurantData}
            />
          )}

          {/* Delivery Address (Delivery) */}
          {getOrderTypeKey(localOrderData.orderType) === "delivery" && (
            <DeliveryAddress
              address={address}
              handleAddressChange={handleAddressChange}
              validationErrors={validationErrors}
              isDarkMode={isDarkMode}
              labelCls={labelCls}
              inputCls={inputCls}
            />
          )}

          {/* Order Items */}
          <div data-error={!!validationErrors.items}>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls.replace("mb-1.5", "")}>Order Items</label>
              <span className={`text-xs ${validationErrors.items ? "text-red-500" : textMut}`}>
                {localOrderData.items.length} item{localOrderData.items.length !== 1 ? "s" : ""}
                {validationErrors.items && ` — ${validationErrors.items}`}
              </span>
            </div>

            <div
              ref={itemsContainerRef}
              className={`space-y-2 max-h-52 overflow-y-auto rounded-xl border p-3 transition-colors ${
                validationErrors.items ? "border-red-300 bg-red-50" : itemsContainerBg
              }`}
            >
              {localOrderData.items.length === 0 ? (
                <p className={`py-4 text-center text-sm italic ${textMut}`}>No items. Add at least one.</p>
              ) : (
                localOrderData.items.map((item, idx) => (
                  <OrderItemRow
                    key={item.clientId || item._id || idx}
                    item={item}
                    index={idx}
                    isDarkMode={isDarkMode}
                    colors={colors}
                    textPri={textPri}
                    textMut={textMut}
                    itemCardBg={itemCardBg}
                    variantPillCls={variantPillCls}
                    dropdownCls={dropdownCls}
                    handleVariantChange={handleVariantChange}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveItem={handleRemoveItem}
                    itemsLength={localOrderData.items.length}
                  />
                ))
              )}
            </div>
          </div>

          {/* Add New Item Selector */}
          <div>
            <Select value={addItemValue} onValueChange={handleAddItem}>
              <SelectTrigger className={`h-10 w-full rounded-lg border px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-200 ${
                isDarkMode ? "border-slate-600 bg-slate-800 text-slate-350 hover:border-slate-500" : "border-[#ede8e3] bg-white text-[#78716c] hover:border-[#d6cfc8]"
              }`}>
                <SelectValue placeholder="+ Add New Item" />
              </SelectTrigger>
              <SelectContent side="top" sideOffset={6} className={`${dropdownCls} w-[var(--radix-select-trigger-width)] max-h-[36dvh]`}>
                <SelectGroup>
                  {menuItems.map((menu) => {
                    const meta = getMenuDropdownPriceMeta(menu);
                    return (
                      <SelectItem key={menu._id} value={menu._id}
                        className={`cursor-pointer rounded-md text-xs ${isDarkMode ? "text-slate-200 data-[highlighted]:bg-slate-700" : "text-[#1c1917] data-[highlighted]:bg-[#f7f3ef]"}`}>
                        <div className="flex items-center justify-between gap-3 w-full py-0.5">
                          <span className="truncate">{menu.name}</span>
                          <span className="shrink-0 font-semibold" style={{ color: colors.primary }}>
                            {meta.isVariant ? "Variants" : (
                              <>
                                {meta.originalPrice > meta.finalPrice && (
                                  <span className={`mr-1 text-[10px] line-through ${textMut}`}>{formatCurrency(meta.originalPrice)}</span>
                                )}
                                {formatCurrency(meta.finalPrice)}
                              </>
                            )}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Items Total */}
          <div className="rounded-xl border px-4 py-3 shadow-sm" style={{ backgroundColor: totalBg, borderColor: isDarkMode ? border : `${colors.primary}25` }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black" style={{ color: textPri }}>Items Total</span>
              <span className="text-lg font-black" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>₹{itemsSubtotal}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex shrink-0 items-center justify-end gap-2.5 border-t px-5 py-3.5"
          style={{
            backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : footerBg,
            borderTopColor: border,
          }}
        >
          <button
            type="button"
            onClick={() => setEditingOrder(null)}
            className="h-9 rounded-xl border px-4 text-sm font-semibold transition-all duration-150 active:scale-[0.97]"
            style={{
              backgroundColor: isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff",
              borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
              color: isDarkMode ? colors.primary : colors.primaryText,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.color = colors.primaryText;
              e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}1a` : colors.primaryLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDarkMode ? `${colors.primary}50` : `${colors.primary}33`;
              e.currentTarget.style.color = isDarkMode ? colors.primary : colors.primaryText;
              e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(30,41,59,0.6)" : "#ffffff";
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdateOrder}
            disabled={isUpdateDisabled}
            className="h-9 rounded-xl px-5 text-sm font-extrabold transition-all duration-150 active:scale-[0.97] text-white shadow-sm"
            style={{
              backgroundColor: isUpdateDisabled
                ? isDarkMode ? "rgba(51, 65, 85, 0.4)" : "#f0ebe5"
                : colors.primary,
              color: isUpdateDisabled
                ? textMut
                : "#ffffff",
              cursor: isUpdateDisabled ? "not-allowed" : "pointer"
            }}
            onMouseEnter={(e) => {
              if (!isUpdateDisabled) e.currentTarget.style.backgroundColor = colors.primaryHover;
            }}
            onMouseLeave={(e) => {
              if (!isUpdateDisabled) e.currentTarget.style.backgroundColor = colors.primary;
            }}
          >
            {isSubmitting ? "Updating..." : "Update Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;