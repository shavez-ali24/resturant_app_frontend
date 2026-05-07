import React from "react";

export default function UpdateFormActions({ onClose, isSubmitting, fileError }) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="h-9 w-full rounded-lg border border-[#ede8e3] bg-white px-4 text-sm font-semibold text-[#78716c] transition-colors hover:bg-[#f7f3ef] hover:text-[#1c1917] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 sm:w-auto"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={isSubmitting || !!fileError}
        className="h-9 w-full rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isSubmitting ? "Updating..." : "Update Profile"}
      </button>
    </div>
  );
}
