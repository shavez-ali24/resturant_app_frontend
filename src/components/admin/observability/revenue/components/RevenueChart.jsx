import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  formatCurrency,
  formatCompactNumber,
  formatChartDate,
  formatTableDate,
} from "../utils/formatters";

export const RevenueChart = ({
  chartData = [],
  timeRange,
  colors,
  isDarkMode,
}) => {
  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors.primary} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#ede8e3"} />
          <XAxis
            dataKey="date"
            tickFormatter={(tick) => formatChartDate(tick, timeRange)}
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDarkMode ? "#94a3b8" : "#78716c", fontSize: 11 }}
            minTickGap={20}
          />
          <YAxis
            tickFormatter={formatCompactNumber}
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDarkMode ? "#94a3b8" : "#78716c", fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className={`p-3 border rounded-xl shadow-lg min-w-[180px] ${
                    isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white"
                  }`}>
                    <p className={`text-sm font-semibold mb-2 border-b pb-2 ${
                      isDarkMode ? "text-slate-100 border-slate-700" : "text-[#1c1917] border-[#ede8e3]"
                    }`}>{formatTableDate(label, timeRange)}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center gap-4">
                        <span className={`text-xs flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: colors.primary }}></span>
                          Revenue
                        </span>
                        <span className="text-sm font-bold" style={{ color: colors.primary }}>{formatCurrency(d.revenue)}</span>
                      </div>
                      {d.orders && (
                        <div className="flex justify-between items-center gap-4">
                          <span className={`text-xs flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                            Orders
                          </span>
                          <span className={`text-sm font-medium ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>
                            {d.orders}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
            cursor={{ stroke: colors.primary, strokeWidth: 1.5 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={colors.primary}
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            dot={{ r: 3, fill: colors.primary, stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: colors.primary, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
