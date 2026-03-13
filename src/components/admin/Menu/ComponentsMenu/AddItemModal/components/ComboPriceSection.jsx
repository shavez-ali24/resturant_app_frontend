import React from "react";
import { CurrencyRupeeIcon } from "@heroicons/react/24/solid";
import FormInput from "./FormInput";
import ComboItemsManager from "../../ComboItemsManager";

const ComboPriceSection = ({ 
  comboPrice, 
  comboItems, 
  menuItems, 
  errors, 
  handleChange, 
  setComboItems, 
  setFormData,
  foodType,
  discount,
  isLoadingMenu = false
}) => {
  return (
    <div className="space-y-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50/70 to-white p-4 sm:p-5">
      <div>
        <FormInput
          label="Combo Price (₹)"
          name="comboPrice"
          value={comboPrice}
          onChange={handleChange}
          error={errors.comboPrice}
          required
          icon={<CurrencyRupeeIcon className="w-4 h-4" />}
          inputMode="numeric"
          placeholder="e.g. 599"
        />
        <p className="text-xs text-gray-500 mt-1">
          The final price customers will pay for the combo
        </p>
      </div>
      
      {/* Discount Section for Combo */}
      {/* <DiscountSection
        discount={discount}
        errors={errors}
        handleChange={handleChange}
        setFormData={setFormData}
        label="Apply Discount on Combo"
        prefix="discount"
      /> */}
      
      <ComboItemsManager
        comboPrice={comboPrice}
        comboItems={comboItems}
        setComboItems={setComboItems}
        menuItems={menuItems}
        errors={errors}
        setFormData={setFormData}
        foodType={foodType}
        discount={discount}
        isLoadingMenu={isLoadingMenu}
      />
    </div>
  );
};

export default ComboPriceSection;
