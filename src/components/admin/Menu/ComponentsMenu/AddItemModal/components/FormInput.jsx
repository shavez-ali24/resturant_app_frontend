import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

const FormInput = ({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  type = "text",
  placeholder, 
  required = false,
  icon,
  ...props 
}) => {
  const hasError = !!error;
  
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label} {required && "*"}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full border ${hasError ? "border-red-500" : "border-orange-500"} rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-orange-50 text-sm ${icon ? "pl-10" : ""}`}
          placeholder={placeholder}
          {...props}
        />
        {icon && (
          <div className="absolute left-3 top-3.5 text-gray-500">
            {icon}
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;