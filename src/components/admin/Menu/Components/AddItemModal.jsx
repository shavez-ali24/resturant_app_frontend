/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlusIcon as PlusIconSolid,
} from "@heroicons/react/24/solid";

import {
  defaultAddFormState,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_KB,
  modalOverlayVariant,
  addItemModalVariant,
} from "../Lib/constants";


const AddItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  restaurantCategories,
  loadingCategories,
  errorCategories,
}) => {
  const [addFormData, setAddFormData] = useState(defaultAddFormState);
  const [addFile, setAddFile] = useState(null);
  const [addFileError, setAddFileError] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAddFormData(defaultAddFormState);
      setAddFile(null);
      setAddFileError("");
      setIsAddingItem(false);
    }
  }, [isOpen]);

  const handleAddFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "quarter" || name === "half" || name === "full") {
      setAddFormData((prev) => ({
        ...prev,
        variantRates: { ...prev.variantRates, [name]: value },
      }));
    } else {
      setAddFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const setPricingType = (type) => {
    setAddFormData((prev) => {
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
  };

  const handleAddFormFileChange = (e) => {
    const file = e.target.files?.[0];
    setAddFileError("");
    setAddFile(null);
    if (!file) return;

    const sizeKB = file.size / 1024;
    if (sizeKB > MAX_IMAGE_KB) {
      setAddFileError(
        `File size too large: ${sizeKB.toFixed(2)} KB. Max: ${MAX_IMAGE_KB}KB`
      );
      e.target.value = "";
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setAddFileError(
        "Invalid image file type (JPEG, PNG, GIF, WEBP, AVIF allowed)"
      );
      e.target.value = "";
      return;
    }
    setAddFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (addFileError) {
      return;
    }

    setIsAddingItem(true);
    try {
      await onSubmit(addFormData, addFile);
    } catch (error) {
      console.error("Failed to add item:", error);
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
          className="fixed inset-0 bg-black/50 mt-10 backdrop-blur-sm flex items-center justify-center z-40 p-4"
          onClick={onClose}
        >
          <motion.div
            variants={addItemModalVariant}
            className="bg-gradient-to-br from-gray-50 to-gray-100 p-1 rounded-2xl shadow-lg w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[90vh] overflow-y-auto rounded-[14px] bg-white">
              <motion.form onSubmit={handleSubmit} className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">🍕</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Add New Product
                    </h2>
                    <p className="text-sm text-gray-500">
                      Create a new menu item.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="ml-auto text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <XCircleIcon className="w-7 h-7" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Product Name
                    </label>
                    <input
                      name="name"
                      value={addFormData.name}
                      onChange={handleAddFormChange}
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-sm"
                      placeholder="e.g. Margherita Pizza"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pricing Type
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setPricingType("single")}
                        className={`py-2 px-4 rounded-md text-sm font-semibold transition-all ${addFormData.pricingType === "single"
                          ? "bg-white text-orange-600 shadow-sm"
                          : "bg-transparent text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        Single Price
                      </button>
                      <button
                        type="button"
                        onClick={() => setPricingType("variant")}
                        className={`py-2 px-4 rounded-md text-sm font-semibold transition-all ${addFormData.pricingType === "variant"
                          ? "bg-white text-orange-600 shadow-sm"
                          : "bg-transparent text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        Variant Pricing
                      </button>
                    </div>
                  </div>

                  {addFormData.pricingType === "single" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={addFormData.price}
                        onChange={handleAddFormChange}
                        required={addFormData.pricingType === "single"}
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-sm"
                        placeholder="e.g. 299"
                      />
                    </div>
                  )}

                  {addFormData.pricingType === "variant" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Variant Prices (₹)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Quarter</label>
                          <input
                            type="number"
                            name="quarter"
                            value={addFormData.variantRates.quarter}
                            onChange={handleAddFormChange}
                            min="0"
                            step="0.01"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                            placeholder="e.g. 150"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Half</label>
                          <input
                            type="number"
                            name="half"
                            value={addFormData.variantRates.half}
                            onChange={handleAddFormChange}
                            min="0"
                            step="0.01"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                            placeholder="e.g. 299"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Full</label>
                          <input
                            type="number"
                            name="full"
                            value={addFormData.variantRates.full}
                            onChange={handleAddFormChange}
                            min="0"
                            step="0.01"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                            placeholder="e.g. 499"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Category
                      </label>
                      {loadingCategories && (
                        <div className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100 text-sm text-gray-500">
                          Loading categories...
                        </div>
                      )}
                      {errorCategories && (
                        <div className="w-full border border-red-300 rounded-lg p-3 bg-red-50 text-sm text-red-600">
                          {errorCategories}
                        </div>
                      )}
                      {!loadingCategories && !errorCategories && (
                        <select
                          name="category"
                          value={addFormData.category}
                          onChange={handleAddFormChange}
                          required
                          className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-sm ${!addFormData.category
                            ? "text-gray-400"
                            : "text-gray-900"
                            }`}
                        >
                          <option value="" disabled>Select a Category</option>
                          {restaurantCategories.length === 0 ? (
                            <option disabled>No categories found</option>
                          ) : (
                            restaurantCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))
                          )}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Food Type
                      </label>
                      <select
                        name="type"
                        value={addFormData.type}
                        onChange={handleAddFormChange}
                        className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-sm ${!addFormData.type
                          ? "text-gray-400"
                          : "text-gray-900"
                          }`}
                      >
                        <option value="" disabled>Select Food Type</option>
                        <option value="veg">🌱 Veg</option>
                        <option value="non-veg">🍗 Non-Veg</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Product Image
                    </label>
                    <label
                      htmlFor="add-product-image-modal"
                      className="cursor-pointer"
                    >
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors bg-gray-50">
                        <input
                          type="file"
                          name="file"
                          onChange={handleAddFormFileChange}
                          className="hidden"
                          id="add-product-image-modal"
                          accept={ALLOWED_IMAGE_TYPES.join(",")}
                        />
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-600">
                          <p className="font-medium text-sm">
                            {addFile ? addFile.name : "Click to upload image"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Max {MAX_IMAGE_KB}KB (JPG, PNG, WEBP, etc.)
                          </p>
                        </div>
                      </div>
                    </label>
                    {addFile && !addFileError && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircleIcon className="w-3.5 h-3.5" /> Selected:{" "}
                        {addFile.name} ({(addFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                    {addFileError && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5" />{" "}
                        {addFileError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <input
                      type="checkbox"
                      id="available-checkbox"
                      name="available"
                      checked={addFormData.available}
                      onChange={handleAddFormChange}
                      className="h-4 w-4 accent-orange-600 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="available-checkbox"
                        className="font-medium text-sm text-gray-800 cursor-pointer"
                      >
                        Available for Order
                      </label>
                      <p className="text-xs text-gray-500">
                        Uncheck this if the product is temporarily unavailable.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Product Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={addFormData.description}
                      onChange={handleAddFormChange}
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white resize-vertical text-sm"
                      placeholder="e.g., Fresh basil pesto, cherry tomatoes, mozzarella..."
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={
                      isAddingItem ||
                      !!addFileError ||
                      loadingCategories ||
                      !addFormData.category
                    }
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg text-base font-semibold shadow-md hover:bg-orange-600 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAddingItem ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding Product...
                      </>
                    ) : (
                      <>
                        <PlusIconSolid className="w-5 h-5" />
                        Add Product to Menu
                      </>
                    )}
                  </motion.button>
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