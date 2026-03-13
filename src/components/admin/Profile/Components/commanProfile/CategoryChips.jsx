import React from "react";

const getCategoryLabel = (category) => {
  if (typeof category === "string") return category;
  if (typeof category === "number") return String(category);
  if (!category || typeof category !== "object") return "";

  if (typeof category.name === "string") return category.name;
  if (typeof category.title === "string") return category.title;
  if (typeof category.label === "string") return category.label;
  if (typeof category.category === "string") return category.category;
  if (typeof category.value === "string") return category.value;
  if (typeof category.displayName === "string") return category.displayName;

  const numericKeys = Object.keys(category).filter((key) => /^\d+$/.test(key));
  if (numericKeys.length) {
    numericKeys.sort((a, b) => Number(a) - Number(b));
    const text = numericKeys.map((key) => category[key]).join("").trim();
    if (text) return text;
  }

  if (typeof category.toString === "function") {
    const text = String(category);
    if (text && text !== "[object Object]") return text;
  }

  return "";
};

export const CategoryChips = ({ categories }) => {
  const list = Array.isArray(categories) ? categories : [];
  const chips = list
    .map((category, index) => {
      const label = getCategoryLabel(category).trim();
      if (!label) return null;
      const key =
        category && typeof category === "object" && category._id
          ? String(category._id)
          : `${label}-${index}`;
      return { key, label };
    })
    .filter(Boolean);

  return (
    <div className="scrollbar-thin max-h-48 overflow-y-auto pb-2">
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center rounded-full border border-orange-200 bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-800 dark:border-slate-700 dark:bg-slate-800 dark:text-orange-200"
            >
              {chip.label}
            </span>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No categories listed
        </p>
      )}
    </div>
  );
};
