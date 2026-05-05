import React from "react";
import { AlertCircle } from "lucide-react";

const FormInput = ({
  label, name, value, onChange, error,
  type = "text", placeholder, required = false, icon, ...props
}) => {
  const hasError = !!error;

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#a8a29e] dark:text-slate-500">
          {label} {required && <span className="text-orange-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`h-10 w-full rounded-lg border px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-500/20 ${
            icon ? "pl-9" : ""
          } ${
            hasError
              ? "border-red-400 bg-red-50 focus:border-red-400 dark:bg-red-900/20 dark:border-red-500"
              : "border-[#ede8e3] bg-white text-[#1c1917] placeholder-[#a8a29e] hover:border-[#d6cfc8] focus:border-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:hover:border-slate-600 dark:focus:border-orange-500"
          }`}
          placeholder={placeholder}
          {...props}
        />
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e] dark:text-slate-500">
            {icon}
          </div>
        )}
      </div>
      {hasError && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
