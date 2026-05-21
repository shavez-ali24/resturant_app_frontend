// src/components/admin/orderManagement/pendingOrders/LayoutView/SectionBlock.jsx
import React from "react";
import TableCard from "./TableCard";
import { ADMIN_COLORS } from "@/redux/adminRedux/adminSlice";

/**
 * Renders a section block (Indoor, Outdoor, etc.) with tables in a flex-wrap row.
 */
const SectionBlock = React.memo(function SectionBlock({
  sectionName,
  tables,
  onTableClick,
  onPrint,
  onView,
  onEdit,
  onRoomClick,
  roomActionLoadingId,
  isDarkMode = false,
}) {
  if (!tables || tables.length === 0) return null;

  const C = isDarkMode ? ADMIN_COLORS.dark : ADMIN_COLORS;

  return (
    <div
      style={{
        borderRadius: 10,
        background: isDarkMode ? "#1e293b" : "#ffffff",
        border: `1px solid ${C.border}`,
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          borderBottom: `1px solid ${C.border}`,
          background: isDarkMode ? "#0f172a" : "#faf9f7",
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "'Outfit', sans-serif",
            color: C.textPrimary,
            margin: 0,
          }}
        >
          {sectionName}
        </h3>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: C.textSecondary,
            background: C.border,
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          {tables.length} {tables.length === 1 ? "Table" : "Tables"}
        </span>
      </div>

      {/* Tables — flex-wrap row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          padding: "16px 16px 34px",
        }}
      >
        {tables.map((table) => (
          <TableCard
            key={table.tableId || table.tableNumber}
            table={table}
            onTableClick={onTableClick}
            onPrint={onPrint}
            onView={onView}
            onEdit={onEdit}
            onRoomClick={onRoomClick}
            isLoading={roomActionLoadingId === table.unitId}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </div>
  );
});

export default SectionBlock;