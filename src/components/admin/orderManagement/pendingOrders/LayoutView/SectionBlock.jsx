// src/components/admin/orderManagement/pendingOrders/LayoutView/SectionBlock.jsx
import React from "react";
import TableCard from "./TableCard";
import { ADMIN_COLORS } from "@/redux/adminRedux/adminSlice";

/**
 * Renders a section block (Indoor, Outdoor, etc.) with tables in a flex-wrap row.
 */
const SectionBlock = React.memo(function SectionBlock({
  sectionName,
  units,
  onTableClick,
  onPrint,
  onView,
  onEdit,
  onMove,
  onPay,
  onRoomClick,
  roomActionLoadingId,
  isDarkMode = false,
}) {
  const C = isDarkMode ? ADMIN_COLORS.dark : ADMIN_COLORS;
  const tables = React.useMemo(
    () => (units || []).filter((unit) => unit?.unitType !== "ROOM"),
    [units]
  );
  const roomGroups = React.useMemo(() => {
    const groups = new Map();

    (units || [])
      .filter((unit) => unit?.unitType === "ROOM")
      .forEach((unit) => {
        const categoryName = String(unit?.roomCategory?.name || "Uncategorized").trim() || "Uncategorized";
        if (!groups.has(categoryName)) groups.set(categoryName, []);
        groups.get(categoryName).push(unit);
      });

    return Array.from(groups.entries())
      .map(([categoryName, groupUnits]) => ({ categoryName, units: groupUnits }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [units]);

  const rowTitleStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: C.textSecondary,
  };

  if (!units || units.length === 0) return null;

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
          {units.length} {units.length === 1 ? "Unit" : "Units"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: "16px 16px 34px",
        }}
      >
        {tables.length > 0 && (
          <div>
            {roomGroups.length > 0 && (
              <div style={rowTitleStyle}>
                <span>Tables</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.textSecondary,
                    background: isDarkMode ? "#334155" : "#f3efea",
                    padding: "2px 8px",
                    borderRadius: 999,
                    letterSpacing: "normal",
                    textTransform: "none",
                  }}
                >
                  {tables.length}
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 24,
              }}
            >
              {tables.map((table) => (
                <TableCard
                  key={table.unitId || table.tableNumber}
                  table={table}
                  onTableClick={onTableClick}
                  onPrint={onPrint}
                  onView={onView}
                  onEdit={onEdit}
                  onMove={onMove}
                  onPay={onPay}
                  onRoomClick={onRoomClick}
                  isLoading={roomActionLoadingId === table.unitId}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </div>
        )}

        {roomGroups.map((group) => (
          <div key={`${sectionName}-${group.categoryName}`}>
            <div style={rowTitleStyle}>
              <span>{group.categoryName}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.textSecondary,
                  background: isDarkMode ? "#334155" : "#f3efea",
                  padding: "2px 8px",
                  borderRadius: 999,
                  letterSpacing: "normal",
                  textTransform: "none",
                }}
              >
                {group.units.length} {group.units.length === 1 ? "room" : "rooms"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 24,
              }}
            >
              {group.units.map((table) => (
                <TableCard
                  key={table.unitId || table.tableNumber}
                  table={table}
                  onTableClick={onTableClick}
                  onPrint={onPrint}
                  onView={onView}
                  onEdit={onEdit}
                  onMove={onMove}
                  onPay={onPay}
                  onRoomClick={onRoomClick}
                  isLoading={roomActionLoadingId === table.unitId}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default SectionBlock;
