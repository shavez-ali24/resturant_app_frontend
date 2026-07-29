import React, { useState } from "react";
import { useSelector } from "react-redux";
import { CurrencyRupeeIcon } from "@heroicons/react/24/solid";
import DiscountSection from "./DiscountSection";

const VariantPriceItem = ({ 
  variantKey, 
  variantData, 
  errors, 
  handleChange, 
  setFormData 
}) => {
  const variantLabels = {
    quarter: "Quarter",
    half: "Half",
    full: "Full"
  };
  
  const colors = useSelector((state) => state.admin.theme.colors);
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const [focused, setFocused] = useState(false);

  const variantError = typeof errors === 'object' ? errors[variantKey] : null;
  const discountError = typeof errors === 'object' ? errors[`${variantKey}Discount`] : null;

  return (
    <div
      className="rounded-xl border p-4 transition-all duration-150"
      style={{
        borderColor: isDarkMode ? `${colors.primary}40` : `${colors.primary}25`,
        backgroundColor: isDarkMode ? `${colors.primary}12` : `${colors.primary}05`,
      }}
    >
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 capitalize">
          {variantLabels[variantKey]} Price
        </label>
        <div className="relative">
          <input
            type="text"
            name={`${variantKey}.price`}
            value={variantData?.price || ""}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full rounded-lg border p-2 pl-8 text-sm shadow-sm outline-none transition-all ${variantError ? 'border-red-500 bg-red-50' : 'bg-white text-gray-900 dark:bg-slate-800 dark:text-slate-100'}`}
            style={!variantError ? {
              borderColor: focused ? colors.primary : isDarkMode ? "rgb(51, 65, 85)" : "#ede8e3",
              boxShadow: focused ? `0 0 0 2px ${colors.primary}20` : "none",
            } : {}}
            placeholder={`e.g. ${variantKey === "quarter" ? 150 : variantKey === "half" ? 299 : 499}`}
          />
          <CurrencyRupeeIcon className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-500" />
        </div>
        {variantError && (
          <p className="mt-1 text-xs text-red-600">
            {variantError}
          </p>
        )}
      </div>
      
      <DiscountSection
        discount={variantData?.discount}
        errors={discountError}
        handleChange={handleChange}
        setFormData={setFormData}
        label={`Apply Discount for ${variantKey}`}
        prefix={`${variantKey}.discount`}
      />
    </div>
  );
};

export default VariantPriceItem;
