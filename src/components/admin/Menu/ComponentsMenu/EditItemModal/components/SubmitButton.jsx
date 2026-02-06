import React from "react";

const SubmitButton = ({ isSubmitting, onClose, submitText = "Save Changes" }) => (
  <div className="flex justify-end gap-3 pt-4">
    <button
      type="button"
      onClick={onClose}
      className="px-6 py-3 bg-orange-100 text-gray-800 rounded-xl hover:bg-orange-200 transition font-semibold"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={isSubmitting}
      className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? "Saving..." : submitText}
    </button>
  </div>
);

export default SubmitButton;