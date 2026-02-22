import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import DiscountSection from "../../AddItemModal/components/DiscountSection";

const VariantPriceSection = ({ variantRates, errors, setFormData }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Variant Prices (₹) *
    </label>

    {typeof errors.variantRates === 'string' && (
      <p className="text-sm text-red-600 mb-2 flex items-center gap-1">
        <ExclamationCircleIcon className="w-4 h-4" />
        {errors.variantRates}
      </p>
    )}

    <div className="space-y-4">
      {["quarter", "half", "full"].map((key) => (
        <div key={key} className="rounded-xl border border-orange-200 bg-orange-50/70 p-4">
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
              {key} Price
            </label>
            <input
              type="text"
              value={variantRates?.[key]?.price || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setFormData(prev => ({
                  ...prev,
                  variantRates: {
                    ...prev.variantRates,
                    [key]: { ...prev.variantRates[key], price: val }
                  }
                }));
              }}
              className={`w-full rounded-lg border p-2 text-sm shadow-sm outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${errors.variantRates?.[key] ? 'border-red-500 bg-red-50' : 'border-orange-200 bg-white hover:border-orange-300'}`}
              placeholder={`e.g. ${key === "quarter" ? 150 : key === "half" ? 299 : 499}`}
            />
            {errors.variantRates?.[key] && (
              <p className="mt-1 text-xs text-red-600">{errors.variantRates[key]}</p>
            )}
          </div>

          <DiscountSection
            discount={variantRates?.[key]?.discount}
            errors={errors.variantRates?.[`${key}Discount`]}
            handleChange={(e) => {
              const name = e.target.name;
              const value = e.target.value;
              const checked = e.target.checked;
              
              if (name.startsWith(`${key}.discount.`)) {
                const discountField = name.split(".")[2];
                setFormData(prev => ({
                  ...prev,
                  variantRates: {
                    ...prev.variantRates,
                    [key]: {
                      ...prev.variantRates[key],
                      discount: {
                        ...(prev.variantRates[key]?.discount || {}),
                        [discountField]: discountField === "type" ? value : (discountField === "value" ? value.replace(/[^0-9]/g, "") : (discountField === "active" ? checked : value))
                      }
                    }
                  }
                }));
              }
            }}
            setFormData={setFormData}
            label={`Apply Discount for ${key}`}
            prefix={`${key}.discount`}
          />
        </div>
      ))}
    </div>

    <p className="text-xs text-gray-500 mt-2">
      * At least one variant price is required
    </p>
  </div>
);

export default VariantPriceSection;
