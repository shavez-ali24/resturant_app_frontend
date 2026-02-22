import React from "react";

const PricingTypeSelector = ({ pricingType, setPricingType }) => {
  const pricingTypes = [
    { id: "single", label: "Single Price" },
    { id: "variant", label: "Variant Pricing" },
    { id: "combo", label: "Combo" }
  ];

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Pricing Type *
      </label>
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-orange-200 bg-orange-50/70 p-1.5 sm:grid-cols-3">
        {pricingTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setPricingType(type.id)}
            className={`h-10 rounded-md px-3 text-sm font-semibold transition-all ${
              pricingType === type.id
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm"
                : "bg-transparent text-gray-700 hover:bg-orange-100"
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
