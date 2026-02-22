/* eslint-disable no-unused-vars */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormCard } from "./commanProfile/FormCard";

export default function UpdateCategoriesForm({
  categories,
  chipVariant,
  currentCategoryInput,
  setCurrentCategoryInput,
  handleCategoryKeyDown,
  handleRemoveCategory,
  categorySuggestions,
}) {
  return (
    <FormCard title="Categories" customIndex={2}>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Categories
        </label>
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
                  onClick={() => handleRemoveCategory(category)}
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
              setCurrentCategoryInput(e.target.value.replace(/ /g, "-"));
            }}
            onKeyDown={handleCategoryKeyDown}
            list="category-suggestions"
            className="min-w-[160px] flex-1 bg-transparent p-1.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none"
            placeholder="Type category and press Enter"
          />
        </div>

        <datalist id="category-suggestions">
          {categorySuggestions.map((cat, idx) => (
            <option key={idx} value={cat} />
          ))}
        </datalist>

        <p className="mt-1.5 text-xs text-gray-500">
          Spaces are auto-converted to hyphens.
        </p>
      </div>
    </FormCard>
  );
}
