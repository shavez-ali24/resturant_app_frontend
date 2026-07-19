// src/components/admin/orderManagement/OrdersTable.jsx
import React, { useState, Suspense, lazy } from "react";
import OrderRow from "./OrderRow";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { Utensils, House, Truck, Bell } from "lucide-react";
import { useNotification } from "@/components/admin/Bell/NotificationContext";
const CustomizationsModal = lazy(() => import("./CustomizationsModal"));
const PendingOrderMobileNote = lazy(() => import("./PendingOrderMobileNote"));
const PendingOrderMobileControls = lazy(() => import("./PendingOrderMobileControls"));
import {
  formatOrderTableId,
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderTypeBadgeClass,
  getOrderIdValue,
  getOrderIdShortValue,
  getOrderTypeKey,
  getOrderTypeLabel,
  getStatusRowClass,
  isEatHereOrder,
} from "../commonOrderFile/utils";

// Utility function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

// Utility function to format time
const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const OrdersTable = ({
  orders,
  loading,
  error,
  setEditingOrder,
  setShowConfirmDelete,
  setOrderForBillModal,
  setPayModalOrder,
  setMoveModalOrder,
  updateOrder,
  tableType,
  onCustomizationsClick,
  latestOrderId,
  isDarkMode = false,
  containerVariant = "card",
  newlyAddedItemsOrderIds,
}) => {
  const dispatch = useDispatch();
  const [selectedCustomizationOrder, setSelectedCustomizationOrder] = useState(null);
  const [seenBillOrderId, setSeenBillOrderId] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("billViewedOrderId") || "";
  });
  const columnCount = tableType === "pending" ? 9 : 6;
  const skeletonRows = Array.from({ length: 8 });
  const mobileSkeletons = Array.from({ length: 4 });

  // Function to handle customizations button click
  const handleCustomizationsClick = (order) => {
    if (order) {
      setSelectedCustomizationOrder(order);
    }
  };

  // Modal background click handler
  const handleModalClose = () => {
    setSelectedCustomizationOrder(null);
  };

  const getOrderId = (order) =>
    getOrderIdValue(order) || order?.createdAt || "";
  const getOrderIdShort = (order) => getOrderIdShortValue(order);
  const latestId = latestOrderId ? String(latestOrderId) : "";
  const isLatestUnseen = (order) => {
    if (!latestId) return false;
    const id = String(getOrderId(order) || "");
    return id && id === latestId && id !== seenBillOrderId;
  };
  const markLatestSeen = (order) => {
    if (typeof window === "undefined") return;
    const id = String(getOrderId(order) || "");
    if (!id || id !== latestId) return;
    localStorage.setItem("billViewedOrderId", id);
    setSeenBillOrderId(id);
  };

  const { setNewlyAddedItemsOrderIds } = useNotification() || {};

  const handleBillClick = async (order) => {
    // Clear NEW ORDER badge when bill is viewed
    const oid = getOrderId(order);
    if (oid && setNewlyAddedItemsOrderIds) {
      setNewlyAddedItemsOrderIds((prev) => {
        const key = String(oid);
        if (!prev.has(key)) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
    markLatestSeen(order);
    dispatch(showBill(order));
  };

  const containerClassName =
    containerVariant === "plain"
      ? "h-full overflow-hidden rounded-xl bg-transparent"
      : "h-full overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-[#1e293b]";

  return (
    <div className={containerClassName}>
      {/* Customizations Modal */}
      {selectedCustomizationOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
          onClick={handleModalClose}
        >
          <Suspense fallback={null}>
            <CustomizationsModal
              order={selectedCustomizationOrder}
              onClose={handleModalClose}
            />
          </Suspense>
        </div>
      )}

      {/* Desktop / Tablet */}
      <div className="hidden md:flex md:h-full md:flex-col">
        <div className="overflow-auto flex-1">
          <table className="min-w-full">
            <thead 
              className="sticky top-0 z-10 backdrop-blur-sm"
              style={{ backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(248, 243, 239, 0.9)" }}
            >
              <tr className={`border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                {tableType === "pending" ? (
                  <th className={`px-4 py-3 text-center align-middle text-xs font-semibold tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Order ID</th>
                ) : (
                  <th className={`px-4 py-3 text-center align-middle text-xs font-semibold tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Date</th>
                )}
                <th className={`px-4 py-3 text-center align-middle text-xs font-semibold tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Placed At</th>
                <th className={`px-4 py-3 text-center align-middle text-xs font-semibold tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Customer</th>
                <th className={`px-4 py-3 text-center align-middle text-xs font-semibold tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Phone</th>
                <th className={`px-4 py-3 text-center align-middle text-xs font-semibold tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Type</th>
                <th className={`px-4 py-3 text-center align-middle text-xs font-semibold tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Order Details</th>
                {tableType === "pending" && (
                  <th className={`px-4 py-3 text-center align-middle text-xs font-semibold tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Note</th>
                )}
                {tableType === "pending" && (
                  <>
                    <th className={`px-4 py-3 text-center align-middle text-xs font-semibold tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Status</th>
                    <th className={`px-4 py-3 text-center align-middle text-xs font-semibold tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Manage</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className={`divide-y ${isDarkMode ? "divide-slate-700/50" : "divide-slate-100"}`}>
              {loading ? (
                skeletonRows.map((_, rowIndex) => (
                  <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
                    {Array.from({ length: columnCount }).map((__, colIndex) => (
                      <td key={`skeleton-cell-${rowIndex}-${colIndex}`} className="px-4 py-3">
                        <div className={`h-4 w-full rounded ${isDarkMode ? "bg-slate-700/60" : "bg-slate-100"}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={columnCount} className="py-10 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className={`py-16 text-center text-sm ${isDarkMode ? "text-slate-400" : "text-[#a8a29e]"}`}>
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <OrderRow
                    key={getOrderId(order) || order?.createdAt || index}
                    order={{
                      ...order,
                      formattedDate: formatDate(order.createdAt),
                      formattedTime: formatTime(order.createdAt),
                      hasNewClientItems: newlyAddedItemsOrderIds?.has(String(getOrderId(order))),
                    }}
                    index={index}
                    setEditingOrder={setEditingOrder}
                    setShowConfirmDelete={setShowConfirmDelete}
                    setOrderForBillModal={setOrderForBillModal}
                    setPayModalOrder={setPayModalOrder}
                    setMoveModalOrder={setMoveModalOrder}
                    updateOrder={updateOrder}
                    tableType={tableType}
                    isDarkMode={isDarkMode}
                    onCustomizationsClick={onCustomizationsClick || handleCustomizationsClick}
                    showBillAttention={isLatestUnseen(order)}
                    onBillOpen={() => markLatestSeen(order)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View — scrollable */}
      <div className="block md:hidden h-full overflow-y-auto p-3">
        {loading ? (
          <div className="space-y-3">
            {mobileSkeletons.map((_, idx) => (
              <div key={`mobile-skeleton-${idx}`} className={`h-48 w-full rounded-xl animate-pulse ${isDarkMode ? "bg-slate-700/40" : "bg-[#f0ebe5]"}`} />
            ))}
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-500">{error}</p>
        ) : orders.length === 0 ? (
          <p className={`py-12 text-center text-sm ${isDarkMode ? "text-slate-400" : "text-[#a8a29e]"}`}>No orders yet</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
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
              const handlePendingCustomizationsClick = onCustomizationsClick || handleCustomizationsClick;
              const orderId = getOrderId(order);
              const hasNewClientItems = newlyAddedItemsOrderIds?.has(String(orderId));

              return (
                <div
                  key={getOrderId(order) || order?.createdAt}
                  className={`w-full rounded-xl border p-3 space-y-2.5 ${isDarkMode
                    ? "border-slate-700/60 bg-slate-800/60"
                    : "border-[#ede8e3] bg-white"
                    }`}
                >
                  {/* Row 1: ID + Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${isDarkMode ? "bg-slate-700 text-orange-300" : "bg-[#f7f3ef] text-orange-600"}`}>
                        {getOrderIdShort(order)}
                      </span>
                      {hasNewClientItems && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse shadow-sm border border-white">
                          <Bell size={10} className="animate-bounce" />
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-[#a8a29e]"}`}>
                      {tableType === "pending"
                        ? formatTime(order.createdAt)
                        : `${formatDate(order.createdAt)} · ${formatTime(order.createdAt)}`}
                    </span>
                  </div>

                  {/* Row 2: Name + Phone */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`rounded-lg px-3 py-2 ${isDarkMode ? "bg-slate-700/40" : "bg-[#f7f3ef]"}`}>
                      <p className={`text-[10px] font-medium mb-0.5 ${isDarkMode ? "text-slate-500" : "text-[#a8a29e]"}`}>Name</p>
                      <p className={`text-sm font-semibold truncate ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>{getOrderCustomerName(order)}</p>
                    </div>
                    <div className={`rounded-lg px-3 py-2 ${isDarkMode ? "bg-slate-700/40" : "bg-[#f7f3ef]"}`}>
                      <p className={`text-[10px] font-medium mb-0.5 ${isDarkMode ? "text-slate-500" : "text-[#a8a29e]"}`}>Phone</p>
                      <p className={`text-sm font-semibold truncate ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>{getOrderCustomerPhone(order)}</p>
                    </div>
                  </div>

                  {/* Row 3: Type badge */}
                  <div className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold min-w-[130px] ${orderTypeClass}`}>
                    {getOrderTypeIcon(order.orderType)}
                    <span>{isEatHereOrder(order.orderType) && tableLabel ? `${tableLabel} : ` : ''}{orderTypeLabel}</span>
                  </div>

                  {/* Row 4: Note + View Bill */}
                  <div className="grid grid-cols-2 gap-2">
                    {tableType === "pending" && (
                      <Suspense fallback={null}>
                        <PendingOrderMobileNote order={order} onCustomizationsClick={handlePendingCustomizationsClick} />
                      </Suspense>
                    )}
                    <button
                      onClick={() => handleBillClick(order)}
                      className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors ${isLatestUnseen(order) ? "bill-border-animate" : ""
                        } ${isDarkMode
                          ? "border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700"
                          : "border-[#ede8e3] bg-white text-[#1c1917] hover:bg-[#f7f3ef]"
                        } ${tableType !== "pending" ? "col-span-2" : ""}`}
                    >
                      View Items & Bill
                    </button>
                  </div>

                  {/* Row 5: Status + Pay/Move/Edit/Delete */}
                  {tableType === "pending" && (
                    <Suspense fallback={null}>
                      <PendingOrderMobileControls
                        order={order}
                        updateOrder={updateOrder}
                        setEditingOrder={setEditingOrder}
                        setShowConfirmDelete={setShowConfirmDelete}
                        setPayModalOrder={setPayModalOrder}
                        setMoveModalOrder={setMoveModalOrder}
                        isDarkMode={isDarkMode}
                      />
                    </Suspense>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;
