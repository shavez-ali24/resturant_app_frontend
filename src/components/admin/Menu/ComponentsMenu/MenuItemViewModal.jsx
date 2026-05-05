import React, { useState, useEffect } from "react";
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => setIsDarkMode(root.classList.contains("admin-dark") || root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  if (!isOpen || !item) return null;

  const isVariantPricing = item.pricingType === "variant";
  const isComboPricing   = item.pricingType === "combo";
  const isSinglePricing  = item.pricingType === "single";

  // ── theme helpers ──────────────────────────────────────────────────────────
  const card    = isDarkMode ? "border-slate-700 bg-[#1e293b]"  : "border-[#ede8e3] bg-white";
  const tp      = isDarkMode ? "text-slate-100"  : "text-[#1c1917]";
  const ts      = isDarkMode ? "text-slate-400"  : "text-[#78716c]";
  const priceBg = isDarkMode ? "border-slate-600 bg-slate-800/60" : "border-orange-200 bg-orange-50/70";
  const variantCard = isDarkMode ? "border-slate-600 bg-slate-800" : "border-orange-200 bg-white";
  const comboItem   = isDarkMode ? "border-slate-600 bg-slate-800 hover:bg-slate-700" : "border-orange-200 bg-white hover:bg-orange-50";
  const descBg  = isDarkMode ? "border-slate-600 bg-slate-800/60" : "border-orange-200 bg-orange-50/60";

  const calculateDiscountedPrice = () => {
    if (!item.price) return null;
    const price = parseFloat(item.price);
    if (isNaN(price)) return null;
    if (item.discount?.active && item.discount?.value) {
      const dv = parseFloat(item.discount.value);
      const dt = item.discount.type || "flat";
      const dp = dt === "percentage" ? price - (price * dv / 100) : price - dv;
      return { original: price.toFixed(2), discounted: dp.toFixed(2), discountText: dt === "percentage" ? `${dv}% OFF` : `₹${dv} OFF` };
    }
    return null;
  };

  const getVariantDisplay = () => {
    if (!item.variantRates) return [];
    return ["quarter", "half", "full"].reduce((acc, key) => {
      const v = item.variantRates[key];
      if (!v?.price) return acc;
      const price = parseFloat(v.price);
      if (v.discount?.active && v.discount?.value) {
        const dv = parseFloat(v.discount.value);
        const dt = v.discount.type || "flat";
        const dp = dt === "percentage" ? price - (price * dv / 100) : price - dv;
        acc.push({ key, label: key === "quarter" ? "QUARTER" : key === "half" ? "HALF" : "FULL", originalPrice: price.toFixed(2), discountedPrice: dp.toFixed(2), discountText: dt === "percentage" ? `${dv}% OFF` : `₹${dv} OFF`, hasDiscount: true });
      } else {
        acc.push({ key, label: key === "quarter" ? "QUARTER" : key === "half" ? "HALF" : "FULL", originalPrice: price.toFixed(2), discountedPrice: null, hasDiscount: false });
      }
      return acc;
    }, []);
  };

  const getComboDisplay = () => {
    if (!item.comboItems || !Array.isArray(item.comboItems)) return [];
    const menuMap = new Map();
    (Array.isArray(menu) ? menu : []).forEach(m => { if (m._id) menuMap.set(String(m._id), m); });
    return item.comboItems.map((ci, i) => ({
      id: i,
      name: ci.name || menuMap.get(String(ci.menuItemId))?.name || `Item ${i + 1}`,
      variant: ci.variant || null,
      quantity: ci.quantity || 1,
    }));
  };

  const discountedPriceInfo = calculateDiscountedPrice();
  const variantDisplay      = getVariantDisplay();
  const comboItemsDisplay   = getComboDisplay();
  const MotionDiv = motion.div;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`relative flex max-h-[90dvh] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl border shadow-[0_20px_45px_-24px_rgba(249,115,22,0.4)] lg:h-[420px] lg:flex-row ${card}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button onClick={onClose}
                className={`absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDarkMode ? "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-100" : "bg-white/90 text-[#a8a29e] shadow-sm hover:bg-orange-100 hover:text-orange-700"}`}
                aria-label="Close">
                <X size={16} />
              </button>

              {/* LEFT – IMAGE */}
              <div className={`relative h-40 w-full overflow-hidden sm:h-48 lg:h-full lg:w-[32%] ${isDarkMode ? "bg-slate-800" : "bg-orange-50"}`}>
                <img
                  src={item.image?.url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E"}
                  alt={item.name} className="h-full w-full object-cover"
                  onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E"; }}
                />
                {isComboPricing && (
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm">
                    <Package size={14} /><span>COMBO</span>
                  </div>
                )}
              </div>

              {/* RIGHT – DETAILS */}
              <div className="relative flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
                {/* Title + Badges */}
                <div className="mb-3">
                  <h2 className={`mb-2 text-base font-bold sm:text-lg md:text-xl ${tp}`}>{item.name}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Tag size={13} className="text-orange-500" />
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${isDarkMode ? "border-slate-600 bg-slate-700 text-slate-200" : "border-orange-300 bg-orange-100 text-orange-700"}`}>
                        {item.category || "Uncategorized"}
                      </span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${item.type === "veg" ? "bg-green-500" : "bg-red-500"}`}>
                      {item.type === "veg" ? "VEG" : "NON-VEG"}
                    </span>
                    <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">
                      {isSinglePricing ? "SINGLE" : isVariantPricing ? "VARIANT" : "COMBO"}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${item.available ? "bg-emerald-500" : "bg-rose-500"}`}>
                      {item.available ? "AVAILABLE" : "UNAVAILABLE"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Info size={15} className="text-orange-500" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-500">Description</h3>
                  </div>
                  <div className={`h-20 overflow-y-auto rounded-xl border p-2.5 ${descBg}`}>
                    <p className={`text-xs leading-relaxed sm:text-sm ${ts}`}>
                      {item.description || "No description available"}
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <ShoppingBag size={15} className="text-orange-500" />
                    <h3 className={`text-sm font-semibold sm:text-base ${tp}`}>Pricing Details</h3>
                  </div>

                  {/* Single */}
                  {isSinglePricing && (
                    <div className={`flex min-h-[90px] items-center justify-center rounded-xl border p-3 ${priceBg}`}>
                      {discountedPriceInfo ? (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-0.5">
                            <IndianRupee className="h-4 w-4 text-orange-500" />
                            <span className="text-xl font-bold text-orange-500">{discountedPriceInfo.discounted}</span>
                          </div>
                          <div className="flex flex-col items-start gap-1">
                            <span className={`text-xs line-through ${ts}`}>₹{discountedPriceInfo.original}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isDarkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-200 text-orange-700"}`}>{discountedPriceInfo.discountText}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <IndianRupee className="h-4 w-4 text-orange-500" />
                          <span className="text-xl font-bold text-orange-500">{item.price}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Variant */}
                  {isVariantPricing && variantDisplay.length > 0 && (
                    <div className={`flex min-h-[90px] items-center rounded-xl border p-3 ${priceBg}`}>
                      <div className="grid w-full grid-cols-3 gap-2">
                        {variantDisplay.map((v) => (
                          <div key={v.key} className={`rounded-lg border-2 p-2.5 text-center ${variantCard}`}>
                            <div className="mb-1 text-xs font-semibold text-orange-500">{v.label}</div>
                            <div className="flex items-center justify-center gap-0.5">
                              <IndianRupee className="h-3 w-3 text-orange-500" />
                              <span className="font-bold text-orange-500 text-sm">{v.discountedPrice || v.originalPrice}</span>
                            </div>
                            {v.hasDiscount && (
                              <div className="mt-1.5 space-y-0.5">
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${isDarkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-700"}`}>{v.discountText}</span>
                                <div className={`text-[10px] line-through ${ts}`}>₹{v.originalPrice}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Combo */}
                  {isComboPricing && (
                    <div className={`flex min-h-[90px] flex-col rounded-xl border p-3 ${priceBg}`}>
                      <div className="mb-2.5 flex items-center justify-center">
                        <IndianRupee className="h-4 w-4 text-orange-500" />
                        <span className="text-xl font-bold text-orange-500">{item.comboPrice || "0.00"}</span>
                      </div>
                      {comboItemsDisplay.length > 0 && (
                        <div className={`border-t pt-2.5 ${isDarkMode ? "border-slate-600" : "border-orange-200"}`}>
                          <div className="mb-2 flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-orange-500" />
                            <h4 className={`text-xs font-semibold ${tp}`}>Combo Includes:</h4>
                          </div>
                          <div className="max-h-24 space-y-1.5 overflow-y-auto pr-1">
                            {comboItemsDisplay.map((ci) => (
                              <div key={ci.id} className={`flex items-center justify-between rounded-lg border p-2 transition-colors ${comboItem}`}>
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                                  <span className={`text-xs font-medium ${tp}`}>
                                    {ci.name}
                                    {ci.variant && <span className={`ml-1.5 rounded px-1 py-0.5 text-[10px] ${isDarkMode ? "bg-slate-700 text-orange-400" : "bg-orange-100 text-orange-600"}`}>{ci.variant}</span>}
                                  </span>
                                </div>
                                {ci.quantity > 1 && <span className={`text-xs ${ts}`}>×{ci.quantity}</span>}
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
