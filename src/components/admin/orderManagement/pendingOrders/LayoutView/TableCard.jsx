// src/components/admin/orderManagement/pendingOrders/LayoutView/TableCard.jsx
import React from "react";
import { SquarePen, Printer } from "lucide-react";
import { ADMIN_COLORS } from "@/redux/adminRedux/adminSlice";

const getStatusBg = (status, isDark) => {
  const map = {
    blank:       { bg: isDark ? "#1e293b" : "#ffffff",       border: `1.5px dashed ${isDark ? "#475569" : "#d6cfc8"}` },
    running:     { bg: isDark ? "#3a3520" : "#FFFDE7",       border: `1.5px solid ${isDark ? "#eab308" : "#FDE047"}` },
    printed:     { bg: isDark ? "#1e3a5f" : "#EBF5FF",       border: `1.5px solid ${isDark ? "#3b82f6" : "#93C5FD"}` },
    paid:        { bg: isDark ? "#1a3a2a" : "#EFFFEF",       border: `1.5px solid ${isDark ? "#22c55e" : "#86EFAC"}` },
    running_kot: { bg: "#f97316",                            border: "1.5px solid #ea580c" },
  };
  return map[status] || map.blank;
};

const getStatusText = (status, isDark) => {
  const map = {
    blank:       isDark ? "#64748b" : "#a8a29e",
    running:     isDark ? "#fde047" : "#854d0e",
    printed:     isDark ? "#93c5fd" : "#1e40af",
    paid:        isDark ? "#86efac" : "#166534",
    running_kot: "#ffffff",
  };
  return map[status] || map.blank;
};

const getStatusAmount = (status, isDark) => {
  const map = {
    blank:       isDark ? "#64748b" : "#a8a29e",
    running:     isDark ? "#fde047" : "#a16207",
    printed:     isDark ? "#93c5fd" : "#2563eb",
    paid:        isDark ? "#86efac" : "#16a34a",
    running_kot: "#fff7ed",
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
  onView,
  onEdit,
  isDarkMode = false,
}) {
  const { tableNumber, status, runningMinutes, currentAmount, orderId } = table;
  const isBlank = status === "blank";
  const bgInfo = getStatusBg(status, isDarkMode);
  const textColor = getStatusText(status, isDarkMode);
  const amountColor = getStatusAmount(status, isDarkMode);
  const C = isDarkMode ? ADMIN_COLORS.dark : ADMIN_COLORS;

  const handleClick = () => onTableClick(table);

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit && orderId) onEdit(table);
  };

  const handlePrint = (e) => {
    e.stopPropagation();
    if (onPrint && orderId) onPrint(orderId);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      style={{
        width: 110,
        height: 130,
        flexShrink: 0,
        borderRadius: 8,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        userSelect: "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        background: bgInfo.bg,
        border: bgInfo.border,
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.04)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
      aria-label={
        isBlank
          ? `Table ${tableNumber} — Available`
          : `Table ${tableNumber} — ${status.replace("_", " ")} — \u20B9${currentAmount}`
      }
    >
      {isBlank ? (
    <span
      style={{
        fontSize: 22,
        fontWeight: 700,
        fontFamily: "'Outfit', sans-serif",
        color: isDarkMode ? "#64748b" : "#a8a29e",
        lineHeight: 1,
      }}
    >
      {tableNumber}
    </span>
      ) : (
        <>
          {/* Time — top */}
          <span
            style={{
              position: "absolute",
              top: 6,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: textColor,
              lineHeight: 1,
            }}
          >
            {runningMinutes != null ? `${runningMinutes}m` : ""}
          </span>

          {/* Table number — center */}
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              color: textColor,
              lineHeight: 1.2,
              marginBottom: 4,
              marginTop: 6,
            }}
          >
            {tableNumber}
          </span>

          {/* Amount */}
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: amountColor,
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            {currentAmount != null ? `\u20B9${currentAmount}` : ""}
          </span>

          {/* Icons row — straddling card's bottom border */}
          <div
            style={{
              position: "absolute",
              bottom: -18,
              left: 0,
              right: 0,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <button
              style={ICON_BTN(isDarkMode)}
              onClick={handleEdit}
              title="Edit Order"
              aria-label="Edit Order"
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              <SquarePen size={20} />
            </button>
            <button
              style={ICON_BTN(isDarkMode)}
              onClick={handlePrint}
              title="Print KOT"
              aria-label="Print KOT"
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              <Printer size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default TableCard;