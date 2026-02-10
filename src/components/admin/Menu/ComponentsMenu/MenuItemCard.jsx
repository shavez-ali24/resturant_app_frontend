import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MoreVertical,
  Edit,
  Trash2,
  Tag,
  CheckCircle,
  XCircle,
} from "lucide-react";

const MenuItemCard = ({ item = {}, onEdit, onDelete, onView, isAdmin = true }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  /* ---------------- SAFE VALUE EXTRACTORS ---------------- */

  const getText = (val) => {
    if (val == null) return "";
    if (typeof val === "object") {
      return val.name || val.title || val.label || "";
    }
    return String(val);
  };

  const getNumber = (val) => {
    if (val == null) return "";
    if (typeof val === "object") {
      const firstNumber = Object.values(val).find(
        (v) => typeof v === "number"
      );
      return firstNumber ?? "";
    }
    return val;
  };

  /* ---------------- SANITIZED DATA ---------------- */

  const safeItem = {
    name: getText(item.name),
    category: getText(item.category),
    description: getText(item.description),
    price: getNumber(item.price),
    variantRates: item.variantRates || {},
    type: item.type || "veg",
    available: item.available !== undefined ? item.available : true,
    pricingType: item.pricingType || "single",
    image: item.image || {},
    discount: item.discount || null,
    comboPrice: item.comboPrice || "",
    comboItems: item.comboItems || [],
    isCombo: item.isCombo || false,
  };

  const isVariantPricing = safeItem.pricingType === "variant";
  const isComboPricing = safeItem.pricingType === "combo";
  const isSinglePricing = safeItem.pricingType === "single";

  // Calculate final price with discount for single items
  const getFinalPrice = () => {
    if (!isSinglePricing || !safeItem.price) return "";
    
    const price = parseFloat(safeItem.price);
    if (isNaN(price)) return "";
    
    if (safeItem.discount?.active && safeItem.discount?.value) {
      const discountValue = parseFloat(safeItem.discount.value);
      const discountType = safeItem.discount.type?.toLowerCase();
      if (discountType === "percentage") {
        const finalPrice = price - (price * discountValue / 100);
        return finalPrice.toFixed(2);
      } else {
        const finalPrice = price - discountValue;
        return finalPrice.toFixed(2);
      }
    }
    
    return price.toFixed(2);
  };

  // Get variant prices with discount calculation and original price
  const getVariantDisplay = () => {
    if (!isVariantPricing) return [];
    
    const variants = [];
    ["quarter", "half", "full"].forEach((key) => {
      const variant = safeItem.variantRates?.[key];
      if (variant?.price) {
        const price = parseFloat(variant.price);
        let displayPrice = price.toFixed(2);
        let originalPrice = price.toFixed(2);
        let hasDiscount = false;
        let discountInfo = null;
        
        if (variant.discount?.active && variant.discount?.value) {
          const discountValue = parseFloat(variant.discount.value);
          const discountType = variant.discount.type?.toLowerCase();
          
          if (discountType === "percentage") {
            const finalPrice = price - (price * discountValue / 100);
            displayPrice = finalPrice.toFixed(2);
            discountInfo = {
              type: "percentage",
              value: discountValue
            };
          } else {
            const finalPrice = price - discountValue;
            displayPrice = finalPrice.toFixed(2);
            discountInfo = {
              type: "flat",
              value: discountValue
            };
          }
          hasDiscount = true;
        }
        
        variants.push({
          key,
          price: displayPrice,
          originalPrice: originalPrice,
          hasDiscount,
          discountInfo,
          label: key === "quarter" ? "Q" : key === "half" ? "H" : "F"
        });
      }
    });
    
    return variants;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row w-full border border-orange-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative w-full sm:w-28 h-40 sm:h-28 overflow-hidden bg-gray-100 flex-shrink-0">
        <img
          src={
            safeItem.image?.url ||
            "https://via.placeholder.com/200x200?text=No+Image"
          }
          alt={safeItem.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col min-w-0 relative">
        {/* Top Right */}
        <div className="absolute top-3 right-3 flex items-start gap-2">
          {/* Category Badge */}
          <div className="px-2 py-1 bg-orange-300/70 rounded-md flex items-center gap-1">
            <Tag size={10} className="text-black" />
            <span className="text-xs text-black truncate max-w-[80px]">
              {safeItem.category}
            </span>
          </div>

          {/* Menu - Only for Admin */}
          {isAdmin && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <MoreVertical size={18} />
              </button>

              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border z-50"
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50 flex items-center gap-3"
                  >
                    <Edit size={16} /> Edit Item
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 border-t"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pr-24">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-5 h-5 flex items-center justify-center border ${
                safeItem.type === "veg"
                  ? "bg-green-100 border-green-600"
                  : safeItem.type === "non-veg"
                  ? "bg-red-100 border-red-600"
                  : "bg-yellow-100 border-yellow-600"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  safeItem.type === "veg" ? "bg-green-600" : safeItem.type === "non-veg" ? "bg-red-600" : "bg-yellow-600"
                }`}
              />
            </div>

            <h3 className="text-base font-bold truncate">{safeItem.name}</h3>
          </div>

          {/* Discount Badge for Single Items */}
          {isSinglePricing && safeItem.discount?.active && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium mb-2">
              <span className="font-bold">
                {safeItem.discount.type?.toLowerCase() === "percentage" 
                  ? `${safeItem.discount.value}% OFF` 
                  : `₹${safeItem.discount.value} OFF`}
              </span>
              <span className="line-through text-gray-500 ml-1">
                ₹{safeItem.price}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm flex-wrap">
            {safeItem.available ? (
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle size={14} />
                <span>Available</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 font-medium">
                <XCircle size={14} />
                <span>Unavailable</span>
              </div>
            )}

            {/* Display Price based on Pricing Type */}
            {isSinglePricing && (
              <div className="flex items-center gap-1">
                <span className="font-bold text-green-700">
                  ₹{getFinalPrice()}
                </span>
              </div>
            )}

            {isVariantPricing && (
              <div className="flex flex-col gap-1">
                {getVariantDisplay().map((variant) => (
                  <div key={variant.key} className="flex items-center gap-2">
                    <span className="text-gray-700 font-medium min-w-[30px]">
                      {variant.label}:
                    </span>
                    {variant.hasDiscount ? (
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-green-700">
                          ₹{variant.price}
                        </span>
                        <span className="line-through text-gray-400 text-xs">
                          ₹{variant.originalPrice}
                        </span>
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                          {variant.discountInfo.type === "percentage" 
                            ? `${variant.discountInfo.value}% OFF` 
                            : `₹${variant.discountInfo.value} OFF`}
                        </div>
                      </div>
                    ) : (
                      <span className="font-bold text-green-700">
                        ₹{variant.price}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isComboPricing && (
              <div className="flex items-center gap-1">
                <span className="font-bold text-blue-700">
                  ₹{safeItem.comboPrice}
                </span>
                <span className="text-xs text-gray-500">
                  ({safeItem.comboItems?.length || 0} items)
                </span>
                {safeItem.discount?.active && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium ml-2">
                    <span className="font-bold">
                      {safeItem.discount.type?.toLowerCase() === "percentage" 
                        ? `${safeItem.discount.value}% OFF` 
                        : `₹${safeItem.discount.value} OFF`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Button - Bottom Right */}
        <div className="flex items-center w-full mt-4">
          <div className="flex-1" />
          <button
            onClick={onView}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium whitespace-nowrap"
          >
            View
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuItemCard;
