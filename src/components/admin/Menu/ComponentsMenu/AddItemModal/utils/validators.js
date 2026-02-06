export const validateForm = (addFormData, comboItems) => {
  const errors = {};

  // Basic validation
  if (!addFormData.name?.trim()) {
    errors.name = "Product name is required";
  }

  if (!addFormData.category) {
    errors.category = "Category is required";
  }

  if (!addFormData.type) {
    errors.type = "Food type is required";
  }

  // Single item validation
  if (addFormData.pricingType === "single") {
    if (!addFormData.price || addFormData.price.trim() === "") {
      errors.price = "Single price is required";
    } else if (parseInt(addFormData.price || "0") <= 0) {
      errors.price = "Price must be greater than 0";
    }
    
    // Discount validation
    if (addFormData.discount?.active) {
      if (!addFormData.discount.type) {
        errors.discount = "Discount type is required";
      } else if (!addFormData.discount.value || addFormData.discount.value.trim() === "") {
        errors.discount = "Discount value is required";
      } else {
        const discountValue = parseInt(addFormData.discount.value);
        if (isNaN(discountValue) || discountValue < 0) {
          errors.discount = "Discount must be a valid positive number";
        }
        if (addFormData.discount.type === "percentage" && discountValue > 100) {
          errors.discount = "Percentage discount cannot exceed 100%";
        }
      }
    }
  } 
  // Variant item validation
  else if (addFormData.pricingType === "variant") {
    const variantRates = addFormData.variantRates || {};
    const hasVariantRate = variantRates.quarter?.price || variantRates.half?.price || variantRates.full?.price;
    
    if (!hasVariantRate) {
      errors.variantRates = "At least one variant price (quarter/half/full) is required";
    } else {
      const variantErrors = {};
      Object.entries(variantRates).forEach(([key, value]) => {
        if (value?.price && value.price.trim() !== "") {
          if (isNaN(value.price) || parseInt(value.price) <= 0) {
            variantErrors[key] = "Must be a valid positive number";
          }
          
          // Discount validation
          if (value?.discount?.active) {
            if (!value.discount.type) {
              variantErrors[`${key}Discount`] = "Discount type is required";
            } else if (!value.discount.value || value.discount.value.trim() === "") {
              variantErrors[`${key}Discount`] = "Discount value is required";
            } else {
              const discountValue = parseInt(value.discount.value);
              if (isNaN(discountValue) || discountValue < 0) {
                variantErrors[`${key}Discount`] = "Discount must be a valid positive number";
              }
              if (value.discount.type === "percentage" && discountValue > 100) {
                variantErrors[`${key}Discount`] = "Percentage discount cannot exceed 100%";
              }
            }
          }
        }
      });
      
      if (Object.keys(variantErrors).length > 0) {
        errors.variantRates = variantErrors;
      }
    }
  } 
  // Combo item validation
  else if (addFormData.pricingType === "combo") {
    if (!addFormData.comboPrice || addFormData.comboPrice.trim() === "") {
      errors.comboPrice = "Combo price is required";
    } else if (parseInt(addFormData.comboPrice || "0") <= 0) {
      errors.comboPrice = "Combo price must be greater than 0";
    }

    // Validate combo items
    if (comboItems.length === 0) {
      errors.comboItems = "At least one combo item is required";
    } else {
      // Validate each combo item
      comboItems.forEach((item, index) => {
        if (!item.menuItemId) {
          errors.comboItems = `Item #${index + 1}: Please select a valid menu item`;
        }
      });
    }
  }

  return errors;
};