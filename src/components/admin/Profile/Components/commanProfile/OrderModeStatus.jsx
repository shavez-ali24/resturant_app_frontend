import React from "react";

export const OrderModeStatus = React.memo(({ label, isEnabled }) => (
  <div className="flex items-center justify-between py-2 px-1 border-b border-[#ede8e3]/50 last:border-b-0 dark:border-slate-700/50">
    <span className={`text-sm font-extrabold ${
      isEnabled ? "text-[#1c1917] dark:text-slate-100" : "text-gray-400 dark:text-slate-500"
    }`}>
      {label}
    </span>
    <span
      className={`rounded-lg px-2.5 py-0.5 text-xs font-bold transition-all ${
        isEnabled
          ? "border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-950/40 dark:text-orange-350 shadow-sm"
          : "border border-gray-200 bg-gray-100 text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
      }`}
    >
      {isEnabled ? "Active" : "Inactive"}
    </span>
  </div>
));
