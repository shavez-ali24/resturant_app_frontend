import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const CategoryChips = ({ categories }) => (
    <div className="flex flex-wrap gap-2">
        {categories.length > 0 ? (
            categories.map((category) => (
                <span
                    key={category}
                    className="bg-orange-100 text-orange-800 border-2 border-blue-500 text-sm font-medium px-3 py-1.5 rounded-full"
                >
                    {category}
                </span>
            ))
        ) : (
            <p className="text-gray-500">No categories listed.</p>
        )}
    </div>
);