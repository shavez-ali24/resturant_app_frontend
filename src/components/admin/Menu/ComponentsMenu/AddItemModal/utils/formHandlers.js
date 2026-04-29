import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_KB } from "../../../Lib/constants";

const sanitizeProductNameInput = (value) =>
  String(value || "")
    .replace(/[^A-Za-z\s]/g, "")
    .replace(/^(\s*)([a-z])/, (_, spaces, char) => `${spaces}${char.toUpperCase()}`);

const normalizeProductName = (value) =>
  sanitizeProductNameInput(value)
    .replace(/\s+/g, " ")
    .trim();

export const handleAddFormChange = (e, addFormData, setAddFormData, formErrors, setFormErrors, backendError, setBackendError) => {
  const { name, value, type, checked } = e.target;

  // Clear errors when user starts typing
  if (formErrors[name]) {
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }
  if (backendError) {
    setBackendError("");
  }

  // Handle discount fields
  if (name.startsWith("discount.")) {
    const discountField = name.split(".")[1];
    // console.log("🔥 Add Item - Discount field change:", { discountField, value, checked });
    setAddFormData((prev) => {
      const newDiscount = {
        ...prev.discount,
        [discountField]: discountField === "type" ? value : (discountField === "value" ? value.replace(/[^0-9]/g, "") : (discountField === "active" ? checked : value)),
      };
      // console.log("🔥 Add Item - New discount state:", newDiscount);
      return {
        ...prev,
        discount: newDiscount
      };
    });
    return;
  }

  // Handle variant discount fields
  if (name.includes(".discount.")) {
    const parts = name.split(".");
    const variant = parts[0];
    const field = parts[2];
    
    // console.log(" Add Item - Variant Discount field change:", { variant, field, value, checked });
    
    setAddFormData(prev => ({
      ...prev,
      variantRates: {
        ...prev.variantRates,
        [variant]: {
          ...prev.variantRates[variant],
          discount: {
            ...prev.variantRates[variant]?.discount,
            [field]: field === "active" ? checked : (field === "type" ? value : (field === "value" ? value.replace(/[^0-9]/g, "") : value))
          }
        }
      }
    }));
    
    // console.log(" Add Item - New variant discount state:", prev.variantRates[variant]?.discount);
    return;
  }

  // Handle variant price fields
  if (name.includes(".price")) {
    const variant = name.split(".")[0];
    const cleanedValue = value.replace(/[^0-9]/g, "");
    
    setAddFormData(prev => ({
      ...prev,
      variantRates: {
        ...prev.variantRates,
        [variant]: {
          ...prev.variantRates[variant],
          price: cleanedValue
        }
      }
    }));
    
    if (formErrors.variantRates) {
      setFormErrors(prev => ({ ...prev, variantRates: "" }));
    }
    return;
  }

  // Handle numeric fields
  const numericFields = ["price", "comboPrice"];
  if (numericFields.includes(name)) {
    const cleaned = value.replace(/[^0-9]/g, "");
    setAddFormData((prev) => ({
      ...prev,
      [name]: cleaned,
    }));
    return;
  }

  // Handle product name field
  if (name === "name") {
    setAddFormData((prev) => ({
      ...prev,
      name: sanitizeProductNameInput(value),
    }));
    return;
  }

  // Handle other fields
  setAddFormData((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
};

export const handleAddFormFileChange = (e, setAddFile, setAddFileError) => {
  const file = e.target.files?.[0];
  setAddFileError("");
  setAddFile(null);
  if (!file) return;

  const sizeKB = file.size / 1024;
  if (sizeKB > MAX_IMAGE_KB) {
    const errorMsg = `File size too large: ${sizeKB.toFixed(2)} KB. Max: ${MAX_IMAGE_KB}KB`;
    setAddFileError(errorMsg);
    e.target.value = "";
    return;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    const errorMsg = "Invalid file type (JPEG, PNG, GIF, PDF, DOC allowed)";
    setAddFileError(errorMsg);
    e.target.value = "";
    return;
  }

  setAddFile(file);
};

export const setPricingType = (type, setFormErrors, setAddFormData, setComboItems) => {
  // Clear related errors
  setFormErrors((prev) => ({
    ...prev,
    price: undefined,
    variantRates: undefined,
    comboPrice: undefined,
    comboItems: undefined,
    discount: undefined,
  }));

  setAddFormData((prev) => {
    const baseData = {
      ...prev,
      pricingType: type,
    };

    if (type === "single") {
      return {
        ...baseData,
        price: "",
        comboPrice: "",
        variantRates: { 
          quarter: { price: "", discount: { type: "flat", value: "", active: false } },
          half: { price: "", discount: { type: "flat", value: "", active: false } },
          full: { price: "", discount: { type: "flat", value: "", active: false } },
        },
      };
    } else if (type === "variant") {
      return {
        ...baseData,
        price: "",
        comboPrice: "",
        discount: { type: "flat", value: "", active: false },
      };
    } else {
      return {
        ...baseData,
        price: "",
        variantRates: { 
          quarter: { price: "", discount: { type: "flat", value: "", active: false } },
          half: { price: "", discount: { type: "flat", value: "", active: false } },
          full: { price: "", discount: { type: "flat", value: "", active: false } },
        },
        comboPrice: "",
        discount: { type: "flat", value: "", active: false },
      };
    }
  });
  
  // Clear combo items when not in combo mode
  if (type !== "combo") {
    setComboItems([]);
  }
};

export const handleSubmit = async (
  e, 
  addFormData, 
  addFile, 
  addFileError, 
  comboItems, 
  validateForm, 
  setFormErrors, 
  setBackendError, 
  setIsAddingItem, 
  onSubmit, 
  onClose,
  scrollToFirstError
) => {
  e.preventDefault();

  setBackendError("");

  // Validate form
  const errors = validateForm(addFormData, comboItems);
  if (Object.keys(errors).length > 0) {
    // console.log("Form validation errors:", errors);
    setFormErrors(errors);
    if (typeof scrollToFirstError === "function") {
      scrollToFirstError(errors);
    }
    return;
  }

  if (addFileError) {
    return;
  }

  setIsAddingItem(true);
  try {
    const formDataToSend = {
      name: normalizeProductName(addFormData.name),
      description: addFormData.description?.trim() || "",
      pricingType: addFormData.pricingType,
      type: addFormData.type,
      category: addFormData.category,
      available: addFormData.available !== undefined ? addFormData.available : true,
    };

    if (addFormData.pricingType === "single") {
      formDataToSend.price = parseInt(addFormData.price) || 0;

      // Handle discount - ensure value reaches database as number
      const raw = addFormData.discount?.value;
      const parsed = raw !== undefined && raw !== null && raw !== "" ? Number(raw) : 0;
      const isActive = parsed > 0 && (addFormData.discount?.active === true || addFormData.discount?.active === "true");
      
      formDataToSend.discount = {
        type: addFormData.discount?.type || "flat",
        value: parsed,
        active: isActive,
      };
      
      // console.log("🔥 Add Item - Discount being sent:", formDataToSend.discount);
      
      // Only include discount if it's active and has value > 0, otherwise set to null
      if (!isActive || parsed <= 0) {
        formDataToSend.discount = null;
        // console.log("🔥 Add Item - Discount set to null (inactive or zero value)");
      }
    } 
    else if (addFormData.pricingType === "variant") {
      const cleanedVariantRates = {};
      ["quarter", "half", "full"].forEach(key => {
        if (addFormData.variantRates?.[key]?.price && addFormData.variantRates[key].price.trim() !== "") {
          const raw = addFormData.variantRates[key]?.discount?.value;
          const parsed = raw !== undefined && raw !== null && raw !== "" ? Number(raw) : 0;
          const isActive = parsed > 0 && (addFormData.variantRates[key]?.discount?.active === true || addFormData.variantRates[key]?.discount?.active === "true");

          cleanedVariantRates[key] = {
            price: parseInt(addFormData.variantRates[key].price) || 0,
            discount: {
              type: addFormData.variantRates[key]?.discount?.type || "flat",
              value: parsed,
              active: isActive,
            }
          };
          
          // Only include discount if it's active and has value > 0, otherwise set to null
          if (!isActive || parsed <= 0) {
            cleanedVariantRates[key].discount = null;
          }
        }
      });

      formDataToSend.variantRates = cleanedVariantRates;
    } 
    else if (addFormData.pricingType === "combo") {
      formDataToSend.comboPrice = parseInt(addFormData.comboPrice) || 0;
      
      // Include discount for combo items - ensure value reaches database as number
      const raw = addFormData.discount?.value;
      const parsed = raw !== undefined && raw !== null && raw !== "" ? Number(raw) : 0;
      const isActive = parsed > 0 && (addFormData.discount?.active === true || addFormData.discount?.active === "true");
      
      formDataToSend.discount = {
        type: addFormData.discount?.type || "flat",
        value: parsed,
        active: isActive,
      };
      
      // Only include discount if it's active and has value > 0, otherwise set to null
      if (!isActive || parsed <= 0) {
        formDataToSend.discount = null;
      }
      
      // Filter out items with empty menuItemId
      const validComboItems = comboItems.filter(item => {
        const isValid = item.menuItemId && item.menuItemId.trim() !== "" && item.name;
        if (!isValid) {
          console.warn("Invalid combo item filtered out:", item);
        }
        return isValid;
      });
      
      if (validComboItems.length === 0) {
        throw new Error("Please select at least one valid menu item for the combo");
      }
      
      // Format exactly as backend expects
      formDataToSend.comboItems = validComboItems.map(item => ({
        menuItemId: item.menuItemId.trim(),
        name: item.name || "Unknown Item",
        variant: item.variant && item.variant.trim() !== "" ? item.variant : null,
        quantity: item.quantity || 1
      }));

      // console.log("📤 Combo items being sent:", formDataToSend.comboItems);
    }

    // console.log("📤 Submitting form data:", formDataToSend);
    
    // console.log("📤 AddItem - Discount being sent:", formDataToSend.discount);
    // console.log("📤 AddItem - Variant Rates being sent:", formDataToSend.variantRates);
    
    await onSubmit(formDataToSend, addFile);
    onClose();
    
  } catch (err) {
    console.error("❌ Add item error:", err);

    if (err.response?.data?.error) {
      const backendErr = err.response.data.error;
      setBackendError(backendErr);

      // Map backend errors to appropriate form fields
      if (backendErr.includes("price")) {
        setFormErrors((prev) => ({ ...prev, price: backendErr }));
      } else if (
        backendErr.includes("variant rate") ||
        backendErr.includes("quarter") ||
        backendErr.includes("half") ||
        backendErr.includes("full")
      ) {
        setFormErrors((prev) => ({ ...prev, variantRates: backendErr }));
      } else if (backendErr.includes("pricing type")) {
        setFormErrors((prev) => ({ ...prev, pricingType: backendErr }));
      } else if (backendErr.includes("combo")) {
        if (backendErr.includes("price")) {
          setFormErrors((prev) => ({ ...prev, comboPrice: backendErr }));
        } else if (backendErr.includes("item") || backendErr.includes("Invalid menuItemId")) {
          setFormErrors((prev) => ({ 
            ...prev, 
            comboItems: "One or more selected items are invalid. Please check your selection." 
          }));
        }
      } else if (backendErr.includes("discount")) {
        setFormErrors((prev) => ({ ...prev, discount: backendErr }));
      }
    } else if (err.message) {
      setBackendError(err.message);
      
      if (err.message.includes("No valid combo items") || err.message.includes("Please select")) {
        setFormErrors((prev) => ({ 
          ...prev, 
          comboItems: err.message 
        }));
      }
    }
  } finally {
    setIsAddingItem(false);
  }
};
