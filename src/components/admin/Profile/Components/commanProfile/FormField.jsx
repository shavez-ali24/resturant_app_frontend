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
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value === 0 ? "" : value ?? ""}
        onChange={onChange}
        min={min}
        placeholder={placeholder}
        onWheel={handleWheel}
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50"
      />
    </div>
  );
};
