"use client";
import React, { useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Building2 } from "lucide-react";
import { XCircleIcon } from "@heroicons/react/24/solid";

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
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-2 backdrop-blur-[2px] sm:p-4"
      >
        <motion.div
          variants={modalContentVariant}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl rounded-2xl bg-gradient-to-br from-orange-100/60 via-orange-50/80 to-white p-[1px] shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
        >
          <div className="max-h-[92dvh] overflow-y-auto rounded-[15px] border border-orange-100 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95 sm:max-h-[88vh]">
            <div className="p-4 sm:p-6 md:p-7">
              <div className="mb-5 flex items-center gap-3 border-b border-orange-200 pb-4 dark:border-slate-700">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                    Update Restaurant Profile
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-300">
                    Keep profile details accurate for customers and staff.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-orange-100 hover:text-orange-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-orange-300"
                  aria-label="Close profile modal"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <motion.form onSubmit={handleSubmit} className="mt-5 space-y-5">
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
                  currentLogo={initialData?.logo?.url || ""}
                />

                <UpdateFormActions
                  isSubmitting={isSubmitting}
                  fileError={fileError}
                  onClose={onClose}
                />
              </motion.form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
