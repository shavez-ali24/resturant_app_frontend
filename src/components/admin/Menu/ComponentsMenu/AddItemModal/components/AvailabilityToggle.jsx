import React from "react";

const AvailabilityToggle = ({ available, handleChange }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer p-3 bg-orange-50 rounded-lg border border-orange-500 w-max">
      <input
        type="checkbox"
        name="available"
        checked={available}
        onChange={handleChange}
        className="w-4 h-4 accent-orange-500"
      />
      <span className="text-sm font-semibold text-gray-700">
        Available
      </span>
    </label>
  );
};

export default AvailabilityToggle;