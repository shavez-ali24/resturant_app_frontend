import React from "react";
import { useSelector } from "react-redux";

const SubmitButton = ({ isAddingItem, onClose, submitText = "Add Product", loadingText }) => {
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const colors = useSelector((state) => state.admin.theme.colors);
  const busyText = loadingText || (submitText === "Save Changes" ? "Saving..." : "Adding...");

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="h-11 w-full rounded-xl border border-[#ede8e3] bg-white px-5 text-sm font-extrabold text-[#57524e] transition-all duration-150 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 sm:w-auto shadow-sm active:scale-[0.98]"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(255,255,255,0.05)" : colors.primaryLight;
          e.currentTarget.style.borderColor = isDarkMode ? "rgb(51, 65, 85)" : `${colors.primary}33`;
          e.currentTarget.style.color = isDarkMode ? "#ffffff" : colors.primaryText;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? "transparent" : "#ffffff";
          e.currentTarget.style.borderColor = isDarkMode ? "rgb(51, 65, 85)" : "#ede8e3";
          e.currentTarget.style.color = isDarkMode ? "rgb(203, 213, 225)" : "#57524e";
        }}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isAddingItem}
        className="h-11 w-full rounded-xl border px-5 text-sm font-black transition-all duration-150 sm:w-auto shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        style={!isAddingItem ? {
          borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
          backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
          color: isDarkMode ? colors.primary : colors.primaryText,
        } : {}}
        onMouseEnter={(e) => {
          if (!isAddingItem) {
            e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}30` : `${colors.primary}22`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isAddingItem) {
            e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}20` : colors.primaryLight;
          }
        }}
      >
        {isAddingItem ? busyText : submitText}
      </button>
    </div>
  );
};

export default SubmitButton;
