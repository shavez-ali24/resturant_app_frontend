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
  newlyAddedItemsOrderIds = [],
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

  const isRoomSection = String(sectionName || "").trim().toLowerCase() === "room";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Section Header (Only for non-room sections) */}
      {!isRoomSection && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "2px 4px",
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              color: C.textPrimary,
              margin: 0,
              textTransform: "capitalize",
            }}
          >
            {sectionName}
          </h3>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "4px 4px 12px",
        }}
      >
        {tables.length > 0 && (
          <div>
            {roomGroups.length > 0 && (
              <div style={rowTitleStyle}>
                <span>Tables</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "28px 14px",
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
                  newlyAddedItemsOrderIds={newlyAddedItemsOrderIds}
                />
              ))}
            </div>
          </div>
        )}

        {roomGroups.map((group, index) => (
          <div
            key={`${sectionName}-${group.categoryName}`}
            style={(index > 0 || tables.length > 0) ? { marginTop: 32 } : {}}
          >
            {isRoomSection ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "2px 4px",
                  marginBottom: 10,
                }}
              >
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: "'Outfit', sans-serif",
                    color: C.textPrimary,
                    margin: 0,
                    textTransform: "capitalize",
                  }}
                >
                  {group.categoryName}
                </h3>
              </div>
            ) : (
              <div style={rowTitleStyle}>
                <span>{group.categoryName}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "28px 14px",
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
                  newlyAddedItemsOrderIds={newlyAddedItemsOrderIds}
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
