import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";

const DiscountSection = ({ 
  discount = {}, 
  errors = {}, 
  handleChange, 
  setFormData, 
  label = "Apply Discount",
  prefix = "discount"
}) => {
  const [localErrors, setLocalErrors] = useState({});
  
  // Initialize discount if undefined
  const safeDiscount = {
    active: discount?.active || false,
    type: discount?.type || "flat",
    value: discount?.value || ""
  };

  // Get error from props or local
  const getError = () => {
    if (typeof errors === 'string') return errors;
    if (errors?.discount) return errors.discount;
    if (errors?.value) return errors.value;
    if (errors?.type) return errors.type;
    if (localErrors.value) return localErrors.value;
    if (localErrors.type) return localErrors.type;
    return null;
  };

  const error = getError();

  // Validate discount
  const validateDiscount = () => {
    if (!safeDiscount.active) {
      setLocalErrors({});
      return true;
    }

    const newErrors = {};

    // Validate type
    if (!safeDiscount.type || (safeDiscount.type !== "flat" && safeDiscount.type !== "percentage")) {
      newErrors.type = "Please select discount type";
    }

    // Validate value
    const value = safeDiscount.value || "";
    if (!value || value.trim() === "") {
      newErrors.value = "Discount value is required";
    } else {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        newErrors.value = "Discount must be a number";
      } else if (numValue < 0) {
        newErrors.value = "Discount cannot be negative";
      } else if (safeDiscount.type === "percentage" && numValue > 100) {
        newErrors.value = "Percentage discount cannot exceed 100%";
      } else if (safeDiscount.type === "flat" && numValue <= 0) {
        newErrors.value = "Flat discount must be greater than 0";
      }
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate on discount changes
  useEffect(() => {
    validateDiscount();
  }, [safeDiscount.active, safeDiscount.type, safeDiscount.value]);

  // Handle discount type change
  const handleTypeChange = (val) => {
    // Clear type error
    setLocalErrors(prev => ({ ...prev, type: "" }));
    
    // Update form data
    const updatedDiscount = {
      ...safeDiscount,
      type: val,
      value: "" // Reset value when type changes
    };
    
    // Call parent handler
    handleChange({
      target: {
        name: `${prefix}.type`,
        value: val
      }
    });
  };

  // Handle value change
  const handleValueChange = (e) => {
    const value = e.target.value;
    
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    
    // Clear value error
    setLocalErrors(prev => ({ ...prev, value: "" }));
    
    // Call parent handler
    handleChange({
      target: {
        name: `${prefix}.value`,
        value: numericValue
      }
    });
  };

  // Handle checkbox change
  const handleCheckboxChange = (e) => {
    const isActive = e.target.checked;
    
    // Clear errors when disabling discount
    if (!isActive) {
      setLocalErrors({});
    }
    
    handleChange({
      target: {
        name: `${prefix}.active`,
        checked: isActive,
        type: "checkbox"
      }
    });
  };

  // Handle direct form data update for Select
  useEffect(() => {
    if (safeDiscount.type && setFormData) {
      setFormData(prev => {
        const newDiscount = { 
          ...prev.discount, 
          type: safeDiscount.type 
        };
        return { ...prev, discount: newDiscount };
      });
    }
  }, [safeDiscount.type]);

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4">
      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={safeDiscount.active}
          onChange={handleCheckboxChange}
          className="w-4 h-4 accent-orange-500"
        />
        <span className="text-sm font-semibold text-gray-700">
          {label}
        </span>
      </label>
      
      {safeDiscount.active && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Discount Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Discount Type *
              </label>
              <Select
                value={safeDiscount.type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger
                  className={`w-full border ${
                    error || localErrors.type ? "border-red-500 bg-red-50" : "border-orange-200 bg-white hover:border-orange-300"
                  } rounded-lg p-2 text-sm shadow-sm outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-200`}
                >
                  <SelectValue placeholder="Select type">
                    {safeDiscount.type === "flat" && "Flat (₹)"}
                    {safeDiscount.type === "percentage" && "Percentage (%)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="min-w-[140px] rounded-xl border border-orange-200 bg-white p-1 shadow-xl">
                  <SelectGroup>
                    <SelectItem 
                      value="flat" 
                      className="data-[highlighted]:bg-orange-200 hover:bg-orange-100 cursor-pointer py-2"
                    >
                      Flat (₹)
                    </SelectItem>
                    <SelectItem 
                      value="percentage" 
                      className="data-[highlighted]:bg-orange-200 hover:bg-orange-100 cursor-pointer py-2"
                    >
                      Percentage (%)
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {localErrors.type && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-3 h-3" />
                  {localErrors.type}
                </p>
              )}
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Discount Value *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={safeDiscount.value}
                  onChange={handleValueChange}
                  className={`w-full border ${
                    error || localErrors.value ? 'border-red-500 bg-red-50' : 'border-orange-200 bg-white hover:border-orange-300'
                  } rounded-lg p-2 pl-8 text-sm shadow-sm outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-200`}
                  placeholder={safeDiscount.type === "percentage" ? "e.g. 10" : "e.g. 50"}
                  disabled={!safeDiscount.type}
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  {safeDiscount.type === "percentage" ? "%" : "₹"}
                </span>
              </div>
              {localErrors.value && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-3 h-3" />
                  {localErrors.value}
                </p>
              )}
            </div>
          </div>

          {/* General error from parent */}
          {error && typeof error === 'string' && !localErrors.type && !localErrors.value && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <ExclamationCircleIcon className="w-3 h-3" />
              {error}
            </p>
          )}

          {/* Validation summary */}
          {safeDiscount.active && safeDiscount.type && safeDiscount.value && 
           !localErrors.type && !localErrors.value && (
            <div className="text-xs text-gray-600 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="font-medium">
                Discount Applied: {safeDiscount.value} {safeDiscount.type === "percentage" ? "%" : "₹"}
              </p>
              <p className="text-gray-500 mt-1">
                {safeDiscount.type === "percentage" 
                  ? `${safeDiscount.value}% discount will be applied`
                  : `₹${safeDiscount.value} discount will be applied`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountSection;
