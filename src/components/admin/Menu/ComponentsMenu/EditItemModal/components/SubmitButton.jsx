import React from "react";

const SubmitButton = ({ isSubmitting, onClose, submitText = "Save Changes" }) => (
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
      className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {isSubmitting ? "Saving..." : submitText}
    </button>
  </div>
);

export default SubmitButton;
