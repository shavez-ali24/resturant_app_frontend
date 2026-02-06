import React from "react";
import VariantPriceItem from "./VariantPriceItem";
import ErrorDisplay from "./ErrorDisplay";

const VariantPriceSection = ({ variantRates, errors, handleChange, setFormData }) => {
  const hasGlobalError = typeof errors === 'string';
  
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Variant Prices (₹) *
      </label>
      {hasGlobalError && (
        <ErrorDisplay error={errors} type="form" />
      )}
      
      <div className="space-y-4">
        {["quarter", "half", "full"].map((key) => (
          <VariantPriceItem
            key={key}
            variantKey={key}
            variantData={variantRates?.[key]}
            errors={errors}
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