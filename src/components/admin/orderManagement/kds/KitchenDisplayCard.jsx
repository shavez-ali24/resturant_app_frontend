import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useToggleItemReadyMutation } from "../../../../redux/adminRedux/adminAPI";
import { Sparkles, Check } from "lucide-react";
import {
  formatElapsedTimer,
  formatOrderTableId,
  getItemCustomizationText,
  getOrderTypeBadgeClass,
  getOrderTypeKey,
  getOrderTypeLabel,
  getOrderCustomerName,
  getOrderIdShortValue,
  getOrderPreparingStartedAt,
  getOrderIdValue,
  getOrderItemsList,
  getPreparingDelayLevel,
  getStatusBadge,
} from "../commonOrderFile/utils";

const ITEM_READY_CHANNEL = "kds-bill-item-ready-sync";
const ORDER_STATUS_CHANNEL = "kds-bill-order-status-sync";

const broadcastItemReady = (orderId, itemId, isReady) => {
  try {
    const channel = new BroadcastChannel(ITEM_READY_CHANNEL);
    channel.postMessage({ orderId, itemId, isReady });
    channel.close();
  } catch (e) {
    console.warn("BroadcastChannel not supported:", e);
  }
};

const broadcastOrderStatus = (orderId, status) => {
  try {
    const channel = new BroadcastChannel(ORDER_STATUS_CHANNEL);
    channel.postMessage({ orderId, status });
    channel.close();
  } catch (e) {
    console.warn("BroadcastChannel not supported:", e);
  }
};

const listenForItemReady = (callback) => {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(ITEM_READY_CHANNEL);
  channel.onmessage = (event) => callback(event.data);
  return () => channel.close();
};

const listenForOrderStatus = (callback) => {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(ORDER_STATUS_CHANNEL);
  channel.onmessage = (event) => callback(event.data);
  return () => channel.close();
};

const getStatusColors = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "preparing") {
    return {
      bg: "bg-[#D32F2F]", // Material Red
      text: "text-[#D32F2F]",
      border: "border-[#D32F2F]",
      lightBg: "bg-red-50",
    };
  }
  if (normalized === "ready") {
    return {
      bg: "bg-blue-600",
      text: "text-blue-600",
      border: "border-blue-600",
      lightBg: "bg-blue-50",
    };
  }
  return {
    bg: "bg-[#2E7D32]", // Material Green
    text: "text-[#2E7D32]",
    border: "border-[#2E7D32]",
    lightBg: "bg-green-50",
  };
};

const getItemName = (item) =>
  item?.name ||
  item?.title ||
  item?.menuItem?.name ||
  item?.item?.name ||
  item?.product?.name ||
  "Item";

