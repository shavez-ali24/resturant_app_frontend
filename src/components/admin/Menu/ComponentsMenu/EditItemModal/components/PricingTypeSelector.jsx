const PricingTypeSelector = ({ pricingType, setPricingType }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Pricing Type *
    </label>
    <div className="grid grid-cols-1 gap-2 rounded-lg bg-orange-100 p-1 sm:grid-cols-3">
      {["single", "variant", "combo"].map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => setPricingType(type)}
          className={`h-10 rounded-md px-3 text-sm font-semibold transition-all ${
            pricingType === type
              ? "bg-orange-500 text-white shadow-sm"
              : "bg-transparent text-gray-600 hover:bg-orange-200"
          }`}
        >
          {type === "single" ? "Single Price" : type === "variant" ? "Variant Pricing" : "Combo"}
        </button>
      ))}
    </div>
  </div>
);

export default PricingTypeSelector;
