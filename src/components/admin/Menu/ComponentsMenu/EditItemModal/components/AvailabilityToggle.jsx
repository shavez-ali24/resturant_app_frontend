import React from "react";

const AvailabilityToggle = ({ available, handleChange }) => (
  <label className="flex items-center gap-3 cursor-pointer p-3 bg-orange-50 rounded-lg border border-orange-500 w-max hover:bg-orange-100 transition-colors">
    <input
      type="checkbox"
      name="available"
      checked={available || false}
      onChange={handleChange}
      className="w-5 h-5 accent-orange-500"
    />
    <span className="text-sm font-semibold text-gray-700">
      Available
    </span>
  </label>
);

export default AvailabilityToggle;