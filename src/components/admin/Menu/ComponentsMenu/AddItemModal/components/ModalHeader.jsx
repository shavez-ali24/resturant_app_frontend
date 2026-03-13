import React from "react";
import { Pizza } from "lucide-react";
import { XCircleIcon } from "@heroicons/react/24/solid";

const ModalHeader = ({ onClose }) => {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-orange-200 pb-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm">
        <Pizza className="text-white text-xl" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
        <p className="text-sm text-gray-500">Create a new menu item.</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-orange-100 hover:text-orange-700"
        aria-label="Close modal"
      >
        <XCircleIcon className="h-6 w-6" />
      </button>
    </div>
  );
};

export default ModalHeader;
