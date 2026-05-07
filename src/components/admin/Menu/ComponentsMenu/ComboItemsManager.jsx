import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, AlertCircle, ChevronUp, ChevronDown } from "lucide-react";
import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ComboItemsManager = ({
  comboItems = [], setComboItems, menuItems = [],
  errors = {}, foodType = "mixed", isLoadingMenu = false,
  discount = null, comboPrice = null,
}) => {
  const [availableMenuItems, setAvailableMenuItems] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const MotionDiv = motion.div;

  // ── Logic (unchanged) ────────────────────────────────────────────────────
  useEffect(() => {
    if (!menuItems?.length) { setAvailableMenuItems([]); return; }
    const filtered = menuItems.filter(item =>
      item && (item._id || item.id) && !item.deleted && item.pricingType !== "combo" && item.available !== false
    );
    const typeFiltered = foodType === "mixed"
      ? filtered
      : filtered.filter(item => !item.type || item.type === foodType || item.type === "mixed");
    setAvailableMenuItems(typeFiltered);
  }, [menuItems, foodType]);

  const addComboItem = () => {
    if (isLoadingMenu) return;
    setComboItems(prev => [...prev, { menuItemId: "", variant: "", quantity: 1, name: "" }]);
    setExpandedIndex(comboItems.length);
  };

  const removeComboItem = (index) => {
    setComboItems(prev => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex > index) setExpandedIndex(p => p - 1);
  };

  const handleComboItemChange = (index, field, value) => {
    setComboItems(prev => {
      const updated = [...prev];
      if (field === "menuItemId") {
        const sel = availableMenuItems.find(i => (i._id || i.id) === value);
        updated[index] = { ...updated[index], [field]: value, name: sel?.name || "",
          variant: sel?.pricingType === "variant" ? "" : updated[index].variant };
      } else if (field === "quantity") {
        const q = parseInt(value) || 1;
        updated[index][field] = q > 0 ? q : 1;
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  };

  const handleQuantityChange = (index, delta) => {
    handleComboItemChange(index, "quantity", Math.max(1, (comboItems[index]?.quantity || 1) + delta));
  };

  const getMenuItemVariants = (menuItemId) => {
    if (!menuItemId) return [];
    const item = availableMenuItems.find(i => (i._id || i.id) === menuItemId);
    if (!item || item.pricingType !== "variant") return [];
    return ["quarter","half","full"].filter(k => item.variantRates?.[k]?.price)
      .map(k => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));
  };

  const getMenuItemInfo = (id) => id ? availableMenuItems.find(i => (i._id || i.id) === id) : null;
  const getVariantPrice = (id, variant) => {
    const item = getMenuItemInfo(id);
    return (!item || !variant || item.pricingType !== "variant") ? 0 : (item.variantRates?.[variant]?.price || 0);
  };
  const calculateItemTotal = (item) => {
    const m = getMenuItemInfo(item.menuItemId);
    if (!m) return 0;
    const price = m.pricingType === "single" ? Number(m.price) || 0
      : m.pricingType === "variant" && item.variant ? Number(getVariantPrice(item.menuItemId, item.variant)) : 0;
    return price * (item.quantity || 1);
  };
  const calculateComboValue = () => comboItems.reduce((t, i) => t + calculateItemTotal(i), 0);
  const isItemAlreadyAdded = (id) => comboItems.some(i => i.menuItemId === id);
  const getAvailableCount = () => availableMenuItems.filter(i => !isItemAlreadyAdded(i._id || i.id)).length;

  // ── Shared classes ────────────────────────────────────────────────────────
  const triggerCls = (hasErr) =>
    `h-9 w-full rounded-lg border px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-100 ${
      hasErr ? "border-red-400 bg-red-50" : "border-[#ede8e3] bg-white hover:border-[#d6cfc8] focus:border-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600"
    }`;
  const dropdownCls = "rounded-lg border border-[#ede8e3] bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900";
  const itemCls = "cursor-pointer rounded-md text-sm text-[#1c1917] data-[highlighted]:bg-[#f7f3ef] dark:text-slate-200 dark:data-[highlighted]:bg-slate-700";
  const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wider text-[#a8a29e] dark:text-slate-400";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label className={labelCls}>Combo Items <span className="text-orange-500">*</span></label>
          <p className="text-xs text-[#a8a29e] dark:text-slate-500">
            {isLoadingMenu ? "Loading menu items..." : "Select items to include in this combo"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLoadingMenu && availableMenuItems.length > 0 && (
            <span className="text-xs text-[#a8a29e] dark:text-slate-500">{getAvailableCount()} items available</span>
          )}
          <button
            type="button"
            onClick={addComboItem}
            disabled={isLoadingMenu || getAvailableCount() === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            {isLoadingMenu ? "Loading..." : "Add Item"}
          </button>
        </div>
      </div>

      {/* Empty states */}
      {isLoadingMenu && (
        <div className="rounded-lg border border-dashed border-[#ede8e3] py-8 text-center">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="text-xs text-[#a8a29e] dark:text-slate-500">Loading menu items...</p>
        </div>
      )}
      {!isLoadingMenu && menuItems.length === 0 && (
        <div className="rounded-lg border border-dashed border-[#ede8e3] py-8 text-center">
          <p className="text-sm text-[#78716c]">No menu items found</p>
          <p className="mt-1 text-xs text-[#a8a29e]">Create regular menu items first</p>
        </div>
      )}
      {!isLoadingMenu && menuItems.length > 0 && availableMenuItems.length === 0 && (
        <div className="rounded-lg border border-dashed border-[#ede8e3] py-8 text-center">
          <p className="text-sm text-[#78716c]">No available items for combo</p>
        </div>
      )}

      {/* Stats bar */}
      {!isLoadingMenu && comboItems.length > 0 && (
        <div className="rounded-lg border border-[#ede8e3] bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <span className="text-xs font-semibold text-[#1c1917] dark:text-slate-100">
            {comboItems.length} item{comboItems.length !== 1 ? "s" : ""} in combo
          </span>
          <span className="ml-3 text-xs text-[#78716c]">Total value: ₹{calculateComboValue()}</span>
          {comboPrice && <span className="ml-3 text-xs text-[#78716c]">Combo price: ₹{comboPrice}</span>}
        </div>
      )}

      {/* Items list */}
      {!isLoadingMenu && comboItems.length > 0 && (
        <div className="space-y-2">
          {comboItems.map((item, index) => {
            const menuItem = getMenuItemInfo(item.menuItemId);
            const variants = getMenuItemVariants(item.menuItemId);
            const isExpanded = expandedIndex === index;
            const itemTotal = calculateItemTotal(item);

            return (
              <MotionDiv
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-lg border border-[#ede8e3] bg-white dark:border-slate-700 dark:bg-slate-800"
              >
                {/* Row header */}
                <div
                  className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-[#f7f3ef] dark:hover:bg-slate-700/60"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1c1917] dark:text-slate-100">
                        {menuItem ? menuItem.name : "Select menu item"}
                        {item.quantity > 1 && ` × ${item.quantity}`}
                      </p>
                      {menuItem && (
                        <p className="text-xs text-[#a8a29e] dark:text-slate-500">
                          {menuItem.pricingType === "single"
                            ? `₹${menuItem.price || 0}`
                            : item.variant
                              ? `${item.variant} - ₹${getVariantPrice(item.menuItemId, item.variant)}`
                              : "Select variant"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-orange-500">₹{itemTotal}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeComboItem(index); }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                    {isExpanded ? <ChevronUp size={14} className="text-[#a8a29e]" /> : <ChevronDown size={14} className="text-[#a8a29e]" />}
                  </div>
                </div>

                {/* Expanded form */}
                {isExpanded && (
                  <MotionDiv
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-[#ede8e3] bg-[#f7f3ef] p-3 dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {/* Menu Item */}
                      <div>
                        <label className={labelCls}>Menu Item *</label>
                        <Select
                          value={item.menuItemId || "none"}
                          onValueChange={(v) => v !== "none" && handleComboItemChange(index, "menuItemId", v)}
                        >
                          <SelectTrigger className={triggerCls(!item.menuItemId)}>
                            <SelectValue placeholder="Select an item" />
                          </SelectTrigger>
                          <SelectContent className={`max-h-52 overflow-y-auto ${dropdownCls}`}>
                            <SelectGroup>
                              <SelectItem value="none" disabled className="text-xs text-[#a8a29e] dark:text-slate-500">Select an item</SelectItem>
                              {availableMenuItems.map(m => {
                                const id = m._id || m.id;
                                const added = isItemAlreadyAdded(id) && item.menuItemId !== id;
                                return (
                                  <SelectItem key={id} value={id} disabled={added} className={`${itemCls} text-xs`}>
                                    {m.name}{m.pricingType === "single" ? ` (₹${m.price})` : m.pricingType === "variant" ? " (Variant)" : ""}
                                    {added && " · Added"}
                                  </SelectItem>
                                );
                              })}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {!item.menuItemId && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle size={11} />Select a menu item</p>
                        )}
                      </div>

                      {/* Variant */}
                      {variants.length > 0 && (
                        <div>
                          <label className={labelCls}>Variant *</label>
                          <Select
                            value={item.variant || "none"}
                            onValueChange={(v) => v !== "none" && handleComboItemChange(index, "variant", v)}
                          >
                            <SelectTrigger className={triggerCls(!item.variant)}>
                              <SelectValue placeholder="Select variant" />
                            </SelectTrigger>
                            <SelectContent className={dropdownCls}>
                              <SelectGroup>
                                <SelectItem value="none" disabled className="text-xs text-[#a8a29e] dark:text-slate-500">Select variant</SelectItem>
                                {variants.map(v => (
                                  <SelectItem key={v.value} value={v.value} className={`${itemCls} text-xs`}>
                                    {v.label} (₹{getVariantPrice(item.menuItemId, v.value)})
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          {!item.variant && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle size={11} />Select a variant</p>
                          )}
                        </div>
                      )}

                      {/* Quantity */}
                      <div>
                        <label className={labelCls}>Quantity</label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, -1)}
                            disabled={(item.quantity || 1) <= 1}
                            className="flex h-9 w-9 items-center justify-center rounded-l-lg border border-[#ede8e3] bg-white text-[#78716c] transition-colors hover:bg-[#f7f3ef] disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            value={item.quantity || 1}
                            onChange={(e) => handleComboItemChange(index, "quantity", e.target.value)}
                            min="1"
                            className="h-9 w-full border-y border-[#ede8e3] bg-white text-center dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm font-semibold text-[#1c1917] outline-none focus:border-orange-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-r-lg border border-[#ede8e3] bg-white text-[#78716c] transition-colors hover:bg-[#f7f3ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        <p className="mt-1 text-right text-xs text-orange-500 font-medium">
                          {item.quantity || 1} item{(item.quantity || 1) !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Item info card */}
                    {menuItem && (
                      <div className="mt-3 rounded-lg border border-[#ede8e3] bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1c1917] dark:text-slate-100">{menuItem.name}</p>
                            <p className="mt-0.5 text-xs text-[#a8a29e] line-clamp-1 dark:text-slate-500">
                              {menuItem.description?.substring(0, 80) || "No description"}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-base font-bold text-orange-500">₹{itemTotal}</p>
                            <p className="text-xs text-[#a8a29e] dark:text-slate-500">
                              {item.quantity || 1} × ₹{menuItem.pricingType === "single" ? menuItem.price : getVariantPrice(item.menuItemId, item.variant)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </MotionDiv>
                )}
              </MotionDiv>
            );
          })}
        </div>
      )}

      {/* Validation error */}
      {errors.comboItems && typeof errors.comboItems === "string" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle size={12} />{errors.comboItems}
          </p>
        </div>
      )}
    </div>
  );
};

export default ComboItemsManager;
