/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { MAX_IMAGE_KB, modalOverlayVariant, modalContentVariant } from "../Lib/constants";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EditItemModal = ({
  isOpen,
  item,
  onClose,
  onSubmit,
  restaurantCategories,
}) => {
  const [editFormData, setEditFormData] = useState(item);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState("");
  

  // ✅ Reset data when modal opens with a new item
  useEffect(() => {
    if (item) {
      setEditFormData({
        ...item,
        variantRates: item.variantRates || {
          quarter: "",
          half: "",
          full: "",
        },
      });
      setNewImageFile(null);
      setErrors({});
      setImageError("");
    }
  }, [item]);

  // ✅ Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!editFormData.name?.trim()) {
      newErrors.name = "Product name is required";
    }
    
    // Category validation
    if (!editFormData.category) {
      newErrors.category = "Category is required";
    }
    
    // Type validation
    if (!editFormData.type) {
      newErrors.type = "Food type is required";
    }
    
    // Pricing validation based on pricing type
    const pricingType = editFormData.pricingType || "single";
    
    if (pricingType === "single") {
      if (!editFormData.price) {
        newErrors.price = "Price is required for single pricing";
      } else if (isNaN(editFormData.price) || parseInt(editFormData.price) <= 0) {
        newErrors.price = "Price must be a valid positive number";
      }
    } else if (pricingType === "variant") {
      const variantRates = editFormData.variantRates || {};
      const hasVariantRate = variantRates.quarter || variantRates.half || variantRates.full;
      
      if (!hasVariantRate) {
        newErrors.variantRates = "At least one variant price (quarter/half/full) is required";
      } else {
        // Validate each variant rate that has a value
        const variantErrors = {};
        Object.entries(variantRates).forEach(([key, value]) => {
          if (value && (isNaN(value) || parseInt(value) <= 0)) {
            variantErrors[key] = "Must be a valid positive number";
          }
        });
        
        if (Object.keys(variantErrors).length > 0) {
          newErrors.variantRates = variantErrors;
        }
      }
    }
    
    // Image validation
    if (newImageFile) {
      if (newImageFile.size > MAX_IMAGE_KB * 1024) {
        setImageError(`Image size must be less than ${MAX_IMAGE_KB}KB`);
        return false;
      }
      if (!newImageFile.type.startsWith("image/")) {
        setImageError("Please upload a valid image file");
        return false;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle text and checkbox inputs
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    if (name === "quarter" || name === "half" || name === "full") {
      setEditFormData((prev) => ({
        ...prev,
        variantRates: { ...prev.variantRates, [name]: value },
      }));
      
      // Clear variant rates error when user starts typing
      if (errors.variantRates) {
        setErrors(prev => ({ ...prev, variantRates: "" }));
      }
    } else {
      setEditFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // ✅ Handle pricing type switch
  const setEditPricingType = (type) => {
    setEditFormData((prev) => {
      if (type === "single") {
        return {
          ...prev,
          pricingType: "single",
          variantRates: { quarter: "", half: "", full: "" },
        };
      } else {
        return {
          ...prev,
          pricingType: "variant",
          price: "",
        };
      }
    });
    
    // Clear pricing errors when switching types
    setErrors(prev => ({
      ...prev,
      price: "",
      variantRates: ""
    }));
  };

  // ✅ Handle image change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setImageError("");
    
    if (!file) {
      setNewImageFile(null);
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file");
      setNewImageFile(null);
      return;
    }
    
    // Validate file size
    if (file.size > MAX_IMAGE_KB * 1024) {
      setImageError(`Image size must be less than ${MAX_IMAGE_KB}KB`);
      setNewImageFile(null);
      return;
    }
    
    setNewImageFile(file);
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Prepare variant rates: convert empty strings to null for backend
      const variantRates = editFormData.variantRates || {};
      const cleanedVariantRates = {};
      Object.entries(variantRates).forEach(([key, value]) => {
        cleanedVariantRates[key] = value ? value : null;
      });
      
      // Prepare form data with cleaned variant rates
      const formDataToSubmit = {
        ...editFormData,
        variantRates: cleanedVariantRates
      };
      
      await onSubmit(formDataToSubmit, newImageFile);
    } catch (err) {
      console.error("Update failed:", err);
      
      // Handle specific error messages from backend
      if (err.response?.data?.error) {
        const backendError = err.response.data.error;
        
        if (backendError.includes("price")) {
          setErrors(prev => ({ ...prev, price: backendError }));
        } else if (backendError.includes("variant rate") || backendError.includes("quarter") || backendError.includes("half") || backendError.includes("full")) {
          setErrors(prev => ({ ...prev, variantRates: backendError }));
        } else if (backendError.includes("pricing type")) {
          setErrors(prev => ({ ...prev, pricingType: backendError }));
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlayVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            variants={modalContentVariant}
            className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-orange-500 pb-3">
              <h3 className="text-xl font-semibold text-gray-800 flex flex-row items-center gap-2">
                Edit <span className="text-orange-500">({item.name})</span>
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                <XCircleIcon className="w-7 h-7" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  className={`w-full border ${errors.name ? 'border-red-500' : 'border-orange-500'} rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm ${errors.name ? 'bg-red-50' : 'bg-orange-50'}`}
                  placeholder="Name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Pricing type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pricing Type *
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-orange-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setEditPricingType("single")}
                    className={`py-2 px-4 rounded-md text-sm font-semibold transition-all ${(editFormData.pricingType || "single") === "single"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-transparent text-gray-600 hover:bg-orange-200"
                      }`}
                  >
                    Single Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPricingType("variant")}
                    className={`py-2 px-4 rounded-md text-sm font-semibold transition-all ${editFormData.pricingType === "variant"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-transparent text-gray-600 hover:bg-orange-200"
                      }`}
                  >
                    Variant Pricing
                  </button>
                </div>
              </div>

              {/* Single Price Field */}
              {(editFormData.pricingType || "single") === "single" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Price (₹) *
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={editFormData.price}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, ""); // ONLY DIGITS
                      setEditFormData({ ...editFormData, price: val });
                      
                      // Clear error when user starts typing
                      if (errors.price) {
                        setErrors(prev => ({ ...prev, price: "" }));
                      }
                    }}
                    className={`w-full border ${errors.price ? 'border-red-500' : 'border-orange-500'} rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm ${errors.price ? 'bg-red-50' : 'bg-orange-50'}`}
                    placeholder="e.g. 299"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <ExclamationCircleIcon className="w-4 h-4" />
                      {errors.price}
                    </p>
                  )}
                </div>
              )}

              {/* Variant Prices */}
              {editFormData.pricingType === "variant" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Variant Prices (₹) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {["quarter", "half", "full"].map((key) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                          {key}
                        </label>
                        <input
                          type="text"
                          name={key}
                          value={editFormData.variantRates?.[key] || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, ""); // ONLY DIGITS
                            setEditFormData((prev) => ({
                              ...prev,
                              variantRates: { ...prev.variantRates, [key]: val },
                            }));
                            
                            // Clear variant errors when user starts typing
                            if (errors.variantRates) {
                              setErrors(prev => ({ ...prev, variantRates: "" }));
                            }
                          }}
                          className={`w-full border ${typeof errors.variantRates === 'object' && errors.variantRates[key] ? 'border-red-500' : 'border-orange-500'} rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none ${typeof errors.variantRates === 'object' && errors.variantRates[key] ? 'bg-red-50' : 'bg-orange-50'}`}
                          placeholder={`e.g. ${key === "quarter" ? 150 : key === "half" ? 299 : 499
                            }`}
                        />
                        {typeof errors.variantRates === 'object' && errors.variantRates[key] && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.variantRates[key]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {typeof errors.variantRates === 'string' && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <ExclamationCircleIcon className="w-4 h-4" />
                      {errors.variantRates}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    * At least one variant price is required
                  </p>
                </div>
              )}

              {/* Category and type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Category *
                  </label>
                  <Select
                    value={editFormData.category || ""}
                    onValueChange={(val) => {
                      setEditFormData((prev) => ({ ...prev, category: val }));
                      if (errors.category) {
                        setErrors(prev => ({ ...prev, category: "" }));
                      }
                    }}
                  >
                    <SelectTrigger className={`w-full border ${errors.category ? 'border-red-500' : 'border-orange-500'} rounded-lg p-3 ${errors.category ? 'bg-red-50' : 'bg-orange-50'} text-sm focus:ring-2 focus:ring-orange-500`}>
                      <SelectValue placeholder="Select a Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-orange-50 border-orange-300 shadow-xl rounded-xl p-1">
                      <SelectGroup>
                        {restaurantCategories.length === 0 ? (
                          <SelectItem value="" disabled>
                            No categories found
                          </SelectItem>
                        ) : (
                          restaurantCategories.map((cat) => (
                            <SelectItem
                              key={cat}
                              value={cat}
                              className="data-[highlighted]:bg-orange-200"
                            >
                              {cat}
                            </SelectItem>
                          ))
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <ExclamationCircleIcon className="w-4 h-4" />
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Food Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Food Type *
                  </label>
                  <Select
                    value={editFormData.type || ""}
                    onValueChange={(val) => {
                      setEditFormData((prev) => ({ ...prev, type: val }));
                      if (errors.type) {
                        setErrors(prev => ({ ...prev, type: "" }));
                      }
                    }}
                  >
                    <SelectTrigger className={`w-full border ${errors.type ? 'border-red-500' : 'border-orange-500'} rounded-lg p-3 ${errors.type ? 'bg-red-50' : 'bg-orange-50'} text-sm focus:ring-2 focus:ring-orange-500`}>
                      <SelectValue placeholder="Select Food Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-orange-50 border-orange-300 shadow-xl rounded-xl p-1">
                      <SelectGroup>
                        <SelectItem
                          value="veg"
                          className="data-[highlighted]:bg-orange-200"
                        >
                          Veg
                        </SelectItem>
                        <SelectItem
                          value="non-veg"
                          className="data-[highlighted]:bg-orange-200"
                        >
                          Non-Veg
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <ExclamationCircleIcon className="w-4 h-4" />
                      {errors.type}
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
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  className="w-full border border-orange-500 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-orange-50"
                  placeholder="Description"
                  rows="3"
                />
              </div>

              {/* Availability */}
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-orange-50 rounded-lg border border-orange-500 w-max">
                <input
                  type="checkbox"
                  name="available"
                  checked={editFormData.available}
                  onChange={handleEditFormChange}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Available
                </span>
              </label>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Product Image
                </label>
                <img
                  src={
                    newImageFile
                      ? URL.createObjectURL(newImageFile)
                      : editFormData.image?.url ||
                      "https://placehold.co/300x200?text=No+Image"
                  }
                  alt="preview"
                  className="w-full h-40 object-cover rounded-lg mb-2 border border-orange-500"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${imageError ? 'file:bg-red-50 file:text-red-700' : 'file:bg-orange-50 file:text-orange-700'} hover:file:bg-orange-100`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select a new file to replace the current image. Max {MAX_IMAGE_KB}KB.
                </p>
                {imageError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {imageError}
                  </p>
                )}
              </div>

              {/* Required fields note */}
              {/* <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  * Required fields
                </p>
              </div> */}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-orange-100 text-gray-800 rounded-xl hover:bg-orange-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-semibold shadow-sm disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditItemModal;