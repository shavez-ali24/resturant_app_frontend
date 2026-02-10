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
      e.target.blur(); // ya e.preventDefault() bhi use kar sakte ho
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
       value={value === 0 ? "" : value ?? ""}
        onChange={onChange}
        min={min}
        placeholder={placeholder}
        onWheel={handleWheel} // scroll block
        className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all cursor-pointer"
      />
    </div>
  );
};
