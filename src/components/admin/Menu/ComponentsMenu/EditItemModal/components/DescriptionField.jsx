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
      className={`w-full border ${error ? 'border-red-500' : 'border-orange-500'} rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-colors ${
        error ? 'bg-red-50' : 'bg-orange-50 hover:bg-orange-100'
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