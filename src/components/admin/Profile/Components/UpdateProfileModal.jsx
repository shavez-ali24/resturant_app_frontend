"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

import { useUpdateProfileForm } from "../Hooks/useUpdateProfileForm";
import {
  modalOverlayVariant,
  modalContentVariant,
  chipVariant,
} from "../Lib/motionVariants";

import UpdateCoreProfileForm from "./UpdateCoreProfileForm";
import UpdateCategoriesForm from "./UpdateCategoriesForm";
import UpdateOrderModeForm from "./UpdateOrderModeForm";
import UpdateFinancialsForm from "./UpdateFinancialsForm";
import UpdateBrandingForm from "./UpdateBrandingForm";
import UpdateFormActions from "./UpdateFormActions";

export const UpdateProfileModal = ({
  initialData,
  token,
  onClose,
  onUpdateSuccess,
}) => {
  // ESC KEY CLOSE
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscKey);

    // BODY SCROLL LOCK
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  const {
    formData,
    categories,
    currentCategoryInput,
    setCurrentCategoryInput,
    file,
    fileError,
    isSubmitting,
    notification,
    categorySuggestions,
    activeModesCount,
    atLeastOneModeActive,
    handleChange,
    handleGstToggle,
    handleOrderModeToggle,
    handleFileChange,
    handleCategoryKeyDown,
    handleRemoveCategory,
    handleSubmit,
    closeNotification,
  } = useUpdateProfileForm(initialData, token, onUpdateSuccess, onClose);

  // ⛔ IMPORTANT: render only after DOM ready
  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        variants={modalOverlayVariant}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3"
      >
        {/* MODAL BOX */}
        <motion.div
          variants={modalContentVariant}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl border border-orange-100 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="w-full p-4 md:p-6 space-y-5 overflow-y-auto">
            {/* HEADER */}
            <div className="flex justify-between items-center pb-4 border-b border-orange-200">
              <h2 className="text-xl font-bold text-orange-700">
                Update Restaurant Profile
              </h2>

              <button
                onClick={onClose}
                className="text-orange-400 hover:text-orange-700 transition-colors p-1 h-8 w-8 rounded-full hover:bg-orange-100"
              >
                ✕
              </button>
            </div>

            {/* FORM */}
            <motion.form onSubmit={handleSubmit} className="space-y-6">
              <UpdateCoreProfileForm
                formData={formData}
                handleChange={handleChange}
              />

              <UpdateCategoriesForm
                categories={categories}
                currentCategoryInput={currentCategoryInput}
                setCurrentCategoryInput={setCurrentCategoryInput}
                handleCategoryKeyDown={handleCategoryKeyDown}
                handleRemoveCategory={handleRemoveCategory}
                categorySuggestions={categorySuggestions}
                chipVariant={chipVariant}
              />

              <UpdateOrderModeForm
                formData={formData}
                handleOrderModeToggle={handleOrderModeToggle}
                activeModesCount={activeModesCount}
                atLeastOneModeActive={atLeastOneModeActive}
              />

              <UpdateFinancialsForm
                formData={formData}
                handleChange={handleChange}
                handleGstToggle={handleGstToggle}
              />

              <UpdateBrandingForm
                file={file}
                fileError={fileError}
                handleFileChange={handleFileChange}
              />

              <UpdateFormActions
                isSubmitting={isSubmitting}
                fileError={fileError}
                onClose={onClose}
              />
            </motion.form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
