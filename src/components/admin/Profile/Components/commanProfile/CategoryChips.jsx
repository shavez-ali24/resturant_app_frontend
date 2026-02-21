import React from "react";

export const CategoryChips = ({ categories }) => (
    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pb-2 scrollbar-thin">
        {categories?.length > 0 ? (
            categories.map((category) => (
                <span key={category} className="bg-orange-200 text-orange-800 text-sm font-medium px-3 py-1.5 rounded-full border border-orange-300">
                    {category}
                </span>
            ))
        ) : (
            <p className="text-gray-400 text-sm">No categories listed</p>
        )}
    </div>
);
