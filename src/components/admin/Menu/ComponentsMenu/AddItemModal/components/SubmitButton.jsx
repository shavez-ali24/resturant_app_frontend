import React from "react";

const SubmitButton = ({ isAddingItem, onClose, submitText = "Add Product" }) => {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="h-11 w-full rounded-xl bg-orange-100 px-4 text-sm font-semibold text-gray-800 transition-colors hover:bg-orange-200 sm:w-auto"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isAddingItem}
        className="h-11 w-full rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isAddingItem ? "Adding..." : submitText}
      </button>
    </div>
  );
};

export default SubmitButton;
