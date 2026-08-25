import React from "react";
import { useSelector } from "react-redux";

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
  const colors = useSelector((state) => state.admin?.theme?.colors) || {
    primary: "#EF9F27",
    primaryText: "#7c2d12",
    primaryLight: "#fff8f5"
  };
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

  // Scroll block function for number inputs
  const handleWheel = (e) => {
    if (type === "number") {
      e.target.blur();
    }
  };

  const hasError = Boolean(error);
  const inputClassName = `h-9 w-full rounded-lg border bg-white px-3 text-sm text-[#1c1917] transition-all outline-none placeholder:text-[#a8a29e] dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 focus:!border-[var(--focus-border)] focus:!ring-2 focus:!ring-[var(--focus-ring)] ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-500/70 dark:focus:border-red-400"
      : "border-[#ede8e3] hover:border-[#d6cfc8] dark:border-slate-600 dark:hover:border-slate-500"
  }`;

  const inputStyle = {
    "--focus-border": colors.primary,
    "--focus-ring": `${colors.primary}20`,
    borderColor: isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3",
  };

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
        style={inputStyle}
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
