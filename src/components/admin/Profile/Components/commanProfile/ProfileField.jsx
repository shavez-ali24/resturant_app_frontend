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

export const ProfileField = ({ label, value, icon }) => (
  <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50/80 to-white p-3 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
    <div className="mb-1 flex items-center gap-2">
      {icon && <span className="text-orange-600 dark:text-orange-300">{icon}</span>}
      <label className="text-xs font-medium uppercase tracking-wide text-orange-600 dark:text-orange-300">{label}</label>
    </div>
    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formatValue(value)}</p>
  </div>
);
