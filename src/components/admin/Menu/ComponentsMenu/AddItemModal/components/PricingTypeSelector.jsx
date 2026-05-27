import React from "react";

const PricingTypeSelector = ({ pricingType, setPricingType }) => {
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const types = [
    { id: "single",  label: "Single Price" },
    { id: "variant", label: "Variant Pricing" },
    { id: "combo",   label: "Combo" },
  ];

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#a8a29e] dark:text-slate-400">
        Pricing Type <span className="text-orange-500">*</span>
      </label>
      <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-[#ede8e3] bg-[#f7f3ef] p-1 dark:border-slate-700 dark:bg-slate-800/60">
        {types.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setPricingType(type.id)}
            className={`h-9 rounded-md px-2 text-xs font-semibold transition-all ${
              pricingType === type.id
                ? isDarkMode
                  ? "bg-orange-950/30 border border-orange-500/40 text-orange-400 shadow-sm"
                  : "bg-orange-50 border border-orange-200 text-orange-700 font-extrabold shadow-sm"
                : "bg-transparent text-[#78716c] hover:bg-white hover:text-[#1c1917] dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PricingTypeSelector;
