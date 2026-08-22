import React from "react";

export const AnalyticsTable = ({
  title,
  subtitle,
  nameHeader,
  data = [],
  colors,
  isDarkMode,
}) => {
  const textPrimary = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-[#78716c]";
  const divider = isDarkMode ? "border-slate-700" : "border-[#ede8e3]";
  const tableHeaderBg = isDarkMode ? "bg-slate-800" : "bg-[#f7f3ef]";
  const tableRowHover = isDarkMode ? "hover:bg-slate-800/60" : "hover:bg-[#faf7f4]";

  return (
    <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "border-slate-700" : "border-[#ede8e3]"}`}>
      <div className={`px-4 py-3 border-b ${divider}`}>
        <h4 className={`text-sm font-semibold ${textPrimary}`}>{title}</h4>
        <p className={`text-xs mt-0.5 ${textSecondary}`}>{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={tableHeaderBg}>
            <tr>
              {["Rank", "Date", nameHeader, "Quantity Sold"].map((h) => (
                <th key={h} className={`py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? "divide-slate-700" : "divide-[#f0ebe5]"}`}>
            {data.map((item, i) => (
              <tr key={`${item.fullDate}-${item.name}`} className={`transition-colors ${tableRowHover}`}>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border"
                        style={
                          i === 0 ? { backgroundColor: "#fef9c3", color: "#854d0e", borderColor: "#fde047" } :
                          i === 1 ? { backgroundColor: "#f1f5f9", color: "#334155", borderColor: "#cbd5e1" } :
                          i === 2 ? {
                            backgroundColor: isDarkMode ? `${colors.primary}25` : colors.primaryLight,
                            color: isDarkMode ? colors.primary : colors.primaryText,
                            borderColor: isDarkMode ? `${colors.primary}60` : `${colors.primary}33`,
                          } : {
                            backgroundColor: isDarkMode ? "rgb(30, 41, 59)" : "rgb(250, 247, 244)",
                            color: isDarkMode ? "rgb(148, 163, 184)" : "rgb(120, 113, 108)",
                            borderColor: isDarkMode ? "rgb(51, 65, 85)" : "rgb(237, 232, 227)"
                          }
                        }
                  >#{i + 1}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors.primary }}></div>
                    <span className={`font-medium ${textPrimary}`}>{item.date}</span>
                  </div>
                </td>
                <td className={`py-3 px-4 font-medium ${textPrimary}`}>{item.name}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                        style={{
                          backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                          borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                          color: isDarkMode ? colors.primary : colors.primaryText,
                        }}
                  >
                    {item.quantity.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
