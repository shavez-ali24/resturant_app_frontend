import React, { useEffect, useRef, useState } from "react";
import { recalcTotal } from "../commonOrderFile/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Truck, Utensils, AlertCircle, Plus, Minus } from "lucide-react";
import { XCircleIcon } from "@heroicons/react/24/solid";

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
  tables
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
  // INIT ORDER DATA (SAFE)
  // =============================
  useEffect(() => {
    if (editingOrder) {
      const normalizedItems = editingOrder.items.map(item => {
        // Look up the menu item from menuItems prop to get variantRates
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
          menuItemId: item.menuItemId || item.menuItem?._id || item._id,
          name: item.name || item.menuItem?.name || menuItem?.name || "",
          price: priceMeta.finalPrice,
          originalUnitPrice: priceMeta.originalPrice,
          discountedUnitPrice: priceMeta.finalPrice,
          quantity: item.quantity ?? 1,
          pricingType: resolvedPricingType,
          // Ensure variantName is set for variant items
          variantName: selectedVariant,
          variant: selectedVariant,
          // Keep variants only for variant-pricing items
          variants: resolvedVariants,
          customizations: item.customizations || ""
        };
      });
      const newLocalOrderData = {
        ...editingOrder,
        items: normalizedItems
      };
      
      setLocalOrderData(newLocalOrderData);
      setInitialOrderData(JSON.parse(JSON.stringify(newLocalOrderData))); // Deep copy for comparison
      setRemovedItemIds([]);
      
      // Set address if exists (for Delivery orders)
      if (editingOrder.address) {
        setAddress(editingOrder.address);
        setInitialAddress(editingOrder.address);
      }
      
      // Set tableId if exists (for Eat Here orders)
      if (editingOrder.tableId) {
        setSelectedTableId(editingOrder.tableId);
        setInitialTableId(editingOrder.tableId);
      }
      
      setIsDirty(false);
      setHasUserChanges(false);
      setAddItemValue("");
      setValidationErrors({
        table: "",
        address: "",
        items: ""
      });
    }
  }, [editingOrder, menuItems]);

  // Check if any changes were made
  useEffect(() => {
    if (!localOrderData || !initialOrderData) return;
    
    // Check order type change
    const orderTypeChanged = localOrderData.orderType !== initialOrderData.orderType;
    
    // Check items changes
    const itemsChanged = JSON.stringify(localOrderData.items) !== JSON.stringify(initialOrderData.items);
    
    // Check address change
    const addressChanged = address !== initialAddress;
    
    // Check table change
    const tableChanged = selectedTableId !== initialTableId;
    
    const hasChanges = orderTypeChanged || itemsChanged || addressChanged || tableChanged;
    setIsDirty(hasChanges || hasUserChanges);
    
  }, [localOrderData, initialOrderData, address, selectedTableId, initialAddress, initialTableId, hasUserChanges]);

  useEffect(() => {
    if (itemsContainerRef.current && localOrderData?.items) {
      itemsContainerRef.current.scrollTop =
        itemsContainerRef.current.scrollHeight;
    }
  }, [localOrderData?.items]);

  if (!editingOrder) return null;

  // Show loading state while data is initializing
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
    const isDuplicateEvent =
      guard.menuItemId === menuItemId && now - guard.ts < 300;
    if (isDuplicateEvent) return;

    addItemGuardRef.current = { menuItemId, ts: now };

    const selected = menuItems.find(m => m._id === menuItemId);
    if (!selected) {
      setAddItemValue("");
      return;
    }

    let newItem;

    if (selected.pricingType === "variant" && selected.variantRates) {
      // Get first variant key
      const firstVariantKey = Object.keys(selected.variantRates)[0];
      const firstVariantData = selected.variantRates[firstVariantKey];
      const firstVariantMeta = getVariantPriceMeta(firstVariantData);
      
      newItem = {
        menuItemId: selected._id,
        name: selected.name,
        quantity: 1,
        pricingType: "variant",
        variantName: firstVariantKey,
        variants: selected.variantRates,
        price: firstVariantMeta.finalPrice,
        originalUnitPrice: firstVariantMeta.originalPrice,
        discountedUnitPrice: firstVariantMeta.finalPrice,
        customizations: ""
      };
    } else {
      const itemPriceMeta = getItemPriceMeta(selected, selected);
      newItem = {
        menuItemId: selected._id,
        name: selected.name,
        quantity: 1,
        pricingType: "single",
        variantName: null,
        variants: null,
        price: itemPriceMeta.finalPrice,
        originalUnitPrice: itemPriceMeta.originalPrice,
        discountedUnitPrice: itemPriceMeta.finalPrice,
        customizations: ""
      };
    }
    // console.log("Adding Item:", newItem);

    setLocalOrderData(prev => {
      if (!prev) return prev;
      const items = [...(prev.items || []), newItem];
      return {
        ...prev,
        items,
        totalAmount: recalcTotal(items)
      };
    });
    setHasUserChanges(true);
    setAddItemValue("");
    
    // Clear items validation error when adding item
    if (validationErrors.items) {
      setValidationErrors(prev => ({ ...prev, items: "" }));
    }

    setTimeout(() => {
      if (addItemGuardRef.current.menuItemId === menuItemId) {
        addItemGuardRef.current = { menuItemId: "", ts: 0 };
      }
    }, 350);
    
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // VARIANT CHANGE
  // =============================
  const handleVariantChange = (idx, variant) => {
    const items = [...localOrderData.items];
    const item = items[idx];

    if (!item.variants || !item.variants[variant]) return;

    const variantMeta = getVariantPriceMeta(item.variants[variant]);
    item.variantName = variant;
    item.price = variantMeta.finalPrice;
    item.originalUnitPrice = variantMeta.originalPrice;
    item.discountedUnitPrice = variantMeta.finalPrice;

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    setHasUserChanges(true);
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // QUANTITY CHANGE
  // =============================
  const handleQuantityChange = (idx, qty) => {
    const items = [...localOrderData.items];

    if (qty === "") {
      items[idx].quantity = "";
    } else {
      const parsedQuantity = parseInt(qty, 10);
      if (Number.isNaN(parsedQuantity)) return;
      items[idx].quantity = Math.max(0, parsedQuantity);
    }

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    setHasUserChanges(true);
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // REMOVE ITEM (MIN 1)
  // =============================
  const handleRemoveItem = (idx) => {
    if (localOrderData.items.length <= 1) {
      setValidationErrors(prev => ({ 
        ...prev, 
        items: "Minimum 1 item required" 
      }));
      return;
    }

    const removedItem = localOrderData.items[idx];
    if (removedItem?._id) {
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
    
    // Clear items validation error if items exist
    if (items.length > 0 && validationErrors.items) {
      setValidationErrors(prev => ({ ...prev, items: "" }));
    }
    
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // ORDER TYPE CHANGE
  // =============================
  const handleOrderTypeChange = (orderType) => {
    const currentType = localOrderData.orderType?.toLowerCase();
    const newType = orderType.toLowerCase();
    
    // Clear fields based on transition
    if (currentType === "delivery" && newType === "eat here") {
      // Delivery → Eat Here: Need tableId, clear address
      setAddress("");
    } else if (currentType === "delivery" && newType === "take away") {
      // Delivery → Take Away: Clear address
      setAddress("");
    } else if (currentType === "eat here" && newType === "take away") {
      // Eat Here → Take Away: Clear tableId
      setSelectedTableId("");
    } else if (currentType === "eat here" && newType === "delivery") {
      // Eat Here → Delivery: Need address, clear tableId
      setSelectedTableId("");
    } else if (currentType === "take away" && newType === "eat here") {
      // Take Away → Eat Here: Need tableId
      // Keep as is
    } else if (currentType === "take away" && newType === "delivery") {
      // Take Away → Delivery: Need address
      // Keep as is
    }

    // Clear validation errors when order type changes
    setValidationErrors({
      table: "",
      address: "",
      items: validationErrors.items // Keep items error if any
    });

    setLocalOrderData(prev => ({
      ...prev,
      orderType
    }));
    setHasUserChanges(true);
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // TABLE SELECTION CHANGE
  // =============================
  const handleTableChange = (tableId) => {
    setSelectedTableId(tableId);
    setHasUserChanges(true);
    
    // Clear table validation error when user selects a table
    if (tableId && validationErrors.table) {
      setValidationErrors(prev => ({ ...prev, table: "" }));
    }
    
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // ADDRESS CHANGE
  // =============================
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    setHasUserChanges(true);
    
    // Clear address validation error when user starts typing
    if (value.trim() && validationErrors.address) {
      setValidationErrors(prev => ({ ...prev, address: "" }));
    }
    
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // 🔥 FIXED: FINAL UPDATE ORDER (WITHOUT ALERT)
  // =============================
  const handleUpdateOrder = async () => {
    if (isSubmitting || !isDirty) return;
    
    // Validate based on order type
    let errors = {
      table: "",
      address: "",
      items: ""
    };
    let hasError = false;

    // Items validation
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
    
    if (localOrderData.orderType?.toLowerCase() === "eat here" && !selectedTableId) {
      errors.table = "Please select a table for Eat Here order";
      hasError = true;
    }
    
    if (localOrderData.orderType?.toLowerCase() === "delivery" && !address.trim()) {
      errors.address = "Please enter address for Delivery order";
      hasError = true;
    }
    
    setValidationErrors(errors);
    
    if (hasError) {
      // Scroll to first error
      setTimeout(() => {
        const errorElements = document.querySelectorAll('[data-error="true"]');
        if (errorElements.length > 0) {
          errorElements[0].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      return;
    }
    
    setIsSubmitting(true);

    try {
      const payload = {
        status: localOrderData.status,
        orderType: localOrderData.orderType,
        replaceItems: true,
        removeItemIds: removedItemIds,
        items: localOrderData.items.map(item => {
          // For variant items, ensure variant is set
          const variantValue = item.variantName || item.variant || null;
          return {
            menuItemId: item.menuItemId,
            quantity: Number(item.quantity),
            variant: variantValue,
            customizations: item.customizations || ""
          };
          // console.log(quantity, variantValue, item.customizations);
        })
      };

      // Add tableId for Eat Here
      if (localOrderData.orderType?.toLowerCase() === "eat here" && selectedTableId) {
        payload.tableId = selectedTableId;
      }

      // Add address for Delivery
      if (localOrderData.orderType?.toLowerCase() === "delivery" && address.trim()) {
        payload.address = address.trim();
      }

      // Clear tableId for Take Away (if exists from previous state)
      if (localOrderData.orderType?.toLowerCase() === "take away") {
        payload.tableId = null;
        payload.address = null;
      }

      // ✅ FIXED: Call updateOrder with correct parameters
      await updateOrder(localOrderData._id, payload);
      setRemovedItemIds([]);
      
      setEditingOrder(null);
    } catch (err) {
      console.error("Update Order Failed:", err);
      const errorMsg =
        typeof getFriendlyErrorMessage === "function"
          ? getFriendlyErrorMessage(err, "update")
          : "Unable to update order right now.";
      // Show error in items section
      setValidationErrors(prev => ({
        ...prev,
        items: errorMsg
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpdateDisabled = isSubmitting || localOrderData.items.length === 0 || !isDirty;
  const itemsSubtotal = recalcTotal(localOrderData?.items || []);

  const handleBackdropClick = (e) => {
    if (e.target.id === "editOrderBackdrop") {
      setEditingOrder(null);
    }
  };

  // =============================
  // ORDER TYPE ICON HELPER
  // =============================
  const getOrderTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case "eat here":
        return <Utensils size={16} />;
      case "take away":
        return <Home size={16} />;
      case "delivery":
        return <Truck size={16} />;
      default:
        return <Utensils size={16} />;
    }
  };

  // =============================
  // ORDER TYPE BADGE HELPER
  // =============================
  const getOrderTypeBadge = () => "border-orange-200 bg-white text-gray-700 hover:border-orange-300";

  // Format tables data (dynamic from props)
  const availableTables = Array.isArray(tables) ? tables : [];

  // Find current table to display
  const currentTable = availableTables.find(table => 
    table._id === selectedTableId || table.tableNumber === selectedTableId
  );

  // =============================
  // UI
  // =============================
  return (
    <div
      id="editOrderBackdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 z-[9999]"
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl border-2 shadow-lg w-full max-w-[calc(100vw-1rem)] sm:max-w-md p-4 sm:p-6 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Edit Order</h3>
          <button
            type="button"
            onClick={() => setEditingOrder(null)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-orange-100 hover:text-orange-700"
            aria-label="Close edit order modal"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Order Type Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Type
          </label>
          <Select
            value={localOrderData.orderType}
            onValueChange={handleOrderTypeChange}
          >
            <SelectTrigger className={`h-11 w-full rounded-xl border px-3 text-sm font-semibold shadow-sm transition-all outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${getOrderTypeBadge(localOrderData.orderType)}`}>
              <div className="flex items-center gap-2">
                {getOrderTypeIcon(localOrderData.orderType)}
                <span>{localOrderData.orderType || "Select Type"}</span>
              </div>
            </SelectTrigger>
            <SelectContent
              side="top"
              sideOffset={6}
              className="z-[10050] w-[var(--radix-select-trigger-width)] max-h-[45dvh] rounded-xl border border-orange-200 bg-white p-1 shadow-xl sm:max-h-[60vh]"
            >
              <SelectGroup>
                <SelectItem 
                  value="Eat Here" 
                  className="cursor-pointer rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800"
                >
                  <div className="flex items-center gap-2">
                    <Utensils size={16} />
                    Eat Here
                  </div>
                </SelectItem>
                <SelectItem 
                  value="Take Away" 
                  className="cursor-pointer rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800"
                >
                  <div className="flex items-center gap-2">
                    <Home size={16} />
                    Take Away
                  </div>
                </SelectItem>
                <SelectItem 
                  value="Delivery" 
                  className="cursor-pointer rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800"
                >
                  <div className="flex items-center gap-2">
                    <Truck size={16} />
                    Delivery
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Table Selection - Only show when "Eat Here" is selected */}
        {localOrderData.orderType?.toLowerCase() === "eat here" && (
          <div className="mb-4" data-error={!!validationErrors.table}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Table *
            </label>
            <Select
              value={selectedTableId}
              onValueChange={handleTableChange}
            >
              <SelectTrigger className={`h-11 w-full rounded-xl px-3 text-sm font-semibold shadow-sm transition-all outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${
                validationErrors.table 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-orange-200 bg-white hover:border-orange-300'
              }`}>
                {selectedTableId && currentTable ? (
                  <span>Table {currentTable.tableNumber || currentTable.name}</span>
                ) : (
                  <SelectValue placeholder="Select Table" />
                )}
              </SelectTrigger>
              <SelectContent
                side="top"
                sideOffset={6}
                className="z-[10050] w-[var(--radix-select-trigger-width)] max-h-[45dvh] cursor-pointer rounded-xl border border-orange-200 bg-white p-1 shadow-xl sm:max-h-[60vh]"
              >
                <SelectGroup>
                  {availableTables.length > 0 ? (
                    availableTables.map((table) => (
                      <SelectItem
                        key={table._id}
                        value={table._id} // Use _id as value
                        className="cursor-pointer rounded-lg border-orange-300 hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800"
                      >
                        <div className="flex justify-between items-center w-full gap-4 pb-2 pt-1">
                          <span>Table {table.tableNumber || table.name}</span>
                          {table.capacity && (
                            <span className="text-sm text-gray-600 gap-2 flex items-center text-orange-600">
                              {table.capacity} seats
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-tables" disabled className="text-gray-400">
                      No tables available
                    </SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            {validationErrors.table && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {validationErrors.table}
              </p>
            )}
          </div>
        )}

        {/* Address Input - Only show when "Delivery" is selected */}
        {localOrderData.orderType?.toLowerCase() === "delivery" && (
          <div className="mb-4" data-error={!!validationErrors.address}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Address *
            </label>
            <textarea
              value={address}
              onChange={handleAddressChange}
              placeholder="Enter delivery address"
              className={`w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                validationErrors.address 
                  ? 'border-red-500 bg-red-50 focus:border-red-500' 
                  : 'border-orange-300 focus:border-orange-500'
              }`}
              required
            />
            {validationErrors.address && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {validationErrors.address}
              </p>
            )}
          </div>
        )}

        {/* Items Section */}
        <div className="mb-4" data-error={!!validationErrors.items}>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Order Items
            </label>
            <span className={`text-xs ${
              validationErrors.items || localOrderData.items.length === 0 
                ? 'text-red-500' 
                : 'text-gray-500'
            }`}>
              {localOrderData.items.length} item{localOrderData.items.length !== 1 ? 's' : ''}
              {validationErrors.items && ` - ${validationErrors.items}`}
            </span>
          </div>
          
          <div
            ref={itemsContainerRef}
            className={`space-y-3 mb-4 max-h-52 sm:max-h-64 overflow-y-auto border rounded-lg p-3 ${
              validationErrors.items 
                ? 'border-red-300 bg-red-50' 
                : 'border-orange-300 bg-gray-50'
            }`}
          >
            {localOrderData.items.length === 0 ? (
              <div className="text-center py-4 text-gray-500 italic">
                No items in order. Please add at least one item.
              </div>
            ) : (
              localOrderData.items.map((item, idx) => {
                const unitPrice = Number(item.price || 0);
                const quantity = Number(item.quantity ?? 1);
                const originalUnitPrice = Number(item.originalUnitPrice || unitPrice);
                const showOldPrice = originalUnitPrice > unitPrice;
                const rowTotal = unitPrice * quantity;
                const oldRowTotal = originalUnitPrice * quantity;

                return (
                  <div
                    key={`${item.menuItemId}-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-orange-300 shadow-sm"
                  >
                    {/* Item Info */}
                    <div className="flex-1 sm:mr-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-800">
                          {item.name}
                        </span>
                        <div className="ml-2 text-right">
                          {showOldPrice && (
                            <div className="text-xs text-gray-400 line-through">
                              ₹{oldRowTotal.toFixed(2)}
                            </div>
                          )}
                          <span className="font-bold text-orange-600">
                            ₹{rowTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Variants Selector */}
                      {item.pricingType === "variant" && item.variants && Object.keys(item.variants).length > 0 ? (
                        <Select
                          value={item.variantName || ""}
                          onValueChange={(value) => handleVariantChange(idx, value)}
                        >
                          <SelectTrigger className="h-9 w-full rounded-lg border border-orange-200 bg-white text-xs shadow-sm transition-all outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 hover:border-orange-300 sm:max-w-[240px]">
                            <SelectValue placeholder="Select variant" />
                          </SelectTrigger>
                          <SelectContent className="z-[10050] w-[var(--radix-select-trigger-width)] max-w-[240px] rounded-lg border border-orange-200 bg-white p-1 shadow-lg">
                            <SelectGroup>
                              {item.variants && item.variants !== null && Object.entries(item.variants).map(([key, variantData]) => {
                                if (!variantData) return null;
                                const variantPriceMeta = getVariantDropdownPriceMeta(key, variantData);
                                return (
                                  <SelectItem 
                                    key={key} 
                                    value={key}
                                    className="cursor-pointer rounded-md text-[11px] hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800"
                                  >
                                    <div className="flex w-full items-center justify-between gap-3">
                                      <span className="truncate text-[11px] sm:text-xs">{variantPriceMeta.label}</span>
                                      <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-orange-600 sm:text-xs">
                                        {variantPriceMeta.showOldPrice && (
                                          <span className="text-[10px] text-gray-400 line-through sm:text-[11px]">
                                            {formatCurrency(variantPriceMeta.originalPrice)}
                                          </span>
                                        )}
                                        <span className="font-semibold text-orange-600 text-[11px] sm:text-xs">
                                          {formatCurrency(variantPriceMeta.finalPrice)}
                                        </span>
                                      </span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      ) : null}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(idx, Math.max(1, quantity - 1))}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-orange-200 bg-white text-orange-700 transition-colors hover:bg-orange-50"
                          title="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          className="w-14 border rounded-lg px-2 py-1 text-center hover:border-orange-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(idx, quantity + 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-orange-200 bg-white text-orange-700 transition-colors hover:bg-orange-50"
                          title="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      
                      {/* Remove Button - Disabled if only one item */}
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        disabled={localOrderData.items.length <= 1}
                        className={`px-2 py-1 rounded text-xs ${
                          localOrderData.items.length <= 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                        }`}
                        title={localOrderData.items.length <= 1 ? "Minimum 1 item required" : "Remove item"}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Add New Item Dropdown */}
        <div className="mb-4">
          <Select value={addItemValue} onValueChange={handleAddItem}>
            <SelectTrigger className="h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold shadow-sm transition-all outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 hover:border-orange-300">
              <SelectValue placeholder="+ Add New Item" />
            </SelectTrigger>
            <SelectContent
              side="top"
              sideOffset={6}
              className="z-[10050] w-[var(--radix-select-trigger-width)] max-h-[36dvh] cursor-pointer rounded-xl border border-orange-200 bg-white p-1 shadow-xl sm:max-h-[46vh]"
            >
              <SelectGroup>
                {menuItems.map((menu) => (
                  <SelectItem 
                    key={menu._id} 
                    value={menu._id} 
                    className="cursor-pointer rounded-lg border-orange-300 text-[11px] hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800 sm:text-xs"
                  >
                    <div className="flex justify-between items-center w-full gap-3 pb-2 pt-1">
                      <span className="truncate text-[11px] sm:text-xs">{menu.name}</span>
                      <span className="text-[11px] sm:text-xs text-gray-600 gap-1.5 flex items-center text-orange-600 shrink-0">
                        {(() => {
                          const menuPriceMeta = getMenuDropdownPriceMeta(menu);
                          if (menuPriceMeta.isVariant) {
                            return "Variants";
                          }

                          const showOldPrice = menuPriceMeta.originalPrice > menuPriceMeta.finalPrice;
                          return (
                            <>
                              {showOldPrice && (
                                <span className="text-[10px] text-gray-400 line-through sm:text-[11px]">
                                  {formatCurrency(menuPriceMeta.originalPrice)}
                                </span>
                              )}
                              <span className="font-semibold text-orange-600 text-[11px] sm:text-xs">
                                {formatCurrency(menuPriceMeta.finalPrice)}
                              </span>
                            </>
                          );
                        })()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Items Subtotal */}
        <div className="mb-6 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">Items Total</span>
            <span className="text-xl font-bold text-orange-600">
              ₹{itemsSubtotal}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            onClick={() => setEditingOrder(null)}
            className="h-11 w-full rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 sm:w-auto"
          >
            Cancel
          </button>

          <button
            onClick={handleUpdateOrder}
            disabled={isUpdateDisabled}
            className={`h-11 w-full rounded-xl px-4 text-sm font-semibold transition-colors sm:w-auto ${
              isUpdateDisabled
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm hover:from-orange-600 hover:to-orange-600'
            }`}
          >
            {isSubmitting ? 'Updating...' : 'Update Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
