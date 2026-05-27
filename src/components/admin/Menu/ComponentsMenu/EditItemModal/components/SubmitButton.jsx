import React from "react";

const SubmitButton = ({ isSubmitting, onClose, submitText = "Save Changes" }) => {
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  return (
    <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
    <button
      type="button"
      onClick={onClose}
      className="h-11 w-full rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 sm:w-auto"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={isSubmitting}
      className={`h-11 w-full rounded-xl border px-4 text-sm font-black transition-all shadow-sm sm:w-auto active:scale-[0.98] ${
        isSubmitting
          ? "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400 opacity-50"
          : isDarkMode
            ? "border-orange-500/35 bg-orange-950/20 text-orange-400 hover:bg-orange-950/40"
            : "border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300"
      }`}
    >
      {isSubmitting ? "Saving..." : submitText}
    </button>
    </div>
  );
};

export default SubmitButton;
