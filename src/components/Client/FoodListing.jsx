"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import {
  addToCart,
  removeFromCart,
  updateCartItem,
} from "../../redux/clientRedux/clientSlice";
import { Dot, ChevronsUpDown, Edit3, X } from "lucide-react";
import { Button } from "../ui/button";
import { AnimatePresence, motion } from "framer-motion";

const groupByCategory = (items) => {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
};

// Calculate discounted price for items
const calculateDiscountedPrice = (item, variantKey = null) => {
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
    // Fallback to main price
    basePrice = Number(item.price) || 0;
    discount = item.discount;
  }

  // Return original price if no valid discount
  if (!discount?.active || !discount?.value || basePrice === 0) {
    return basePrice;
  }

  const discountValue = Number(discount.value);
  
  // Return original price if discount value is 0 or invalid
  if (discountValue <= 0) {
    return basePrice;
  }
  
  if (discount.type?.toLowerCase() === "percentage") {
    return basePrice - (basePrice * discountValue / 100);
  } else {
    return basePrice - discountValue;
  }
};

// Check if item has active discount
const hasActiveDiscount = (item, variantKey = null) => {
  let discount = null;
  
  if (item.pricingType === "single") {
    discount = item.discount;
  } else if (item.pricingType === "variant" && variantKey) {
    discount = item.variantRates?.[variantKey]?.discount;
  } else if (item.pricingType === "combo") {
    discount = item.discount;
  } else {
    // Fallback to main discount
    discount = item.discount;
  }

  // Only return true if discount is active and has a valid value > 0
  return discount?.active === true && 
         discount?.value !== undefined && 
         discount?.value !== null && 
         Number(discount.value) > 0;
};

// Get combo items count
const getComboItemsCount = (item) => {
  if (item.pricingType === "combo" && item.comboItems) {
    return item.comboItems.length;
  }
  return 0;
};

// Get combo item name from menu data
const getComboItemName = (comboItem, menuData) => {
  if (comboItem.name) return comboItem.name;
  
  // Try to find the item in menu data by ID
  const allItems = [];
  if (menuData && Array.isArray(menuData)) {
    // If menu is an array of items
    allItems.push(...menuData);
  } else if (menuData && typeof menuData === 'object') {
    // If menu is grouped by category
    Object.values(menuData).forEach(categoryItems => {
      if (Array.isArray(categoryItems)) {
        allItems.push(...categoryItems);
      }
    });
  }
  
  const foundItem = allItems.find(menuItem => menuItem._id === comboItem.menuItemId);
  return foundItem?.name || comboItem.menuItemId || "Unknown Item";
};

