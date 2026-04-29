/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCard } from "./commanProfile/FormCard";

export default function UpdateCategoriesForm({
  categories,
  chipVariant,
  currentCategoryInput,
  setCurrentCategoryInput,
  handleCategoryKeyDown,
  handleAddCategory,
  handleRemoveCategory,
  categorySuggestions,
}) {
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState(null);

  const handleRequestDelete = (category) => {
    setDeleteConfirmCategory(category);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmCategory(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmCategory) return;
    handleRemoveCategory(deleteConfirmCategory);
    setDeleteConfirmCategory(null);
  };

  return (
    <FormCard title="Food Categories" customIndex={2}>
      <div>
        {/* <label className="mb-1.5 block text-sm font-semibold text-gray-700">
        Food  Categories
        </label> */}
        <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-orange-200 bg-white p-2 shadow-sm transition-all hover:border-orange-300 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-200">
          <AnimatePresence>
            {categories?.map((category) => (
              <motion.span
                key={category}
                variants={chipVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-800"
              >
                {category}
                <button
                  type="button"
                  onClick={() => handleRequestDelete(category)}
                  className="text-orange-600 transition-colors hover:text-orange-800"
                  aria-label={`Remove ${category}`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          <input
            type="text"
            value={currentCategoryInput}
            onChange={(e) => {
              const nextValue = e.target.value.replace(/-+/g, " ");
              setCurrentCategoryInput(nextValue);
            }}
            onKeyDown={handleCategoryKeyDown}
            list="category-suggestions"
            className="min-w-[160px] flex-1 bg-transparent p-1.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none"
            placeholder="Type category and press Enter"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={!currentCategoryInput.trim()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 shadow-sm transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
            aria-label="Add category"
            title="Add category"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        </div>

        <datalist id="category-suggestions">
          {categorySuggestions.map((cat, idx) => (
            <option key={idx} value={cat} />
          ))}
        </datalist>

        <p className="mt-1.5 text-xs text-gray-500">
          <span className="hidden sm:inline">Press Enter to add category</span>
          <span className="sm:hidden">Tap the check to add category</span>
        </p>
      </div>

      {deleteConfirmCategory &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
            onClick={handleCancelDelete}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-orange-100 bg-white/95 p-6 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-100">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-bold text-gray-900">
                    Delete Category?
                  </h3>
                  <p className="text-gray-600">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-gray-800">
                      "{deleteConfirmCategory}"
                    </span>
                    ? All items under this category will be deleted. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-orange-100 pt-4 sm:flex-row">
                <Button
                  onClick={handleCancelDelete}
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border border-orange-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="h-11 flex-1 rounded-xl border border-red-600 bg-gradient-to-r from-red-500 to-red-500 text-sm font-semibold text-white transition-all duration-200 hover:from-red-600 hover:to-red-600"
                >
                  Yes, Delete Category
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </FormCard>
  );
}
