import React from "react";

export const OrderModeStatus = ({ label, isEnabled }) => (
    <div className={`flex items-center justify-between p-3 rounded-xl ${isEnabled ? "bg-orange-50 border border-orange-100" : "bg-gray-50 border border-gray-100"}`}>
        <span className={`text-sm font-medium ${isEnabled ? "text-orange-700" : "text-gray-500"}`}>{label}</span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isEnabled ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-500"}`}>
            {isEnabled ? "Active" : "Inactive"}
        </span>
    </div>
);
