import { XCircleIcon } from "@heroicons/react/24/solid";

const ModalHeader = ({ itemName, onClose }) => (
  <div className="flex items-center justify-between mb-6 border-b border-orange-500 pb-4">
    <h3 className="text-xl font-semibold text-gray-800 flex flex-row items-center gap-2">
      Edit <span className="text-orange-500">({itemName})</span>
    </h3>
    <button
      type="button"
      onClick={onClose}
      className="text-gray-400 hover:text-gray-600"
      aria-label="Close modal"
    >
      <XCircleIcon className="w-7 h-7" />
    </button>
  </div>
);

export default ModalHeader;