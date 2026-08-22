import React from "react";
import { RefreshCw } from "lucide-react";

export const EmptyAnalyticsState = ({
  title,
  icon: Icon,
  colors,
  isDarkMode,
  isRefreshing,
  onRefresh,
}) => {
  const textPrimary = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-[#78716c]";
  
  const secondaryButtonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[var(--hover-bg)]";

  const secondaryBtnStyle = {
    "--hover-bg": isDarkMode ? `${colors.primary}30` : `${colors.primary}22`,
    borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
    backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
    color: isDarkMode ? colors.primary : colors.primaryText,
  };

  return (
    <div className={`h-64 flex flex-col items-center justify-center rounded-xl border p-6 ${
      isDarkMode ? "border-slate-700 bg-slate-800/40" : "border-[#ede8e3] bg-[#f7f3ef]"
    }`}>
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
        }}
      >
        <Icon className="h-6 w-6" style={{ color: colors.primary }} />
      </div>
      <p className={`font-bold text-lg mb-2 ${textPrimary}`}>{title}</p>
      <p className={`text-center mb-4 text-sm ${textSecondary}`}>
        No completed orders found for the selected time period.
      </p>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={secondaryButtonClass}
        style={secondaryBtnStyle}
      >
        <RefreshCw className={`w-4 h-4 shrink-0 text-current ${isRefreshing ? "animate-spin" : ""}`} />
        <span>{isRefreshing ? "Refreshing..." : "Refresh Data"}</span>
      </button>
    </div>
  );
};
