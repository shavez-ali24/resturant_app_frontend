import React from "react";

const SubmitButton = ({ isAddingItem, onClose, submitText = "Add Product", loadingText }) => {
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const busyText = loadingText || (submitText === "Save Changes" ? "Saving..." : "Adding...");
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="h-11 w-full rounded-xl border border-[#ede8e3] bg-white px-5 text-sm font-extrabold text-[#57524e] transition-all duration-200 hover:bg-orange-50/40 hover:text-orange-700 hover:border-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 sm:w-auto shadow-sm"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isAddingItem}
        className={`h-11 w-full rounded-xl border px-5 text-sm font-black transition-all duration-200 sm:w-auto shadow-sm active:scale-[0.98] ${
          isAddingItem
            ? "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400 opacity-50"
            : isDarkMode
              ? "border-orange-500/35 bg-orange-950/20 text-orange-400 hover:bg-orange-950/40"
              : "border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300"
        }`}
      >
        {isAddingItem ? busyText : submitText}
      </button>
    </div>
  );
};

export default SubmitButton;
