import { validateImage } from "./validators";

export const handleEditFormChange = (e, formData, setFormData, errors, setErrors, backendError, setBackendError) => {
  const { name, value, type, checked } = e.target;

  if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  if (backendError) setBackendError("");

  // SINGLE DISCOUNT
  if (name.startsWith("discount.")) {
    const field = name.split(".")[1];
    // console.log("🔥 Edit Item - Discount field change:", { field, value, checked });
    setFormData(prev => {
      const newDiscount = {
        ...prev.discount,
        [field]: field === "active" ? checked : field === "type" ? value : value.replace(/[^0-9]/g, "")
      };
      // console.log("🔥 Edit Item - New discount state:", newDiscount);
      return {
        ...prev,
        discount: newDiscount
      };
    });
    return;
  }

  // VARIANT DISCOUNT
  if (name.includes(".discount.")) {
    const [variant, , field] = name.split(".");
    setFormData(prev => ({
      ...prev,
      variantRates: {
        ...prev.variantRates,
        [variant]: {
          ...prev.variantRates[variant],
          discount: {
            ...prev.variantRates[variant]?.discount,
            [field]: field === "active" ? checked : field === "type" ? value : value.replace(/[^0-9]/g, "")
          }
        }
      }
    }));
    return;
  }

  // VARIANT PRICE
  if (name.includes(".price")) {
    const variant = name.split(".")[0];
    setFormData(prev => ({
      ...prev,
      variantRates: {
        ...prev.variantRates,
        [variant]: {
          ...prev.variantRates[variant],
          price: value.replace(/[^0-9]/g, "")
        }
      }
    }));
    if (errors.variantRates) setErrors(prev => ({ ...prev, variantRates: "" }));
    return;
  }

  // SINGLE PRICE / COMBO
  if (name === "price" || name === "comboPrice") {
    setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, "") }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    return;
  }

  // DEFAULT
  setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
};

export const handleEditFileChange = (e, setNewImageFile, setImageError) => {
  const file = e.target.files?.[0];
  setImageError("");

  if (!file) {
    setNewImageFile(null);
    return;
  }

  const imageError = validateImage(file);
  if (imageError) {
    setImageError(imageError);
    setNewImageFile(null);
    return;
  }

  setNewImageFile(file);
};

export const setEditPricingType = (type, setErrors, setFormData, setComboItems) => {
  setFormData(prev => {
    if (type === "single") {
      return {
        ...prev,
        pricingType: "single",
        variantRates: {
          quarter: { price: "", discount: { type: "flat", value: "", active: false } },
          half: { price: "", discount: { type: "flat", value: "", active: false } },
          full: { price: "", discount: { type: "flat", value: "", active: false } },
        },
        comboPrice: "",
      };
    } else if (type === "variant") {
      return {
        ...prev,
        pricingType: "variant",
        price: "",
        comboPrice: "",
      };
    } else {
      return {
        ...prev,
        pricingType: "combo",
        price: "",
        variantRates: {
          quarter: { price: "", discount: { type: "flat", value: "", active: false } },
          half: { price: "", discount: { type: "flat", value: "", active: false } },
          full: { price: "", discount: { type: "flat", value: "", active: false } },
        },
      };
    }
  });

  setErrors(prev => ({
    ...prev,
    price: "",
    variantRates: "",
    comboPrice: "",
    comboItems: ""
  }));

  if (type !== "combo") setComboItems([]);
};

