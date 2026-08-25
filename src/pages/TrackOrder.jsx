"use client";

import { useState, useEffect, useRef } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  useGetOrdersByFingerprintQuery,
} from "../redux/clientRedux/clientAPI";
import { ArrowLeft, Package, Clock, ChevronRight, Wifi, WifiOff } from "lucide-react";
import fingerprintService from "@/service/fingerprintService";
import config from "@/config";
import { SSEConnectionManager } from "@/utils/sseConnectionManager";
import { getFriendlyErrorMessage } from "@/utils/errorHelpers";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  preparing: "bg-orange-100 text-orange-800 border-orange-200",
  ready: "bg-green-100 text-green-800 border-green-200",
  billed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  billed: "Billed",
  completed: "Completed",
  cancelled: "Cancelled",
};

function getFingerprint() {
  return fingerprintService.getFingerprint();
}

export default function TrackOrder() {
  const outletContext = useOutletContext() || {};
  const isDarkMode = Boolean(outletContext?.isDarkMode);

  const [fingerPrint, setFingerPrint] = useState(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [, setSseVersion] = useState(0); // Used to trigger re-renders on map changes
  
  const sseUpdatesRef = useRef(new Map());
  const sseManagerRef = useRef(null);

  useEffect(() => {
    getFingerprint().then(setFingerPrint);
  }, []);

  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useGetOrdersByFingerprintQuery(
    { fingerPrint },
    { skip: !fingerPrint }
  );

  // SSE connection for live updates
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!fingerPrint || !config?.BASE_URL) return undefined;

    const baseUrl = String(config.BASE_URL).replace(/\/$/, "");
    const sseUrl = `${baseUrl}/api/notifications?fingerPrint=${encodeURIComponent(fingerPrint)}`;

    sseManagerRef.current = new SSEConnectionManager({
      url: sseUrl,
      onConnectionChange: (connected) => {
        setSseConnected(connected);
        if (connected) {
          refetch(); // Refetch REST API as the source of truth on reconnect
        }
      },
      onMessage: (event) => {
        if (!event?.data) return;
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }
        
        // Ignore handshake
        if (!payload || payload.type === "CONNECTED") return;

        // Process ORDER_UPDATED events
        if (payload.type === "ORDER_UPDATED" && payload.data) {
          const orderId = payload.data._id || payload.data.id || payload.data.orderId;
          if (!orderId) return;

          // Set update in persistent Map
          sseUpdatesRef.current.set(String(orderId), payload.data);
          setSseVersion((v) => v + 1); // Trigger UI sync
        }
      },
    });

    sseManagerRef.current.connect();

    return () => {
      if (sseManagerRef.current) {
        sseManagerRef.current.destroy();
        sseManagerRef.current = null;
      }
      setSseConnected(false);
    };
  }, [fingerPrint, refetch]);

  // Merge SSE updates into API orders
  const mergedOrders = orders.map((order) => {
    const orderIdStr = String(order._id || order.id || order.orderId || "");
    const sseUpdate = sseUpdatesRef.current.get(orderIdStr);
    return sseUpdate ? { ...order, ...sseUpdate } : order;
  });

  // Sort by createdAt chronologically (latest first) and pick latest 2
  const recentOrders = [...mergedOrders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 2);

  if (isLoading || !fingerPrint) {
    return (
      <div className={`flex min-h-[80dvh] items-center justify-center ${isDarkMode ? "text-slate-400" : "text-gray-400"}`}>
        <div className="flex flex-col items-center gap-3">
          <Package className="h-10 w-10 animate-pulse text-orange-500" />
          <p className="text-sm font-semibold">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex min-h-[80dvh] flex-col items-center justify-center gap-3 px-6 text-center ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
        <Package className="h-12 w-12 text-orange-400" />
        <p className="text-base font-bold">Could not load orders</p>
        <p className="text-sm opacity-70">
          {getFriendlyErrorMessage(error, "We couldn't load your active orders right now. Please check your internet connection.")}
        </p>
        <Link
          to="/"
          className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${isDarkMode
            ? "bg-orange-600 text-white hover:bg-orange-500"
            : "bg-orange-50 text-white hover:bg-orange-600"
            }`}
        >
          <ArrowLeft size={16} />
          Back to Menu
        </Link>
      </div>
    );
  }

  if (recentOrders.length === 0) {
    return (
      <div className={`flex min-h-[80dvh] flex-col items-center justify-center gap-3 px-6 text-center ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
        <Package className="h-14 w-14 text-orange-300" />
        <p className="text-lg font-bold">No Orders Found</p>
        <p className="max-w-[260px] text-sm opacity-70">
          You haven't placed any orders yet. Browse the menu to get started.
        </p>
        <Link
          to="/"
          className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${isDarkMode
            ? "bg-orange-600 text-white hover:bg-orange-500"
            : "bg-orange-50 text-white hover:bg-orange-600"
            }`}
        >
          Browse Menu
          <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-[520px] px-4 pb-8 pt-4 ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
      {/* Back button */}
      <Link
        to="/"
        className={`mb-4 inline-flex items-center gap-1.5 text-sm font-semibold ${isDarkMode ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-700"
          }`}
      >
        <ArrowLeft size={16} />
        Back to Menu
      </Link>

      <h1 className="mb-5 text-xl font-extrabold">Your Orders</h1>

      {/* SSE live connection indicator */}
      <div className={`mb-4 flex items-center gap-2 text-[11px] font-medium tracking-wide ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
        {sseConnected ? (
          <Wifi size={12} className="text-green-500" />
        ) : (
          <WifiOff size={12} className="text-amber-500" />
        )}
        {sseConnected ? "Live — Connected" : "Reconnecting..."}
      </div>

      <div className="flex flex-col gap-4">
        {recentOrders.map((order) => {
          const orderId = order?._id || order?.id || "";
          const shortId = orderId.length > 6 ? orderId.slice(-6) : orderId;
          let status = (order?.status || "pending").toLowerCase();
          const hasPayment = order?.paymentMethod || (order?.paymentMethods && order.paymentMethods.length > 0);
          if (status === "completed" && !hasPayment) {
            status = "billed";
          }
          const statusColor = statusColors[status] || statusColors.pending;

          return (
            <div
              key={orderId}
              className={`rounded-xl border p-4 shadow-sm ${isDarkMode
                ? "border-slate-700 bg-slate-800/60"
                : "border-gray-200 bg-white"
                }`}
            >
              {/* Header row */}
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-500"
                    }`}
                >
                  #{shortId}
                </span>
                <span
                  className={`rounded-full border px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide ${statusColor}`}
                >
                  {statusLabels[status] || status}
                </span>
              </div>

              {/* Order type + customer name + phone + table */}
              <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span
                  className={`rounded-md px-2 py-0.5 ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-orange-50 text-orange-700"
                    }`}
                >
                  {order?.orderType || "Take Away"}
                </span>
                {(order?.customerName || order?.customerPhone || order?.phone) && (
                  <span
                    className={`rounded-md px-2 py-0.5 ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {order.customerName || "Guest"}{(order.customerPhone || order.phone) ? ` · ${order.customerPhone || order.phone}` : ""}
                  </span>
                )}
                {order?.source?.unitName && (
                  <span
                    className={`rounded-md px-2 py-0.5 ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-blue-50 text-blue-700"
                      }`}
                  >
                    {order.source.unitName}
                    {order.source.sectionName ? ` · ${order.source.sectionName}` : ""}
                  </span>
                )}
              </div>

              {/* Items list */}
              <div className={`mb-3 space-y-1.5 ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
                {(Array.isArray(order?.items) ? order.items : []).map((item, idx) => {
                  const itemId = item?._id || idx;
                  const itemName = item?.name || item?.menuItem?.name || "Item";
                  const qty = item?.quantity || 1;
                  return (
                    <div key={itemId} className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        <span className="mr-1.5 text-xs opacity-60">×{qty}</span>
                        {itemName}
                        {item?.variant && (
                          <span className="ml-1 text-[11px] opacity-50">({item.variant})</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price breakdown */}
              <div className={`space-y-0.5 border-t pt-2 text-xs ${isDarkMode ? "border-slate-700 text-slate-400" : "border-gray-100 text-gray-500"}`}>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{Number(order?.subtotal || 0).toFixed(2)}</span>
                </div>
                {order?.gstRate > 0 && (
                  <div className="flex justify-between">
                    <span>GST ({order.gstRate}%)</span>
                    <span>₹{Number(order?.gstAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                {Number(order?.deliveryCharges) > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>₹{Number(order.deliveryCharges).toFixed(2)}</span>
                  </div>
                )}
                <div className={`flex justify-between border-t pt-1 text-sm font-bold ${isDarkMode ? "border-slate-700 text-slate-100" : "border-gray-100 text-gray-800"}`}>
                  <span>Total</span>
                  <span>₹{Number(order?.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment info */}
              {hasPayment && (
                <div className={`mt-2 rounded-lg px-3 py-1.5 text-center text-xs font-bold ${isDarkMode
                  ? "bg-green-900/40 text-green-300"
                  : "bg-green-50 text-green-700"
                  }`}>
                  Paid via {order.paymentMethods && order.paymentMethods.length > 0 ? order.paymentMethods.map(p => p.method).join(" + ") : order.paymentMethod}
                </div>
              )}

              {/* Timestamp */}
              {order?.createdAt && (
                <div className={`mt-2 text-[10px] font-medium tracking-tight ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
                  {new Date(order.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}