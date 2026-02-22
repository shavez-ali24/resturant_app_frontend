import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";

const FormInput = ({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  required = false, 
  type = "text",
  placeholder,
  icon,
  inputMode,
  className = "",
  disabled = false
}) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} {required && "*"}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          {icon}
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        inputMode={inputMode}
        className={`h-11 w-full rounded-xl border px-3 text-sm shadow-sm transition-all outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${
          error ? 'border-red-500 bg-red-50' : 'border-orange-200 bg-white hover:border-orange-300'
        } ${icon ? 'pl-10' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        placeholder={placeholder || label}
      />
    </div>
    {error && (
      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
        <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

export default FormInput;
