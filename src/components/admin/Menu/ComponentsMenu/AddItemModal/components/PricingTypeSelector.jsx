import React from "react";
import { useSelector } from "react-redux";

const PricingTypeSelector = ({ pricingType, setPricingType }) => {
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const colors = useSelector((state) => state.admin.theme.colors);
  const types = [
    { id: "single",  label: "Single Price" },
    { id: "variant", label: "Variant Pricing" },
    { id: "combo",   label: "Combo" },
  ];

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#a8a29e] dark:text-slate-400">
        Pricing Type <span style={{ color: colors.primary }}>*</span>
      </label>
      <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-[#ede8e3] bg-[#f7f3ef] p-1 dark:border-slate-700 dark:bg-slate-800/60">
        {types.map((type) => {
          const isSelected = pricingType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setPricingType(type.id)}
              className={`h-9 rounded-md px-2 text-xs font-black transition-all border ${
                isSelected
                  ? "shadow-sm"
                  : "border-transparent bg-transparent text-[#78716c] hover:bg-white hover:text-[#1c1917] dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              }`}
              style={isSelected ? {
                backgroundColor: isDarkMode ? `${colors.primary}25` : colors.primaryLight,
                borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                color: isDarkMode ? colors.primary : colors.primaryText,
              } : {}}
            >
              {type.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PricingTypeSelector;