const getItemQuantity = (item) => {
  const quantity = Number(item?.quantity ?? item?.qty ?? item?.count ?? 1);
  return Number.isFinite(quantity) ? Math.max(1, quantity) : 1;
};

 const KitchenDisplayCard = ({
   order,
   isDarkMode,
   isNewOrder,
   updateOrder,
   onStatusReady,
   onDismiss,
 }) => {
   const [toggleItemReady] = useToggleItemReadyMutation();
   const orderId = getOrderIdValue(order) || "-";
   const orderIdShort = getOrderIdShortValue(order) || orderId;
   const createdAtMs = order?.createdAt ? new Date(order.createdAt).getTime() : Date.now();

   const formattedAcceptedTime = new Date(createdAtMs).toLocaleTimeString([], {
     hour: "2-digit",
     minute: "2-digit",
     hour12: true,
   });

   const status = String(order?.status || "pending").trim().toLowerCase();
   const colors = getStatusColors(status);
   const items = useMemo(() => getOrderItemsList(order), [order]);

   const orderTypeKey = getOrderTypeKey(order?.orderType);
   const orderTypeLabel = getOrderTypeLabel(order?.orderType);
   const customerName = getOrderCustomerName(order);
   const tableId = formatOrderTableId(
     order?.tableId ||
       order?.table ||
       order?.tableNumber ||
       order?.table?.name ||
       order?.table?.tableNumber ||
       order?.table?.number
   );

    const displayOrderType =
      orderTypeKey === "eat_here" && tableId
        ? `${orderTypeLabel} • Table ${tableId}`
        : orderTypeLabel;

    // Timer for elapsed time calculation
    const [nowMs, setNowMs] = useState(Date.now());
    const preparingStartedAtMs = useMemo(() => getOrderPreparingStartedAt(order), [order]);
    const preparingElapsedMs = (status === "preparing" || status === "ready") && preparingStartedAtMs ? Math.max(0, nowMs - preparingStartedAtMs) : 0;

    useEffect(() => {
      const timerId = window.setInterval(() => setNowMs(Date.now()), 1000);
      return () => window.clearInterval(timerId);
    }, []);

    // Optimistic overrides for item ready state (key: itemId, value: isReady)
    // Empty means use server state from order.items
    const [itemOverrides, setItemOverrides] = useState({});
    const [togglingItems, setTogglingItems] = useState(new Set());

    // Cleanup overrides that have been confirmed by server or are stale
    useEffect(() => {
      if (!order?.items) return;

      setItemOverrides(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
          if (togglingItems.has(key)) return; // still pending, keep override
          const serverItem = order.items.find(i => i._id === key);
          if (serverItem) {
            const serverReady = !!serverItem.isReady;
            if (next[key] === serverReady) {
              delete next[key];
              changed = true;
            } else {
              // Server state differs; remove override to use server truth
              delete next[key];
              changed = true;
            }
          } else {
            // Item no longer in order, clean up
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, [order?.items, order?.updatedAt, togglingItems]);

    const itemRows = useMemo(() => items
      .filter(item => item?._id) // Only include items with _id
      .map((item, index) => {
        const variant = String(item?.variantName || item?.variant || "").trim();
        const name = getItemName(item);

        return {
          itemId: item._id,
          itemName: variant ? `${name} (${variant})` : name,
          itemCustomization: getItemCustomizationText(item),
          itemKitchenNote: item?.specialInstructions || item?.notes || "",
          quantity: getItemQuantity(item),
          // Use override if present, else server state
          isReady: itemOverrides[item._id] !== undefined ? itemOverrides[item._id] : !!item.isReady,
          isToggling: togglingItems.has(item._id),
        };
      }), [items, togglingItems, itemOverrides]);

  const allItemsReady = itemRows.length > 0 && itemRows.every(item => item.isReady);

  const handleStatusToggle = async () => {
    if (status === "pending") {
      const success = await updateOrder(orderId, { status: "preparing" });
      if (success) {
        broadcastOrderStatus(orderId, "preparing");
      } else {
        console.error("Failed to update order status");
      }
    }
    else if (status === "preparing") {
      const success = await updateOrder(orderId, { status: "ready" });
      if (success) {
        broadcastOrderStatus(orderId, "ready");
        onStatusReady?.();
      } else {
        console.error("Failed to update order status to ready");
      }
    }
    else if (status === "ready") {
      // Ready orders are waiting for admin completion
    }
  };

    const toggleReady = async (itemId) => {
      if (togglingItems.has(itemId)) return; // Prevent double-clicks

      const currentItem = itemRows.find(i => i.itemId === itemId);
      if (!currentItem) return;

      // Get current effective ready state (considering overrides)
      const currentIsReady = itemOverrides[itemId] !== undefined ? itemOverrides[itemId] : !!currentItem.isReady;
      const newIsReady = !currentIsReady;

      // Optimistic override update for instant UI feedback
      setItemOverrides(prev => ({
        ...prev,
        [itemId]: newIsReady
      }));

      // Add to toggling set to show loading state
      setTogglingItems(prev => new Set(prev).add(itemId));

      try {
        await toggleItemReady({ orderId, itemId }).unwrap();
        // Broadcast to other tabs/windows
        broadcastItemReady(orderId, itemId, newIsReady);
      } catch (err) {
        // Revert override on error
        setItemOverrides(prev => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
        console.error("Failed to toggle item ready status", err);
      } finally {
        // Remove from toggling set
        setTogglingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
    };

    useEffect(() => {
      const cleanup = listenForItemReady(({ orderId: broadcastOrderId, itemId: broadcastItemId, isReady: newIsReady }) => {
        if (String(broadcastOrderId) === String(orderId) && broadcastItemId) {
          // Update override immediately for cross-tab sync
          setItemOverrides(prev => ({
            ...prev,
            [broadcastItemId]: newIsReady
          }));
        }
      });
      return cleanup;
    }, [orderId]);

   // Listen for order status changes from other tabs (e.g., BillPage)
   useEffect(() => {
     const cleanup = listenForOrderStatus(({ orderId: broadcastOrderId, status: newStatus }) => {
       if (String(broadcastOrderId) === String(orderId)) {
         // Trigger a local update by calling updateOrder optimistically
         // The actual update will be confirmed via SSE
         if (String(newStatus) !== String(status)) {
           // Update local UI immediately via the parent's SSE handling or force a re-render
           // Since order prop comes from parent, we rely on parent SSE update
           // But we can also trigger a manual refetch if needed
           window.dispatchEvent(new CustomEvent("order-status-changed", { 
             detail: { orderId: broadcastOrderId, status: newStatus } 
           }));
         }
       }
     });
     return cleanup;
   }, [orderId, status]);

    // When order status becomes "ready", mark all items as ready
    useEffect(() => {
      if (status === "ready" && order?.items?.length) {
        // Use server state to determine items that need marking, avoid items already optimistically ready
        const itemsToMark = order.items.filter(item => 
          item._id && 
          !item.isReady && 
          itemOverrides[item._id] !== true
        );

        itemsToMark.forEach(item => {
          const itemId = item._id;
          if (togglingItems.has(itemId)) return;

          // Set optimistic override
          setItemOverrides(prev => ({ ...prev, [itemId]: true }));
          setTogglingItems(prev => new Set(prev).add(itemId));

          toggleItemReady({ orderId, itemId }).unwrap()
            .then(() => {
              broadcastItemReady(orderId, itemId, true);
            })
            .catch(err => {
              console.error("Failed to mark item ready", err);
              setItemOverrides(prev => {
                const next = { ...prev };
                delete next[itemId];
                return next;
              });
            })
            .finally(() => {
              setTogglingItems(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
              });
            });
        });
      }
    }, [status, orderId, order?.items, itemOverrides, toggleItemReady, broadcastItemReady]);

    // Cleanup: Remove overrides that are confirmed by server or are outdated
    useEffect(() => {
      if (!order?.items) return;

      setItemOverrides(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
          // Skip items that are currently being toggled (pending)
          if (togglingItems.has(key)) return;
          const serverItem = order.items.find(i => i._id === key);
          if (serverItem) {
            const serverReady = !!serverItem.isReady;
            if (next[key] === serverReady) {
              delete next[key];
              changed = true;
            }
            // else: override differs from server, keep it until server confirms
          } else {
            // Item no longer exists in order
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, [order?.items, order?.updatedAt, togglingItems]);






  return (
    <div className={`flex flex-col h-fit overflow-hidden rounded-lg border-2 ${colors.border} bg-white shadow-md ${status === "ready" ? "ring-2 ring-blue-400 ring-opacity-50 shadow-blue-200/50" : ""}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 ${colors.bg} text-white shrink-0 ${status === "ready" ? "bg-gradient-to-r from-blue-500 to-blue-600" : ""}`}>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black tracking-wider uppercase">ID: {orderIdShort}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
              {displayOrderType}
            </span>
            {status === "ready" && (
              <span className="bg-green-500 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest animate-pulse">
                READY
              </span>
            )}
          </div>
          {customerName && (
            <span className="text-[11px] font-bold truncate mt-0.5 opacity-90 uppercase">
              NAME: {customerName}
            </span>
          )}
        </div>
      </div>

      {/* Content - No internal scroll, expands height */}
      <div className="flex-1 p-3 space-y-5">
        {itemRows.map((item, idx) => {
          const isFullyDone = item.isReady;
          const isLoading = item.isToggling;

          // Only show items that have _id (saved to database)
          if (!item.itemId) return null;

          return (
            <div key={idx} className="pb-2 border-b border-slate-50 last:border-0">
              <div className="flex items-start gap-3">
                {/* Checkbox (Left Side) */}
                <div className="shrink-0">
                  <div
                    onClick={() => !isLoading && toggleReady(item.itemId)}
                    className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-all ${
                      isLoading
                        ? "border-slate-400 bg-slate-100 cursor-not-allowed"
                        : isFullyDone
                        ? `${colors.bg} ${colors.border} text-white shadow-sm cursor-pointer`
                        : "border-slate-300 bg-white hover:border-slate-400 cursor-pointer"
                    }`}
                  >
                    {isLoading ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                    ) : (
                      isFullyDone && <Check size={14} strokeWidth={4} />
                    )}
                  </div>
                </div>

                {/* Item Name and Info */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => toggleReady(item.itemId)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-[15px] font-bold leading-tight break-words overflow-hidden transition-all ${
                      isFullyDone ? "text-slate-400 line-through" : "text-slate-800"
                    }`}>
                      {item.itemName}
                    </h4>
                    <div className={`${colors.bg} text-white text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0`}>
                      <span>x</span>
                      <span>{item.quantity}</span>
                    </div>
                  </div>

                  {item.itemCustomization && (
                    <p className={`text-[13px] mt-1 leading-relaxed transition-all break-all ${
                      isFullyDone ? "text-slate-300" : "text-slate-500"
                    }`}>
                      <span className="font-black uppercase text-[11px] mr-1">Note:</span>
                      {item.itemCustomization}
                    </p>
                  )}
                  {item.itemKitchenNote && (
                    <p className={`text-[13px] font-medium mt-1 italic transition-all break-all ${
                      isFullyDone ? "text-slate-300" : "text-orange-600"
                    }`}>
                      <span className="font-black uppercase text-[11px] not-italic mr-1">Instruction:</span>
                      {item.itemKitchenNote}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className={`px-3 py-2 border-t ${colors.bg} bg-opacity-90 flex justify-between items-center text-[10px] font-black uppercase tracking-tight text-white`}>
        <div className="flex flex-col">
          <span className="opacity-70">Accepted At</span>
          <span>{formattedAcceptedTime}</span>
        </div>
        {(status === "preparing" || status === "ready") && (
          <div className="flex flex-col text-right">
            <span className="opacity-70">Delayed By</span>
            <span>{Math.floor(preparingElapsedMs / 60000)}mins</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="p-2 bg-white">
        <button
          onClick={handleStatusToggle}
          disabled={status === "ready"}
          className={`w-full py-2.5 rounded border-2 ${colors.border} ${colors.text} text-[12px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors ${status === "ready" ? "opacity-50 cursor-not-allowed bg-blue-50 border-blue-300 text-blue-600" : ""}`}
        >
          {status === "pending" ? "Start Preparing" : status === "preparing" ? "Mark as Ready" : "Ready for Pickup"}
        </button>
      </div>
    </div>
  );
};

export default KitchenDisplayCard;
