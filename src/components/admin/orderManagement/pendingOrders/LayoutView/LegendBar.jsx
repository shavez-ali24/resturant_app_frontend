// src/components/admin/orderManagement/pendingOrders/LayoutView/LegendBar.jsx
import React from "react";
import { useSelector } from "react-redux";

const LegendBar = React.memo(function LegendBar({ isDarkMode = false }) {
  const colors = useSelector((state) => state.admin.theme.colors);

  const items = [
    { label: "Available", dotBg: isDarkMode ? "#475569" : "#e4e4e7" },
    { label: "Occupied", dotBg: colors.primary },
    { label: "Billed", dotBg: "#22c55e" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-1 flex-shrink-0">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          style={{ color: isDarkMode ? "#94a3b8" : "#78716c" }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.dotBg }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
});

export default LegendBar;