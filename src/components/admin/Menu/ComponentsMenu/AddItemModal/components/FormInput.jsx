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
          className={`h-11 w-full rounded-xl border ${hasError ? "border-red-500 bg-red-50" : "border-orange-200 bg-white hover:border-orange-300"} px-3 text-sm shadow-sm transition-all outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${icon ? "pl-10" : ""}`}
          placeholder={placeholder}
          {...props}
        />
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
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
