import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MoreVertical,
  Edit,
  Trash2,
  Tag,
  CheckCircle,
  XCircle,
  GripVertical,
} from "lucide-react";

const MenuItemCard = ({
  item = {},
  onEdit,
  onDelete,
  onView,
  isAdmin = true,
  dragHandleProps,
  isDragging = false,
  disableMotion = false,
}) => {
  const MotionDiv = motion.div;
  const CardWrapper = disableMotion ? "div" : MotionDiv;
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
    visibility: item.visibility || "PUBLIC",
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
    <CardWrapper
      {...(disableMotion
        ? {}
        : {
            layout: true,
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -10 },
            transition: { type: "spring", stiffness: 200, damping: 25 },
          })}
      className={`group relative h-full w-full self-stretch min-w-0 overflow-visible rounded-2xl border border-orange-200 bg-gradient-to-br from-white via-orange-50/40 to-white shadow-[0_8px_24px_-18px_rgba(249,115,22,0.55)] transition-all duration-300 hover:border-orange-300 hover:shadow-[0_14px_30px_-18px_rgba(249,115,22,0.65)] dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:shadow-slate-950/40 ${
        showMenu ? "z-40" : "z-10"
      } ${isDragging ? "ring-2 ring-orange-400/70 opacity-90" : ""}`}
    >
      <div className="flex h-full flex-col sm:flex-row">
        {/* Image */}
        <div className="relative h-[12.5rem] w-full flex-shrink-0 overflow-hidden rounded-t-2xl bg-gray-100 dark:bg-slate-800 sm:h-auto sm:w-36 sm:min-h-[166px] sm:rounded-l-2xl sm:rounded-tr-none lg:w-32 lg:min-h-[150px] lg:rounded-l-xl">
          <img
            src={
              safeItem.image?.url ||
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='13' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E"
            }
            alt={safeItem.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative flex min-w-0 flex-1 flex-col gap-2 p-3 sm:gap-1.5 sm:p-2.5 lg:gap-1 lg:p-2">
          {isAdmin && (
            <div className="absolute right-2.5 top-2.5 z-20 sm:right-2 sm:top-2 lg:right-1.5 lg:top-1.5" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-700 transition-colors hover:border-orange-200 hover:bg-orange-50 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 sm:h-8 sm:w-8"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                disableMotion ? (
                  <div className="absolute right-0 top-full z-[120] mt-1 w-40 rounded-xl border bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit();
                      }}
                      className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-slate-700 hover:bg-orange-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Edit size={15} /> Edit Item
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete();
                      }}
                      className="flex h-10 w-full items-center gap-2 border-t px-3 text-left text-sm text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-500/20"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                ) : (
                  <MotionDiv
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 top-full z-[120] mt-1 w-40 rounded-xl border bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit();
                    }}
                    className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-slate-700 hover:bg-orange-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Edit size={15} /> Edit Item
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="flex h-10 w-full items-center gap-2 border-t px-3 text-left text-sm text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-500/20"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </MotionDiv>
                )
              )}
            </div>
          )}

          <div className="space-y-2 pr-10 sm:space-y-1.5">
            <div className="flex min-w-0 items-center gap-3">
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

              <h3 className="min-w-0 flex-1 truncate text-base font-bold leading-5 text-gray-900 dark:text-slate-100 sm:text-sm sm:leading-4 lg:text-[13px] lg:leading-[1.1]">
                {safeItem.name || "Unnamed Item"}
              </h3>

              {isAdmin && dragHandleProps && (
                <button
                  type="button"
                  {...dragHandleProps}
                  className="inline-flex h-6 w-6 touch-none select-none items-center justify-center rounded-md border border-orange-200 bg-white/90 text-orange-600 shadow-sm transition hover:bg-orange-50 active:cursor-grabbing dark:border-slate-600 dark:bg-slate-900/90 dark:text-orange-300"
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                >
                  <GripVertical size={14} />
                </button>
              )}
            </div>

            <p className="line-clamp-3 break-words text-xs leading-5 text-gray-500 dark:text-slate-300 sm:line-clamp-1 sm:leading-4 lg:text-[11px] lg:leading-[1.2]">
              {safeItem.description || "No description available"}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex max-w-full items-center gap-1 rounded-md border border-orange-200 bg-orange-100/85 px-2 py-1 dark:border-slate-600 dark:bg-slate-800 sm:py-0.5 lg:px-1.5 lg:py-0.5">
                <Tag size={11} className="shrink-0 text-orange-700 dark:text-orange-300" />
                <span className="max-w-[180px] truncate text-[11px] font-medium text-orange-800 dark:text-orange-200 sm:text-xs lg:text-[11px]">
                  {safeItem.category || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-1.5">
            {safeItem.available ? (
              <div className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 sm:px-2 sm:py-0.5 sm:text-[11px] lg:px-2 lg:py-0.5 lg:text-[10px] dark:bg-green-950/20 dark:text-green-400">
                <CheckCircle size={13} />
                Available
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 sm:px-2 sm:py-0.5 sm:text-[11px] lg:px-2 lg:py-0.5 lg:text-[10px] dark:bg-red-950/20 dark:text-red-400">
                <XCircle size={13} />
                Unavailable
              </div>
            )}

            {safeItem.visibility === "ADMIN" ? (
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 sm:px-2 sm:py-0.5 sm:text-[11px] lg:px-2 lg:py-0.5 lg:text-[10px] dark:bg-amber-950/30 dark:text-amber-400">
                Off Menu
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 sm:px-2 sm:py-0.5 sm:text-[11px] lg:px-2 lg:py-0.5 lg:text-[10px] dark:bg-blue-950/30 dark:text-blue-400">
                On Menu
              </div>
            )}

            <div className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 sm:px-2 sm:py-0.5 sm:text-[11px] lg:px-2 lg:py-0.5 lg:text-[10px] dark:bg-orange-950/20 dark:text-orange-300">
              {isSinglePricing ? "Single" : isVariantPricing ? "Variant" : "Combo"}
            </div>
          </div>

          <div className="h-[96px] overflow-hidden sm:h-[64px] lg:h-[64px]">
            {isSinglePricing && (
              <div className="flex items-center gap-2 sm:gap-1.5">
                <span className="text-lg font-bold text-green-700 sm:text-base lg:text-sm">₹{getFinalPrice() || safeItem.price || 0}</span>
                {safeItem.discount?.active && (
                  <>
                    <span className="text-xs text-gray-400 dark:text-slate-400 line-through">₹{safeItem.price}</span>
                    <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 lg:px-1.5 lg:py-0.5 lg:text-[10px]">
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
                    <div key={variant.key} className="flex items-center gap-1.5 text-xs lg:text-[11px]">
                      <span className="w-6 font-semibold text-gray-700 dark:text-slate-300">{variant.label}</span>
                      <span className="font-bold text-green-700">₹{variant.price}</span>
                      {variant.hasDiscount && (
                        <>
                          <span className="text-gray-400 dark:text-slate-400 line-through">₹{variant.originalPrice}</span>
                          <span className="rounded-md bg-orange-100 px-2 py-0.5 font-semibold text-orange-700 lg:px-1.5 lg:py-0.5 lg:text-[10px]">
                            {variant.discountInfo.type === "percentage"
                              ? `${variant.discountInfo.value}% OFF`
                              : `₹${variant.discountInfo.value} OFF`}
                          </span>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 dark:text-slate-300">Variant prices not available</span>
                )}
              </div>
            )}

            {isComboPricing && (
              <div className="flex items-center gap-2 sm:gap-1.5">
                <span className="text-lg font-bold text-blue-700 sm:text-base lg:text-sm">₹{safeItem.comboPrice || 0}</span>
                <span className="text-xs text-gray-500 dark:text-slate-300">({safeItem.comboItems?.length || 0} items)</span>
                {safeItem.discount?.active && (
                  <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 lg:px-1.5 lg:py-0.5 lg:text-[10px]">
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
              className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-xl border text-sm font-extrabold shadow-sm transition-all sm:h-7 sm:w-auto sm:px-3 sm:text-xs lg:h-6 lg:px-2.5 lg:text-[10px] lg:rounded-lg border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] hover:border-orange-350 dark:border-slate-700 dark:bg-slate-800 dark:text-orange-400 dark:hover:bg-slate-700"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
};

export default MenuItemCard;
