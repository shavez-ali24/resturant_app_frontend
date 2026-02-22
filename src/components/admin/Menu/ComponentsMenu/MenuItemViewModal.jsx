import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Tag,
  Info,
  IndianRupee,
  Package,
  ShoppingBag,
  Layers,
} from "lucide-react";

const MenuItemViewModal = ({ item, isOpen, onClose, menu = [] }) => {
  if (!isOpen || !item) return null;

  const isVariantPricing = item.pricingType === "variant";
  const isComboPricing = item.pricingType === "combo";
  const isSinglePricing = item.pricingType === "single";

  // Calculate discounted price for single items
  const calculateDiscountedPrice = () => {
    if (!item.price) return null;
    
    const price = parseFloat(item.price);
    if (isNaN(price)) return null;
    
    if (item.discount?.active && item.discount?.value) {
      const discountValue = parseFloat(item.discount.value);
      const discountType = item.discount.type || "flat";
      
      if (discountType === "percentage") {
        const discountedPrice = price - (price * discountValue / 100);
        return {
          original: price.toFixed(2),
          discounted: discountedPrice.toFixed(2),
          discountValue: discountValue,
          discountType: "percentage",
          discountText: `${discountValue}% OFF`
        };
      } else {
        const discountedPrice = price - discountValue;
        return {
          original: price.toFixed(2),
          discounted: discountedPrice.toFixed(2),
          discountValue: discountValue,
          discountType: "flat",
          discountText: `₹${discountValue} OFF`
        };
      }
    }
    
    return null;
  };

  // Calculate variant prices with discounts
  const getVariantDisplay = () => {
    if (!item.variantRates) return [];
    
    const variants = [];
    ["quarter", "half", "full"].forEach((key) => {
      const variant = item.variantRates[key];
      if (variant?.price) {
        const price = parseFloat(variant.price);
        
        if (variant.discount?.active && variant.discount?.value) {
          const discountValue = parseFloat(variant.discount.value);
          const discountType = variant.discount.type || "flat";
          let discountedPrice;
          
          if (discountType === "percentage") {
            discountedPrice = price - (price * discountValue / 100);
          } else {
            discountedPrice = price - discountValue;
          }
          
          variants.push({
            key,
            label: key === "quarter" ? "Quarter" : key === "half" ? "Half" : "Full",
            originalPrice: price.toFixed(2),
            discountedPrice: discountedPrice.toFixed(2),
            discountValue,
            discountType,
            discountText: discountType === "percentage" ? `${discountValue}% OFF` : `₹${discountValue} OFF`,
            hasDiscount: true
          });
        } else {
          variants.push({
            key,
            label: key === "quarter" ? "Quarter" : key === "half" ? "Half" : "Full",
            originalPrice: price.toFixed(2),
            discountedPrice: null,
            hasDiscount: false
          });
        }
      }
    });
    
    return variants;
  };

  // Get combo items display - look up names from menu if not available in comboItem
  const getComboDisplay = () => {
    if (!item.comboItems || !Array.isArray(item.comboItems)) return [];
    
    const menuMap = new Map();
    (Array.isArray(menu) ? menu : []).forEach(menuItem => {
      if (menuItem._id) {
        menuMap.set(String(menuItem._id), menuItem);
      }
    });
    
    return item.comboItems.map((comboItem, index) => {
      let name = comboItem.name;
      
      if (!name && comboItem.menuItemId) {
        const menuItem = menuMap.get(String(comboItem.menuItemId));
        name = menuItem?.name || comboItem.menuItemId;
      }
      
      return {
        id: index,
        name: name || `Item ${index + 1}`,
        variant: comboItem.variant || null,
        quantity: comboItem.quantity || 1,
      };
    });
  };

  const discountedPriceInfo = calculateDiscountedPrice();
  const variantDisplay = getVariantDisplay();
  const comboItemsDisplay = getComboDisplay();
  const MotionDiv = motion.div;
  
  // Handle backdrop click to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
            onClick={handleBackdropClick}
          />

          {/* Modal Wrapper */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative flex max-h-[90dvh] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white/95 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] lg:h-[410px] lg:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm transition-colors hover:bg-orange-100 hover:text-orange-700"
                aria-label="Close item details"
              >
                <X size={18} />
              </button>

              {/* LEFT – IMAGE */}
              <div className="relative h-40 w-full overflow-hidden bg-orange-50 sm:h-48 lg:h-full lg:w-[32%]">
                <img
                  src={
                    item.image?.url ||
                    "https://via.placeholder.com/600x400?text=No+Image"
                  }
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/600x400?text=No+Image";
                  }}
                />
                
                {/* Combo Badge */}
                {isComboPricing && (
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-sm">
                    <Package size={16} />
                    <span>COMBO</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
              </div>

              {/* RIGHT – DETAILS */}
              <div className="relative flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
                {/* Title */}
                <div className="mb-3">
                  <h2 className="mb-2 text-base font-bold text-gray-900 sm:text-lg md:text-xl">
                    {item.name}
                  </h2>
                  
                  {/* Badges */}
                  <div className="mb-2.5 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-orange-500" />
                      <span className="rounded-full border border-orange-300 bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                        {item.category || "Uncategorized"}
                      </span>
                    </div>
                    
                    <div
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${
                        item.type === "veg"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {item.type === "veg" ? "VEG" : "NON-VEG"}
                    </div>
                    
                    <div className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">
                      {isSinglePricing ? "SINGLE" : 
                       isVariantPricing ? "VARIANT" : 
                       "COMBO"}
                    </div>
                    
                    <div
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${
                        item.available
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                    >
                      {item.available ? "AVAILABLE" : "UNAVAILABLE"}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-orange-500" />
                    <h3 className="font-semibold text-orange-700 text-sm uppercase tracking-wider">
                      Description
                    </h3>
                  </div>

                  <div className="h-20 overflow-y-auto rounded-xl border border-orange-200 bg-orange-50/60 p-2.5">
                    <p className="text-xs leading-relaxed text-gray-700 sm:text-sm">
                      {item.description || "No description available"}
                    </p>
                  </div>
                </div>

                {/* PRICE SECTION - Unified Style */}
                <div className="mb-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-orange-500" />
                    <h3 className="text-sm font-semibold text-orange-800 sm:text-base">
                      Pricing Details
                    </h3>
                  </div>
                  
                  {/* Single Price - Unified Style */}
                  {isSinglePricing && (
                    <div className="flex min-h-[110px] items-center justify-center rounded-xl border border-orange-200 bg-orange-50/70 p-3 shadow-sm">
                      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
                        {discountedPriceInfo ? (
                          <>
                            <div className="flex items-center">
                              <IndianRupee className="h-3.5 w-3.5 text-orange-600 sm:h-4 sm:w-4" />
                              <span className="text-base font-bold text-orange-600 sm:text-xl">
                                {discountedPriceInfo.discounted}
                              </span>
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                              <span className="text-xs text-gray-400 line-through sm:text-sm">
                                ₹{discountedPriceInfo.original}
                              </span>
                              <span className="mt-1 rounded-full bg-orange-200 px-2 py-0.5 text-xs font-medium text-orange-700">
                                {discountedPriceInfo.discountText}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center">
                            <IndianRupee className="h-3.5 w-3.5 text-orange-600 sm:h-4 sm:w-4" />
                            <span className="text-base font-bold text-orange-600 sm:text-xl">
                              {item.price}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Variant Prices - Unified Style */}
                  {isVariantPricing && variantDisplay.length > 0 && (
                    <div className="flex min-h-[110px] items-center rounded-xl border border-orange-200 bg-orange-50/70 p-3 shadow-sm">
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        {variantDisplay.map((variant) => (
                          <div 
                            key={variant.key} 
                            className={`rounded-lg border-2 bg-white p-2.5 text-center sm:p-3 ${
                              variant.hasDiscount ? 'border-orange-300' : 'border-orange-200'
                            }`}
                          >
                            <div className="mb-1.5 text-xs font-medium uppercase text-orange-600 sm:text-sm">
                              {variant.label}
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <IndianRupee className="h-3 w-3 text-orange-600 sm:h-3.5 sm:w-3.5" />
                              <span className={`font-bold text-orange-600 ${
                                variant.hasDiscount ? "text-sm sm:text-base" : "text-xs sm:text-sm"
                              }`}>
                                {variant.discountedPrice || variant.originalPrice}
                              </span>
                            </div>
                            {variant.hasDiscount && (
                              <div className="mt-1.5">
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                  {variant.discountText}
                                </span>
                                <div className="mt-1 text-xs text-gray-400 line-through">
                                  ₹{variant.originalPrice}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Combo Pricing - Unified Style */}
                  {isComboPricing && (
                    <div className="flex min-h-[110px] flex-col rounded-xl border border-orange-200 bg-orange-50/70 p-3 shadow-sm sm:p-3.5">
                      {/* Combo Price Display */}
                      <div className="mb-2.5 flex items-center justify-center sm:mb-3">
                        <div className="flex items-center">
                          <IndianRupee className="h-3.5 w-3.5 text-orange-600 sm:h-4 sm:w-4" />
                          <span className="text-base font-bold text-orange-600 sm:text-xl">
                            {item.comboPrice || "0.00"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Combo Items List */}
                      {comboItemsDisplay.length > 0 && (
                        <div className="border-t border-orange-200 pt-2.5 sm:pt-3">
                          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
                            <Layers className="h-4 w-4 text-orange-500" />
                            <h4 className="text-sm font-semibold text-orange-700">Combo Includes:</h4>
                          </div>
                          
                          <div className="max-h-24 space-y-1.5 overflow-y-auto pr-1.5">
                            {comboItemsDisplay.map((comboItem) => (
                              <div 
                                key={comboItem.id} 
                                className="flex items-center justify-between rounded-lg border border-orange-200 bg-white p-2 transition-colors hover:bg-orange-50"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-800 sm:text-sm">
                                      {comboItem.name || `Item ${comboItem.id + 1}`}
                                      {comboItem.variant && (
                                        <span className="ml-1 rounded bg-orange-100 px-1 py-0.5 text-xs text-orange-600 sm:ml-2">
                                          {comboItem.variant}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-600 sm:text-sm">
                                  {comboItem.quantity > 1 ? `×${comboItem.quantity}` : ''}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </MotionDiv>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MenuItemViewModal;
