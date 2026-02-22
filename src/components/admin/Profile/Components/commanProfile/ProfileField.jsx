import React from "react";

export const ProfileField = ({ label, value, icon }) => (
  <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50/80 to-white p-3 shadow-sm">
    <div className="mb-1 flex items-center gap-2">
      {icon && <span className="text-orange-600">{icon}</span>}
      <label className="text-xs font-medium uppercase tracking-wide text-orange-600">{label}</label>
    </div>
    <p className="text-sm font-semibold text-gray-900">{value || "N/A"}</p>
  </div>
);
