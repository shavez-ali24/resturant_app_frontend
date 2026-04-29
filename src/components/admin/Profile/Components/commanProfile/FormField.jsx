import React from "react";

export const FormField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  required = false,
  error = "",
}) => {
  // Scroll block function for number inputs
  const handleWheel = (e) => {
    if (type === "number") {
      e.target.blur();
    }
  };

  const hasError = Boolean(error);
  const inputClassName = `h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-800 shadow-sm transition-all outline-none placeholder:text-gray-400 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200 dark:border-red-500/70 dark:focus:border-red-400"
      : "border-orange-200 hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:hover:border-orange-400"
  }`;

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
        required={required}
        placeholder={placeholder || label}
        onWheel={handleWheel}
        className={inputClassName}
        aria-invalid={hasError}
      />
      {hasError && (
        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};
