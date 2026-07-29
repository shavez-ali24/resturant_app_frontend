import React from "react";
import { useSelector } from "react-redux";

export const OrderModeStatus = React.memo(({ label, isEnabled }) => {
  const colors = useSelector((state) => state.admin.theme.colors);
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

  return (
    <div className="flex items-center justify-between py-2 px-1 border-b border-[#ede8e3]/50 last:border-b-0 dark:border-slate-700/50">
      <span className={`text-sm font-extrabold ${
        isEnabled ? "text-[#1c1917] dark:text-slate-100" : "text-gray-400 dark:text-slate-500"
      }`}>
        {label}
      </span>
      {isEnabled ? (
        <span
          className="rounded-lg px-2.5 py-0.5 text-xs font-bold transition-all shadow-sm border"
          style={{
            borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
            backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
            color: isDarkMode ? colors.primary : colors.primaryText,
          }}
        >
          Active
        </span>
      ) : (
        <span className="rounded-lg px-2.5 py-0.5 text-xs font-bold transition-all border border-gray-200 bg-gray-100 text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
          Inactive
        </span>
      )}
    </div>
  );
});
