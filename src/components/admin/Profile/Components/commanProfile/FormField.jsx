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
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
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
        className="h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm shadow-sm transition-all outline-none hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
      />
    </div>
  );
};
