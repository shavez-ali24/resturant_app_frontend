import React from "react";

export const CategoryChips = ({ categories }) => (
  <div className="scrollbar-thin max-h-48 overflow-y-auto pb-2">
    {categories?.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <span
            key={category}
            className="inline-flex items-center rounded-full border border-orange-200 bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-800"
          >
            {category}
          </span>
        ))}
      </div>
    ) : (
      <p className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 text-sm text-gray-500">
        No categories listed
      </p>
    )}
  </div>
);
