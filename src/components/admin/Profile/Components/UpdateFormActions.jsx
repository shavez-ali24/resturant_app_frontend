import React from "react";

export default function UpdateFormActions({ onClose, isSubmitting, fileError }) {
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
        disabled={isSubmitting || !!fileError}
        className="h-11 w-full rounded-xl border border-orange-200 bg-[#fff8f5] px-5 text-sm font-black text-orange-700 transition-all duration-200 hover:bg-[#ffedd5] hover:border-orange-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400 dark:hover:bg-orange-950/40 sm:w-auto shadow-sm active:scale-[0.98]"
      >
        {isSubmitting ? "Updating..." : "Update Profile"}
      </button>
    </div>
  );
}
