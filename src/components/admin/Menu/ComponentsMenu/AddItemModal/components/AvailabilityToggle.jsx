import React from "react";

const AvailabilityToggle = ({ available, handleChange }) => {
  return (
    <label className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-orange-500 bg-orange-50 px-3 sm:w-max">
      <input
        type="checkbox"
        name="available"
        checked={available}
        onChange={handleChange}
        className="h-4 w-4 accent-orange-500"
      />
      <span className="text-sm font-semibold text-gray-700">
        Available
      </span>
    </label>
  );
};

export default AvailabilityToggle;
