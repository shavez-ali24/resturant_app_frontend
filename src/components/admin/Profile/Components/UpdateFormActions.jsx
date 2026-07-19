import React from "react";
import { useSelector } from "react-redux";

export default function UpdateFormActions({ onClose, isSubmitting, fileError }) {
  const colors = useSelector((state) => state.admin.theme.colors);
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

  const btnStyle = {
      borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
      backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
      color: isDarkMode ? colors.primary : colors.primaryText,
  };
  const handleMouseEnter = (e) => {
      e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}35` : `${colors.primary}22`;
  };
  const handleMouseLeave = (e) => {
      e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}20` : colors.primaryLight;
  };

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="h-11 w-full rounded-xl border border-[#ede8e3] bg-white px-5 text-sm font-extrabold text-[#57524e] transition-all duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 sm:w-auto shadow-sm"
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = isDarkMode ? `${colors.primary}50` : `${colors.primary}33`;
            e.currentTarget.style.color = isDarkMode ? colors.primary : colors.primaryText;
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isDarkMode ? "rgb(51, 65, 85)" : "#ede8e3";
            e.currentTarget.style.color = isDarkMode ? "rgb(203, 213, 225)" : "#57524e";
        }}
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={isSubmitting || !!fileError}
        className="h-11 w-full rounded-xl border px-5 text-sm font-black transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto shadow-sm active:scale-[0.98]"
        style={btnStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isSubmitting ? "Updating..." : "Update Profile"}
      </button>
    </div>
  );
}