export const handleEditSubmit = async (
  e,
  editFormData,
  newImageFile,
  imageError,
  comboItems,
  menuItems,
  validateForm,
  setFormErrors,
  setImageError,
  setBackendError,
  setIsUpdating,
  onSubmit,
  onClose
) => {
  e.preventDefault();

  const formErrors = validateForm(editFormData, newImageFile, comboItems);

  if (newImageFile) {
    const imageValidationError = validateImage(newImageFile);
    if (imageValidationError) {
      setImageError(imageValidationError);
      return;
    }
  }

  if (Object.keys(formErrors).length > 0) {
    setFormErrors(formErrors);
    return;
  }

  setIsUpdating(true);
  setBackendError("");

  try {
    const formDataToSubmit = {
      ...editFormData,
      price: editFormData.pricingType === "single" ? (parseInt(editFormData.price) || 0) : null,
      comboPrice: editFormData.pricingType === "combo" ? (parseInt(editFormData.comboPrice) || 0) : null,
    };

    // VARIANT DISCOUNT FIX - allow 0 as valid value
    if (editFormData.pricingType === "variant") {
      const cleanedVariantRates = {};
      Object.entries(editFormData.variantRates || {}).forEach(([key, value]) => {
        if (value?.price) {
          // Get raw value and parse safely
          const raw = value.discount?.value;
          let parsed = "";
          if (raw !== undefined && raw !== null && raw !== "") {
            const num = Number(raw);
            parsed = isNaN(num) ? "" : num;
          }
          
          const isActive = value.discount?.active === true || value.discount?.active === "true";
          
          cleanedVariantRates[key] = {
            price: parseInt(value.price, 10) || 0,
            discount: {
              type: value.discount?.type || "flat",
              value: parsed,
              active: isActive,
            }
          };
          
          // console.log("🔥 Edit Item - Final Variant Discount:", { variant: key, discount: cleanedVariantRates[key].discount });
          
          // ✅ FIXED: Only set to null if NOT active (not if parsed <= 0)
          if (!isActive) {
            cleanedVariantRates[key].discount = null;
            // console.log("🔥 Edit Item - Variant Discount set to null (inactive)");
          }
        }
      });
      formDataToSubmit.variantRates = cleanedVariantRates;
    }

    // SINGLE PRICE DISCOUNT - ensure value reaches database as number
    if (editFormData.pricingType === "single") {
      const raw = editFormData.discount?.value;
      const parsed = raw !== undefined && raw !== null && raw !== "" ? Number(raw) : "";
      
      // ✅ FIXED: Only check if active is true
      const isActive = editFormData.discount?.active === true || editFormData.discount?.active === "true";
      
      // console.log("🔥 Edit Item - Single Discount Parsing:", { raw, parsed, isActive });
      
      formDataToSubmit.discount = {
        type: editFormData.discount?.type || "flat",
        value: parsed,
        active: isActive,
      };
      
      // console.log("🔥 Edit Item - Final Single Discount:", formDataToSubmit.discount);
      
      // ✅ FIXED: Only set to null if NOT active
      if (!isActive) {
        formDataToSubmit.discount = null;
        // console.log("🔥 Edit Item - Single Discount set to null (inactive)");
      }
    }

    // COMBO ITEMS & DISCOUNT - ensure value reaches database as number
    if (editFormData.pricingType === "combo") {
      formDataToSubmit.comboItems = comboItems.map(item => ({
        menuItemId: item.menuItemId,
        variant: item.variant || undefined,
        quantity: item.quantity || 1
      }));
      formDataToSubmit.isCombo = true;
      
      const raw = editFormData.discount?.value;
      const parsed = raw !== undefined && raw !== null && raw !== "" ? Number(raw) : "";
      
      // ✅ FIXED: Only check if active is true
      const isActive = editFormData.discount?.active === true || editFormData.discount?.active === "true";
      
      formDataToSubmit.discount = {
        type: editFormData.discount?.type || "flat",
        value: parsed,
        active: isActive,
      };
      
      // ✅ FIXED: Only set to null if NOT active
      if (!isActive) {
        formDataToSubmit.discount = null;
      }
    }

    await onSubmit(formDataToSubmit, newImageFile);
    onClose();
  } catch (err) {
    console.error("Update failed:", err);

    if (err.response?.data?.error) {
      const backendError = err.response.data.error;
      setBackendError(backendError);

      if (backendError.includes("price")) setFormErrors(prev => ({ ...prev, price: backendError }));
      else if (backendError.includes("variant rate")) setFormErrors(prev => ({ ...prev, variantRates: backendError }));
      else if (backendError.includes("pricing type")) setFormErrors(prev => ({ ...prev, pricingType: backendError }));
      else if (backendError.includes("combo")) setFormErrors(prev => ({ ...prev, comboPrice: backendError }));
      else if (backendError.includes("discount")) setFormErrors(prev => ({ ...prev, discount: backendError }));
      else if (backendError.includes("combo item")) setFormErrors(prev => ({ ...prev, comboItems: backendError }));
    } else {
      setBackendError("An unexpected error occurred. Please try again.");
    }
  } finally {
    setIsUpdating(false);
  }
};
