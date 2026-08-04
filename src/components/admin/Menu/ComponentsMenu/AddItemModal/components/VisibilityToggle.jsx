import React from "react";
import { useSelector } from "react-redux";

const VisibilityToggle = ({ visibility, handleChange }) => {
  const isPublic = visibility === "PUBLIC" || !visibility;
  const colors = useSelector((state) => state.admin.theme.colors);
  const isDarkMode = document.documentElement.classList.contains("dark") || document.documentElement.classList.contains("admin-dark");

  const labelText = isPublic ? "On Menu" : "Off Menu";
  const knobTranslate = isPublic ? "translate-x-3" : "translate-x-0";
  const trackBg = isPublic 
    ? (isDarkMode ? "#10b981" : "#16a34a") 
    : (isDarkMode ? "#f43f5e" : "#dc2626");

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          const nextVal = !isPublic ? "PUBLIC" : "ADMIN";
          handleChange({
            target: {
              name: "visibility",
              value: nextVal,
            },
          });
        }}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
          isPublic
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-250"
        }`}
      >
        <span 
          className="relative h-4 w-7 rounded-full transition-colors"
          style={{ backgroundColor: trackBg }}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full shadow transition-transform ${knobTranslate}`}
            style={{ backgroundColor: "#ffffff" }}
          />
        </span>
        <span>{labelText}</span>
      </button>
    </div>
  );
};

export default VisibilityToggle;
