import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

const DiscountSection = ({
  discount = {}, errors = {}, handleChange, setFormData,
  label = "Apply Discount", prefix = "discount",
}) => {
  const [localErrors, setLocalErrors] = useState({});
  const [selectFocused, setSelectFocused] = useState(false);
  const [valueFocused, setValueFocused] = useState(false);

  const colors = useSelector((state) => state.admin.theme.colors);
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

  const safeDiscount = {
    active: discount?.active || false,
    type:   discount?.type  || "flat",
    value:  discount?.value || "",
  };

  const getError = () => {
    if (typeof errors === "string") return errors;
    if (errors?.discount) return errors.discount;
    if (errors?.value)    return errors.value;
    if (errors?.type)     return errors.type;
    if (localErrors.value) return localErrors.value;
    if (localErrors.type)  return localErrors.type;
    return null;
  };
  const error = getError();

  const validateDiscount = useCallback(() => {
    if (!safeDiscount.active) { setLocalErrors({}); return true; }
    const errs = {};
    if (!safeDiscount.type || !["flat","percentage"].includes(safeDiscount.type))
      errs.type = "Please select discount type";
    const val = safeDiscount.value || "";
    if (!val || val.toString().trim() === "") {
      errs.value = "Discount value is required";
    } else {
      const n = Number(val);
      if (isNaN(n)) errs.value = "Must be a number";
      else if (n < 0) errs.value = "Cannot be negative";
      else if (safeDiscount.type === "percentage" && n > 100) errs.value = "Cannot exceed 100%";
      else if (safeDiscount.type === "flat" && n <= 0) errs.value = "Must be greater than 0";
    }
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  }, [safeDiscount.active, safeDiscount.type, safeDiscount.value]);

  useEffect(() => { validateDiscount(); }, [validateDiscount]);

  const handleTypeChange = (val) => {
    setLocalErrors((prev) => ({ ...prev, type: "" }));
    handleChange({ target: { name: `${prefix}.type`, value: val } });
  };

  const handleValueChange = (e) => {
    const numeric = e.target.value.replace(/[^0-9]/g, "");
    setLocalErrors((prev) => ({ ...prev, value: "" }));
    handleChange({ target: { name: `${prefix}.value`, value: numeric } });
  };

  const handleCheckboxChange = (e) => {
    if (!e.target.checked) setLocalErrors({});
    handleChange({ target: { name: `${prefix}.active`, checked: e.target.checked, type: "checkbox" } });
  };

  useEffect(() => {
    if (safeDiscount.type && setFormData) {
      setFormData((prev) => ({ ...prev, discount: { ...prev.discount, type: safeDiscount.type } }));
    }
  }, [safeDiscount.type, setFormData]);

  return (
    <div className="rounded-lg border border-[#ede8e3] bg-[#f7f3ef] p-4 dark:border-slate-700 dark:bg-slate-800/60">
      {/* Checkbox toggle */}
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={safeDiscount.active}
          onChange={handleCheckboxChange}
          className="h-4 w-4"
          style={{ accentColor: colors.primary }}
        />
        <span className="text-sm font-semibold text-[#1c1917] dark:text-slate-100">{label}</span>
      </label>

      {safeDiscount.active && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {/* Type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[#78716c] dark:text-slate-400">Type *</label>
            <Select value={safeDiscount.type} onValueChange={handleTypeChange}>
              <SelectTrigger
                onFocus={() => setSelectFocused(true)}
                onBlur={() => setSelectFocused(false)}
                className={`h-9 w-full rounded-lg border px-3 text-sm outline-none transition-all ${
                  localErrors.type ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500" : "bg-white dark:bg-slate-800 dark:text-slate-100"
                }`}
                style={!localErrors.type ? {
                  borderColor: selectFocused ? colors.primary : isDarkMode ? "rgb(51, 65, 85)" : "#ede8e3",
                  boxShadow: selectFocused ? `0 0 0 2px ${colors.primary}20` : "none",
                } : {}}
              >
                <SelectValue placeholder="Select type">
                  {safeDiscount.type === "flat" && "Flat (₹)"}
                  {safeDiscount.type === "percentage" && "Percentage (%)"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-lg border border-[#ede8e3] bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <SelectGroup>
                  <SelectItem value="flat" className="cursor-pointer rounded-md text-sm text-[#1c1917] data-[highlighted]:bg-[#f7f3ef] dark:text-slate-200 dark:data-[highlighted]:bg-slate-700">Flat (₹)</SelectItem>
                  <SelectItem value="percentage" className="cursor-pointer rounded-md text-sm text-[#1c1917] data-[highlighted]:bg-[#f7f3ef] dark:text-slate-200 dark:data-[highlighted]:bg-slate-700">Percentage (%)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {localErrors.type && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle size={11} />{localErrors.type}</p>
            )}
          </div>

          {/* Value */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[#78716c] dark:text-slate-400">Value *</label>
            <div className="relative">
              <input
                type="text"
                value={safeDiscount.value}
                onChange={handleValueChange}
                onFocus={() => setValueFocused(true)}
                onBlur={() => setValueFocused(false)}
                className={`h-9 w-full rounded-lg border px-3 text-sm outline-none transition-all pl-7 ${
                  localErrors.value
                    ? "border-red-400 bg-red-50 focus:border-red-400 dark:bg-red-900/20 dark:border-red-500 text-[#1c1917] dark:text-slate-100"
                    : "bg-white text-[#1c1917] dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                }`}
                style={!localErrors.value ? {
                  borderColor: valueFocused ? colors.primary : isDarkMode ? "rgb(51, 65, 85)" : "#ede8e3",
                  boxShadow: valueFocused ? `0 0 0 2px ${colors.primary}20` : "none",
                } : {}}
                placeholder={safeDiscount.type === "percentage" ? "e.g. 10" : "e.g. 50"}
                disabled={!safeDiscount.type}
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#a8a29e]">
                {safeDiscount.type === "percentage" ? "%" : "₹"}
              </span>
            </div>
            {localErrors.value && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle size={11} />{localErrors.value}</p>
            )}
          </div>

          {/* Summary */}
          {safeDiscount.active && safeDiscount.type && safeDiscount.value &&
           !localErrors.type && !localErrors.value && !error && (
            <div className="col-span-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              {safeDiscount.type === "percentage"
                ? `${safeDiscount.value}% discount will be applied`
                : `₹${safeDiscount.value} flat discount will be applied`}
            </div>
          )}

          {error && typeof error === "string" && !localErrors.type && !localErrors.value && (
            <p className="col-span-2 flex items-center gap-1 text-xs text-red-500"><AlertCircle size={11} />{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountSection;
