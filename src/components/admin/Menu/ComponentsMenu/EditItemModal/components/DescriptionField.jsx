import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";

const DescriptionField = ({ value, onChange, error }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      Description
    </label>
    <textarea
      name="description"
      value={value || ""}
      onChange={onChange}
      className={`w-full rounded-xl border p-3 text-sm shadow-sm outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${
        error ? 'border-red-500 bg-red-50' : 'border-orange-200 bg-white hover:border-orange-300'
      }`}
      placeholder="Enter product description"
      rows="3"
    />
    {error && (
      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
        <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

export default DescriptionField;
