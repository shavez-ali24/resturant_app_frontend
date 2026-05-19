/**
 * OrderDetailView.jsx — Detail view.
 * Shows: item name + qty + who added it (role badge) + filter buttons.
 * Fully responsive for mobile & laptop.
 */

import { useState, useEffect, useMemo } from "react";
import { X, Filter } from "lucide-react";

const ROLE_COLORS = {
  admin: { border: "border-l-orange-500", bg: "bg-orange-50/30", label: "Admin", badge: "bg-orange-100 text-orange-700 border-orange-200" },
  staff: { border: "border-l-blue-500",   bg: "bg-blue-50/30",   label: "Staff", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  user:  { border: "border-l-green-500",  bg: "bg-green-50/30",  label: "User",  badge: "bg-green-100 text-green-700 border-green-200" },
};

function getRoleData(role) {
  return ROLE_COLORS[role?.toLowerCase()] || ROLE_COLORS.user;
}

function getItemRole(item, orderCreatedByRole) {
  return item?.addedByRole || item?.createdByRole || orderCreatedByRole || "user";
}

function getItemName(item) {
  return item?.name || item?.menuItem?.name || "Item";
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "admin", label: "Admin" },
  { key: "staff", label: "Staff" },
  { key: "user", label: "User" },
];

export default function OrderDetailView({ order, restaurantDetails = {}, onClose }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;
    const updateMode = () =>
      setIsDarkMode(
        root.classList.contains("admin-dark") || root.classList.contains("dark")
      );
    updateMode();
    const observer = new MutationObserver(updateMode);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const items = order?.items || [];
  const orderCreatedByRole = order?.createdByRole || "user";

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => {
      const role = getItemRole(item, orderCreatedByRole);
      return role.toLowerCase() === activeFilter;
    });
  }, [items, activeFilter, orderCreatedByRole]);

  const countByRole = useMemo(() => {
    const counts = { all: items.length, admin: 0, staff: 0, user: 0 };
    items.forEach((item) => {
      const role = getItemRole(item, orderCreatedByRole).toLowerCase();
      if (counts[role] !== undefined) counts[role]++;
    });
    return counts;
  }, [items, orderCreatedByRole]);

  return (
    <div className={`relative flex max-h-[85vh] sm:max-h-[90vh] w-full max-w-[95vw] sm:max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-[0_20px_45px_-24px_rgba(249,115,22,0.4)] ${
      isDarkMode
        ? "border-slate-700 bg-[#1e293b] text-slate-100"
        : "border-[#ede8e3] bg-white"
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b px-4 sm:px-6 py-3 sm:py-4 ${
        isDarkMode
          ? "border-slate-700 bg-slate-800/60"
          : "border-[#ede8e3] bg-[#f7f3ef]"
      }`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h3 className={`text-sm sm:text-lg font-semibold truncate ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>
            Order Details
          </h3>
          <span className={`shrink-0 rounded-md border px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-wide ${
            isDarkMode ? "border-slate-600 text-slate-400" : "border-gray-300 text-gray-500"
          }`}>
            #{order?.orderId || order?._id?.slice(-4) || "N/A"}
          </span>
        </div>
        <button
          onClick={onClose}
          className={`shrink-0 rounded-full p-1 sm:p-1.5 transition-colors ${
            isDarkMode
              ? "text-slate-400 hover:bg-slate-800 hover:text-orange-300"
              : "text-gray-400 hover:bg-orange-100 hover:text-orange-700"
          }`}
        >
          <X size={18} className="sm:size-[22px]" />
        </button>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 ${isDarkMode ? "bg-slate-950" : "bg-white"}`}>
        {/* Order summary */}
        <div className={`mb-3 sm:mb-4 flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-1 text-xs sm:text-sm ${
          isDarkMode ? "text-slate-400" : "text-gray-500"
        }`}>
          <span><span className="font-medium">Customer:</span> {order?.customerName || "Guest"}</span>
          <span><span className="font-medium">Type:</span> {order?.orderType || "N/A"}</span>
          <span><span className="font-medium">Time:</span>{" "}
            {order?.createdAt
              ? new Date(order.createdAt).toLocaleTimeString([], { hour12: true })
              : "N/A"}
          </span>
          <span className="capitalize"><span className="font-medium">By:</span> {orderCreatedByRole}</span>
        </div>

        {/* Filter Buttons */}
        <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
          <Filter size={14} className={`shrink-0 sm:size-4 ${isDarkMode ? "text-slate-500" : "text-gray-400"}`} />
          <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider shrink-0 ${
            isDarkMode ? "text-slate-500" : "text-gray-400"
          }`}>
            Filter:
          </span>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto">
            {FILTERS.map(({ key, label }) => {
              const isActive = activeFilter === key;
              const count = countByRole[key] || 0;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`shrink-0 rounded-lg border px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                      : isDarkMode
                        ? "border-slate-600 bg-slate-800 text-slate-300 hover:border-orange-400 hover:text-orange-300"
                        : "border-gray-200 bg-white text-gray-600 hover:border-orange-400 hover:text-orange-600"
                  }`}
                >
                  {label}
                  <span className={`ml-1 sm:ml-1.5 text-[10px] sm:text-xs ${
                    isActive ? "text-white/70" : isDarkMode ? "text-slate-500" : "text-gray-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Items list */}
        <div className="max-h-[300px] sm:max-h-[450px] overflow-y-auto space-y-1.5 sm:space-y-2">
          {filteredItems.length === 0 ? (
            <div className={`py-10 sm:py-12 text-center text-xs sm:text-sm ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
              No items found for this filter.
            </div>
          ) : (
            filteredItems.map((item, i) => {
              const role = getItemRole(item, orderCreatedByRole);
              const { border, bg, badge } = getRoleData(role);
              const itemVariant = item.variant || item.variantName;
              const itemQty = item.quantity || 1;

              return (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-2 sm:gap-4 border-l-4 rounded-lg py-2 sm:py-3 px-3 sm:px-4 ${border} ${bg}`}
                >
                  {/* Left: item name + qty + variant */}
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-1.5 sm:gap-2 flex-wrap`}>
                      <span className={`text-sm sm:text-base font-medium truncate ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
                        {getItemName(item)}
                      </span>
                      <span className={`text-xs sm:text-sm font-semibold shrink-0 ${
                        isDarkMode ? "text-slate-300" : "text-gray-700"
                      }`}>
                        ×{itemQty}
                      </span>
                    </div>
                    {itemVariant && (
                      <span className={`text-[11px] sm:text-sm ${isDarkMode ? "text-slate-400" : "text-gray-400"}`}>
                        ({itemVariant})
                      </span>
                    )}
                    {item.customizations && (
                      <div className={`text-[11px] sm:text-sm mt-0.5 truncate ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
                        {item.customizations}
                      </div>
                    )}
                  </div>

                  {/* Right: role badge */}
                  <span className={`shrink-0 rounded-lg border px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-sm font-semibold capitalize ${badge}`}>
                    {role}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        {filteredItems.length > 0 && filteredItems.length < items.length && (
          <div className={`mt-3 sm:mt-4 border-t pt-2 sm:pt-3 text-right text-xs sm:text-sm ${
            isDarkMode ? "border-slate-700 text-slate-500" : "border-gray-100 text-gray-400"
          }`}>
            Showing {filteredItems.length} of {items.length} items
          </div>
        )}

        {/* Total items count */}
        <div className={`mt-3 sm:mt-4 border-t pt-2 sm:pt-3 text-center text-xs sm:text-sm ${
          isDarkMode ? "border-slate-700 text-slate-500" : "border-gray-100 text-gray-400"
        }`}>
          Total {items.length} item{items.length !== 1 ? "s" : ""} in this order
        </div>
      </div>

      {/* Footer */}
      <div className={`flex justify-end border-t px-4 sm:px-6 py-2 sm:py-3 ${
        isDarkMode
          ? "border-slate-700 bg-slate-800/40"
          : "border-[#ede8e3] bg-[#f7f3ef]"
      }`}>
        <button
          onClick={onClose}
          className={`h-8 sm:h-10 rounded-lg border px-4 sm:px-6 text-xs sm:text-sm font-semibold transition-colors ${
            isDarkMode
              ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"
          }`}
        >
          Close
        </button>
      </div>
    </div>
  );
}