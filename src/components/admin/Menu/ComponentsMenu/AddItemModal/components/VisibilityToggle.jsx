import React from "react";
import { useSelector } from "react-redux";

const VisibilityToggle = ({ visibility, handleChange }) => {
  const isPublic = visibility === "PUBLIC" || !visibility;
  const colors = useSelector((state) => state.admin.theme.colors);

  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#ede8e3] bg-[#f7f3ef] px-3 py-2.5 transition-colors hover:bg-[#ede8e3] w-max dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-700">
      <input
        type="checkbox"
        name="visibility"
        checked={isPublic}
        onChange={(e) => {
          const nextVal = e.target.checked ? "PUBLIC" : "ADMIN";
          handleChange({
            target: {
              name: "visibility",
              value: nextVal,
            },
          });
        }}
        className="h-4 w-4"
        style={{ accentColor: colors.primary }}
      />
      <span className="text-sm font-semibold text-[#1c1917] dark:text-slate-100">
        Show on Client Menu (Public)
      </span>
    </label>
  );
};

export default VisibilityToggle;
