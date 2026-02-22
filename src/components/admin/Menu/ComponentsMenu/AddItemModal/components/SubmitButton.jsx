import React from "react";

const SubmitButton = ({ isAddingItem, onClose, submitText = "Add Product" }) => {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="h-11 w-full rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 sm:w-auto"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isAddingItem}
        className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isAddingItem ? "Adding..." : submitText}
      </button>
    </div>
  );
};

export default SubmitButton;
