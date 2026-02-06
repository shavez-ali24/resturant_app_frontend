import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import DiscountSection from "../../AddItemModal/components/DiscountSection";

const SinglePriceSection = ({ price, discount, errors, handleChange, setFormData }) => (
  <>
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        Price (₹) *
      </label>
      <input
        type="text"
        name="price"
        value={price || ""}
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9]/g, "");
          setFormData(prev => ({ ...prev, price: val }));
        }}
        className={`w-full border ${errors.price ? 'border-red-500' : 'border-orange-500'} rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm ${errors.price ? 'bg-red-50' : 'bg-orange-50'}`}
        placeholder="e.g. 299"
      />
      {errors.price && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <ExclamationCircleIcon className="w-4 h-4" />
          {errors.price}
        </p>
      )}
    </div>

    <DiscountSection
      discount={discount}
      errors={errors}
      handleChange={handleChange}
      setFormData={setFormData}
      label="Apply Discount"
    />
  </>
);

export default SinglePriceSection;
