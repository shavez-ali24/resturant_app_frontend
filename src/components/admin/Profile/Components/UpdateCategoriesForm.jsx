/* eslint-disable no-unused-vars */
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function UpdateCategoriesForm({ categories, chipVariant, currentCategoryInput, setCurrentCategoryInput, handleCategoryKeyDown, handleRemoveCategory, categorySuggestions }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Categories
            </label>
            <div className="flex flex-wrap items-center gap-2 w-full border border-gray-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all">
                {" "}
                <AnimatePresence>
                    {categories.map((category) => (
                        <motion.span
                            key={category}
                            {...chipVariant}
                            className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1.5 rounded-full"
                        >
                            {category}
                            <button
                                type="button"
                                onClick={() => handleRemoveCategory(category)}
                                className="text-orange-600 hover:text-orange-800"
                                aria-label={`Remove ${category}`}
                            >
                                <svg
                                    className="w-4 h-4"
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
                        // This line now replaces spaces with hyphens as you type
                        setCurrentCategoryInput(e.target.value.replace(/ /g, "-"));
                    }}
                    onKeyDown={handleCategoryKeyDown}
                    list="category-suggestions"
                    className="flex-1 min-w-[150px] border-none outline-none ring-0 focus:ring-0 p-1.5 bg-transparent"
                    placeholder="Type a category and press Enter..."
                />
            </div>
            <datalist id="category-suggestions">
                {categorySuggestions.map((cat, idx) => (
                    <option key={idx} value={cat} />
                ))}
            </datalist>
            <p className="text-xs text-gray-500 mt-1.5">
                Spaces will be converted to hyphens. Press Enter to add.
            </p>
        </div>
    )
}
