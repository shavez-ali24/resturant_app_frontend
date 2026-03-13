import React from "react";

export const FormField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
}) => {
  // Scroll block function for number inputs
  const handleWheel = (e) => {
    if (type === "number") {
      e.target.blur();
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-200">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value === 0 ? "" : value ?? ""}
        onChange={onChange}
        min={min}
        placeholder={placeholder || label}
        onWheel={handleWheel}
        className="h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm text-gray-800 shadow-sm transition-all outline-none hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 placeholder:text-gray-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:hover:border-orange-400"
      />
    </div>
  );
};
