import React from "react";
import { CurrencyRupeeIcon } from "@heroicons/react/24/solid";
import FormInput from "./FormInput";
import DiscountSection from "./DiscountSection";

const SinglePriceSection = ({ 
  price, 
  discount, 
  errors, 
  handleChange, 
  setFormData 
}) => {
  return (
    <>
      <FormInput
        label="Price (₹)"
        name="price"
        value={price}
        onChange={handleChange}
        error={errors.price}
        required
        icon={<CurrencyRupeeIcon className="w-4 h-4" />}
        inputMode="numeric"
        placeholder="e.g. 299"
      />
      
      <DiscountSection
        discount={discount}
        errors={errors}
        handleChange={handleChange}
        setFormData={setFormData}
        label="Apply Discount"
      />
    </>
  );
};

export default SinglePriceSection;