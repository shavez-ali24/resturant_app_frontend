/* AddItemModal.jsx */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { Pizza } from "lucide-react";

import {
  defaultAddFormState,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_KB,
  modalOverlayVariant,
  addItemModalVariant,
} from "../Lib/constants";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AddItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  restaurantCategories = [],
  onError,
}) => {
  const [addFormData, setAddFormData] = useState(defaultAddFormState);
  const [addFile, setAddFile] = useState(null);
  const [addFileError, setAddFileError] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setAddFormData(defaultAddFormState);
      setAddFile(null);
      setAddFileError("");
      setIsAddingItem(false);
      setFormErrors({});
      setBackendError("");
    }
  }, [isOpen]);

  const handleAddFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (backendError) {
      setBackendError("");
    }

    const numericFields = ["price", "quarter", "half", "full"];
    if (numericFields.includes(name)) {
      const cleaned = value.replace(/[^0-9]/g, "");
      setAddFormData((prev) =>
        name === "price"
          ? { ...prev, price: cleaned }
          : { ...prev, variantRates: { ...prev.variantRates, [name]: cleaned } }
      );
      return;
    }

    setAddFormData((prev) => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!addFormData.name?.trim()) {
      errors.name = "Product name is required";
    }
    
    if (!addFormData.category) {
      errors.category = "Category is required";
    }
    
    if (!addFormData.type) {
      errors.type = "Food type is required";
    }

    if (addFormData.pricingType === "single") {
      if (!addFormData.price) {
        errors.price = "Single price is required";
      } else if (parseInt(addFormData.price || "0") <= 0) {
        errors.price = "Price must be greater than 0";
      }
    } else if (addFormData.pricingType === "variant") {
      const { quarter, half, full } = addFormData.variantRates;
      
      if (!quarter && !half && !full) {
        errors.variantRates = "At least one variant rate (quarter/half/full) is required";
      } else {
        if (quarter && parseInt(quarter || "0") <= 0) {
          errors.quarter = "Quarter price must be greater than 0";
        }
        if (half && parseInt(half || "0") <= 0) {
          errors.half = "Half price must be greater than 0";
        }
        if (full && parseInt(full || "0") <= 0) {
          errors.full = "Full price must be greater than 0";
        }
      }
    } else {
      errors.pricingType = "Invalid pricing type. Must be 'single' or 'variant'";
    }

    return errors;
  };

  const setPricingType = (type) => {
    setFormErrors((prev) => ({
      ...prev,
      price: undefined,
      variantRates: undefined,
      quarter: undefined,
      half: undefined,
      full: undefined,
    }));

    setAddFormData((prev) => {
      if (type === "single") {
        return { 
          ...prev, 
          pricingType: "single", 
          variantRates: { quarter: "", half: "", full: "" } 
        };
      } else {
        return { 
          ...prev, 
          pricingType: "variant", 
          price: "" 
        };
      }
    });
  };

  const handleAddFormFileChange = (e) => {
    const file = e.target.files?.[0];
    setAddFileError("");
    setAddFile(null);
    if (!file) return;

    const sizeKB = file.size / 1024;
    if (sizeKB > MAX_IMAGE_KB) {
      const errorMsg = `File size too large: ${sizeKB.toFixed(2)} KB. Max: ${MAX_IMAGE_KB}KB`;
      setAddFileError(errorMsg);
      onError?.(errorMsg);
      e.target.value = "";
      return;
    }
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const errorMsg = "Invalid image file type (JPEG, PNG, GIF, WEBP, AVIF allowed)";
      setAddFileError(errorMsg);
      onError?.(errorMsg);
      e.target.value = "";
      return;
    }
    
    setAddFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setBackendError("");
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstError = Object.values(errors)[0];
      onError?.(firstError);
      return;
    }
    
    if (addFileError) {
      onError?.(addFileError);
      return;
    }

    setIsAddingItem(true);
    try {
      const formDataToSend = {
        name: addFormData.name.trim(),
        description: addFormData.description || "",
        pricingType: addFormData.pricingType,
        type: addFormData.type,
        category: addFormData.category,
        available: addFormData.available ?? true,
      };

      if (addFormData.pricingType === "single") {
        formDataToSend.price = parseInt(addFormData.price || "0");
        formDataToSend.variantRates = null;
      } else {
        const rates = {};
        const { quarter, half, full } = addFormData.variantRates;
        
        if (quarter?.trim()) rates.quarter = parseInt(quarter);
        if (half?.trim()) rates.half = parseInt(half);
        if (full?.trim()) rates.full = parseInt(full);
        
        if (Object.keys(rates).length === 0) {
          throw new Error("At least one variant rate (quarter/half/full) is required");
        }
        
        formDataToSend.variantRates = rates;
        formDataToSend.price = null;
      }

      await onSubmit(formDataToSend, addFile);
    } catch (err) {
      console.error("Add item error:", err);
      
      if (err.response?.data?.error) {
        const backendErr = err.response.data.error;
        setBackendError(backendErr);
        
        if (backendErr.includes("price")) {
          setFormErrors(prev => ({ ...prev, price: backendErr }));
        } else if (backendErr.includes("variant rate") || 
                   backendErr.includes("quarter") || 
                   backendErr.includes("half") || 
                   backendErr.includes("full")) {
          setFormErrors(prev => ({ ...prev, variantRates: backendErr }));
        } else if (backendErr.includes("pricing type")) {
          setFormErrors(prev => ({ ...prev, pricingType: backendErr }));
        }
      }
      
      onError?.(err.message || "Failed to add item");
    } finally {
      setIsAddingItem(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlayVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm h-full pt-20 flex items-center justify-center z-40 p-2"
          onClick={onClose}
        >
          <motion.div
            variants={addItemModalVariant}
            className="bg-gradient-to-br from-gray-50 to-gray-100 p-1 rounded-2xl shadow-lg w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[85vh] overflow-y-auto rounded-[14px] bg-white">
              <motion.form onSubmit={handleSubmit} className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 border-b border-orange-500 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <Pizza className="text-white text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
                    <p className="text-sm text-gray-500">Create a new menu item.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="ml-auto text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-7 h-7" />
                  </button>
                </div>

                {/* Show backend error at top */}
                {backendError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {backendError}
                    </p>
                  </div>
                )}

                {/* Image Upload */}
               

                <div className="space-y-6 mt-6">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Product Name *
                    </label>
                    <input
                      name="name"
                      value={addFormData.name}
                      onChange={handleAddFormChange}
                      className={`w-full border ${
                        formErrors.name ? "border-red-500" : "border-orange-500"
                      } rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-orange-50 text-sm`}
                      placeholder="e.g. Margherita Pizza"
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Pricing Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pricing Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                      {["single", "variant"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPricingType(type)}
                          className={`py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                            addFormData.pricingType === type
                              ? "bg-orange-500 text-white shadow-sm"
                              : "bg-transparent text-gray-600 hover:bg-orange-200"
                          }`}
                        >
                          {type === "single" ? "Single Price" : "Variant Pricing"}
                        </button>
                      ))}
                    </div>
                    {formErrors.pricingType && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {formErrors.pricingType}
                      </p>
                    )}
                  </div>

                  {/* Price Inputs */}
                  {addFormData.pricingType === "single" ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Price (₹) *
                      </label>
                      <input
                        type="text"
                        name="price"
                        value={addFormData.price}
                        onChange={handleAddFormChange}
                        inputMode="numeric"
                        className={`w-full border bg-orange-50 ${
                          formErrors.price ? "border-red-500" : "border-orange-500"
                        } rounded-lg p-3 text-sm`}
                        placeholder="e.g. 299"
                      />
                      {formErrors.price && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {formErrors.price}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Variant Prices (₹) *
                      </label>
                      {formErrors.variantRates && (
                        <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {formErrors.variantRates}
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {["quarter", "half", "full"].map((variant) => (
                          <div key={variant}>
                            <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                              {variant}
                            </label>
                            <input
                              type="text"
                              name={variant}
                              value={addFormData.variantRates[variant]}
                              onChange={handleAddFormChange}
                              inputMode="numeric"
                              className={`w-full border bg-orange-50 ${
                                formErrors[variant] ? "border-red-500" : "border-orange-500"
                              } rounded-lg p-3 text-sm`}
                              placeholder="e.g. 150"
                            />
                            {formErrors[variant] && (
                              <p className="text-xs text-red-600 mt-1">{formErrors[variant]}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        * At least one variant price is required
                      </p>
                    </div>
                  )}

                  {/* Category & Food Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Category *
                      </label>
                      <Select
                        value={addFormData.category}
                        onValueChange={(val) => {
                          setAddFormData((prev) => ({ ...prev, category: val }));
                          if (formErrors.category) {
                            setFormErrors(prev => ({ ...prev, category: undefined }));
                          }
                        }}
                      >
                        <SelectTrigger
                          className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-orange-50 text-sm ${
                            formErrors.category ? "border-red-500" : "border-orange-500"
                          }`}
                        >
                          <SelectValue placeholder="Select a Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-orange-50 border-orange-300 shadow-xl rounded-xl p-1 min-w-[140px] cursor-pointer">
                          <SelectGroup>
                            {restaurantCategories.length === 0 ? (
                              <SelectItem value="" disabled>No categories found</SelectItem>
                            ) : (
                              restaurantCategories.map((cat) => (
                                <SelectItem key={cat} value={cat} className="data-[highlighted]:bg-orange-200">
                                  {cat}
                                </SelectItem>
                              ))
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {formErrors.category && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {formErrors.category}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Food Type *
                      </label>
                      <Select
                        value={addFormData.type}
                        onValueChange={(val) => {
                          setAddFormData((prev) => ({ ...prev, type: val }));
                          if (formErrors.type) {
                            setFormErrors(prev => ({ ...prev, type: undefined }));
                          }
                        }}
                      >
                        <SelectTrigger
                          className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-orange-50 text-sm ${
                            formErrors.type ? "border-red-500" : "border-orange-500"
                          }`}
                        >
                          <SelectValue placeholder="Select Food Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-orange-50 border-orange-300 shadow-xl rounded-xl p-1 min-w-[140px] cursor-pointer">
                          <SelectGroup>
                            <SelectItem value="veg" className="data-[highlighted]:bg-orange-200">Veg</SelectItem>
                            <SelectItem value="non-veg" className="data-[highlighted]:bg-orange-200">Non-Veg</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {formErrors.type && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {formErrors.type}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={addFormData.description}
                      onChange={handleAddFormChange}
                      rows={3}
                      className="w-full border border-orange-500 rounded-lg p-3 bg-orange-50 text-sm focus:ring-2 focus:ring-orange-500"
                      placeholder="Write product description..."
                    />
                  </div>
                   <div>
                  <label className="block text-sm font-semibold mb-1">
                    Product Image
                  </label>
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center bg-gray-50">
                      <input
                        type="file"
                        className="hidden"
                        accept={ALLOWED_IMAGE_TYPES.join(",")}
                        onChange={handleAddFormFileChange}
                      />
                      <p className="text-sm">
                        {addFile ? addFile.name : "Click to upload image"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Max {MAX_IMAGE_KB}KB
                      </p>
                    </div>
                  </label>

                  {addFile && !addFileError && (
                    <p className="text-xs text-green-600 mt-2 flex gap-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      Selected ({(addFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}

                  {addFileError && (
                    <p className="text-xs text-red-600 mt-2 flex gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {addFileError}
                    </p>
                  )}
                </div>

                  {/* Submit */}
                  <div className="mt-6 text-right">
                    <button
                      type="submit"
                      disabled={isAddingItem}
                      className="py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      {isAddingItem ? "Adding..." : "Add Product"}
                    </button>
                  </div>
                </div>
              </motion.form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddItemModal;