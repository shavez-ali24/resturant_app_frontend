// src/components/admin/orderManagement/pendingOrders/LayoutView/LegendBar.jsx
import React from "react";
import { useSelector } from "react-redux";

const LegendBar = React.memo(function LegendBar({ isDarkMode = false }) {
  const colors = useSelector((state) => state.admin.theme.colors);

  const items = [
    { 
      label: "Available", 
      dotBg: isDarkMode ? "#1e293b" : "#f4f4f5",
      border: `1.5px dashed ${isDarkMode ? "#475569" : "#d4d4d8"}`
    },
    { 
      label: "Occupied", 
      dotBg: isDarkMode ? "#ca8a04" : "#fef08a",
      border: `1.5px solid ${isDarkMode ? "#854d0e" : "#eab308"}`
    },
    { 
      label: "Billed", 
      dotBg: isDarkMode ? "#16a34a" : "#bbf7d0",
      border: `1.5px solid ${isDarkMode ? "#14532d" : "#22c55e"}`
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-x-5 sm:gap-y-2 py-1 flex-shrink-0">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium whitespace-nowrap"
          style={{ color: isDarkMode ? "#94a3b8" : "#4b5563" }}
        >
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0"
            style={{ 
              backgroundColor: item.dotBg, 
              border: item.border,
              boxSizing: "border-box"
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
});

export default LegendBar;