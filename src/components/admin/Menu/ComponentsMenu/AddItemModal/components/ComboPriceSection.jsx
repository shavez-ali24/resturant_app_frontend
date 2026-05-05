import React from "react";
import { IndianRupee } from "lucide-react";
import FormInput from "./FormInput";
import ComboItemsManager from "../../ComboItemsManager";

const ComboPriceSection = ({
  comboPrice, comboItems, menuItems, errors,
  handleChange, setComboItems, setFormData,
  foodType, discount, isLoadingMenu = false,
}) => {
  return (
    <div className="space-y-4 rounded-lg border border-[#ede8e3] bg-[#f7f3ef] p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <div>
        <FormInput
          label="Combo Price (₹)"
          name="comboPrice"
          value={comboPrice}
          onChange={handleChange}
          error={errors.comboPrice}
          required
          icon={<IndianRupee size={14} />}
          inputMode="numeric"
          placeholder="e.g. 599"
        />
        <p className="mt-1 text-xs text-[#a8a29e]">
          The final price customers will pay for the combo
        </p>
      </div>

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
