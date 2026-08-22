/**
 * KOTSlip.jsx — Kitchen Order Ticket print component.
 * Shows: restaurant name, Order ID, Name, Type (with section/number), time,
 * items with quantity. All text dark for clean print.
 */

import React, { useMemo } from "react";

const KOTSlip = ({ order, restaurantDetails }) => {
  const restaurantName =
    restaurantDetails?.restaurantName ||
    restaurantDetails?.name ||
    "Restaurant Name";

  const typeInfo = useMemo(() => {
    const orderType = order?.orderType || "";
    const section = order?.source?.section;
    const number = order?.source?.number;
    if (section && number != null) {
      const labels = { indoor: "Indoor", outdoor: "Outdoor", rooftop: "Rooftop", rooms: "Room" };
      const secLabel = labels[section] || (String(section).charAt(0).toUpperCase() + String(section).slice(1));
      const unit = order?.source?.type === "ROOM" ? "" : "Table";
      const loc = unit ? `${secLabel} ${unit} ${number}` : `${secLabel} ${number}`;
      return `${orderType} · ${loc}`;
    }
    return orderType || "N/A";
  }, [order?.orderType, order?.source]);

  const orderId = order?.orderId || order?._id?.slice(-4) || "N/A";

  const formattedTime = useMemo(() => {
    if (!order?.createdAt) return "N/A";
    const date = new Date(order.createdAt);
    return isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleString("en-IN", { hour12: true });
  }, [order?.createdAt]);

  return (
    <div className="p-6 text-sm" style={{ fontFamily: "monospace", color: "#000" }}>
      {/* Restaurant Header */}
      <div className="mb-4 text-center">
        <h2 className="text-lg font-bold uppercase tracking-wide text-black">{restaurantName}</h2>
        <hr className="mx-auto my-2 w-3/4 border-black" />
        <p className="text-xs font-semibold uppercase tracking-wider text-black">
          Kitchen Order Ticket
        </p>
      </div>

      {/* Order Info */}
      <div className="mb-3 border-t border-b border-dashed border-black py-2 text-xs text-black">
        <div className="flex justify-between">
          <span className="font-semibold">Order ID</span>
          <span>{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Name</span>
          <span>{order?.customerName || "Guest"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Type</span>
          <span>{typeInfo}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Time</span>
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Items */}
      <table className="mb-3 w-full text-xs text-black">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1 text-left font-semibold">Item</th>
            <th className="py-1 text-right font-semibold">Qty</th>
          </tr>
        </thead>
        <tbody>
          {(order?.items || []).map((item, i) => (
            <tr key={i} className="border-b border-dotted border-black">
              <td className="py-1 text-black">
                {item.name || item.menuItem?.name || "Item"}
                {(item.variant || item.variantName) && (
                  <span className="ml-1 text-black">
                    ({item.variant || item.variantName})
                  </span>
                )}
              </td>
              <td className="py-1 text-right font-medium text-black">{item.quantity || 1}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(KOTSlip);