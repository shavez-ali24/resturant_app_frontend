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
      <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
        {pricingTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setPricingType(type.id)}
            className={`py-2 px-4 rounded-md text-sm font-semibold transition-all ${
              pricingType === type.id
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:bg-orange-200"
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