export default function FoodListing({
  menu,
  onQuantityChange,
  isRestaurantOpen = true,
  isDarkMode = false,
  categoryOrder = [],
}) {
  const normalizeCategoryKey = (value) =>
    String(value || "")
      .replace(/-+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const groupedMenu = groupByCategory(menu || []);
  const groupedKeys = Object.keys(groupedMenu);
  const groupedKeyByNormalized = new Map();

  groupedKeys.forEach((key) => {
    const normalized = normalizeCategoryKey(key);
    if (!groupedKeyByNormalized.has(normalized)) {
      groupedKeyByNormalized.set(normalized, key);
    }
  });

  const orderedCategoryKeys = [];
  (Array.isArray(categoryOrder) ? categoryOrder : []).forEach((cat) => {
    const label = typeof cat === "object" && cat !== null ? cat.name || cat.category : cat;
    const normalized = normalizeCategoryKey(label);
    const resolved = groupedKeyByNormalized.get(normalized);
    if (resolved) {
      orderedCategoryKeys.push(resolved);
      groupedKeyByNormalized.delete(normalized);
    }
  });

  if (groupedKeyByNormalized.size) {
    orderedCategoryKeys.push(...groupedKeyByNormalized.values());
  }
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.client.cart.items || {});
  const [descModal, setDescModal] = useState({ open: false, item: null });
  const [selectedVariants, setSelectedVariants] = useState({});
  const [openVariantMenu, setOpenVariantMenu] = useState(null);
  const [customizationModal, setCustomizationModal] = useState({
    open: false,
    cartKey: null,
    customizations: "",
  });

  useEffect(() => {
    if (!menu) return;
    setSelectedVariants((prev) => {
      let changed = false;
      const next = { ...prev };

      menu.forEach((item) => {
        if (item?.pricingType === "variant") {
          const variantRates = item?.variantRates || {};
          const validVariants = Object.entries(variantRates)
            .filter(([key, price]) => price != null && price !== undefined)
            .map(([key]) => key);
          if (validVariants.length > 0 && !next[item._id]) {
            next[item._id] = validVariants[0];
            changed = true;
          }
        }
      });

      return changed ? next : prev;
    });
  }, [menu]);

  // Close open variant dropdown on any outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenVariantMenu(null);
    };

    if (openVariantMenu) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openVariantMenu]);

  // Helper function to get the correct price for cart total
  const getCartItemPrice = (item) => {
    if (item.pricingType === "combo") {
      return Number(item.comboPrice) || 0;
    }
    if (item.variantKey && item.variantRates) {
      return Number(item.variantRates[item.variantKey]?.price) || 0;
    }
    return Number(item.price) || 0;
  };

  useEffect(() => {
    if (onQuantityChange) {
      const total = Object.values(cartItems).reduce(
        (acc, item) => acc + getCartItemPrice(item) * item.quantity,
        0
      );
      onQuantityChange(total);
    }
  }, [cartItems, onQuantityChange]);

  const formatVariantLabel = (key) =>
    key
      ? key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
      : "";

  const openDescription = (item) => {
    if (!item) return;
    setDescModal({ open: true, item });
  };

  const closeDescription = () => {
    setDescModal({ open: false, item: null });
  };

  const openCustomization = (cartKey) => {
    const currentCustomization = cartItems[cartKey]?.customizations || "";
    setCustomizationModal({
      open: true,
      cartKey,
      customizations: currentCustomization,
    });
    closeDescription();
  };

  const closeCustomization = () => {
    setCustomizationModal({ open: false, cartKey: null, customizations: "" });
  };

  const handleCustomizationSave = () => {
    if (!customizationModal.cartKey) return;
    // Update the cart item with customizations
    dispatch(
      updateCartItem({
        id: customizationModal.cartKey,
        updates: {
          customizations: customizationModal.customizations.trim(),
        },
      })
    );
    closeCustomization();
  };

  const descriptionText =
    descModal.open && descModal.item?.description
      ? descModal.item.description
      : "";
  const isLongDescription =
    descriptionText.split(/\s+/).filter(Boolean).length > 60;
  const customizationTargetItem =
    customizationModal.cartKey && cartItems[customizationModal.cartKey]
      ? cartItems[customizationModal.cartKey]
      : null;
  const customizationItemName = customizationTargetItem?.name || "this item";
  const customizationItemVariant = customizationTargetItem?.variantLabel
    ? ` (${customizationTargetItem.variantLabel})`
    : "";

  return (
    <div className={`flex flex-col px-2 pb-24 pt-2 sm:px-3 ${isDarkMode ? "bg-slate-950" : "bg-white"}`}>
      {orderedCategoryKeys.map((category) => {
        const itemsInCategory = groupedMenu[category] || [];
        const layoutMode =
          itemsInCategory.length === 1
            ? "single"
            : itemsInCategory.length === 2
            ? "double"
            : "multi";

        const hasOpenVariantInSection = itemsInCategory.some(
          (menuItem) => openVariantMenu === menuItem._id
        );
        const containerClass =
          layoutMode === "multi"
            ? "flex gap-3 overflow-x-auto overflow-y-visible scroll-hidden -mx-2 pl-2 pr-0 py-2.5 sm:-mx-3 sm:gap-4 sm:pl-3 sm:pr-1"
            : `grid items-start gap-3 ${
                layoutMode === "single"
                  ? "grid-cols-1 pt-1 pb-2"
                  : "grid-cols-2 pt-1 pb-2"
              }`;

        return (
          <motion.section
            key={category}
            id={`category-${category}`}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`relative ${
              hasOpenVariantInSection ? "z-40" : "z-0"
            }`}
          >
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes expand {
                  0% { 
                    background: linear-gradient(90deg, transparent 0%, #fb923c 50%, transparent 100%);
                    transform: scaleX(0);
                  }
                  50% { 
                    background: linear-gradient(90deg, transparent 0%, #fb923c 50%, transparent 100%);
                    transform: scaleX(1);
                  }
                  100% { 
                    background: linear-gradient(90deg, transparent 0%, #fb923c 50%, transparent 100%);
                    transform: scaleX(0);
                  }
                }
              `
            }} />
            {/* ✅ Category Header */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative h-2.5 w-2.5">
                <div
                  className={`absolute inset-0 rounded-full animate-pulse ${
                    isDarkMode
                      ? "bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 shadow-[0_0_10px_rgba(251,146,60,0.9)]"
                      : "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700"
                  }`}
                ></div>
                <div
                  className={`absolute inset-0 rounded-full animate-ping ${
                    isDarkMode
                      ? "bg-gradient-to-r from-orange-200 via-orange-300 to-orange-400 opacity-70"
                      : "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"
                  }`}
                ></div>
                <div
                  className={`relative h-2.5 w-2.5 rounded-full ${
                    isDarkMode
                      ? "bg-orange-400 ring-1 ring-orange-300/80 shadow-[0_0_6px_rgba(251,146,60,0.95)]"
                      : "bg-orange-600/95 ring-1 ring-orange-300"
                  }`}
                ></div>
              </div>
              <h2 className={`text-base font-semibold tracking-wide ${isDarkMode ? "text-orange-50" : "text-gray-800"}`}>
                {category}
              </h2>
              <div 
                className="relative flex-1 h-px" 
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, #fb923c 50%, transparent 100%)',
                  animation: 'expand 3s ease-in-out infinite',
                  transformOrigin: 'center'
                }}
              />
            </div>

            {/* ✅ Food Cards - Responsive Layout */}
            {layoutMode === "multi" ? (
              <div className="relative">
              <div className={containerClass} style={{ position: "relative" }}>
                  {itemsInCategory.map((item) => {
                    const isMenuOpen = openVariantMenu === item._id;
                    const selectedVariant = item.pricingType === "variant" ? selectedVariants[item._id] : null;
                    const variantRates = item.variantRates || {};
                    const variantPrice = selectedVariant ? variantRates[selectedVariant] : null;
                    
                    const cartKey = item.pricingType === "variant" && selectedVariant
                      ? `${item._id}-${selectedVariant}`
                      : item._id;
                    const quantity = cartItems[cartKey]?.quantity || 0;
                    
                    // Handle different pricing types - same logic as modal
                    let basePrice = item.price;
                    if (item.pricingType === "variant" && selectedVariant && variantPrice) {
                      basePrice = variantPrice.price;
                    } else if (item.pricingType === "combo") {
                      basePrice = item.comboPrice;
                    }
                    
                    // Calculate discounted prices - same as modal
                    const discountedPrice = calculateDiscountedPrice(item, selectedVariant);
                    const hasDiscount = hasActiveDiscount(item, selectedVariant);
                    const originalPrice = basePrice;
                    const comboItemsCount = getComboItemsCount(item);
                    const canAdd = (item.pricingType !== "variant" || (selectedVariant && variantPrice)) && isRestaurantOpen;
                    const isUnavailable = !item.available || !isRestaurantOpen;
                    
                    // Food type color coding
                    const getFoodTypeColor = (type) => {
                      switch(type?.toLowerCase()) {
                        case 'veg': return 'border-green-500';
                        case 'non-veg': return 'border-red-500';
                        case 'mixed': return 'border-orange-500';
                        default: return 'border-gray-300';
                      }
                    };

                    return (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.06 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        whileHover={{ y: -2 }}
                        className={`relative w-[clamp(132px,40vw,166px)] flex-shrink-0 rounded-2xl border border-orange-200/75 bg-gradient-to-b from-white via-orange-50/18 to-white shadow-[0_8px_18px_rgba(249,115,22,0.14)] ${
                          isUnavailable ? "opacity-60 grayscale" : "opacity-100"
                        } ${isMenuOpen ? "z-40 overflow-visible" : "z-10 overflow-hidden"}`}
                      >
                        {/* ✅ Image Section */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            openDescription(item);
                          }}
                          className={`relative h-28 w-full cursor-pointer overflow-hidden rounded-t-2xl`}
                        >
                          <img
                            src={item.image?.url}
                            alt={item.name}
                            className="w-full h-full object-cover object-center"
                          />
                          {/* Veg / Non-Veg / Mixed dot badge over image */}
                          <div className="absolute top-2 left-2 rounded-full bg-white p-1 shadow-sm border border-white">
                            {item.type === "veg" ? (
                              <Dot
                                size={12}
                                strokeWidth={12}
                                className="border-2 border-current text-green-700"
                              />
                            ) : item.type === "non-veg" ? (
                              <Dot
                                size={12}
                                strokeWidth={12}
                                className="border-2 border-current text-red-600"
                              />
                            ) : (
                              <Dot
                                size={12}
                                strokeWidth={12}
                                className="border-2 border-current text-orange-600"
                              />
                            )}
                          </div>
                          
                          {/* Discount badge */}
                          {hasDiscount && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full border border-white bg-green-600 px-2 py-1 text-white shadow-sm">
                              <span className="text-xs font-bold">
                                {item.pricingType === "variant" && selectedVariant
                                  ? (() => {
                                      const discount = variantRates[selectedVariant]?.discount;
                                      const discountValue = Number(discount?.value || 0);
                                      // console.log("🔥 FoodListing - Variant Discount Badge:", { selectedVariant, discount, discountValue });
                                      return discountValue > 0 
                                        ? (discount?.type?.toLowerCase() === "percentage" 
                                          ? `${discountValue}% OFF` 
                                          : `₹${discountValue} OFF`)
                                        : '';
                                    })()
                                  : (() => {
                                      const discount = item.discount;
                                      const discountValue = Number(discount?.value || 0);
                                      // console.log("🔥 FoodListing - Single Discount Badge:", { discount, discountValue });
                                      return discountValue > 0 
                                        ? (discount?.type?.toLowerCase() === "percentage" 
                                          ? `${discountValue}% OFF` 
                                          : `₹${discountValue} OFF`)
                                        : '';
                                    })()
                                }
                              </span>
                            </div>
                          )}
                          
                          {/* Combo badge */}
                          {item.pricingType === "combo" && (
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full border border-white bg-orange-600 px-2 py-1 text-white shadow-sm">
                              <span className="text-xs font-bold">
                                Combo
                              </span>
                            </div>
                          )}
                          {isUnavailable && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">
                              {!item.available ? "Not Available" : "Orders Closed"}
                            </div>
                          )}
                        </div>

                        {/* ✅ Fixed Size Details Section */}
                        <div className="flex h-28 flex-col gap-1 bg-gradient-to-b from-white to-orange-50/35 p-2">
                          {/* Item Name with Pencil Icon */}
                          <h3 className="flex h-10 items-start justify-between text-xs font-semibold leading-tight text-gray-900">
                            <span className="flex-1 line-clamp-1 break-words pr-1">
                              {item.name}
                            </span>
                            {quantity > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCustomization(cartKey);
                                }}
                                className="text-gray-400 hover:text-orange-600 p-0.5 rounded hover:bg-orange-50 flex-shrink-0"
                                title="Customize item"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                            )}
                          </h3>
                          
                          {/* Variant Selection or Price Display */}
                          <div className="flex flex-col items-start">
                            {item.pricingType === "variant" && Object.keys(variantRates).length > 0 ? (
                              <div className="relative z-10 w-full">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenVariantMenu((prev) =>
                                      prev === item._id ? null : item._id
                                    );
                                  }}
                                  className="text-orange-600 text-xs font-semibold hover:underline flex items-center gap-1 w-full justify-between"
                                >
                                  <span className="truncate">
                                    {selectedVariant && variantPrice != null && variantPrice !== undefined
                                      ? formatVariantLabel(selectedVariant)
                                      : "Select size"}
                                  </span>
                                  <ChevronsUpDown className="h-3 w-3 flex-shrink-0" />
                                </button>

                                <AnimatePresence>
                                  {isMenuOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                      transition={{ duration: 0.18, ease: "easeOut" }}
                                      className="absolute bottom-full left-0 z-[70] mb-1.5 w-[128px] overflow-hidden rounded-xl border border-orange-100 bg-white shadow-2xl"
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                    >
                                      {Object.entries(variantRates)
                                        .filter(
                                          ([key, price]) =>
                                            price != null && price !== undefined
                                        )
                                        .map(([key, price]) => {
                                          const isActive =
                                            selectedVariant === key;
                                          const hasVariantDiscount = hasActiveDiscount(item, key) && Number(price.discount?.value || 0) > 0;
                                          const discountedVariantPrice = calculateDiscountedPrice(item, key);
                                          
                                          return (
                                            <button
                                              key={key}
                                              type="button"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                setSelectedVariants((prev) => ({
                                                  ...prev,
                                                  [item._id]: key,
                                                }));
                                                setOpenVariantMenu(null);
                                              }}
                                              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition ${
                                                isActive
                                                  ? "bg-gray-100 font-semibold text-orange-700"
                                                  : "text-gray-700 hover:bg-orange-50"
                                              }`}
                                            >
                                              <span>{formatVariantLabel(key)}</span>
                                              
                                           
                                              {(() => {
                                                const finalPrice = hasVariantDiscount ? 
                                                  discountedVariantPrice : 
                                                  Number(price.price);
                                                return (
                                                  <span className="text-xs font-semibold text-orange-600">
                                                    ₹{finalPrice.toFixed(2)}
                                                  </span>
                                                );
                                              })()}
                                            </button>
                                          );
                                        })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ) : null}
                            
                            {/* Show price for variants below selection */}
                            {item.pricingType === "variant" && selectedVariant && variantPrice && (
                            <div className="mt-1 flex items-center gap-1">
                                {hasDiscount ? (
                                  <>
                                    <span className="text-xs text-gray-400 line-through">
                                      ₹{Number(variantPrice.price).toFixed(2)}
                                    </span>
                                    <span className="text-xs font-bold text-orange-600">
                                      ₹{Number(discountedPrice).toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold text-orange-600">
                                    ₹{Number(variantPrice.price).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Show price for non-variant items */}
                            {item.pricingType !== "variant" && (
                              <div className="mt-1 flex items-center gap-1">
                                {hasDiscount ? (
                                  <>
                                    <span className="text-xs text-gray-400 line-through">
                                      ₹{Number(originalPrice).toFixed(2)}
                                    </span>
                                    <span className="text-xs font-bold text-orange-600">
                                      ₹{Number(discountedPrice).toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold text-orange-600">
                                    ₹{Number(originalPrice).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Add Button */}
                          <div className="mt-auto">
                            {!item.available ? null : (
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex-1" />
                                <div className="flex items-center gap-1">
                                  {quantity > 0 ? (
                                    <>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(removeFromCart(cartKey));
                                          }}
                                          disabled={!isRestaurantOpen}
                                          className="h-6 w-6 rounded-lg border-gray-300 p-0 text-xs font-bold hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          -
                                        </Button>
                                        <span className="min-w-[14px] text-center text-xs font-semibold">
                                          {quantity}
                                        </span>
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(
                                              addToCart({
                                                id: cartKey,
                                                item: {
                                                  ...item,
                                                  price: discountedPrice || basePrice,
                                                  originalPrice: originalPrice,
                                                  hasDiscount: hasDiscount,
                                                  variantKey: selectedVariant,
                                                  variantLabel:
                                                    selectedVariant &&
                                                    variantPrice != null &&
                                                    variantPrice !== undefined
                                                      ? formatVariantLabel(selectedVariant)
                                                      : null,
                                                  customizations:
                                                    cartItems[cartKey]?.customizations || "",
                                                },
                                                quantity: 1,
                                              })
                                            );
                                          }}
                                          disabled={!isRestaurantOpen || !canAdd}
                                          className="client-add-button h-6 w-6 rounded-lg p-0 text-xs font-bold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          +
                                        </Button>
                                      </div>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch(
                                          addToCart({
                                            id: cartKey,
                                            item: {
                                              ...item,
                                              price: discountedPrice || basePrice,
                                              originalPrice: originalPrice,
                                              hasDiscount: hasDiscount,
                                              variantKey: selectedVariant,
                                              variantLabel:
                                                selectedVariant &&
                                                variantPrice != null &&
                                                variantPrice !== undefined
                                                  ? formatVariantLabel(selectedVariant)
                                                  : null,
                                              customizations:
                                                cartItems[cartKey]?.customizations || "",
                                            },
                                            quantity: 1,
                                          })
                                        );
                                      }}
                                      disabled={!isRestaurantOpen || !canAdd}
                                      className="client-add-button h-8 w-full rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Add
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
                <div className={`pointer-events-none absolute inset-y-2 right-0 w-4 bg-gradient-to-l ${isDarkMode ? "from-slate-950" : "from-[#fff8f2]"} to-transparent`} />
              </div>
            ) : (
              <div className={containerClass} style={{ position: "relative" }}>
                {itemsInCategory.map((item) => {
                const isMenuOpen = openVariantMenu === item._id;
                const selectedVariant = item.pricingType === "variant" ? selectedVariants[item._id] : null;
                const variantRates = item.variantRates || {};
                const variantPrice = selectedVariant ? variantRates[selectedVariant] : null;
                
                const cartKey = item.pricingType === "variant" && selectedVariant
                  ? `${item._id}-${selectedVariant}`
                  : item._id;
                const quantity = cartItems[cartKey]?.quantity || 0;
                
                // Handle different pricing types - same logic as modal
                let basePrice = item.price;
                if (item.pricingType === "variant" && selectedVariant && variantPrice) {
                  basePrice = variantPrice.price;
                } else if (item.pricingType === "combo") {
                  basePrice = item.comboPrice;
                }
                
                // Calculate discounted prices - same as modal
                const discountedPrice = calculateDiscountedPrice(item, selectedVariant);
                const hasDiscount = hasActiveDiscount(item, selectedVariant);
                const originalPrice = basePrice;
                const comboItemsCount = getComboItemsCount(item);
                const canAdd = (item.pricingType !== "variant" || (selectedVariant && variantPrice)) && isRestaurantOpen;
                const isUnavailable = !item.available || !isRestaurantOpen;
                
                // Food type color coding
                const getFoodTypeColor = (type) => {
                  switch(type?.toLowerCase()) {
                    case 'veg': return 'border-green-500';
                    case 'non-veg': return 'border-red-500';
                    case 'mixed': return 'border-orange-500';
                    default: return 'border-gray-300';
                  }
                };

                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.06 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    whileHover={layoutMode === "single" ? { y: 0 } : { y: -2 }}
                    className={`relative rounded-2xl border border-orange-200/75 bg-gradient-to-b from-white via-orange-50/18 to-white shadow-[0_8px_18px_rgba(249,115,22,0.14)] ${
                      isUnavailable ? "opacity-60 grayscale" : "opacity-100"
                    } ${
                      layoutMode === "single"
                        ? "flex min-h-[128px] w-full self-start"
                        : "w-full"
                    } ${isMenuOpen ? "z-40 overflow-visible" : "z-10 overflow-hidden"}`}
                  >
                    {/* ✅ Image Section */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        openDescription(item);
                      }}
                      className={`relative cursor-pointer overflow-hidden ${
                        layoutMode === "single"
                          ? "h-[128px] w-[118px] shrink-0 rounded-l-2xl rounded-tr-none sm:w-[126px]"
                          : "h-28 w-full rounded-t-2xl"
                      }`}
                    >
                      <img
                        src={item.image?.url}
                        alt={item.name}
                        className="w-full h-full object-cover object-center"
                      />
                      {/* Veg / Non-Veg / Mixed dot badge over image */}
                      <div className="absolute top-2 left-2 rounded-full bg-white p-1 shadow-sm border border-white">
                        {item.type === "veg" ? (
                          <Dot
                            size={12}
                            strokeWidth={12}
                            className="border-2 border-current text-green-700"
                          />
                        ) : item.type === "non-veg" ? (
                          <Dot
                            size={12}
                            strokeWidth={12}
                            className="border-2 border-current text-red-600"
                          />
                        ) : (
                          <Dot
                            size={12}
                            strokeWidth={12}
                            className="border-2 border-current text-orange-600"
                          />
                        )}
                      </div>
                      
                      {/* Discount badge */}
                      {hasDiscount && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full border border-white bg-green-600 px-2 py-1 text-white shadow-sm">
                          <span className="text-xs font-bold">
                            {item.pricingType === "variant" && selectedVariant
                              ? (() => {
                                  const discount = variantRates[selectedVariant]?.discount;
                                  const discountValue = Number(discount?.value || 0);
                                  // console.log("🔥 FoodListing - Variant Discount Badge:", { selectedVariant, discount, discountValue });
                                  return discountValue > 0 
                                    ? (discount?.type?.toLowerCase() === "percentage" 
                                      ? `${discountValue}% OFF` 
                                      : `₹${discountValue} OFF`)
                                    : '';
                                })()
                              : (() => {
                                  const discount = item.discount;
                                  const discountValue = Number(discount?.value || 0);
                                  // console.log("🔥 FoodListing - Single Discount Badge:", { discount, discountValue });
                                  return discountValue > 0 
                                    ? (discount?.type?.toLowerCase() === "percentage" 
                                      ? `${discountValue}% OFF` 
                                      : `₹${discountValue} OFF`)
                                    : '';
                                })()
                            }
                          </span>
                        </div>
                      )}
                      
                      {/* Combo badge */}
                      {item.pricingType === "combo" && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full border border-white bg-orange-600 px-2 py-1 text-white shadow-sm">
                          <span className="text-xs font-bold">
                            Combo
                          </span>
                        </div>
                      )}
                      {isUnavailable && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">
                          {!item.available ? "Not Available" : "Orders Closed"}
                        </div>
                      )}
                    </div>

                    {/* ✅ Fixed Size Details Section */}
                    <div
                      className={`flex flex-col gap-1 bg-gradient-to-b from-white to-orange-50/35 ${
                        layoutMode === "single"
                          ? "min-h-[128px] flex-1 justify-start px-3 py-2"
                          : "h-28 p-2"
                      }`}
                    >
                      {/* Item Name with Pencil Icon */}
                      <h3
                        className={`flex items-start justify-between leading-tight text-gray-900 ${
                          layoutMode === "single"
                            ? "h-10 text-sm font-semibold"
                            : "h-10 text-xs font-semibold"
                        }`}
                      >
                        <span className="flex-1 line-clamp-2 break-words pr-1">
                          {item.name}
                        </span>
                        {quantity > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCustomization(cartKey);
                            }}
                            className="text-gray-400 hover:text-orange-600 p-0.5 rounded hover:bg-orange-50 flex-shrink-0"
                            title="Customize item"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        )}
                      </h3>
                      
                      {/* Variant Selection or Price Display */}
                      <div className="flex flex-col items-start">
                        {item.pricingType === "variant" && Object.keys(variantRates).length > 0 ? (
                          <div className="relative z-10 w-full">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenVariantMenu((prev) =>
                                  prev === item._id ? null : item._id
                                );
                              }}
                              className="text-orange-600 text-xs font-semibold hover:underline flex items-center gap-1 w-full justify-between"
                            >
                              <span className="truncate">
                                {selectedVariant && variantPrice != null && variantPrice !== undefined
                                  ? formatVariantLabel(selectedVariant)
                                  : "Select size"}
                              </span>
                              <ChevronsUpDown className="h-3 w-3 flex-shrink-0" />
                            </button>

                            <AnimatePresence>
                              {isMenuOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                  transition={{ duration: 0.18, ease: "easeOut" }}
                                  className="absolute left-0 top-full z-[70] mt-1.5 w-[128px] overflow-hidden rounded-xl border border-orange-100 bg-white shadow-2xl"
                                  onClick={(event) =>
                                    event.stopPropagation()
                                  }
                                >
                                  {Object.entries(variantRates)
                                    .filter(
                                      ([key, price]) =>
                                        price != null && price !== undefined
                                    )
                                    .map(([key, price]) => {
                                      const isActive =
                                        selectedVariant === key;
                                      const hasVariantDiscount = hasActiveDiscount(item, key) && Number(price.discount?.value || 0) > 0;
                                      const discountedVariantPrice = calculateDiscountedPrice(item, key);
                                      
                                      return (
                                        <button
                                          key={key}
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setSelectedVariants((prev) => ({
                                              ...prev,
                                              [item._id]: key,
                                            }));
                                            setOpenVariantMenu(null);
                                          }}
                                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition ${
                                            isActive
                                              ? "bg-gray-100 font-semibold text-orange-700"
                                              : "text-gray-700 hover:bg-orange-50"
                                          }`}
                                        >
                                          <span>{formatVariantLabel(key)}</span>
                                          
                                        
                                          {(() => {
                                            const finalPrice = hasVariantDiscount ? 
                                              discountedVariantPrice : 
                                              Number(price.price);
                                            return (
                                              <span className="text-xs font-semibold text-orange-600">
                                                ₹{finalPrice.toFixed(2)}
                                              </span>
                                            );
                                          })()}
                                        </button>
                                      );
                                    })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : null}
                        
                        {/* Show price for variants below selection */}
                        {item.pricingType === "variant" && selectedVariant && variantPrice && (
                        <div className="mt-1 flex items-center gap-1">
                            {hasDiscount ? (
                              <>
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{Number(variantPrice.price).toFixed(2)}
                                </span>
                                <span className="text-xs font-bold text-orange-600">
                                  ₹{Number(discountedPrice).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-orange-600">
                                ₹{Number(variantPrice.price).toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Show price for non-variant items */}
                        {item.pricingType !== "variant" && (
                          <div className="mt-1 flex items-center gap-1">
                            {hasDiscount ? (
                              <>
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{Number(originalPrice).toFixed(2)}
                                </span>
                                <span className="text-xs font-bold text-orange-600">
                                  ₹{Number(discountedPrice).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-orange-600">
                                ₹{Number(originalPrice).toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Add Button */}
                      <div className="mt-auto">
                        {!item.available ? null : (
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex-1" />
                            <div className="flex items-center gap-1">
                              {quantity > 0 ? (
                                <>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch(removeFromCart(cartKey));
                                      }}
                                      disabled={!isRestaurantOpen}
                                      className="h-6 w-6 rounded-lg border-gray-300 p-0 text-xs font-bold hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      -
                                    </Button>
                                    <span className="min-w-[14px] text-center text-xs font-semibold">
                                      {quantity}
                                    </span>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch(
                                          addToCart({
                                            id: cartKey,
                                            item: {
                                              ...item,
                                              price: discountedPrice || basePrice,
                                              originalPrice: originalPrice,
                                              hasDiscount: hasDiscount,
                                              variantKey: selectedVariant,
                                              variantLabel:
                                                selectedVariant &&
                                                variantPrice != null &&
                                                variantPrice !== undefined
                                                  ? formatVariantLabel(selectedVariant)
                                                  : null,
                                              customizations:
                                                cartItems[cartKey]?.customizations || "",
                                            },
                                            quantity: 1,
                                          })
                                        );
                                      }}
                                      disabled={!isRestaurantOpen || !canAdd}
                                      className="client-add-button h-6 w-6 rounded-lg p-0 text-xs font-bold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      +
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dispatch(
                                      addToCart({
                                        id: cartKey,
                                        item: {
                                          ...item,
                                          price: discountedPrice || basePrice,
                                          originalPrice: originalPrice,
                                          hasDiscount: hasDiscount,
                                          variantKey: selectedVariant,
                                          variantLabel:
                                            selectedVariant &&
                                            variantPrice != null &&
                                            variantPrice !== undefined
                                              ? formatVariantLabel(selectedVariant)
                                              : null,
                                          customizations:
                                            cartItems[cartKey]?.customizations || "",
                                        },
                                        quantity: 1,
                                      })
                                    );
                                  }}
                                  disabled={!isRestaurantOpen || !canAdd}
                                  className="client-add-button h-8 w-full rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            )}
          </motion.section>
        );
      })}
      {/* Description Modal - Fixed Size with Scroll */}
      <AnimatePresence>
        {descModal.open && descModal.item && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
            onClick={closeDescription}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={`relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border shadow-2xl ${
                isDarkMode
                  ? "border-slate-700 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800"
                  : "border-orange-100/90 bg-gradient-to-b from-[#fffaf4] via-[#fff7f0] to-[#fff2e8]"
              }`}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 290, damping: 24 }}
            >
            {/* Header with Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={descModal.item.image?.url}
                alt={descModal.item.name}
                className="w-full h-full object-cover object-center"
              />
              
              {/* Close button */}
              <button
                onClick={closeDescription}
                className={`absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full shadow-md transition ${
                  isDarkMode
                    ? "bg-slate-900/95 text-slate-200 hover:text-red-400 hover:shadow-lg"
                    : "bg-white text-gray-500 hover:text-red-500 hover:shadow-lg"
                }`}
                aria-label="Close description"
              >
                <X size={20} />
              </button>

              {/* Food type badge */}
              <div className={`absolute top-4 left-4 rounded-full p-2 shadow-sm border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-white"}`}>
                {descModal.item.type === "veg" ? (
                  <Dot
                    size={16}
                    strokeWidth={12}
                    className="border-2 border-current text-green-700"
                  />
                ) : descModal.item.type === "non-veg" ? (
                  <Dot
                    size={16}
                    strokeWidth={12}
                    className="border-2 border-current text-red-600"
                  />
                ) : (
                  <Dot
                    size={16}
                    strokeWidth={12}
                    className="border-2 border-current text-orange-600"
                  />
                )}
              </div>

              {/* Category and badges */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                {descModal.item.category && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isDarkMode ? "bg-slate-900/90 text-slate-100 border border-slate-600" : "bg-white text-gray-800"
                  }`}>
                    {descModal.item.category}
                  </span>
                )}
                {descModal.item.pricingType === "combo" && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isDarkMode ? "bg-orange-500/20 text-orange-200 border border-orange-500/40" : "bg-orange-600/80 text-white"
                  }`}>
                    Combo ({getComboItemsCount(descModal.item)} items)
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <h3 className={`text-2xl font-bold leading-snug ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                  {descModal.item.name}
                </h3>
                <div
                  className={
                    isLongDescription ? "max-h-40 overflow-y-auto pr-1" : ""
                  }
                >
                  <p className={`text-sm leading-relaxed ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
                    {descModal.item.description}
                  </p>
                </div>
              </div>

              <div
                className={`rounded-2xl border p-3 shadow-sm ${
                  isDarkMode
                    ? "border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                    : "border-orange-100/80 bg-gradient-to-br from-[#fff8f1] via-[#fffdf9] to-[#fff3e9]"
                }`}
              >
                <div className="space-y-2">
                  {(() => {
                    const item = descModal.item;
                    const getDiscountLabel = (discount) => {
                      const value = Number(discount?.value || 0);
                      if (value <= 0) return "";
                      return discount?.type?.toLowerCase() === "percentage"
                        ? `${value}% OFF`
                        : `₹${value} OFF`;
                    };

                    const renderPriceLine = (label, originalPrice, finalPrice, discountLabel, key) => (
                      <div
                        key={key || label}
                        className={`flex items-center justify-between gap-1.5 border-b pb-1.5 last:border-b-0 last:pb-0 ${
                          isDarkMode ? "border-slate-700" : "border-orange-100/80"
                        }`}
                      >
                        <span className={`text-xs font-semibold leading-none sm:text-sm ${isDarkMode ? "text-slate-200" : "text-gray-700"}`}>
                          {label}
                        </span>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {originalPrice > finalPrice && (
                            <span className={`text-xs line-through ${isDarkMode ? "text-slate-400" : "text-gray-400"}`}>
                              ₹{Number(originalPrice).toFixed(2)}
                            </span>
                          )}
                          <span className="text-base font-bold leading-none text-orange-600">
                            ₹{Number(finalPrice).toFixed(2)}
                          </span>
                          {discountLabel ? (
                            <span className={`rounded-full px-1.5 py-0 text-[9px] font-semibold ${
                              isDarkMode ? "bg-orange-500/20 text-orange-300" : "bg-orange-50 text-orange-600"
                            }`}>
                              {discountLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );

                    if (item.pricingType === "variant") {
                      const variantRates = item.variantRates || {};

                      return Object.entries(variantRates)
                        .filter(([, variant]) => variant?.price != null)
                        .map(([key, variant]) => {
                          const hasVariantDiscount =
                            hasActiveDiscount(item, key) &&
                            Number(variant.discount?.value || 0) > 0;
                          const discountedVariantPrice = calculateDiscountedPrice(
                            item,
                            key
                          );
                          const originalVariantPrice = Number(variant.price || 0);
                          const discountLabel = hasVariantDiscount
                            ? getDiscountLabel(variant.discount)
                            : "";

                          return renderPriceLine(
                            formatVariantLabel(key),
                            originalVariantPrice,
                            discountedVariantPrice,
                            discountLabel,
                            key
                          );
                        });
                    }

                    let basePrice = item.price;
                    if (item.pricingType === "combo") {
                      basePrice = item.comboPrice;
                    }

                    const hasItemDiscount =
                      hasActiveDiscount(item) && Number(item.discount?.value || 0) > 0;
                    const discountedItemPrice = calculateDiscountedPrice(item);
                    const originalItemPrice = Number(basePrice || 0);
                    const discountLabel = getDiscountLabel(item.discount);

                    return renderPriceLine(
                      item.pricingType === "combo" ? "Combo" : "Price",
                      originalItemPrice,
                      discountedItemPrice,
                      hasItemDiscount ? discountLabel : "",
                      "base-price"
                    );
                  })()}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {!descModal.item.available && (
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
                      isDarkMode
                        ? "text-red-300 bg-red-500/20 border-red-500/40"
                        : "text-red-600 bg-red-50 border-red-100"
                    }`}>
                      Currently unavailable
                    </span>
                  )}
                </div>
              </div>

              {/* Combo items details */}
              {descModal.item.pricingType === "combo" && descModal.item.comboItems && (
                <div className={`rounded-2xl p-4 border ${
                  isDarkMode ? "bg-slate-900/80 border-slate-700" : "bg-orange-50 border-orange-100"
                }`}>
                  <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? "text-orange-300" : "text-orange-800"}`}>
                    Combo Includes ({descModal.item.comboItems.length} items)
                  </h4>
                  <div className="space-y-2">
                    {descModal.item.comboItems.map((comboItem, index) => (
                      <div key={index} className={`flex justify-between items-center rounded-lg px-3 py-2 border ${
                        isDarkMode ? "bg-slate-900 border-slate-600" : "bg-white border-orange-200"
                      }`}>
                        <span className={`text-sm ${isDarkMode ? "text-slate-100" : "text-gray-700"}`}>
                          {getComboItemName(comboItem, menu)}
                        </span>
                        <div className="flex items-center gap-2">
                          {comboItem.variant && (
                            <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? "text-orange-200 bg-orange-500/20" : "text-gray-500 bg-orange-100"}`}>
                              {comboItem.variant}
                            </span>
                          )}
                          <span className={`text-xs ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
                            Qty: {comboItem.quantity || 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {descModal.item.ingredients?.length ? (
                <div className={`rounded-2xl p-4 border ${
                  isDarkMode ? "bg-slate-900/80 border-slate-700" : "bg-gray-50 border-gray-100"
                }`}>
                  <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
                    Key Ingredients
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {descModal.item.ingredients.map((ingredient, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full border text-xs ${
                          isDarkMode
                            ? "bg-slate-900 border-slate-600 text-slate-300"
                            : "bg-white border-gray-200 text-gray-600"
                        }`}
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-end">
                <Button
                  size="sm"
                  className="rounded-full px-6 bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    closeDescription();
                  }}
                >
                  Got it
                </Button>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customization Modal */}
      <AnimatePresence>
        {customizationModal.open && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
            onClick={closeCustomization}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={`relative w-full max-w-[390px] overflow-hidden rounded-3xl border shadow-2xl ${
                isDarkMode
                  ? "border-slate-700 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800"
                  : "border-orange-200/90 bg-gradient-to-b from-[#fffdf9] via-[#fff7ef] to-[#fff3e8]"
              }`}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 290, damping: 24 }}
            >
            <button
              onClick={closeCustomization}
              className={`absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full shadow-md transition ${
                isDarkMode
                  ? "bg-slate-900/95 text-slate-200 hover:text-red-400 hover:shadow-lg"
                  : "bg-white/95 text-gray-500 hover:text-red-500 hover:shadow-lg"
              }`}
              aria-label="Close customizations"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-5 space-y-4 sm:p-6">
              <div className="flex flex-col gap-2">
                <h3 className={`text-lg font-bold sm:text-xl ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                  Add Customization
                </h3>
                <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
                  Add special instructions for{" "}
                  <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
                    {customizationItemName}
                    {customizationItemVariant}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <textarea
                  value={customizationModal.customizations}
                  onChange={(e) =>
                    setCustomizationModal({
                      ...customizationModal,
                      customizations: e.target.value,
                    })
                  }
                  placeholder="Add note"
                  className={`w-full resize-none rounded-xl border px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    isDarkMode
                      ? "border-slate-600 bg-slate-900 text-slate-100"
                      : "border-orange-200 bg-white text-gray-800"
                  }`}
                  rows={4}
                  maxLength={200}
                />
                <p className={`text-right text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                  {customizationModal.customizations.length}/200
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={closeCustomization}
                  className={`rounded-full px-6 ${
                    isDarkMode
                      ? "border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
                      : "border-orange-200 bg-white text-gray-700 hover:bg-orange-50"
                  }`}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="rounded-full px-6 bg-primary text-white shadow-md hover:bg-primary/90"
                  onClick={handleCustomizationSave}
                >
                  Save
                </Button>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
