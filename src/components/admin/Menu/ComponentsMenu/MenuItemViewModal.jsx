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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleBackdropClick}
          />

          {/* Modal Wrapper */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border-2 border-orange-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 transition-colors"
              >
                <X size={20} />
              </button>

              {/* LEFT – IMAGE */}
              <div className="w-full md:w-2/5 h-[300px] md:h-[500px] bg-orange-50 relative">
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
                  <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                    <Package size={16} />
                    <span>COMBO</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent"></div>
              </div>

              {/* RIGHT – DETAILS */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto relative">
                {/* Title */}
                <div className="mb-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {item.name}
                  </h2>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-orange-500" />
                      <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium border border-orange-300">
                        {item.category || "Uncategorized"}
                      </span>
                    </div>
                    
                    <div
                      className={`px-3 py-1 text-xs font-bold text-white rounded-full ${
                        item.type === "veg"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {item.type === "veg" ? "VEG" : "NON-VEG"}
                    </div>
                    
                    <div className="px-3 py-1 text-xs font-bold text-white rounded-full bg-orange-500">
                      {isSinglePricing ? "SINGLE" : 
                       isVariantPricing ? "VARIANT" : 
                       "COMBO"}
                    </div>
                    
                    <div
                      className={`px-3 py-1 text-xs font-bold text-white rounded-full ${
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
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-orange-500" />
                    <h3 className="font-semibold text-orange-700 text-sm uppercase tracking-wider">
                      Description
                    </h3>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-orange-100">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {item.description || "No description available"}
                    </p>
                  </div>
                </div>

                {/* PRICE SECTION - Unified Style */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-orange-500" />
                    <h3 className="text-lg font-semibold text-orange-800">
                      Pricing Details
                    </h3>
                  </div>
                  
                  {/* Single Price - Unified Style */}
                  {isSinglePricing && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-200 shadow-sm">
                      <div className="flex items-center justify-center">
                        {discountedPriceInfo ? (
                          <div className="flex items-center gap-6">
                            <div className="flex items-center">
                              <IndianRupee size={28} className="text-orange-600" />
                              <span className="text-4xl font-bold text-orange-600">
                                {discountedPriceInfo.discounted}
                              </span>
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-xl text-gray-400 line-through">
                                ₹{discountedPriceInfo.original}
                              </span>
                              <span className="mt-1 text-sm bg-orange-200 text-orange-700 px-3 py-1 rounded-full font-medium">
                                {discountedPriceInfo.discountText}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <IndianRupee size={28} className="text-orange-600" />
                            <span className="text-4xl font-bold text-orange-600">
                              {item.price}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Variant Prices - Unified Style */}
                  {isVariantPricing && variantDisplay.length > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-200 shadow-sm">
                      <div className="grid grid-cols-3 gap-4">
                        {variantDisplay.map((variant) => (
                          <div 
                            key={variant.key} 
                            className={`bg-white rounded-lg p-4 text-center border-2 ${
                              variant.hasDiscount ? 'border-orange-300' : 'border-orange-200'
                            }`}
                          >
                            <div className="text-sm text-orange-600 font-medium mb-2 uppercase">
                              {variant.label}
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <IndianRupee size={20} className="text-orange-600" />
                              <span className={`font-bold text-orange-600 ${
                                variant.hasDiscount ? 'text-2xl' : 'text-xl'
                              }`}>
                                {variant.discountedPrice || variant.originalPrice}
                              </span>
                            </div>
                            {variant.hasDiscount && (
                              <div className="mt-2">
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                  {variant.discountText}
                                </span>
                                <div className="text-xs text-gray-400 line-through mt-1">
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
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-200 shadow-sm">
                      {/* Combo Price Display */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center">
                          <IndianRupee size={28} className="text-orange-600" />
                          <span className="text-4xl font-bold text-orange-600">
                            {item.comboPrice || "0.00"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Combo Items List */}
                      {comboItemsDisplay.length > 0 && (
                        <div className="pt-4 border-t border-orange-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Layers size={16} className="text-orange-500" />
                            <h4 className="font-semibold text-orange-700">Combo Includes:</h4>
                          </div>
                          
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {comboItemsDisplay.map((comboItem) => (
                              <div 
                                key={comboItem.id} 
                                className="flex items-center justify-between bg-white/70 p-3 rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                  <div>
                                    <div className="font-medium text-gray-800 text-sm">
                                      {comboItem.name || `Item ${comboItem.id + 1}`}
                                      {comboItem.variant && (
                                        <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                                          {comboItem.variant}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600">
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
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MenuItemViewModal;
