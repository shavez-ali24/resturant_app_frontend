import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  PlusCircleIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from "@heroicons/react/24/solid";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ComboItemsManager = ({
  comboItems = [],
  setComboItems,
  menuItems = [],
  errors = {},
  foodType = "mixed",
  isLoadingMenu = false,
  discount = null,
  comboPrice = null
}) => {
  const [availableMenuItems, setAvailableMenuItems] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const MotionDiv = motion.div;

  // Filter menu items based on food type and availability
  useEffect(() => {
    if (!menuItems || menuItems.length === 0) {
      setAvailableMenuItems([]);
      return;
    }

    // Filter out combo items, deleted items, and unavailable items
    const filtered = menuItems.filter(item => {
      if (!item) return false;
      
      if (!item._id && !item.id) return false;

      const isDeleted = item.deleted === true;
      const isCombo = item.pricingType === "combo";
      const isUnavailable = item.available === false;
      
      return !isDeleted && !isCombo && !isUnavailable;
    });

    // Apply food type filter
    const typeFiltered = foodType === "mixed" 
      ? filtered 
      : filtered.filter(item => {
          if (!item.type) return true;
          return item.type === foodType || item.type === "mixed";
        });

    setAvailableMenuItems(typeFiltered);
  }, [menuItems, foodType]);

  const addComboItem = () => {
    if (isLoadingMenu) return;
    
    setComboItems(prev => [
      ...prev,
      { 
        menuItemId: "", 
        variant: "", 
        quantity: 1,
        name: ""
      }
    ]);
    setExpandedIndex(comboItems.length);
  };

  const removeComboItem = (index) => {
    setComboItems(prev => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex > index) {
      setExpandedIndex(prev => prev - 1);
    }
  };

  const handleComboItemChange = (index, field, value) => {
    setComboItems(prev => {
      const updated = [...prev];
      
      if (field === "menuItemId") {
        const selectedItem = availableMenuItems.find(item => {
          const itemId = item._id || item.id;
          return itemId === value;
        });
        
        updated[index] = {
          ...updated[index],
          [field]: value,
          name: selectedItem ? selectedItem.name : "",
          variant: selectedItem?.pricingType === "variant" ? "" : updated[index].variant
        };
      } else if (field === "variant") {
        updated[index][field] = value;
      } else if (field === "quantity") {
        const quantity = parseInt(value) || 1;
        updated[index][field] = quantity > 0 ? quantity : 1;
      }
      
      return updated;
    });
  };

  const handleQuantityChange = (index, delta) => {
    const currentQty = comboItems[index]?.quantity || 1;
    const newQty = Math.max(1, currentQty + delta);
    handleComboItemChange(index, "quantity", newQty);
  };

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getMenuItemVariants = (menuItemId) => {
    if (!menuItemId) return [];
    
    const item = availableMenuItems.find(item => {
      const itemId = item._id || item.id;
      return itemId === menuItemId;
    });
    
    if (!item || item.pricingType !== "variant") return [];
    
    const variants = [];
    if (item.variantRates?.quarter?.price) {
      variants.push({ value: "quarter", label: "Quarter" });
    }
    if (item.variantRates?.half?.price) {
      variants.push({ value: "half", label: "Half" });
    }
    if (item.variantRates?.full?.price) {
      variants.push({ value: "full", label: "Full" });
    }
    
    return variants;
  };

  const getMenuItemInfo = (menuItemId) => {
    if (!menuItemId) return null;
    
    const item = availableMenuItems.find(item => {
      const itemId = item._id || item.id;
      return itemId === menuItemId;
    });
    
    return item;
  };

  const getVariantPrice = (menuItemId, variant) => {
    const item = getMenuItemInfo(menuItemId);
    if (!item || !variant || item.pricingType !== "variant") return 0;
    
    return item.variantRates?.[variant]?.price || 0;
  };

  const calculateItemTotal = (item) => {
    if (!item.menuItemId) return 0;
    
    const menuItem = getMenuItemInfo(item.menuItemId);
    if (!menuItem) return 0;
    
    let price = 0;
    
    if (menuItem.pricingType === "single") {
      price = Number(menuItem.price) || 0;
    } else if (menuItem.pricingType === "variant" && item.variant) {
      price = Number(getVariantPrice(item.menuItemId, item.variant)) || 0;
    }
    
    return price * (item.quantity || 1);
  };

  const calculateComboValue = () => {
    return comboItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const calculateComboDiscount = (comboPrice, discount) => {
    if (!discount?.active || !discount?.value || !comboPrice) return 0;
    
    const price = Number(comboPrice) || 0;
    const discountValue = Number(discount.value) || 0;
    
    if (discountValue <= 0) return 0;
    
    if (discount.type?.toLowerCase() === "percentage") {
      return (price * discountValue / 100);
    } else {
      return discountValue;
    }
  };

  const calculateFinalComboPrice = (comboPrice, discount) => {
    if (!comboPrice) return 0;
    
    const price = parseFloat(comboPrice);
    const discountAmount = calculateComboDiscount(comboPrice, discount);
    
    return Math.max(0, price - discountAmount);
  };

  const isItemAlreadyAdded = (menuItemId) => {
    return comboItems.some(item => item.menuItemId === menuItemId);
  };

  const getAvailableItemsCount = () => {
    return availableMenuItems.filter(item => {
      const itemId = item._id || item.id;
      return !isItemAlreadyAdded(itemId);
    }).length;
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Combo Items *
          </label>
          <p className="text-xs text-gray-500">
            {isLoadingMenu ? "Loading menu items..." : "Select items to include in this combo"}
          </p>
        </div>
        
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {!isLoadingMenu && availableMenuItems.length > 0 && (
            <span className="text-xs text-gray-600">
              {getAvailableItemsCount()} items available
            </span>
          )}
          <button
            type="button"
            onClick={addComboItem}
            disabled={isLoadingMenu || getAvailableItemsCount() === 0}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <PlusCircleIcon className="h-4 w-4" />
            {isLoadingMenu ? "Loading..." : "Add Item"}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingMenu && (
        <div className="rounded-xl border border-dashed border-orange-200 bg-white/90 py-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="text-sm text-gray-500 mt-2">Loading menu items...</p>
        </div>
      )}

      {/* No Items Available */}
      {!isLoadingMenu && menuItems.length === 0 && (
        <div className="rounded-xl border border-dashed border-orange-200 bg-white/90 py-8 text-center">
          <p className="text-gray-500">No menu items found in database</p>
          <p className="text-sm text-gray-400 mt-1">
            Create some regular menu items first to add to combos
          </p>
        </div>
      )}

      {/* No Available Items After Filter */}
      {!isLoadingMenu && menuItems.length > 0 && availableMenuItems.length === 0 && (
        <div className="rounded-xl border border-dashed border-orange-200 bg-white/90 py-8 text-center">
          <p className="text-gray-500">No available items for combo</p>
          <p className="text-sm text-gray-400 mt-1">
            All items are either combos, deleted, or unavailable
          </p>
        </div>
      )}

      {/* Stats Bar */}
      {!isLoadingMenu && comboItems.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-white p-3 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-semibold text-gray-800">
                {comboItems.length} item{comboItems.length !== 1 ? 's' : ''} in combo
              </span>
              <span className="ml-4 text-sm text-gray-600">
                Total value: ₹{calculateComboValue()}
              </span>
              {comboPrice && (
                <>
                  <span className="ml-4 text-sm text-gray-600">
                    Combo price: ₹{comboPrice}
                  </span>
                  {discount?.active && (
                    <>
                      <span className="text-sm text-green-600 ml-4">
                        You save: ₹{calculateComboDiscount(comboPrice, discount)}
                      </span>
                      <span className="text-sm font-bold text-green-700 ml-4">
                        Final price: ₹{calculateFinalComboPrice(comboPrice, discount)}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
            {errors.comboItems && typeof errors.comboItems === 'string' && (
              <span className="text-sm text-red-600 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {errors.comboItems}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Combo Items List */}
      {!isLoadingMenu && comboItems.length > 0 && (
        <div className="space-y-3">
          {comboItems.map((item, index) => {
            const menuItem = getMenuItemInfo(item.menuItemId);
            const variants = getMenuItemVariants(item.menuItemId);
            const isExpanded = expandedIndex === index;
            const itemTotal = calculateItemTotal(item);
            
            return (
              <MotionDiv
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-xl border border-orange-200 bg-white shadow-sm"
              >
                {/* Item Header */}
                <div 
                  className="flex cursor-pointer items-center justify-between gap-2 bg-orange-50/60 p-4 transition-colors hover:bg-orange-50"
                  onClick={() => toggleExpand(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {menuItem ? menuItem.name : "Select menu item"}
                        {item.quantity > 1 && ` × ${item.quantity}`}
                      </h4>
                      {menuItem && (
                        <p className="text-sm text-gray-500">
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
                    <span className="text-sm font-medium">
                      ₹{itemTotal}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeComboItem(index);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Form */}
                {isExpanded && (
                  <MotionDiv
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-orange-100 bg-white p-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Menu Item Selection - FIXED */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Menu Item *
                        </label>
                        <Select
                          value={item.menuItemId || "none"}
                          onValueChange={(val) => val !== "none" && handleComboItemChange(index, "menuItemId", val)}
                        >
                          <SelectTrigger
                            className={`h-11 w-full rounded-xl border px-3 text-sm font-medium text-gray-700 shadow-sm transition-all outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${
                              !item.menuItemId
                                ? "border-red-500 bg-red-50"
                                : "border-orange-200 bg-white hover:border-orange-300"
                            }`}
                          >
                            <SelectValue placeholder="Select an item" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto rounded-xl border border-orange-200 bg-white p-1 shadow-xl">
                            <SelectGroup>
                              <SelectItem value="none" disabled className="cursor-not-allowed rounded-lg text-sm text-gray-400 data-[disabled]:opacity-70">
                                Select an item
                              </SelectItem>
                              {availableMenuItems.map(menuItem => {
                                const itemId = menuItem._id || menuItem.id;
                                const itemName = menuItem.name || "Unnamed Item";
                                const itemPrice = menuItem.price || 0;
                                const isVariant = menuItem.pricingType === "variant";
                                const alreadyAdded = isItemAlreadyAdded(itemId);
                                
                                return (
                                  <SelectItem 
                                    key={itemId} 
                                    value={itemId}
                                    disabled={alreadyAdded && item.menuItemId !== itemId}
                                    className="cursor-pointer rounded-lg text-sm text-gray-700 data-[disabled]:opacity-50 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800"
                                  >
                                    {itemName} 
                                    {menuItem.pricingType === "single" 
                                      ? ` (₹${itemPrice})` 
                                      : isVariant
                                        ? ` (Variant)`
                                        : ""}
                                    {alreadyAdded && item.menuItemId !== itemId && " - Already in combo"}
                                  </SelectItem>
                                );
                              })}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {!item.menuItemId && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                            Please select a menu item
                          </p>
                        )}
                      </div>

                      {/* Variant Selection - FIXED */}
                      {variants.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Variant *
                          </label>
                          <Select
                            value={item.variant || "none"}
                            onValueChange={(val) => val !== "none" && handleComboItemChange(index, "variant", val)}
                          >
                            <SelectTrigger
                              className={`h-11 w-full rounded-xl border px-3 text-sm font-medium text-gray-700 shadow-sm transition-all outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${
                                !item.variant
                                  ? "border-red-500 bg-red-50"
                                  : "border-orange-200 bg-white hover:border-orange-300"
                              }`}
                            >
                              <SelectValue placeholder="Select variant" />
                            </SelectTrigger>
                            <SelectContent className="min-w-[140px] rounded-xl border border-orange-200 bg-white p-1 shadow-xl">
                              <SelectGroup>
                                <SelectItem value="none" disabled className="cursor-not-allowed rounded-lg text-sm text-gray-400 data-[disabled]:opacity-70">
                                  Select variant
                                </SelectItem>
                                {variants.map(variant => (
                                  <SelectItem 
                                    key={variant.value} 
                                    value={variant.value}
                                    className="cursor-pointer rounded-lg text-sm text-gray-700 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800"
                                  >
                                    {variant.label} (₹{getVariantPrice(item.menuItemId, variant.value)})
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          {variants.length > 0 && !item.variant && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                              Please select a variant for this item
                            </p>
                          )}
                        </div>
                      )}

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, -1)}
                            disabled={(item.quantity || 1) <= 1}
                            className="flex h-11 w-11 items-center justify-center rounded-l-xl border border-orange-200 bg-white text-orange-700 transition-all duration-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          
                          <div className="relative flex-1">
                            <input
                              type="number"
                              value={item.quantity || 1}
                              onChange={(e) => handleComboItemChange(index, "quantity", e.target.value)}
                              min="1"
                              className="h-11 w-full border-y border-orange-200 bg-white p-2.5 text-center text-sm font-medium outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                              <span className="text-xs text-gray-400 ml-3">Qty</span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, 1)}
                            className="flex h-11 w-11 items-center justify-center rounded-r-xl border border-orange-200 bg-white text-orange-700 transition-all duration-200 hover:bg-orange-50"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-500">
                            Quantity in combo
                          </p>
                          <p className="text-xs text-orange-600 font-medium">
                            {item.quantity || 1} item{(item.quantity || 1) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Selected Item Info */}
                    {menuItem && (
                      <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/40 p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{menuItem.name}</p>
                            <p className="text-sm text-gray-600">
                              {menuItem.description?.substring(0, 80) || "No description"}...
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">
                              ₹{itemTotal}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.quantity || 1} × ₹{
                                menuItem.pricingType === "single" 
                                  ? menuItem.price 
                                  : getVariantPrice(item.menuItemId, item.variant)
                              }
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

      {/* Validation Error */}
      {errors.comboItems && typeof errors.comboItems === 'string' && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{errors.comboItems}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ComboItemsManager;
