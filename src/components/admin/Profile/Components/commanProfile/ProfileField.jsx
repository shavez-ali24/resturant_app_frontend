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
  <div className="rounded-xl border border-[#ede8e3] bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
    <div className="mb-1 flex items-center gap-2">
      {icon && <span className="text-orange-500">{icon}</span>}
      <label className="text-xs font-semibold uppercase tracking-wide text-orange-500">{label}</label>
    </div>
    <p className="text-sm font-semibold text-[#1c1917] dark:text-slate-100">{formatValue(value)}</p>
  </div>
);
