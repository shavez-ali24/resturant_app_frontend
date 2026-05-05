import React, { Suspense, lazy } from "react";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { Truck, Utensils, House } from "lucide-react";
import {
  formatOrderTableId,
  getOrderTypeBadgeClass,
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderIdShortValue,
  getOrderTypeKey,
  getOrderTypeLabel,
  getStatusRowClass,
  isEatHereOrder,
} from "../commonOrderFile/utils";

const PendingOrderRowActions = lazy(() => import("./PendingOrderRowActions"));

const PendingOrderRowActionsFallback = () => (
  <>
    <td className="border py-2" aria-hidden="true" />
    <td className="border py-2" aria-hidden="true" />
    <td className="border py-2" aria-hidden="true" />
  </>
);

const OrderRow = ({
  order,
  setEditingOrder,
  setShowConfirmDelete,
  updateOrder,
  tableType,
  onCustomizationsClick,
  showBillAttention,
  onBillOpen,
  isDarkMode = false,
}) => {
  const dispatch = useDispatch();

  const getOrderTypeIcon = (type) => {
    switch (getOrderTypeKey(type)) {
      case "eat_here": return <Utensils size={13} />;
      case "take_away": return <House size={13} />;
      case "delivery": return <Truck size={13} />;
      default: return <Utensils size={13} />;
    }
  };

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

  return (
    <tr className={`transition-colors ${isDarkMode ? "hover:bg-slate-700/30" : "hover:bg-[#faf7f4]"}`}>

      {/* Date (non-pending) */}
      {tableType !== "pending" && (
        <td className={tdBase}>{order.formattedDate || "—"}</td>
      )}

      {tableType === "pending" ? (
        <>
          {/* ID */}
          <td className="px-4 py-3 align-middle">
            <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${isDarkMode ? "bg-slate-700 text-orange-300" : "bg-[#f7f3ef] text-orange-600"}`}>
              {orderIdDisplay || "—"}
            </span>
          </td>
          {/* Time */}
          <td className={`${tdBase} whitespace-nowrap`}>{order.formattedTime || "—"}</td>
          {/* Customer */}
          <td className={`${tdBase} font-medium ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>{customerName}</td>
          {/* Phone */}
          <td className={`${tdBase} ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>{customerPhone || "—"}</td>
        </>
      ) : (
        <>
          <td className={`${tdBase} whitespace-nowrap`}>{order.formattedTime || "—"}</td>
          <td className={`${tdBase} font-medium ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>{customerName}</td>
          <td className={`${tdBase} ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>{customerPhone || "—"}</td>
        </>
      )}

      {/* Order Type */}
      <td className="px-4 py-3 align-middle">
        <span className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold min-w-[130px] ${orderTypeClass}`}>
          {getOrderTypeIcon(order.orderType)}
          {orderTypeLabel}
          {isEatHereOrder(order.orderType) && tableLabel && ` : ${tableLabel}`}
        </span>
      </td>

      {/* View Items & Bill */}
      <td className="px-4 py-3 align-middle">
        <button
          onClick={() => { if (onBillOpen) onBillOpen(); dispatch(showBill(order)); }}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            showBillAttention ? "bill-border-animate" : ""
          } ${isDarkMode
            ? "border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700"
            : "border-[#ede8e3] bg-white text-[#1c1917] hover:bg-[#f7f3ef]"
          }`}
        >
          View Items & Bill
        </button>
      </td>

      {/* Pending-only actions */}
      {tableType === "pending" && (
        <Suspense fallback={<PendingOrderRowActionsFallback />}>
          <PendingOrderRowActions
            order={order}
            setEditingOrder={setEditingOrder}
            setShowConfirmDelete={setShowConfirmDelete}
            updateOrder={updateOrder}
            onCustomizationsClick={onCustomizationsClick}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      )}
    </tr>
  );
};

export default OrderRow;
