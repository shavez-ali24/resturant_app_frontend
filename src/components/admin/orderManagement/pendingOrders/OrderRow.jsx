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
}) => {
  const dispatch = useDispatch();

  const getOrderTypeIcon = (type) => {
    switch (getOrderTypeKey(type)) {
      case "eat_here":
        return <Utensils size={16} />;
      case "take_away":
        return <House size={16} />;
      case "delivery":
        return <Truck size={16} />;
      default:
        return <Utensils size={16} />;
    }
  };

  const orderTypeLabel = getOrderTypeLabel(order.orderType);
  const orderTypeClass = getOrderTypeBadgeClass(order.orderType);
  const tableLabel = formatOrderTableId(
    order.tableId ||
      order.table ||
      order.tableNumber ||
      order?.table?.name ||
      order?.table?.tableNumber ||
      order?.table?.number
  );
  const customerName = getOrderCustomerName(order);
  const customerPhone = getOrderCustomerPhone(order);
  const orderIdDisplay = getOrderIdShortValue(order);

  return (
    <tr
      className={`border-b border-orange-100 transition-colors hover:brightness-95 dark:border-slate-700 dark:hover:brightness-110 ${getStatusRowClass(
        order.status
      )}`}
    >
      {/* Date Column */}
      {tableType !== "pending" && (
        <td className="text-center border px-1 text-sm text-gray-700 dark:border-slate-700 dark:text-slate-200">
          {order.formattedDate || "N/A"}
        </td>
      )}

      {tableType === "pending" ? (
        <>
          {/* ID Column - FIRST for pending */}
          <td className="text-center border px-1 text-sm text-gray-700 dark:border-slate-700 dark:text-slate-200">
            <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
              {orderIdDisplay || "N/A"}
            </span>
          </td>
          {/* Time Column - SECOND for pending */}
          <td className="text-center border px-1 text-sm text-gray-700 dark:border-slate-700 dark:text-slate-200">
            {order.formattedTime || "N/A"}
          </td>
          <td className="text-center border px-1 text-sm font-semibold text-gray-800 dark:border-slate-700 dark:text-slate-100">
            {customerName}
          </td>
          <td className="text-center border px-1 text-sm text-gray-700 dark:border-slate-700 dark:text-slate-200">
            {customerPhone || "N/A"}
          </td>
        </>
      ) : (
        <>
          {/* Time Column - FIRST for non-pending */}
          <td className="text-center border px-1 text-sm text-gray-700 dark:border-slate-700 dark:text-slate-200">
            {order.formattedTime || "N/A"}
          </td>
          <td className="text-center border px-1 text-sm text-gray-700 dark:border-slate-700 dark:text-slate-200">{customerName}</td>
          <td className="text-center border px-1 text-sm text-gray-700 dark:border-slate-700 dark:text-slate-200">{customerPhone}</td>
        </>
      )}

      {/* Order Type - DISPLAY ONLY (same styling as EditOrderModal) */}
      <td className="px-1 py-2 text-center border dark:border-slate-700">
        <div className={`mx-auto inline-flex h-9 w-40 items-center justify-center rounded-xl px-3 text-sm font-semibold ring-1 ring-black/5 dark:ring-white/10 ${orderTypeClass}`}>
          <div className="flex items-center gap-1.5">
            {getOrderTypeIcon(order.orderType)}
            <span>{orderTypeLabel}</span>
            {isEatHereOrder(order.orderType) && tableLabel && (
              <span className="ml-0.5">: {tableLabel}</span>
            )}
          </div>
        </div>
      </td>

      {/* View Items / Bill */}
      <td className="text-center border py-2">
        <button
          onClick={() => {
            if (onBillOpen) onBillOpen();
            dispatch(showBill(order));
          }}
          className={`rounded-xl border border-orange-200 bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 ${showBillAttention ? "bill-border-animate" : ""}`}
        >
          <span className="flex justify-center items-center gap-1">
            View Items & Bill
          </span>
        </button>
      </td>

      {/* C/S Column - Show only for pending orders */}
      {tableType === "pending" && (
        <Suspense fallback={<PendingOrderRowActionsFallback />}>
          <PendingOrderRowActions
            order={order}
            setEditingOrder={setEditingOrder}
            setShowConfirmDelete={setShowConfirmDelete}
            updateOrder={updateOrder}
            onCustomizationsClick={onCustomizationsClick}
          />
        </Suspense>
      )}
    </tr>
  );
};

export default OrderRow;
