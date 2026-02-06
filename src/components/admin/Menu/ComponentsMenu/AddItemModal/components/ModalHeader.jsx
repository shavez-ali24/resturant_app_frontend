import React from "react";
import { Pizza } from "lucide-react";
import { XCircleIcon } from "@heroicons/react/24/solid";

const ModalHeader = ({ onClose }) => {
  return (
    <div className="flex items-center gap-3 mb-6 border-b border-orange-500 pb-4">
      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
        <Pizza className="text-white text-xl" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
        <p className="text-sm text-gray-500">Create a new menu item.</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-auto text-gray-400 hover:text-gray-600"
      >
        <XCircleIcon className="w-7 h-7" />
      </button>
    </div>
  );
};

export default ModalHeader;