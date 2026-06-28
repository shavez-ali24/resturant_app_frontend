// src/components/admin/orderManagement/pendingOrders/LayoutView/TableCard.jsx
import React from "react";
import { IndianRupee, SquarePen, Printer, Move, Bell } from "lucide-react";
import { ADMIN_COLORS } from "@/redux/adminRedux/adminSlice";
import { useNotification } from "@/components/admin/Bell/NotificationContext";

// Prompt-specified colors + existing extended statuses
const getStatusBg = (status, rawStatus, isDark) => {
  // Priority: raw backend status for rooms
  if (rawStatus === "AVAILABLE") {
    return { bg: isDark ? "#1e293b" : "#ffffff", border: `1.5px dashed ${isDark ? "#475569" : "#d6cfc8"}` };
  }
  if (rawStatus === "OCCUPIED") {
    return { bg: isDark ? "#3a3520" : "#fefce8", border: `1.5px solid ${isDark ? "#fde047" : "#fde047"}` };
  }
  if (rawStatus === "BILLED") {
    return { bg: isDark ? "#1a3a2a" : "#dcfce7", border: `1.5px solid ${isDark ? "#22c55e" : "#4ade80"}` };
  }

  // Fallback to derived status for food tables
  const map = {
    blank: { bg: isDark ? "#1e293b" : "#ffffff", border: `1.5px dashed ${isDark ? "#475569" : "#d6cfc8"}` },
    running: { bg: isDark ? "#3a3520" : "#FFFDE7", border: `1.5px solid ${isDark ? "#eab308" : "#FDE047"}` },
    running_kot: { bg: isDark ? "#1e3a5f" : "#EBF5FF", border: `1.5px solid ${isDark ? "#3b82f6" : "#93C5FD"}` },
    printed: { bg: isDark ? "#1e3a5f" : "#EBF5FF", border: `1.5px solid ${isDark ? "#3b82f6" : "#93C5FD"}` },
    paid: { bg: isDark ? "#1a3a2a" : "#EFFFEF", border: `1.5px solid ${isDark ? "#22c55e" : "#86EFAC"}` },
    booked: { bg: isDark ? "#3a3520" : "#fefce8", border: `1.5px solid ${isDark ? "#fde047" : "#fde047"}` },
  };
  return map[status] || map.blank;
};

const getStatusText = (status, rawStatus, isDark) => {
  if (rawStatus === "AVAILABLE") return isDark ? "#64748b" : "#78716c";
  if (rawStatus === "OCCUPIED") return isDark ? "#fde047" : "#854d0e";
  if (rawStatus === "BILLED") return isDark ? "#86efac" : "#166534";

  const map = {
    blank: isDark ? "#64748b" : "#a8a29e",
    running: isDark ? "#fde047" : "#854d0e",
    running_kot: isDark ? "#93c5fd" : "#1e40af",
    printed: isDark ? "#93c5fd" : "#1e40af",
    paid: isDark ? "#86efac" : "#166534",
    booked: isDark ? "#fde047" : "#854d0e",
  };
  return map[status] || map.blank;
};

