import React, { useState } from "react";
import { useSelector } from "react-redux";
import { AlertCircle } from "lucide-react";

const FormInput = ({
  label, name, value, onChange, error,
  type = "text", placeholder, required = false, icon, ...props
}) => {
  const hasError = !!error;
  const colors = useSelector((state) => state.admin.theme.colors);
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const [focused, setFocused] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={name} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">
          {label} {required && <span style={{ color: colors.primary }}>*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`h-10 w-full rounded-lg border px-3 text-sm outline-none transition-all ${
            icon ? "pl-9" : ""
          } ${
            hasError
              ? "border-red-400 bg-red-50 focus:border-red-400 dark:bg-red-900/20 dark:border-red-500"
              : "bg-white text-[#1c1917] placeholder-[#a8a29e] dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          }`}
          style={!hasError ? {
            borderColor: focused ? colors.primary : isDarkMode ? "rgb(51, 65, 85)" : "#ede8e3",
            boxShadow: focused ? `0 0 0 2px ${colors.primary}20` : "none",
          } : {}}
          placeholder={placeholder}
          {...props}
        />
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e] dark:text-slate-500">
            {icon}
          </div>
        )}
      </div>
      {hasError && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
