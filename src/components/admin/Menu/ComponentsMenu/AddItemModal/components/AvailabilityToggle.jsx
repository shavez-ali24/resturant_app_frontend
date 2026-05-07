import React from "react";

const AvailabilityToggle = ({ available, handleChange }) => {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#ede8e3] bg-[#f7f3ef] px-3 py-2.5 transition-colors hover:bg-[#ede8e3] w-max dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-700">
      <input
        type="checkbox"
        name="available"
        checked={available}
        onChange={handleChange}
        className="h-4 w-4 accent-orange-500"
      />
      <span className="text-sm font-semibold text-[#1c1917] dark:text-slate-100">Available</span>
    </label>
  );
};

export default AvailabilityToggle;
