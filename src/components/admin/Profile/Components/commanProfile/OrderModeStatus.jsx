import React from "react";

export const OrderModeStatus = ({ label, isEnabled }) => (
  <div
    className={`flex items-center justify-between rounded-xl border p-3 ${
      isEnabled ? "border-orange-200 bg-orange-50/70" : "border-gray-200 bg-gray-50"
    }`}
  >
    <span className={`text-sm font-medium ${isEnabled ? "text-orange-700" : "text-gray-600"}`}>
      {label}
    </span>
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isEnabled
          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
          : "bg-gray-200 text-gray-600"
      }`}
    >
      {isEnabled ? "Active" : "Inactive"}
    </span>
  </div>
);
