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
  const inputClassName = `h-9 w-full rounded-lg border bg-white px-3 text-sm text-[#1c1917] transition-all outline-none placeholder:text-[#a8a29e] dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-500/70 dark:focus:border-red-400"
      : "border-[#ede8e3] hover:border-[#d6cfc8] focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-slate-600 dark:hover:border-slate-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/20"
  }`;

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#78716c] dark:text-slate-400">
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
