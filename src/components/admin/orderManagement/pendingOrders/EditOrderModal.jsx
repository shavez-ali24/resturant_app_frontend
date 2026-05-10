import React, { useEffect, useRef, useState } from "react";
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
import { Home, Truck, Utensils, AlertCircle, Plus, Minus } from "lucide-react";

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
  const [validationErrors, setValidationErrors] = useState({
    table: "",
    address: "",
    items: ""
  });

  // =============================
  // INIT ORDER DATA
  // =============================
  useEffect(() => {
    if (editingOrder) {
      const normalizedItems = editingOrder.items.map(item => {
        const menuItem = menuItems.find(m => m._id === (item.menuItemId || item.menuItem?._id || item._id));
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
          menuItemId: item.menuItemId || item.menuItem?._id || item._id,
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
          // Existing items — _isNew is false
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
      }

      if (editingOrder.source?.section && editingOrder.source?.number) {
        const val = `${editingOrder.source.section}:${editingOrder.source.number}`;
        setSelectedTableId(val);
        setInitialTableId(val);
      } else if (editingOrder.tableId) {
        setSelectedTableId(editingOrder.tableId);
        setInitialTableId(editingOrder.tableId);
      }

      setIsDirty(false);
      setHasUserChanges(false);
      setAddItemValue("");
      setValidationErrors({ table: "", address: "", items: "" });
    }
  }, [editingOrder, menuItems]);

  // Dirty check
  useEffect(() => {
    if (!localOrderData || !initialOrderData) return;

    const orderTypeChanged = localOrderData.orderType !== initialOrderData.orderType;
    const itemsChanged = JSON.stringify(localOrderData.items) !== JSON.stringify(initialOrderData.items);
    const addressChanged = address !== initialAddress;
    const tableChanged = selectedTableId !== initialTableId;

    const hasChanges = orderTypeChanged || itemsChanged || addressChanged || tableChanged;
    setIsDirty(hasChanges || hasUserChanges);

  }, [localOrderData, initialOrderData, address, selectedTableId, initialAddress, initialTableId, hasUserChanges]);

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
  // ADD ITEM
  // =============================
  const handleAddItem = (menuItemId) => {
    if (!menuItemId) return;

    const now = Date.now();
    const guard = addItemGuardRef.current;
    const isDuplicateEvent = guard.menuItemId === menuItemId && now - guard.ts < 300;
    if (isDuplicateEvent) return;

    addItemGuardRef.current = { menuItemId, ts: now };

    const selected = menuItems.find(m => m._id === menuItemId);
    if (!selected) {
      setAddItemValue("");
      return;
    }

    let newItem;

    if (selected.pricingType === "variant" && selected.variantRates) {
      const firstVariantKey = Object.keys(selected.variantRates)[0];
      const firstVariantData = selected.variantRates[firstVariantKey];
      const firstVariantMeta = getVariantPriceMeta(firstVariantData);

      newItem = {
        _id: null,
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
        _isNew: true, // naya item — variant dropdown dikhega
      };
    } else {
      const itemPriceMeta = getItemPriceMeta(selected, selected);
      newItem = {
        _id: null,
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
        _isNew: true, // naya item
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
  };

  // =============================
  // VARIANT CHANGE — sirf _isNew items pe kaam karta hai
  // =============================
  const handleVariantChange = (idx, variant) => {
    const items = [...localOrderData.items];
    const item = items[idx];

    // Existing items ka variant change nahi hona chahiye
    if (!item._isNew) return;
    if (!item.variants || !item.variants[variant]) return;

    const variantMeta = getVariantPriceMeta(item.variants[variant]);
    items[idx] = {
      ...item,
      variantName: variant,
      variant: variant,
      price: variantMeta.finalPrice,
      originalUnitPrice: variantMeta.originalPrice,
      discountedUnitPrice: variantMeta.finalPrice,
    };

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    setHasUserChanges(true);
  };

  // =============================
  // QUANTITY CHANGE
  // =============================
  const handleQuantityChange = (idx, qty) => {
    const items = [...localOrderData.items];

    if (qty === "") {
      items[idx] = { ...items[idx], quantity: "" };
    } else {
      const parsedQuantity = parseInt(qty, 10);
      if (Number.isNaN(parsedQuantity)) return;
      items[idx] = { ...items[idx], quantity: Math.max(0, parsedQuantity) };
    }

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    setHasUserChanges(true);
  };

  // =============================
  // REMOVE ITEM
  // =============================
  const handleRemoveItem = (idx) => {
    if (localOrderData.items.length <= 1) {
      setValidationErrors(prev => ({ ...prev, items: "Minimum 1 item required" }));
      return;
    }

    const removedItem = localOrderData.items[idx];

    // Sirf existing items (_id hai, _isNew nahi) ko removeItemIds mein daalo
    if (removedItem?._id && !removedItem._isNew) {
      const removedId = String(removedItem._id);
      setRemovedItemIds((prev) =>
        prev.includes(removedId) ? prev : [...prev, removedId]
      );
    }

    const items = localOrderData.items.filter((_, i) => i !== idx);

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    setHasUserChanges(true);

    if (items.length > 0 && validationErrors.items) {
      setValidationErrors(prev => ({ ...prev, items: "" }));
    }
  };

  // =============================
  // ORDER TYPE CHANGE
  // =============================
  const handleOrderTypeChange = (orderType) => {
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
  };

  // =============================
  // TABLE CHANGE
  // =============================
  const handleTableChange = (tableId) => {
    setSelectedTableId(tableId);
    setHasUserChanges(true);

    if (tableId && validationErrors.table) {
      setValidationErrors(prev => ({ ...prev, table: "" }));
    }
  };

  // =============================
  // ADDRESS CHANGE
  // =============================
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    setHasUserChanges(true);

    if (value.trim() && validationErrors.address) {
      setValidationErrors(prev => ({ ...prev, address: "" }));
    }
  };

  // =============================
  // UPDATE ORDER
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

      // ─── PART 1: NAYE ITEMS ───────────────────────────
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

      // ─── PART 2: QUANTITY CHANGES ─────────────────────
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

      // ─── PART 3: REMOVED ITEMS ────────────────────────
      if (removedItemIds.length > 0) {
        payload.removeItemIds = removedItemIds;
      }

      // ─── STATUS ───────────────────────────────────────
      const isAddingNewItems = newItems.length > 0;
      if (initialStatus === "ready" && isAddingNewItems) {
        payload.status = "preparing";
      } else if (currentStatus !== initialStatus) {
        payload.status = currentStatus;
      }

      // ─── SOURCE (TABLE) ───────────────────────────────
      if (selectedOrderTypeKey === "eat_here" && selectedTableId) {
        const [section, numStr] = selectedTableId.split(":");
        const number = parseInt(numStr, 10) || 1;
        const type = section === "rooms" ? "ROOM" : "TABLE";
        payload.source = { section, number, type };
      }

      // ─── ADDRESS ──────────────────────────────────────
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
      setValidationErrors(prev => ({ ...prev, items: errorMsg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================
  // UI
  // =============================
  const isDarkMode = localStorage.getItem("admin-theme") === "dark";

  const isUpdateDisabled = isSubmitting || localOrderData.items.length === 0 || !isDirty;
  const itemsSubtotal = recalcTotal(localOrderData?.items || []);

  const handleBackdropClick = (e) => {
    if (e.target.id === "editOrderBackdrop") setEditingOrder(null);
  };

  const getOrderTypeIcon = (type) => {
    switch (getOrderTypeKey(type)) {
      case "eat_here": return <Utensils size={14} />;
      case "take_away": return <Home size={14} />;
      case "delivery": return <Truck size={14} />;
      default: return <Utensils size={14} />;
    }
  };

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const modalBg          = isDarkMode ? "bg-[#1e293b] border-slate-700/60"   : "bg-white border-[#ede8e3]";
  const headerBg         = isDarkMode ? "bg-[#0f172a] border-slate-700/60"   : "bg-[#f7f3ef] border-[#ede8e3]";
  const textPri          = isDarkMode ? "text-slate-100"  : "text-[#1c1917]";
  const textMut          = isDarkMode ? "text-slate-500"  : "text-[#a8a29e]";
  const labelCls         = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${textMut}`;
  const inputCls         = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-200 ${
    isDarkMode
      ? "border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-orange-500"
      : "border-[#ede8e3] bg-white text-[#1c1917] placeholder-[#a8a29e] focus:border-orange-400"
  }`;
  const itemCardBg       = isDarkMode ? "bg-slate-800/60 border-slate-700/60" : "bg-white border-[#ede8e3]";
  const itemsContainerBg = isDarkMode ? "bg-[#0f172a] border-slate-700/60"   : "bg-[#f7f3ef] border-[#ede8e3]";
  const totalBg          = isDarkMode ? "bg-slate-800/40 border-slate-700/40" : "bg-[#fff7ed] border-orange-100";
  const footerBg         = isDarkMode ? "bg-[#0f172a] border-slate-700/60"   : "bg-[#f7f3ef] border-[#ede8e3]";
  const dropdownCls      = `z-[10050] rounded-lg border p-1 shadow-lg ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-[#ede8e3] bg-white"}`;
  const variantPillCls   = isDarkMode
    ? "bg-slate-700 text-slate-300 border border-slate-600"
    : "bg-[#f7f3ef] text-[#78716c] border border-[#e7e1db]";

  return (
    <div
      id="editOrderBackdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/45 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-2 sm:p-4 z-[9999]"
    >
      <div
        className={`w-full max-w-[calc(100vw-1rem)] sm:max-w-md max-h-[92dvh] sm:max-h-[90vh] overflow-hidden rounded-2xl border shadow-xl flex flex-col ${modalBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={`flex shrink-0 items-center justify-between border-b px-5 py-4 ${headerBg}`}>
          <h3 className={`text-base font-bold ${textPri}`}>Edit Order</h3>
          <button
            type="button"
            onClick={() => setEditingOrder(null)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              isDarkMode ? "text-slate-400 hover:bg-slate-700 hover:text-slate-100" : "text-[#a8a29e] hover:bg-[#ede8e3] hover:text-[#1c1917]"
            }`}
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Order Type */}
          <div>
            <label className={labelCls}>Order Type</label>
            <Select value={localOrderData.orderType} onValueChange={handleOrderTypeChange}>
              <SelectTrigger className={`h-10 w-full rounded-lg border px-3 text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-orange-200 ${getOrderTypeBadgeClass(localOrderData.orderType)}`}>
                <div className="flex items-center gap-2">
                  {getOrderTypeIcon(localOrderData.orderType)}
                  <span>{getOrderTypeLabel(localOrderData.orderType)}</span>
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

          {/* Table / Room Selection - Eat Here */}
          {getOrderTypeKey(localOrderData.orderType) === "eat_here" && (() => {
            const restaurant = restaurantData?.restaurant || restaurantData || {};
            const sec = restaurant.sections || {};
            const indoorCount  = sec.indoor?.tables  || restaurant.tableNumbers || 0;
            const outdoorCount = sec.outdoor?.tables || 0;
            const rooftopCount = sec.rooftop?.tables || 0;
            const roomsCount   = sec.rooms?.rooms    || 0;

            const sectionDefs = [
              { key: "indoor",  label: "Indoor",  count: indoorCount,  unit: "Table" },
              { key: "outdoor", label: "Outdoor", count: outdoorCount, unit: "Table" },
              { key: "rooftop", label: "Rooftop", count: rooftopCount, unit: "Table" },
              { key: "rooms",   label: "Rooms",   count: roomsCount,   unit: "Room"  },
            ].filter(s => s.count > 0);

            const [selSection, selNum] = selectedTableId ? selectedTableId.split(":") : ["", ""];
            const onlyOne = sectionDefs.length === 1;

            return (
              <div data-error={!!validationErrors.table}>
                <label className={labelCls}>{onlyOne ? "Select Table *" : "Select Section & Table *"}</label>
                {sectionDefs.length === 0 ? (
                  <p className={`rounded-lg border border-dashed p-3 text-sm text-center ${isDarkMode ? "border-slate-600 text-slate-400" : "border-[#ede8e3] text-[#78716c]"}`}>
                    No tables configured yet.
                  </p>
                ) : onlyOne ? (
                  <Select
                    value={selectedTableId || `${sectionDefs[0].key}:1`}
                    onValueChange={(v) => handleTableChange(`${sectionDefs[0].key}:${v}`)}
                  >
                    <SelectTrigger className={`h-9 w-full rounded-lg border text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-orange-200 ${
                      isDarkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#ede8e3] bg-white text-[#1c1917]"
                    }`}>
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
                            className={`flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all ${
                              isSelected
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
                              <SelectTrigger className={`h-9 w-full rounded-lg border text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-orange-200 ${
                                isDarkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#ede8e3] bg-white text-[#1c1917]"
                              }`}>
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
          })()}

          {/* Address */}
          {getOrderTypeKey(localOrderData.orderType) === "delivery" && (
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
              className={`space-y-2 max-h-52 overflow-y-auto rounded-xl border p-3 ${
                validationErrors.items ? "border-red-300 bg-red-50" : itemsContainerBg
              }`}
            >
              {localOrderData.items.length === 0 ? (
                <p className={`py-4 text-center text-sm italic ${textMut}`}>No items. Add at least one.</p>
              ) : (
                localOrderData.items.map((item, idx) => {
                  const unitPrice = Number(item.price || 0);
                  const quantity = Number(item.quantity ?? 1);
                  const originalUnitPrice = Number(item.originalUnitPrice || unitPrice);
                  const showOldPrice = originalUnitPrice > unitPrice;
                  const rowTotal = unitPrice * quantity;
                  const oldRowTotal = originalUnitPrice * quantity;

                  return (
                    <div key={`${item.menuItemId}-${idx}`} className={`rounded-xl border p-3 ${itemCardBg}`}>

                      {/* ── Name + badges + price ── */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-sm font-semibold ${textPri}`}>{item.name}</span>

                          {/* Ready badge — existing items only */}
                          {item.isReady && !item._isNew && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                              ✓ Ready
                            </span>
                          )}

                          {/* New item badge */}
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

                      {/* ── Variant ── */}
                      {item.pricingType === "variant" && (
                        item._isNew && item.variants && Object.keys(item.variants).length > 0 ? (
                          // NAYA item — variant dropdown dikhao, user change kar sakta hai
                          <Select value={item.variantName || ""} onValueChange={(v) => handleVariantChange(idx, v)}>
                            <SelectTrigger className={`h-8 w-full max-w-[220px] rounded-lg border px-2.5 text-xs outline-none focus:ring-1 focus:ring-orange-200 ${
                              isDarkMode ? "border-slate-600 bg-slate-700 text-slate-200" : "border-[#ede8e3] bg-[#f7f3ef] text-[#1c1917]"
                            }`}>
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
                          // EXISTING item — sirf text pill, dropdown nahi
                          item.variantName && (
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variantPillCls}`}>
                              {formatVariantLabel(item.variantName)}
                            </span>
                          )
                        )
                      )}

                      {/* ── Qty + Remove ── */}
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => handleQuantityChange(idx, Math.max(1, quantity - 1))}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                              isDarkMode ? "border-slate-600 bg-slate-700 text-orange-300 hover:bg-slate-600" : "border-[#ede8e3] bg-white text-orange-500 hover:bg-orange-50"
                            }`}>
                            <Minus size={12} />
                          </button>
                          <input type="number" min="1" value={item.quantity}
                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                            className={`w-12 rounded-lg border px-1 py-1 text-center text-sm outline-none focus:ring-1 focus:ring-orange-200 ${
                              isDarkMode ? "border-slate-600 bg-slate-700 text-slate-100" : "border-[#ede8e3] bg-white text-[#1c1917]"
                            }`}
                          />
                          <button type="button" onClick={() => handleQuantityChange(idx, quantity + 1)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                              isDarkMode ? "border-slate-600 bg-slate-700 text-orange-300 hover:bg-slate-600" : "border-[#ede8e3] bg-white text-orange-500 hover:bg-orange-50"
                            }`}>
                            <Plus size={12} />
                          </button>
                        </div>
                        <button onClick={() => handleRemoveItem(idx)}
                          disabled={localOrderData.items.length <= 1}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                            localOrderData.items.length <= 1
                              ? `cursor-not-allowed ${isDarkMode ? "bg-slate-700 text-slate-500" : "bg-[#f7f3ef] text-[#a8a29e]"}`
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}>
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add New Item */}
          <div>
            <Select value={addItemValue} onValueChange={handleAddItem}>
              <SelectTrigger className={`h-10 w-full rounded-lg border px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-200 ${
                isDarkMode ? "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500" : "border-[#ede8e3] bg-white text-[#78716c] hover:border-[#d6cfc8]"
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
                          <span className="shrink-0 text-orange-500 font-semibold">
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
          <div className={`rounded-xl border px-4 py-3 ${totalBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${textPri}`}>Items Total</span>
              <span className="text-lg font-bold text-orange-500">₹{itemsSubtotal}</span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={`flex shrink-0 items-center justify-end gap-2.5 border-t px-5 py-3 ${footerBg}`}>
          <button
            onClick={() => setEditingOrder(null)}
            className={`h-9 rounded-lg border px-4 text-sm font-semibold transition-colors ${
              isDarkMode
                ? "border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700"
                : "border-[#ede8e3] bg-white text-[#1c1917] hover:bg-[#f7f3ef]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateOrder}
            disabled={isUpdateDisabled}
            className={`h-9 rounded-lg px-4 text-sm font-semibold transition-colors ${
              isUpdateDisabled
                ? `cursor-not-allowed ${isDarkMode ? "bg-slate-700 text-slate-500" : "bg-[#f0ebe5] text-[#a8a29e]"}`
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {isSubmitting ? "Updating..." : "Update Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;