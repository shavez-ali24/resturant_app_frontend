import React from "react";
import { useSelector } from "react-redux";

export default function UpdateFormActions({ onClose, isSubmitting, fileError, isDarkMode: propIsDarkMode }) {
  const colors = useSelector((state) => state.admin?.theme?.colors) || {
    primary: "#EF9F27",
    primaryText: "#7c2d12",
    primaryLight: "#fff8f5"
  };
  const isDarkMode =
    propIsDarkMode !== undefined
      ? propIsDarkMode
      : typeof document !== "undefined" &&
        (document.documentElement.classList.contains("admin-dark") ||
          document.documentElement.classList.contains("dark"));

  const btnStyle = {
    borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
    backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
    color: isDarkMode ? colors.primary : colors.primaryText,
    "--hover-bg": isDarkMode ? `${colors.primary}35` : `${colors.primary}22`,
  };

  const cancelBtnStyle = {
    "--hover-border": isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
    "--hover-color": isDarkMode ? colors.primary : colors.primaryText,
  };

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        style={cancelBtnStyle}
        className="h-11 w-full rounded-xl border border-[#ede8e3] bg-white px-5 text-sm font-extrabold text-[#57524e] transition-all duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 sm:w-auto shadow-sm hover:border-[var(--hover-border)] hover:text-[var(--hover-color)]"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={isSubmitting || !!fileError}
        className="h-11 w-full rounded-xl border px-5 text-sm font-black transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto shadow-sm active:scale-[0.98] hover:bg-[var(--hover-bg)]"
        style={btnStyle}
      >
        {isSubmitting ? "Updating..." : "Update Profile"}
      </button>
    </div>
  );
}
