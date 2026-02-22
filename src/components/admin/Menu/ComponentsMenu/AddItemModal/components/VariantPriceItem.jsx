import React from "react";
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
  
  const variantError = typeof errors === 'object' ? errors[variantKey] : null;
  const discountError = typeof errors === 'object' ? errors[`${variantKey}Discount`] : null;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4">
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
          {variantLabels[variantKey]} Price
        </label>
        <div className="relative">
          <input
            type="text"
            name={`${variantKey}.price`}
            value={variantData?.price || ""}
            onChange={handleChange}
            className={`w-full rounded-lg border p-2 pl-8 text-sm shadow-sm outline-none transition-all ${variantError ? 'border-red-500 bg-red-50' : 'border-orange-200 bg-white hover:border-orange-300'} focus:border-orange-400 focus:ring-2 focus:ring-orange-200`}
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
