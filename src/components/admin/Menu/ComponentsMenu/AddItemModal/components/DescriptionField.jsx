import React from "react";

const DescriptionField = ({ value, onChange, error }) => {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#a8a29e] dark:text-slate-500">
        Description
      </label>
      <textarea
        name="description"
        value={value}
        onChange={onChange}
        rows={3}
        className={`w-full rounded-lg border p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-500/20 resize-none ${
          error
            ? "border-red-400 bg-red-50 focus:border-red-400 dark:bg-red-900/20 dark:border-red-500"
            : "border-[#ede8e3] bg-white text-[#1c1917] placeholder-[#a8a29e] hover:border-[#d6cfc8] focus:border-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:hover:border-slate-600 dark:focus:border-orange-500"
        }`}
        placeholder="Write product description..."
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default DescriptionField;
