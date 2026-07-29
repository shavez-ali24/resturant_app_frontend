import React, { useState } from "react";
import { useSelector } from "react-redux";

const DescriptionField = ({ value, onChange, error }) => {
  const hasError = !!error;
  const colors = useSelector((state) => state.admin.theme.colors);
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#a8a29e] dark:text-slate-500">
        Description
      </label>
      <textarea
        name="description"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={3}
        className={`w-full rounded-lg border p-3 text-sm outline-none transition-all resize-none ${
          hasError
            ? "border-red-400 bg-red-50 focus:border-red-400 dark:bg-red-900/20 dark:border-red-500"
            : "bg-white text-[#1c1917] placeholder-[#a8a29e] dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        }`}
        style={!hasError ? {
          borderColor: focused ? colors.primary : isDarkMode ? "rgb(51, 65, 85)" : "#ede8e3",
          boxShadow: focused ? `0 0 0 2px ${colors.primary}20` : "none",
        } : {}}
        placeholder="Write product description..."
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default DescriptionField;
