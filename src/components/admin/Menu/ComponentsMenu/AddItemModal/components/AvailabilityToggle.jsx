import React from "react";
import { useSelector } from "react-redux";

const AvailabilityToggle = ({ available, handleChange }) => {
  const colors = useSelector((state) => state.admin.theme.colors);

  const labelText = available ? "Available" : "Unavailable";
  const trackClass = available ? "bg-green-600 dark:bg-emerald-500" : "bg-red-600 dark:bg-rose-500";
  const knobTranslate = available ? "translate-x-3" : "translate-x-0";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          handleChange({
            target: {
              name: "available",
              value: !available,
              type: "checkbox",
              checked: !available,
            },
          });
        }}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
          available
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-250"
        }`}
      >
        <span className={`relative h-4 w-7 rounded-full transition-colors ${trackClass}`}>
          <span
            className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${knobTranslate}`}
          />
        </span>
        <span>{labelText}</span>
      </button>
    </div>
  );
};

export default AvailabilityToggle;