const ICON_BTN = (isDark) => ({
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${isDark ? "#475569" : "#e5e5e5"}`,
  background: isDark ? "#334155" : "#ffffff",
  cursor: "pointer",
  borderRadius: 8,
  color: isDark ? "#f1f5f9" : "#1c1917",
  padding: 0,
  outline: "none",
});

const TableCard = React.memo(function TableCard({
  table,
  onTableClick,
  onPrint,
  onEdit,
  onMove,
  onPay,
  onRoomClick,
  isLoading = false,
  isDarkMode = false,
  newlyAddedItemsOrderIds,
}) {
  const {
    tableNumber,
    status,
    unitType,
    rawStatus,
    roomCategory,
    occupiedSince,
  } = table;

  const isRoom = unitType === "ROOM";
  const isAvailable = rawStatus === "AVAILABLE" || status === "blank";
  const isOccupied = rawStatus === "OCCUPIED";
  const isBilled = rawStatus === "BILLED";

  const bgInfo = getStatusBg(status, rawStatus, isDarkMode);
  const textColor = getStatusText(status, rawStatus, isDarkMode);

  const { newlyAddedItemsOrderIds: ctxOrderIds, setNewlyAddedItemsOrderIds } = useNotification() || {};

  const handleClick = () => {
    // Clear NEW ORDER badge when card is clicked
    if (orderId && setNewlyAddedItemsOrderIds) {
      setNewlyAddedItemsOrderIds((prev) => {
        const oid = String(orderId);
        if (!prev.has(oid)) return prev;
        const next = new Set(prev);
        next.delete(oid);
        return next;
      });
    }
    if (isRoom) {
      onRoomClick?.(table);
      return;
    }
    if (isBilled) {
      onPay?.(table);
      return;
    }
    onTableClick?.(table);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (isBilled) {
      onPay?.(table);
      return;
    }
    onEdit?.(table);
  };
  const handlePrint = (e) => { e.stopPropagation(); onPrint?.(table); };
  const handleMove = (e) => { e.stopPropagation(); onMove?.(table); };

  // Calculate elapsed time from occupiedSince (prompt priority)
  const elapsed = occupiedSince
    ? Math.floor((Date.now() - new Date(occupiedSince).getTime()) / 60000)
    : null;

  const formatAmount = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? `₹${n.toFixed(2)}` : "";
  };

  // 🔧 FIX: Show bottom icons (Edit/Print/Move) for both rooms AND tables
  const showBottomIcons = (isOccupied || isBilled) && (table.currentOrderId || table.orderId);

  const orderId = table.currentOrderId || table.orderId;
  // Use context directly so it works even if prop chain is broken (LayoutView doesn't forward the prop)
  const effectiveIds = ctxOrderIds || newlyAddedItemsOrderIds;
  const hasNewClientItems = orderId && effectiveIds?.has(String(orderId));

  return (
    <div
      onClick={handleClick}
      style={{
        width: 120,
        height: 130,
        borderRadius: 8,
        cursor: isLoading ? "wait" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: bgInfo.bg,
        border: bgInfo.border,
        boxSizing: "border-box",
        opacity: isLoading ? 0.55 : 1,
      }}
    >
      {hasNewClientItems && (
        <div
          className="animate-pulse"
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            right: 2,
            background: "#ef4444",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            fontSize: "8px",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.2px",
            padding: "3px 0",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: 10,
            whiteSpace: "nowrap"
          }}
        >
          <Bell size={9} className="animate-bounce" />
        </div>
      )}
      {isLoading && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>...</div>}

      {/* Top status / time */}
      {!hasNewClientItems && (
        <div style={{ position: "absolute", top: 8, fontSize: 11, fontWeight: 800, color: textColor, textTransform: "uppercase", letterSpacing: "0.8px" }}>
          {isAvailable ? "AVAILABLE" : isBilled ? "BILLED" : elapsed != null ? `${elapsed} MINS` : ""}
        </div>
      )}

      {/* Main number - styled duller and slightly larger */}
      <div style={{ fontSize: 19, fontWeight: 700, color: isDarkMode ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.3)", marginTop: 12 }}>
        {tableNumber}
      </div>

      {/* Room category + price or table amount */}
      {!isAvailable && (
        <div style={{ fontSize: 15, color: textColor, marginTop: 4, fontWeight: 800, textAlign: 'center' }}>
          {table.currentAmount != null ? (
            formatAmount(table.currentAmount)
          ) : isRoom && roomCategory ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: 10 }}>
              <span style={{ opacity: 0.8, fontWeight: 500 }}>{roomCategory.name}</span>
              {roomCategory.pricePerNight ? <span style={{ fontSize: 14, fontWeight: 800 }}>{formatAmount(roomCategory.pricePerNight)}</span> : ''}
            </div>
          ) : ''}
        </div>
      )}

      {/* Bottom icons - only for occupied TABLES */}
      {showBottomIcons && (
        <div style={{ position: "absolute", bottom: -18, display: "flex", gap: 10 }}>
          <button
            onClick={isBilled ? (e) => { e.stopPropagation(); onPay?.(table); } : handleEdit}
            style={ICON_BTN(isDarkMode)}
            title={isBilled ? "Pay Order" : "Edit Order"}
          >
            {isBilled ? <IndianRupee size={22} /> : <SquarePen size={22} />}
          </button>
          <button
            onClick={handlePrint}
            style={ICON_BTN(isDarkMode)}
            title="Print"
          >
            <Printer size={22} />
          </button>
          {!isBilled && (
            <button
              onClick={handleMove}
              style={ICON_BTN(isDarkMode)}
              title="Move Table/Room"
            >
              <Move size={22} />
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default TableCard;
