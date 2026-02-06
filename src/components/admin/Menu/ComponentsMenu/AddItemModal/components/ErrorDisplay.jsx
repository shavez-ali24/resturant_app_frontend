import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

const ErrorDisplay = ({ error, type = "backend" }) => {
  if (!error) return null;
  
  return (
    <div className={`mb-4 p-3 ${type === "backend" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"} border rounded-lg`}>
      <p className={`text-sm ${type === "backend" ? "text-red-600" : "text-orange-600"} flex items-center gap-1`}>
        <ExclamationTriangleIcon className="w-4 h-4" />
        {error}
      </p>
    </div>
  );
};

export default ErrorDisplay;