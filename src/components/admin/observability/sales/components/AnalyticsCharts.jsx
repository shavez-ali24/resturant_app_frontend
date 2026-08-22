import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/formatters";

const renderDistributionLabel = (
  { cx, cy, midAngle, outerRadius, percent, name },
  minPercent = 0.05,
  labelColor = "#fb923c"
) => {
  if (percent < minPercent) return null;

  const radian = Math.PI / 180;
  const radius = outerRadius + 12;
  const x = cx + radius * Math.cos(-midAngle * radian);
  const y = cy + radius * Math.sin(-midAngle * radian);
  const textAnchor = x > cx ? "start" : "end";
  const labelText = `${name}: ${Math.round(percent * 100)}%`;

  return (
    <text
      x={x}
      y={y}
      fill={labelColor}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {labelText}
    </text>
  );
};

export const AnalyticsCharts = ({
  chartData = [],
  aggregatedData = [],
  type,
  colors,
  themeColorsList = [],
  isDarkMode,
}) => {
  const isProducts = type === "products";
  
  const card = isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white shadow-sm";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const chartGrid = isDarkMode ? "#334155" : "#ede8e3";
  const chartTick = isDarkMode ? "#94a3b8" : "#78716c";
  
  const tooltipStyle = {
    backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
    border: `1px solid ${isDarkMode ? "#334155" : "#ede8e3"}`,
    borderRadius: "12px",
    color: isDarkMode ? "#f1f5f9" : "#1c1917",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
  };
  const tooltipItemStyle = {
    color: isDarkMode ? "#f1f5f9" : "#1c1917",
  };
  const tooltipLabelStyle = {
    color: isDarkMode ? "#f1f5f9" : "#1c1917",
    fontWeight: 600,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div className={`rounded-xl border p-4 ${card}`}>
        <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${textPrimary}`}>
          <BarChart3 className="w-4 h-4" style={{ color: colors.primary }} />
          {isProducts ? "Daily Top Product Sales" : "Daily Top Category Performance"}
        </h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData.slice(0, 20)}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: chartData.length > 5 ? 50 : 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} strokeOpacity={0.6} vertical={false} />
              <XAxis
                dataKey="date"
                angle={chartData.length > 5 ? -45 : 0}
                textAnchor={chartData.length > 5 ? "end" : "middle"}
                height={chartData.length > 5 ? 60 : 35}
                fontSize={11}
                tick={{ fill: chartTick }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={isProducts ? (v) => v.toLocaleString() : formatNumber}
                fontSize={11}
                tick={{ fill: chartTick }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                formatter={isProducts ? (value) => [value.toLocaleString(), "Qty"] : (v) => [formatNumber(v), "Qty"]}
                labelFormatter={(label, payload) =>
                  payload?.[0]
                    ? `${isProducts ? "Product" : "Category"}: ${payload[0].payload.name}`
                    : label
                }
              />
              <Bar dataKey="quantity" fill={colors.primary} radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className={`rounded-xl border p-4 ${card}`}>
        <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${textPrimary}`}>
          <PieChartIcon className="w-4 h-4" style={{ color: colors.primary }} />
          {isProducts ? "Top Products Distribution" : "Top Categories Distribution"}
        </h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 18, right: 40, left: 40, bottom: 18 }}>
              <Pie
                data={aggregatedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) =>
                  renderDistributionLabel(
                    props,
                    isProducts ? 0.06 : 0.05,
                    isDarkMode ? "#fbbf24" : colors.primaryText
                  )
                }
                outerRadius={isProducts ? 72 : 80}
                dataKey="revenue"
              >
                {aggregatedData.map((_, i) => (
                  <Cell key={i} fill={themeColorsList[i % themeColorsList.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(v) => [formatCurrency(v), "Revenue"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
