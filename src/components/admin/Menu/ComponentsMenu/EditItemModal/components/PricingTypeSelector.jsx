const PricingTypeSelector = ({ pricingType, setPricingType }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Pricing Type *
    </label>
    <div className="grid grid-cols-1 gap-2 rounded-xl border border-orange-200 bg-orange-50/70 p-1.5 sm:grid-cols-3">
      {["single", "variant", "combo"].map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => setPricingType(type)}
          className={`h-10 rounded-md px-3 text-sm font-semibold transition-all ${
            pricingType === type
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm"
              : "bg-transparent text-gray-700 hover:bg-orange-100"
          }`}
        >
          {type === "single" ? "Single Price" : type === "variant" ? "Variant Pricing" : "Combo"}
        </button>
      ))}
    </div>
  </div>
);

export default PricingTypeSelector;
