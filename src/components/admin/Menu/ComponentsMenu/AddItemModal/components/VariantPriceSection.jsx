import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import VariantPriceItem from "./VariantPriceItem";

const VariantPriceSection = ({ variantRates, errors, handleChange, setFormData }) => {
  const globalError = typeof errors === "string" ? errors : "";
  const variantFieldErrors =
    errors && typeof errors === "object" ? errors : {};
  
  return (
    <div data-field="variantRates">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Variant Prices (₹) *
      </label>

      {globalError && (
        <p className="mb-2 flex items-center gap-1 text-xs text-red-600">
          <ExclamationCircleIcon className="h-4 w-4" />
          {globalError}
        </p>
      )}
      
      <div className="space-y-4">
        {["quarter", "half", "full"].map((key) => (
          <VariantPriceItem
            key={key}
            variantKey={key}
            variantData={variantRates?.[key]}
            errors={variantFieldErrors}
            handleChange={handleChange}
            setFormData={setFormData}
          />
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        * At least one variant price is required
      </p>
    </div>
  );
};

export default VariantPriceSection;
