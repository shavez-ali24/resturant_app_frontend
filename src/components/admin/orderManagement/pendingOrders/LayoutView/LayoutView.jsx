// src/components/admin/orderManagement/pendingOrders/LayoutView/LayoutView.jsx
import React, { useState, useCallback, useMemo } from "react";
import { useNotification } from "../../../Bell/NotificationContext";

import SectionBlock from "./SectionBlock";
import LegendBar from "./LegendBar";
import CreateOrderModal from "./CreateOrderModal";
import RoomActionModal from "./RoomActionModal";

/**
 * Main Layout View — renders restaurant sections with table cards in a flex-wrap row.
 */
export default function LayoutView({
  sections,
  onViewOrder,
  onCreateOrder,
  onEditOrder,
  onPrintBill,
  onBookRoom,
  onCheckoutRoom,
  roomActionLoadingId = null,
  isDarkMode = false,
  isLoading = false,
  error = null,
  onRetry,
}) {
  const { notify } = useNotification();

  const [selectedBlankTable, setSelectedBlankTable] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleTableClick = useCallback(
    (table) => {
      if (table.status === "blank") {
        setSelectedBlankTable(table);
      } else {
        // Occupied / Billed → open "create order" panel (AdminOrderPanel) prefilled with this table
        try {
          sessionStorage.setItem("selectedTable", JSON.stringify(table));
        } catch (_) {}
        onCreateOrder?.(table);
      }
    },
    [onCreateOrder]
  );

  const handleRoomClick = useCallback((room) => {
    setSelectedRoom(room);
  }, []);

  const handlePrintBill = useCallback(
    (tableInfo) => {
      // If parent provides direct print handler (auto-print + close), use it.
      // Otherwise fall back to opening the bill view.
      if (onPrintBill) {
        onPrintBill(tableInfo);
      } else {
        const info = tableInfo && typeof tableInfo === "object" ? tableInfo : { orderId: tableInfo };
        onViewOrder?.(info);
      }
    },
    [onPrintBill, onViewOrder]
  );

  const handleViewOrder = useCallback((table) => onViewOrder?.(table), [onViewOrder]);
  const handleEditOrder = useCallback((table) => onEditOrder?.(table), [onEditOrder]);

  const handleProceedCreate = useCallback(
    (tableInfo) => {
      setSelectedBlankTable(null);
      onCreateOrder?.(tableInfo);
    },
    [onCreateOrder]
  );

  const handleCloseModal = useCallback(() => setSelectedBlankTable(null), []);

  const handleCloseRoomModal = useCallback(() => setSelectedRoom(null), []);

  const handleBookRoom = useCallback(async (payload, room) => {
    await onBookRoom?.(payload, room);
  }, [onBookRoom]);

  const handleCheckoutRoom = useCallback(async (room) => {
    await onCheckoutRoom?.(room);
  }, [onCheckoutRoom]);

  const sectionsList = useMemo(() => {
    if (!Array.isArray(sections)) return [];
    return sections.filter((sec) => Array.isArray(sec.tables) && sec.tables.length > 0);
  }, [sections]);

  // ── Loading State ──
  if (isLoading && sectionsList.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 4, height: "100%", overflowY: "auto" }}>
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
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: isDarkMode ? "#94a3b8" : "#78716c" }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: isDarkMode ? "#334155" : "#ede8e3",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  display: "inline-block",
                  width: 60,
                  height: 12,
                  borderRadius: 4,
                  background: isDarkMode ? "#334155" : "#ede8e3",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: 4 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 120,
                height: 130,
                borderRadius: 8,
                background: isDarkMode ? "#334155" : "#ede8e3",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error && sectionsList.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 4, height: "100%", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "64px 0", color: isDarkMode ? "#94a3b8" : "#78716c" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Could not load units. Please refresh the page</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{error}</p>
          <button
            onClick={onRetry}
            style={{
              marginTop: 8,
              borderRadius: 8,
              background: "#f97316",
              color: "#ffffff",
              border: "none",
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Empty State ──
  if (sectionsList.length === 0 && !isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 4, height: "100%", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "64px 0", color: isDarkMode ? "#94a3b8" : "#78716c" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
            <path d="m12 4 4 5H8l4-5Z" />
          </svg>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No units found. Add tables or rooms to get started</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>Add units in Table Management</p>
        </div>
      </div>
    );
  }

  // ── Main Render ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: 4 }}>
      <LegendBar isDarkMode={isDarkMode} />

      {sectionsList.map((section) => (
        <SectionBlock
          key={section.sectionId || section.sectionName}
          sectionName={section.sectionName}
          tables={section.tables}
          onTableClick={handleTableClick}
          onPrint={handlePrintBill}
          onView={handleViewOrder}
          onEdit={handleEditOrder}
          onRoomClick={handleRoomClick}
          roomActionLoadingId={roomActionLoadingId}
          isDarkMode={isDarkMode}
        />
      ))}

      {selectedBlankTable && (
        <CreateOrderModal
          table={selectedBlankTable}
          isDarkMode={isDarkMode}
          onClose={handleCloseModal}
          onProceed={handleProceedCreate}
        />
      )}

      {selectedRoom && (
        <RoomActionModal
          room={selectedRoom}
          isDarkMode={isDarkMode}
          onClose={handleCloseRoomModal}
          onBook={handleBookRoom}
          onCheckout={handleCheckoutRoom}
          isLoading={roomActionLoadingId === selectedRoom.unitId}
        />
      )}
    </div>
  );
}