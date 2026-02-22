import { XCircleIcon } from "@heroicons/react/24/solid";

const ModalHeader = ({ itemName, onClose }) => (
  <div className="flex items-center justify-between mb-6 border-b border-orange-500 pb-4">
    <h3 className="text-xl font-semibold text-gray-800 flex flex-row items-center gap-2">
      Edit <span className="text-orange-500">({itemName})</span>
    </h3>
    <button
      type="button"
      onClick={onClose}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-orange-100 hover:text-gray-700"
      aria-label="Close modal"
    >
      <XCircleIcon className="h-6 w-6" />
    </button>
  </div>
);

export default ModalHeader;
