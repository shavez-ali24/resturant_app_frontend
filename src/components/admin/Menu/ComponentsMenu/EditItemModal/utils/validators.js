import { MAX_IMAGE_KB } from "../../../Lib/constants";

export const validateEditForm = (formData, imageFile, comboItems) => {
  const errors = {};
  const normalizedName = String(formData?.name || "").trim();
  const productNamePattern = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;
  
  // Name validation
  if (!normalizedName) {
    errors.name = "Product name is required";
  } else if (!productNamePattern.test(normalizedName)) {
    errors.name = "Product name can contain only letters and spaces";
  }
  
  // Category validation
  if (!formData.category) {
    errors.category = "Category is required";
  }
  
  // Type validation
  if (!formData.type) {
    errors.type = "Food type is required";
  }
  
  const pricingType = formData.pricingType || "single";
  
  // Single price validation
  if (pricingType === "single") {
    if (!formData.price) {
      errors.price = "Price is required for single pricing";
    } else if (isNaN(formData.price) || parseInt(formData.price) <= 0) {
      errors.price = "Price must be a valid positive number";
    }
    
    // Discount validation for single price
    if (formData.discount?.active) {
      if (formData.discount?.value === undefined || formData.discount?.value === "") {
        errors.discount = "Discount value is required when discount is active";
      } else {
        const discountValue = parseInt(formData.discount.value);
        if (isNaN(discountValue) || discountValue <= 0) {
          errors.discount = "Discount must be a valid positive number";
        }
        if (formData.discount.type === "percentage" && discountValue > 100) {
          errors.discount = "Percentage discount cannot exceed 100%";
        }
        if (formData.discount.type === "flat") {
          const priceValue = parseFloat(formData.price || "0");
          if (!isNaN(priceValue) && priceValue > 0 && discountValue > priceValue) {
            errors.discount = "Discount amount cannot be greater than price";
          }
        }
      }
    }
  }
  
  // Variant pricing validation
  if (pricingType === "variant") {
    const variantRates = formData.variantRates || {};
    const hasVariantRate = variantRates.quarter?.price || variantRates.half?.price || variantRates.full?.price;
    
    if (!hasVariantRate) {
      errors.variantRates = "At least one variant price (quarter/half/full) is required";
    } else {
      const variantErrors = {};
      Object.entries(variantRates).forEach(([key, value]) => {
        if (value?.price && (isNaN(value.price) || parseInt(value.price) <= 0)) {
          variantErrors[key] = "Must be a valid positive number";
        }
        
        if (value?.discount?.active) {
          if (value.discount?.value === undefined || value.discount?.value === "") {
            variantErrors[`${key}Discount`] = "Discount value is required when discount is active";
          } else {
            const discountValue = parseInt(value.discount.value);
            if (isNaN(discountValue) || discountValue <= 0) {
              variantErrors[`${key}Discount`] = "Discount must be a valid positive number";
            }
            if (value.discount.type === "percentage" && discountValue > 100) {
              variantErrors[`${key}Discount`] = "Percentage discount cannot exceed 100%";
            }
            if (value.discount.type === "flat") {
              const priceValue = parseFloat(value.price || "0");
              if (!isNaN(priceValue) && priceValue > 0 && discountValue > priceValue) {
                variantErrors[`${key}Discount`] = "Discount amount cannot be greater than price";
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
  
  // Combo pricing validation
  if (pricingType === "combo") {
    if (!formData.comboPrice) {
      errors.comboPrice = "Combo price is required";
    } else if (isNaN(formData.comboPrice) || parseInt(formData.comboPrice) <= 0) {
      errors.comboPrice = "Combo price must be a valid positive number";
    }
    
    if (comboItems.length === 0) {
      errors.comboItems = "At least one combo item is required";
    }

    if (formData.discount?.active) {
      if (formData.discount?.value === undefined || formData.discount?.value === "") {
        errors.discount = "Discount value is required when discount is active";
      } else {
        const discountValue = parseInt(formData.discount.value);
        if (isNaN(discountValue) || discountValue <= 0) {
          errors.discount = "Discount must be a valid positive number";
        }
        if (formData.discount.type === "percentage" && discountValue > 100) {
          errors.discount = "Percentage discount cannot exceed 100%";
        }
        if (formData.discount.type === "flat") {
          const comboPriceValue = parseFloat(formData.comboPrice || "0");
          if (!isNaN(comboPriceValue) && comboPriceValue > 0 && discountValue > comboPriceValue) {
            errors.discount = "Discount amount cannot be greater than combo price";
          }
        }
      }
    }
  }
  
  return errors;
};

export const validateImage = (file) => {
  if (!file) return null;
  
  if (!file.type.startsWith("image/")) {
    return "Please upload a valid image file";
  }
  
  if (file.size > MAX_IMAGE_KB * 1024) {
    return `Image size must be less than ${MAX_IMAGE_KB}KB`;
  }
  
  return null;
};
