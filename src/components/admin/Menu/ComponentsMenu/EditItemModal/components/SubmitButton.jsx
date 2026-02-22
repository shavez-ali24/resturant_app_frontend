import React from "react";

const SubmitButton = ({ isSubmitting, onClose, submitText = "Save Changes" }) => (
  <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
    <button
      type="button"
      onClick={onClose}
      className="h-11 w-full rounded-xl bg-orange-100 px-4 text-sm font-semibold text-gray-800 transition-colors hover:bg-orange-200 sm:w-auto"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={isSubmitting}
      className="h-11 w-full rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {isSubmitting ? "Saving..." : submitText}
    </button>
  </div>
);

export default SubmitButton;
