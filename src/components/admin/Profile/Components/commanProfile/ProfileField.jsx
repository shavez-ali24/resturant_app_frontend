import React from "react";

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";

  const type = typeof value;
  if (type === "string" || type === "number") return value;
  if (type === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (item === null || item === undefined) return "";
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (typeof item === "object") {
          return (
            item.name ||
            item.title ||
            item.label ||
            item.value ||
            item.displayName ||
            item._id ||
            ""
          );
        }
        return String(item);
      })
      .filter(Boolean);
    return parts.length ? parts.join(", ") : "N/A";
  }

  if (type === "object") {
    const numericKeys = Object.keys(value).filter((key) => /^\d+$/.test(key));
    if (numericKeys.length) {
      numericKeys.sort((a, b) => Number(a) - Number(b));
      const text = numericKeys.map((key) => value[key]).join("").trim();
      if (text) return text;
    }

    return (
      value.name ||
      value.title ||
      value.label ||
      value.value ||
      value.displayName ||
      value._id ||
      "N/A"
    );
  }

  return String(value);
};

import { useSelector } from "react-redux";

export const ProfileField = React.memo(({ label, value, icon }) => {
  const colors = useSelector((state) => state.admin.theme.colors);
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const primaryColor = isDarkMode ? colors.primary : colors.primaryText;

  return (
    <div className="flex flex-col min-w-0 transition-colors py-1">
      <div className="mb-1 flex items-center gap-1.5">
        {icon && <span className="opacity-80 shrink-0" style={{ color: primaryColor }}>{icon}</span>}
        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>{label}</label>
      </div>
      <p className="text-sm font-extrabold text-[#1c1917] dark:text-slate-100 truncate">{formatValue(value)}</p>
    </div>
  );
});
