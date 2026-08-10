// src/components/admin/orderManagement/pendingOrders/LayoutView/TableCard.jsx
import React from "react";
import { useSelector } from "react-redux";
import { IndianRupee, SquarePen, Printer, Move, Bell } from "lucide-react";
import { ADMIN_COLORS } from "@/redux/adminRedux/adminSlice";
import { useNotification } from "@/components/admin/Bell/NotificationContext";

const formatElapsed = (minutes) => {
  if (minutes == null) return "";
  if (minutes < 60) return ` • ${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return ` • ${h}h${m > 0 ? ` ${m}m` : ""}`;
};

const getElapsedString = (minutes) => {
  if (minutes == null) return "";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ""}`;
};

const getCardStyle = (rawStatus, status, isDark, themeColors) => {
  // AVAILABLE / Blank status
  if (rawStatus === "AVAILABLE" || status === "blank") {
    return {
      bg: isDark ? "#1e293b" : "#f4f4f5",
      border: `2px dashed ${isDark ? "#475569" : "#d4d4d8"}`,
      labelColor: isDark ? "#94a3b8" : "#71717a",
      numColor: isDark ? "#ffffff" : "#18181b"
    };
  }

  // OCCUPIED / running statuses
  if (
    rawStatus === "OCCUPIED" ||
    status === "running" ||
    status === "running_kot" ||
    status === "printed" ||
    status === "booked"
  ) {
    return {
      bg: isDark ? "#ca8a04" : "#fef08a",
      border: `1.5px solid ${isDark ? "#854d0e" : "#eab308"}`,
      labelColor: isDark ? "#ca8a04" : "#eab308",
      numColor: isDark ? "#ffffff" : "#1c1917"
    };
  }

  // BILLED / paid statuses
  if (rawStatus === "BILLED" || status === "paid" || status === "billed") {
    return {
      bg: isDark ? "#16a34a" : "#bbf7d0",
      border: `1.5px solid ${isDark ? "#14532d" : "#22c55e"}`,
      labelColor: isDark ? "#16a34a" : "#22c55e",
      numColor: isDark ? "#ffffff" : "#1c1917"
    };
  }

  // Fallback
  return {
    bg: isDark ? "#1e293b" : "#f4f4f5",
    border: `1.5px solid ${isDark ? "#334155" : "#e4e4e7"}`,
    labelColor: isDark ? "#94a3b8" : "#71717a",
    numColor: isDark ? "#ffffff" : "#18181b"
  };
};

const ICON_BTN = (isDark) => ({
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${isDark ? "#475569" : "#d4d4d8"}`,
  background: isDark ? "#334155" : "#f4f4f5",
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
  const colors = useSelector((state) => state.admin.theme.colors);
  const [elapsedMinutes, setElapsedMinutes] = React.useState(null);

  const {
    tableNumber,
    status,
    unitType,
    rawStatus,
    roomCategory,
    occupiedSince,
  } = table;

  React.useEffect(() => {
    if (!occupiedSince) {
      setElapsedMinutes(null);
      return;
    }

    const calculateElapsed = () => {
      const diffMs = Date.now() - new Date(occupiedSince).getTime();
      return Math.max(0, Math.floor(diffMs / 60000));
    };

    setElapsedMinutes(calculateElapsed());

    const interval = setInterval(() => {
      setElapsedMinutes(calculateElapsed());
    }, 15000);

    return () => clearInterval(interval);
  }, [occupiedSince]);

  const isRoom = unitType === "ROOM";
  const isAvailable = rawStatus === "AVAILABLE" || status === "blank";
  const isOccupied = rawStatus === "OCCUPIED" || status === "running" || status === "running_kot" || status === "printed" || status === "booked";
  const isBilled = rawStatus === "BILLED" || status === "paid" || status === "billed";

  const cardStyle = getCardStyle(rawStatus, status, isDarkMode, colors);

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

  const formatAmount = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? `₹${n.toFixed(2)}` : "";
  };

  // 🔧 FIX: Show bottom icons (Edit/Print/Move) for both rooms AND tables
  const showBottomIcons = (isOccupied || isBilled) && (table.currentOrderId || table.orderId);

  const orderId = table.currentOrderId || table.orderId;
  const effectiveIds = ctxOrderIds || newlyAddedItemsOrderIds;
  const hasNewClientItems = orderId && effectiveIds?.has(String(orderId));

  // Prefix T to numeric numbers only for tables (not rooms)
  const displayNum = !isRoom && /^\d+$/.test(String(tableNumber || "")) ? `T${tableNumber}` : tableNumber;

  return (
    <div
      onClick={handleClick}
      className="transition-all duration-200 active:scale-95"
      style={{
        width: 140,
        height: 112,
        borderRadius: 14,
        cursor: isLoading ? "wait" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: cardStyle.bg,
        border: cardStyle.border,
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
            gap: 4,
            fontSize: "8px",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            padding: "3px 0",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: 10,
            whiteSpace: "nowrap"
          }}
        >
          <Bell size={9} className="animate-bounce" />
          <span>New Order</span>
        </div>
      )}
      {isLoading && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>...</div>}

      {/* Top status / time */}
      {!hasNewClientItems && !isAvailable && elapsedMinutes != null && (
        <div style={{ position: "absolute", top: 12, fontSize: 10, fontWeight: 800, color: isDarkMode ? "#ffffff" : "#713f12", textTransform: "uppercase", letterSpacing: "0.6px" }}>
          {getElapsedString(elapsedMinutes)}
        </div>
      )}

      {/* Main number - bold dark, matches mockup */}
      <div 
        style={{ 
          fontSize: table.isVirtual ? 14 : 20, 
          fontWeight: 700, 
          color: cardStyle.numColor, 
          marginTop: table.isVirtual ? 18 : 14,
          textAlign: "center",
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
          maxWidth: "100%",
          padding: "0 6px"
        }}
      >
        {displayNum}
      </div>

      {/* Room category + price or table amount */}
      {!isAvailable && (
        <div style={{ fontSize: 13, color: isDarkMode ? "#ffffff" : "#713f12", marginTop: 2, fontWeight: 700, textAlign: 'center' }}>
          {table.currentAmount != null ? (
            formatAmount(table.currentAmount)
          ) : isRoom && roomCategory ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: 10 }}>
              <span style={{ opacity: 0.8, fontWeight: 500 }}>{roomCategory.name}</span>
              {roomCategory.pricePerNight ? <span style={{ fontSize: 13, fontWeight: 800 }}>{formatAmount(roomCategory.pricePerNight)}</span> : ''}
            </div>
          ) : ''}
        </div>
      )}

      {/* Bottom icons - only for occupied TABLES */}
      {showBottomIcons && (
        <div style={{ position: "absolute", bottom: -18, display: "flex", gap: 10, zIndex: 10 }}>
          <button
            onClick={isBilled ? (e) => { e.stopPropagation(); onPay?.(table); } : handleEdit}
            style={ICON_BTN(isDarkMode)}
            title={isBilled ? "Pay Order" : "Edit Order"}
          >
            {isBilled ? <IndianRupee size={18} /> : <SquarePen size={18} />}
          </button>
          <button
            onClick={handlePrint}
            style={ICON_BTN(isDarkMode)}
            title="Print"
          >
            <Printer size={18} />
          </button>
          {!isBilled && !table.isVirtual && (
            <button
              onClick={handleMove}
              style={ICON_BTN(isDarkMode)}
              title="Move Table/Room"
            >
              <Move size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default TableCard;
