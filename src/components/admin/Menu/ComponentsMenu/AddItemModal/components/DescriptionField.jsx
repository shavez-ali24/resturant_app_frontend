import React from "react";

const DescriptionField = ({ value, onChange, error }) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        Description
      </label>
      <textarea
        name="description"
        value={value}
        onChange={onChange}
        rows={3}
        className={`w-full rounded-xl border p-3 text-sm shadow-sm outline-none transition-all ${error ? "border-red-500 bg-red-50" : "border-orange-200 bg-white hover:border-orange-300"} focus:border-orange-400 focus:ring-2 focus:ring-orange-200`}
        placeholder="Write product description..."
      />
      {error && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default DescriptionField;
