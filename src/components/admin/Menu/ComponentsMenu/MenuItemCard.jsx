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

  const variantDisplay = getVariantDisplay();

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
      className={`group relative h-fit w-full self-start min-w-0 overflow-visible rounded-2xl border border-orange-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md ${
        showMenu ? "z-40" : "z-10"
      }`}
    >
      <div className="flex h-full flex-col sm:flex-row">
        {/* Image */}
        <div className="relative h-44 w-full flex-shrink-0 overflow-hidden rounded-t-2xl bg-gray-100 sm:h-auto sm:w-36 sm:min-h-[152px] lg:min-h-[146px] sm:rounded-l-2xl sm:rounded-tr-none">
          <img
            src={
              safeItem.image?.url ||
              "https://via.placeholder.com/200x200?text=No+Image"
            }
            alt={safeItem.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative flex min-w-0 flex-1 flex-col gap-2 p-3 sm:gap-1.5 sm:p-2.5">
          {isAdmin && (
            <div className="absolute right-2.5 top-2.5 z-20 sm:right-2 sm:top-2" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition-colors hover:border-orange-200 hover:bg-orange-50 sm:h-8 sm:w-8"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-full z-[120] mt-1 w-40 rounded-xl border bg-white shadow-xl"
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm hover:bg-orange-50"
                  >
                    <Edit size={15} /> Edit Item
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="flex h-10 w-full items-center gap-2 border-t px-3 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </motion.div>
              )}
            </div>
          )}

          <div className="space-y-2 pr-10 sm:space-y-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                  safeItem.type === "veg"
                    ? "border-green-600 bg-green-100"
                    : safeItem.type === "non-veg"
                    ? "border-red-600 bg-red-100"
                    : "border-yellow-600 bg-yellow-100"
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    safeItem.type === "veg"
                      ? "bg-green-600"
                      : safeItem.type === "non-veg"
                      ? "bg-red-600"
                      : "bg-yellow-600"
                  }`}
                />
              </div>

              <h3 className="min-w-0 flex-1 truncate text-base font-bold leading-5 text-gray-900 sm:text-sm sm:leading-4">
                {safeItem.name || "Unnamed Item"}
              </h3>
            </div>

            <p className="line-clamp-3 break-words text-xs leading-5 text-gray-500 sm:line-clamp-1 sm:leading-4">
              {safeItem.description || "No description available"}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex max-w-full items-center gap-1 rounded-md bg-orange-300/70 px-2 py-1 sm:py-0.5">
                <Tag size={11} className="shrink-0 text-black" />
                <span className="max-w-[180px] truncate text-[11px] text-black sm:text-xs">
                  {safeItem.category || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-1.5">
            {safeItem.available ? (
              <div className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 sm:px-2 sm:py-0.5 sm:text-[11px]">
                <CheckCircle size={13} />
                Available
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 sm:px-2 sm:py-0.5 sm:text-[11px]">
                <XCircle size={13} />
                Unavailable
              </div>
            )}

            <div className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 sm:px-2 sm:py-0.5 sm:text-[11px]">
              {isSinglePricing ? "Single" : isVariantPricing ? "Variant" : "Combo"}
            </div>
          </div>

          <div className="min-h-[64px] sm:min-h-[34px]">
            {isSinglePricing && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-1.5">
                <span className="text-lg font-bold text-green-700 sm:text-base">₹{getFinalPrice() || safeItem.price || 0}</span>
                {safeItem.discount?.active && (
                  <>
                    <span className="text-xs text-gray-400 line-through">₹{safeItem.price}</span>
                    <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                      {safeItem.discount.type?.toLowerCase() === "percentage"
                        ? `${safeItem.discount.value}% OFF`
                        : `₹${safeItem.discount.value} OFF`}
                    </span>
                  </>
                )}
              </div>
            )}

            {isVariantPricing && (
              <div className="space-y-0.5">
                {variantDisplay.length > 0 ? (
                  variantDisplay.map((variant) => (
                    <div key={variant.key} className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="w-6 font-semibold text-gray-700">{variant.label}</span>
                      <span className="font-bold text-green-700">₹{variant.price}</span>
                      {variant.hasDiscount && (
                        <>
                          <span className="text-gray-400 line-through">₹{variant.originalPrice}</span>
                          <span className="rounded-md bg-orange-100 px-2 py-0.5 font-semibold text-orange-700">
                            {variant.discountInfo.type === "percentage"
                              ? `${variant.discountInfo.value}% OFF`
                              : `₹${variant.discountInfo.value} OFF`}
                          </span>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Variant prices not available</span>
                )}
              </div>
            )}

            {isComboPricing && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-1.5">
                <span className="text-lg font-bold text-blue-700 sm:text-base">₹{safeItem.comboPrice || 0}</span>
                <span className="text-xs text-gray-500">({safeItem.comboItems?.length || 0} items)</span>
                {safeItem.discount?.active && (
                  <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    {safeItem.discount.type?.toLowerCase() === "percentage"
                      ? `${safeItem.discount.value}% OFF`
                      : `₹${safeItem.discount.value} OFF`}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-auto flex justify-end pt-0.5">
            <button
              onClick={onView}
              className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 sm:h-7 sm:w-auto sm:px-3 sm:text-xs"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuItemCard;
