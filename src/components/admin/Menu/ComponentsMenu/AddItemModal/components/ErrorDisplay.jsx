import React from "react";
import { useSelector } from "react-redux";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

const ErrorDisplay = ({ error, type = "backend" }) => {
  const colors = useSelector((state) => state.admin.theme.colors);
  if (!error) return null;
  
  return (
    <div
      className="mb-4 p-3 border rounded-lg"
      style={{
        backgroundColor: type === "backend" ? "rgb(254, 242, 242)" : colors.primaryLight,
        borderColor: type === "backend" ? "rgb(252, 165, 165)" : `${colors.primary}33`,
      }}
    >
      <p
        className="text-sm flex items-center gap-1"
        style={{
          color: type === "backend" ? "rgb(220, 38, 38)" : colors.primaryText,
        }}
      >
        <ExclamationTriangleIcon className="w-4 h-4" />
        {error}
      </p>
    </div>
  );
};

export default ErrorDisplay;