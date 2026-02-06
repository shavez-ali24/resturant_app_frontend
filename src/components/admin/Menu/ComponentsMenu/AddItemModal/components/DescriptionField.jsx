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
        className={`w-full border ${error ? "border-red-500" : "border-orange-500"} rounded-lg p-3 bg-orange-50 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all`}
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