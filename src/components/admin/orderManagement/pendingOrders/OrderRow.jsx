import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { Truck, Utensils, House, Bell } from "lucide-react";
import {
  formatOrderTableId,
  getOrderTypeBadgeClass,
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderIdShortValue,
  getOrderTypeKey,
  getOrderTypeLabel,
  isEatHereOrder,
} from "../commonOrderFile/utils";
import PendingOrderRowActions from "./PendingOrderRowActions";

// Static helper moved outside of the component to prevent recreation on every render
const getOrderTypeIcon = (type) => {
  switch (getOrderTypeKey(type)) {
    case "eat_here":
      return <Utensils size={13} />;
    case "take_away":
      return <House size={13} />;
    case "delivery":
      return <Truck size={13} />;
    default:
      return <Utensils size={13} />;
  }
};

const OrderRow = ({
  order,
  setEditingOrder,
  setShowConfirmDelete,
  setPayModalOrder,
  setMoveModalOrder,
  updateOrder,
  tableType,
  onCustomizationsClick,
  showBillAttention,
  handleBillClick,
  isDarkMode = false,
}) => {
  // Safe Redux theme selection with reliable default fallbacks
  const colors = useSelector((state) => state.admin.theme?.colors || {
    primary: "#f97316",
    primaryHover: "#ea580c",
    primaryLight: "#fff7ed",
    primaryText: "#ea580c",
  });

  const onBillClick = useCallback(() => {
    handleBillClick(order);
  }, [order, handleBillClick]);

  const orderTypeLabel = getOrderTypeLabel(order.orderType);
  const orderTypeClass = getOrderTypeBadgeClass(order.orderType);
  
  const tableLabel = formatOrderTableId(
    order.tableId || order.table || order.tableNumber ||
    order?.table?.name || order?.table?.tableNumber || order?.table?.number,
    order.source
  );
  
  const customerName = getOrderCustomerName(order);
  const customerPhone = getOrderCustomerPhone(order);
  const orderIdDisplay = getOrderIdShortValue(order);

  const tdBase = `px-4 py-3 text-sm align-middle ${isDarkMode ? "text-slate-300" : "text-[#44403c]"}`;

  // CSS variables style object for hover states instead of manual DOM mutations
  const hoverStyles = useMemo(() => ({
    "--hover-bg": isDarkMode ? "rgba(51, 65, 85, 0.6)" : `${colors.primary}08`,
    "--hover-border": isDarkMode ? colors.primary : `${colors.primary}80`,
    "--hover-text": isDarkMode ? colors.primary : colors.primaryText,
    backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "#ffffff",
    borderColor: isDarkMode ? "#475569" : "#ede8e3",
    borderWidth: "1px",
    color: isDarkMode ? "rgba(241, 245, 249, 0.9)" : "#57524e",
  }), [isDarkMode, colors.primary, colors.primaryText]);

  return (
    <tr className={`transition-colors ${isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/60"}`}>
      {/* Date (non-pending) */}
      {tableType !== "pending" && (
        <td className={`${tdBase} text-center`}>{order.formattedDate || "—"}</td>
      )}

      {tableType === "pending" ? (
        <>
          {/* ID */}
          <td className="px-4 py-3 align-middle text-center flex items-center justify-center gap-1.5">
            <span
              className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: isDarkMode ? `${colors.primary}1a` : `${colors.primary}05`,
                borderColor: isDarkMode ? `${colors.primary}59` : `${colors.primary}33`,
                color: isDarkMode ? colors.primary : colors.primaryText,
                borderWidth: '1px'
              }}
            >
              {orderIdDisplay || "—"}
            </span>
            {order.hasNewClientItems && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse shadow-sm border border-white">
                <Bell size={10} className="animate-bounce" />
              </span>
            )}
          </td>
          {/* Time */}
          <td className={`${tdBase} whitespace-nowrap text-center`}>{order.formattedTime || "—"}</td>
          {/* Customer */}
          <td className={`${tdBase} font-bold text-center ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>{customerName}</td>
          {/* Phone */}
          <td className={`text-center ${tdBase} ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>{customerPhone || "—"}</td>
        </>
      ) : (
        <>
          <td className={`${tdBase} whitespace-nowrap text-center`}>{order.formattedTime || "—"}</td>
          <td className={`${tdBase} font-bold text-center ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>{customerName}</td>
          <td className={`${tdBase} text-center ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>{customerPhone || "—"}</td>
        </>
      )}

      {/* Order Type */}
      <td className="px-4 py-3 align-middle text-center">
        <span 
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold min-w-[130px] ${orderTypeClass}`}
          style={order.orderType === "Room Stay" ? {
            backgroundColor: isDarkMode ? 'rgba(71, 85, 105, 0.35)' : '#f5f5f4',
            color: isDarkMode ? '#e2e8f0' : '#57524e',
            border: isDarkMode ? '1px solid rgba(148, 163, 184, 0.25)' : '1px solid #e7e5e4'
          } : {}}
        >
          {getOrderTypeIcon(order.orderType)}
          {isEatHereOrder(order.orderType) && tableLabel ? `${tableLabel} : ` : ''}{orderTypeLabel}
        </span>
      </td>

      {/* View Items & Bill */}
      <td className="px-4 py-3 align-middle text-center">
        <button
          type="button"
          onClick={onBillClick}
          className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all duration-200 shadow-sm hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)] hover:text-[var(--hover-text)] ${showBillAttention ? "bill-border-animate" : ""}`}
          style={hoverStyles}
        >
          View Items & Bill
        </button>
      </td>

      {/* Pending-only actions (Statically imported action component instead of overhead row-level lazy loading) */}
      {tableType === "pending" && (
        <PendingOrderRowActions
          order={order}
          setEditingOrder={setEditingOrder}
          setShowConfirmDelete={setShowConfirmDelete}
          setPayModalOrder={setPayModalOrder}
          setMoveModalOrder={setMoveModalOrder}
          updateOrder={updateOrder}
          onCustomizationsClick={onCustomizationsClick}
          isDarkMode={isDarkMode}
        />
      )}
    </tr>
  );
};

// Memoize the entire row to prevent unnecessary list re-renders
export default React.memo(OrderRow);
