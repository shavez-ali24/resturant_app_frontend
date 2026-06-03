import React, { Suspense, lazy, useCallback } from "react";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { Truck, Utensils, House, Bell } from "lucide-react";
import { useNotification } from "@/components/admin/Bell/NotificationContext";
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
  setPayModalOrder,
  setMoveModalOrder,
  updateOrder,
  tableType,
  onCustomizationsClick,
  showBillAttention,
  onBillOpen,
  isDarkMode = false,
}) => {
  const dispatch = useDispatch();

  const { setNewlyAddedItemsOrderIds } = useNotification() || {};

  const handleBillClick = useCallback(() => {
    // Clear NEW ORDER badge when bill is viewed
    const oid = order?._id || order?.id || order?.orderId;
    if (oid && setNewlyAddedItemsOrderIds) {
      setNewlyAddedItemsOrderIds((prev) => {
        const key = String(oid);
        if (!prev.has(key)) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
    if (onBillOpen) onBillOpen();
    dispatch(showBill(order));
  }, [order, dispatch, onBillOpen, setNewlyAddedItemsOrderIds]);

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
        <td className={`${tdBase} text-center`}>{order.formattedDate || "—"}</td>
      )}

      {tableType === "pending" ? (
        <>
          {/* ID */}
          <td className="px-4 py-3 align-middle text-center flex items-center justify-center gap-1.5">
            <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${isDarkMode ? "bg-slate-700 text-orange-300" : "bg-[#fbfaf8] border border-[#ede8e3] text-orange-600"}`}>
              {orderIdDisplay || "—"}
            </span>
            {order.hasNewClientItems && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500 text-white animate-pulse shadow-sm border border-white">
                <Bell size={10} className="animate-bounce" />
                <span>NEW ORDER</span>
              </span>
            )}
          </td>
          {/* Time */}
          <td className={`${tdBase} whitespace-nowrap text-center`}>{order.formattedTime || "—"}</td>
          {/* Customer */}
          <td className={`${tdBase} font-bold text-center ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>{customerName}</td>
          {/* Phone */}
          <td className={`text-center ${tdBase} ${isDarkMode ? "text-slate-400" : "text-[#87807b]"}`}>{customerPhone || "—"}</td>
        </>
      ) : (
        <>
          <td className={`${tdBase} whitespace-nowrap text-center`}>{order.formattedTime || "—"}</td>
          <td className={`${tdBase} font-bold text-center ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>{customerName}</td>
          <td className={`${tdBase} text-center ${isDarkMode ? "text-slate-400" : "text-[#87807b]"}`}>{customerPhone || "—"}</td>
        </>
      )}

      {/* Order Type */}
      <td className="px-4 py-3 align-middle text-center">
        <span className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold min-w-[130px] ${orderTypeClass}`}>
          {getOrderTypeIcon(order.orderType)}
          {isEatHereOrder(order.orderType) && tableLabel ? `${tableLabel} : ` : ''}{orderTypeLabel}
        </span>
      </td>

      {/* View Items & Bill */}
      <td className="px-4 py-3 align-middle text-center">
        <button
          onClick={handleBillClick}
          className={`rounded-xl border px-4 py-2 text-xs font-extrabold transition-all duration-200 ${showBillAttention ? "bill-border-animate" : ""
            } ${isDarkMode
              ? "border-slate-600 bg-slate-800 text-orange-300 hover:bg-slate-700"
              : "border-[#ede8e3] bg-[#fbfaf8] text-[#57524e] hover:bg-orange-50/50 hover:text-orange-700 hover:border-orange-200 shadow-sm"
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
            setPayModalOrder={setPayModalOrder}
            setMoveModalOrder={setMoveModalOrder}
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
