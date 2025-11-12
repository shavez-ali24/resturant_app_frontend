/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { MAX_IMAGE_KB, modalOverlayVariant, modalContentVariant } from "../Lib/constants";

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

  // ✅ Reset data when modal opens with a new item
  useEffect(() => {
    if (item) {
      const safeItem = {
        ...item,
        variantRates: item.variantRates || { quarter: "", half: "", full: "" },
      };
      setEditFormData(safeItem);
      setNewImageFile(null);
    }
  }, [item]);

  // ✅ Handle text and checkbox inputs
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "quarter" || name === "half" || name === "full") {
      setEditFormData((prev) => ({
        ...prev,
        variantRates: { ...prev.variantRates, [name]: value },
      }));
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
  };

  // ✅ Handle image change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setNewImageFile(null);
      return;
    }
    setNewImageFile(file);
  };

  // ✅ Submit handler — builds FormData and sends via onSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const formDataToSend = new FormData();

      // Append text fields
      Object.keys(editFormData).forEach((key) => {
        if (key === "variantRates") {
          Object.entries(editFormData.variantRates).forEach(([variant, value]) => {
            if (value) formDataToSend.append(`variantRates[${variant}]`, value);
          });
        } else if (key !== "image" && editFormData[key] !== undefined && editFormData[key] !== null) {
          formDataToSend.append(key, editFormData[key]);
        }
      });

      // ✅ Append new image if selected
      if (newImageFile) {
        formDataToSend.append("file", newImageFile);
      }

      // ✅ Send FormData to parent (Menu.jsx → handleUpdateItem)
      await onSubmit(editFormData, newImageFile);

      setIsUpdating(false);
    } catch (error) {
      console.error("Failed to update item:", error);
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalContentVariant}
            className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-xl font-semibold text-gray-800">
                Edit "{item.name}"
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
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  placeholder="Name"
                />
              </div>

              {/* Pricing type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pricing Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setEditPricingType("single")}
                    className={`py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                      (editFormData.pricingType || "single") === "single"
                        ? "bg-white text-orange-600 shadow-sm"
                        : "bg-transparent text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Single Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPricingType("variant")}
                    className={`py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                      editFormData.pricingType === "variant"
                        ? "bg-white text-orange-600 shadow-sm"
                        : "bg-transparent text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Variant Pricing
                  </button>
                </div>
              </div>

              {/* Price fields */}
              {(editFormData.pricingType || "single") === "single" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={editFormData.price}
                    onChange={handleEditFormChange}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    placeholder="e.g. 299"
                  />
                </div>
              )}

              {editFormData.pricingType === "variant" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Variant Prices (₹)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {["quarter", "half", "full"].map((key) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                          {key}
                        </label>
                        <input
                          type="number"
                          name={key}
                          value={editFormData.variantRates?.[key] || ""}
                          onChange={handleEditFormChange}
                          min="0"
                          step="0.01"
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                          placeholder={`e.g. ${key === "quarter" ? 150 : key === "half" ? 299 : 499}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category and type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditFormChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  >
                    <option value="">Select a Category</option>
                    {restaurantCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Food Type
                  </label>
                  <select
                    name="type"
                    value={editFormData.type}
                    onChange={handleEditFormChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  >
                    <option value="">Select Food Type</option>
                    <option value="veg">🌱 Veg</option>
                    <option value="non-veg">🍗 Non-Veg</option>
                  </select>
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
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  placeholder="Description"
                  rows="3"
                />
              </div>

              {/* Availability */}
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-lg border">
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
                  className="w-full h-40 object-cover rounded-lg mb-2 border"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select a new file to replace the current image. Max {MAX_IMAGE_KB}KB.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition font-semibold"
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
