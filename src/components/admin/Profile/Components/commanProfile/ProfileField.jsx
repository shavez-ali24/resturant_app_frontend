import React from "react";

export const ProfileField = ({ label, value, icon }) => (
    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
        <div className="flex items-center gap-2 mb-1">
            {icon && <span className="text-orange-600">{icon}</span>}
            <label className="text-xs font-medium text-orange-600 uppercase tracking-wide">{label}</label>
        </div>
        <p className="text-sm font-semibold text-gray-900">{value || "N/A"}</p>
    </div>
);
