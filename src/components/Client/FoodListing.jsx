"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import {
  addToCart,
  removeFromCart,
  updateCartItem,
} from "../../redux/clientRedux/clientSlice";
import { Dot, ChevronsUpDown, Plus, Edit3, X, Percent } from "lucide-react";
import { Button } from "../ui/button";

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
}) {
  const groupedMenu = groupByCategory(menu || []);
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

  return (
    <div className="bg-white flex flex-col pb-20 px-2 sm:px-3 pt-2">
      {Object.keys(groupedMenu).map((category) => {
        const itemsInCategory = groupedMenu[category] || [];
        const layoutMode =
          itemsInCategory.length === 1
            ? "single"
            : itemsInCategory.length === 2
            ? "double"
            : "multi";

        const containerClass =
          layoutMode === "multi"
            ? "flex gap-3 sm:gap-4 overflow-x-auto overflow-y-visible scroll-hidden -mx-2 sm:-mx-3 px-2 sm:px-3 py-3"
            : `grid gap-4 ${
                layoutMode === "single"
                  ? "grid-cols-1 py-3"
                  : "grid-cols-2 py-3"
              }`;

        return (
          <div key={category} id={`category-${category}`} className="">
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
            <div className="flex items-center gap-2 pt:2">
              <div className="relative w-3 h-3">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full animate-ping"></div>
              </div>
              <h2 className="text-base font-semibold text-gray-800 tracking-wide">
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
                  <div
                    key={item._id}
                    className={`relative bg-white rounded-2xl shadow-md transition-transform hover:scale-[1.02] ${
                      isUnavailable ? "opacity-60 grayscale" : "opacity-100"
                    } ${
                      layoutMode === "multi"
                        ? "flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]"
                        : "w-[140px] sm:w-[160px] md:w-[180px]"
                    } ${isMenuOpen ? "z-10" : ""}`}
                  >
                    {/* ✅ Image Section */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        openDescription(item);
                      }}
                      className={`relative w-full h-28 overflow-hidden rounded-t-2xl cursor-pointer`}
                    >
                      <img
                        src={item.image?.url}
                        alt={item.name}
                        className="w-full h-full object-cover object-center"
                      />
                      {/* Veg / Non-Veg / Mixed dot badge over image */}
                      <div className="absolute top-2 left-2 backdrop-blur-sm bg-white/80 p-1 rounded-full shadow-sm border border-white/70">
                        {item.type === "veg" ? (
                          <Dot
                            size={12}
                            strokeWidth={12}
                            className="border-2 border-green-700 text-green-700"
                          />
                        ) : item.type === "non-veg" ? (
                          <Dot
                            size={12}
                            strokeWidth={12}
                            className="border-2 border-red-600 text-red-600"
                          />
                        ) : (
                          <Dot
                            size={12}
                            strokeWidth={12}
                            className="border-2 border-orange-600 text-orange-600"
                          />
                        )}
                      </div>
                      
                      {/* Discount badge */}
                      {hasDiscount && (
                        <div className="absolute top-2 right-2 backdrop-blur-sm bg-green-600/90 text-white px-2 py-1 rounded-full shadow-sm border border-white/70 flex items-center gap-1">
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
                        <div className="absolute bottom-2 left-2 backdrop-blur-sm bg-orange-600/90 text-white px-2 py-1 rounded-full shadow-sm border border-white/70 flex items-center gap-1">
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
                    <div className="p-2 flex flex-col gap-1 h-28">
                      {/* Item Name with Pencil Icon */}
                      <h3 className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 h-8 flex items-center justify-between">
                        <span className="flex-1 truncate pr-1">{item.name}</span>
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

                            {isMenuOpen && (
                              <div
                                className="absolute -left-2 bottom-0 w-[120px] rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden z-10"
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
                                    const originalVariantPrice = Number(price.price || 0);
                                    
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
                                        className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition ${
                                          isActive
                                            ? "bg-gray-100 text-orange-700 font-semibold"
                                            : "text-gray-700 hover:bg-orange-50"
                                        }`}
                                      >
                                        <span>{formatVariantLabel(key)}</span>
                                        
                                        {/* ✅ सिर्फ final price (discount के बाद) */}
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
                              </div>
                            )}
                          </div>
                        ) : null}
                        
                        {/* Show price for variants below selection */}
                        {item.pricingType === "variant" && selectedVariant && variantPrice && (
                          <div className="flex items-center gap-1 mt-1">
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
                          <div className="flex items-center gap-1 mt-1">
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
                                      className="rounded-lg h-5 w-5 p-0 text-xs font-bold border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      -
                                    </Button>
                                    <span className="text-xs font-medium min-w-[12px] text-center">
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
                                      className="rounded-lg h-5 w-5 p-0 text-xs font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                  className="rounded-lg px-2 py-1 text-xs font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                                >
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Description Modal - Fixed Size with Scroll */}
      {descModal.open && descModal.item && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8"
          onClick={closeDescription}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
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
                className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full bg-white shadow-md text-gray-500 hover:text-red-500 hover:shadow-lg transition"
                aria-label="Close description"
              >
                <X size={20} />
              </button>

              {/* Food type badge */}
              <div className="absolute top-4 left-4 backdrop-blur-sm bg-white/80 p-2 rounded-full shadow-sm border border-white/70">
                {descModal.item.type === "veg" ? (
                  <Dot
                    size={16}
                    strokeWidth={12}
                    className="border-2 border-green-700 text-green-700"
                  />
                ) : descModal.item.type === "non-veg" ? (
                  <Dot
                    size={16}
                    strokeWidth={12}
                    className="border-2 border-red-600 text-red-600"
                  />
                ) : (
                  <Dot
                    size={16}
                    strokeWidth={12}
                    className="border-2 border-orange-600 text-orange-600"
                  />
                )}
              </div>

              {/* Category and badges */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                {descModal.item.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-800">
                    {descModal.item.category}
                  </span>
                )}
                {descModal.item.pricingType === "combo" && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-600/80 text-white">
                    Combo ({getComboItemsCount(descModal.item)} items)
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold text-gray-900 leading-snug">
                  {descModal.item.name}
                </h3>
                <div
                  className={
                    isLongDescription ? "max-h-40 overflow-y-auto pr-1" : ""
                  }
                >
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {descModal.item.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Price display with discount - consistent colors */}
                {(() => {
                  const item = descModal.item;
                  
                  // Use same base price logic as cards
                  let basePrice = item.price;
                  if (item.pricingType === "combo") {
                    basePrice = item.comboPrice;
                  }
                  
                  const hasItemDiscount = hasActiveDiscount(item) && Number(item.discount?.value || 0) > 0;
                  const discountedItemPrice = calculateDiscountedPrice(item);
                  const originalItemPrice = basePrice;
                  
                  if (item.pricingType === "combo") {
                    return (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          {hasItemDiscount && originalItemPrice > 0 && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{originalItemPrice.toFixed(2)}
                            </span>
                          )}
                          <span className={`text-lg font-bold ${hasItemDiscount ? 'text-orange-600' : 'text-orange-700'}`}>
                            ₹{Number(discountedItemPrice).toFixed(2)}
                          </span>
                        </div>
                        {hasItemDiscount && (
                          <span className="text-xs text-orange-600 font-medium">
                            {item.discount?.type?.toLowerCase() === "percentage" 
                              ? `${item.discount.value}% OFF` 
                              : `₹${item.discount.value} OFF`}
                          </span>
                        )}
                        {/* <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                          Combo ({getComboItemsCount(item)} items)
                        </span> */}
                      </div>
                    );
                  } else if (item.pricingType === "variant") {
                    const variantRates = item.variantRates || {};
                    return Object.entries(variantRates).map(([key, variant]) => {
                      const hasVariantDiscount = hasActiveDiscount(item, key) && Number(variant.discount?.value || 0) > 0;
                      const discountedVariantPrice = calculateDiscountedPrice(item, key);
                      const originalVariantPrice = Number(variant.price || 0);
                      
                      return (
                        <div key={key} className="flex flex-col items-center">
                          <span className="text-xs font-medium text-gray-500 capitalize">
                            {formatVariantLabel(key)}
                          </span>
                          <div className="flex items-center gap-1">
                            {hasVariantDiscount && originalVariantPrice > 0 && (
                              <span className="text-xs text-gray-400 line-through">
                                ₹{originalVariantPrice.toFixed(2)}
                              </span>
                            )}
                            <span className={`text-sm font-bold ${hasVariantDiscount ? 'text-orange-600' : 'text-orange-700'}`}>
                              ₹{Number(discountedVariantPrice).toFixed(2)}
                            </span>
                          </div>
                          {hasVariantDiscount && (
                            <span className="text-xs text-orange-600 font-medium">
                              {variant.discount?.type?.toLowerCase() === "percentage" 
                                ? `${variant.discount.value}% OFF` 
                                : `₹${variant.discount.value} OFF`}
                            </span>
                          )}
                        </div>
                      );
                    });
                  } else {
                    // Use same base price logic as cards
                    let basePrice = item.price;
                    
                    const hasItemDiscount = hasActiveDiscount(item) && Number(item.discount?.value || 0) > 0;
                    const discountedItemPrice = calculateDiscountedPrice(item);
                    const originalItemPrice = basePrice;
                    
                    return (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          {hasItemDiscount && originalItemPrice > 0 && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{originalItemPrice.toFixed(2)}
                            </span>
                          )}
                          <span className={`text-lg font-bold ${hasItemDiscount ? 'text-orange-600' : 'text-orange-700'}`}>
                            ₹{Number(discountedItemPrice).toFixed(2)}
                          </span>
                        </div>
                        {hasItemDiscount && (
                          <span className="text-xs text-orange-600 font-medium">
                            {item.discount?.type?.toLowerCase() === "percentage" 
                              ? `${item.discount.value}% OFF` 
                              : `₹${item.discount.value} OFF`}
                          </span>
                        )}
                      </div>
                    );
                  }
                })()}
                
                {descModal.item.pricingType === "variant" && (
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    Multiple portions available
                  </span>
                )}
                {!descModal.item.available && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    Currently unavailable
                  </span>
                )}
              </div>

              {/* Combo items details */}
              {descModal.item.pricingType === "combo" && descModal.item.comboItems && (
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2">
                    Combo Includes ({descModal.item.comboItems.length} items)
                  </h4>
                  <div className="space-y-2">
                    {descModal.item.comboItems.map((comboItem, index) => (
                      <div key={index} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-orange-200">
                        <span className="text-sm text-gray-700">
                          {getComboItemName(comboItem, menu)}
                        </span>
                        <div className="flex items-center gap-2">
                          {comboItem.variant && (
                            <span className="text-xs text-gray-500 bg-orange-100 px-2 py-1 rounded">
                              {comboItem.variant}
                            </span>
                          )}
                          <span className="text-xs text-gray-600">
                            Qty: {comboItem.quantity || 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {descModal.item.ingredients?.length ? (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Key Ingredients
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {descModal.item.ingredients.map((ingredient, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-600"
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
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {customizationModal.open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8"
          onClick={closeCustomization}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeCustomization}
              className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full bg-white shadow-md text-gray-500 hover:text-red-500 hover:shadow-lg transition"
              aria-label="Close customizations"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-gray-900">
                  Add Customization
                </h3>
                <p className="text-sm text-gray-600">
                  Add special instructions or notes for this item
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Customization Note
                </label>
                <textarea
                  value={customizationModal.customizations}
                  onChange={(e) =>
                    setCustomizationModal({
                      ...customizationModal,
                      customizations: e.target.value,
                    })
                  }
                  placeholder="e.g., No onions, Extra spicy, Less salt..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm"
                  rows={4}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 text-right">
                  {customizationModal.customizations.length}/200
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={closeCustomization}
                  className="rounded-full px-6"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="rounded-full px-6 bg-primary text-white hover:bg-primary/90"
                  onClick={handleCustomizationSave}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}