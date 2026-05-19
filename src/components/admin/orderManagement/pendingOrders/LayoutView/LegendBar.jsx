// src/components/admin/orderManagement/pendingOrders/LayoutView/LegendBar.jsx
import React from "react";

const LEGEND_ITEMS = [
  { label: "Available", swatchBg: "#ffffff", swatchBorder: "1.5px dashed #d6cfc8" },
  { label: "Running", swatchBg: "#FFFDE7", swatchBorder: "1.5px solid #FDE047" },
  { label: "Printed", swatchBg: "#EBF5FF", swatchBorder: "1.5px solid #93C5FD" },
  { label: "Paid", swatchBg: "#EFFFEF", swatchBorder: "1.5px solid #86EFAC" },
  { label: "Running KOT", swatchBg: "#f97316", swatchBorder: "1.5px solid #ea580c" },
];

const DARK_LEGEND_ITEMS = [
  { label: "Available", swatchBg: "#334155", swatchBorder: "1.5px dashed #475569" },
  { label: "Running", swatchBg: "#422006", swatchBorder: "1.5px solid #eab308" },
  { label: "Printed", swatchBg: "#1e3a5f", swatchBorder: "1.5px solid #3b82f6" },
  { label: "Paid",  swatchBg: "#14532d", swatchBorder: "1.5px solid #22c55e" },
  { label: "Running KOT", swatchBg: "#ea580c", swatchBorder: "1.5px solid #c2410c" },
];

const LegendBar = React.memo(function LegendBar({ isDarkMode = false }) {
  const items = isDarkMode ? DARK_LEGEND_ITEMS : LEGEND_ITEMS;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px 20px",
        padding: "10px 16px",
        borderRadius: 10,
        border: "1px solid",
        borderColor: isDarkMode ? "#334155" : "#ede8e3",
        background: isDarkMode ? "#1e293b" : "#ffffff",
        flexShrink: 0,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: "nowrap",
            color: isDarkMode ? "#94a3b8" : "#78716c",
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              flexShrink: 0,
              background: item.swatchBg,
              border: item.swatchBorder,
            }}
          />
          {item.label}
        </div>
      ))}
    </div>
  );
});

export default LegendBar;