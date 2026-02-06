import { ExclamationCircleIcon } from "@heroicons/react/24/solid";

const ErrorDisplay = ({ error }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-600 flex items-center gap-2">
      <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium">Error: {error}</span>
    </p>
  </div>
);

export default ErrorDisplay;