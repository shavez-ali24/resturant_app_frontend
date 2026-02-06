import React from "react";

const SubmitButton = ({ isAddingItem }) => {
  return (
    <div className="mt-6 text-right">
      <button
        type="submit"
        disabled={isAddingItem}
        className="py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAddingItem ? "Adding..." : "Add Product"}
      </button>
    </div>
  );
};

export default SubmitButton;