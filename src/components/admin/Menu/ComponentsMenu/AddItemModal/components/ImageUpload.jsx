import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import ErrorDisplay from "./ErrorDisplay";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_KB } from "../../../Lib/constants";

const ImageUpload = ({ addFile, addFileError, handleFileChange }) => {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">
        Product Image
      </label>
      <label className="cursor-pointer">
        <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center bg-gray-50">
          <input
            type="file"
            className="hidden"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleFileChange}
          />
          <p className="text-sm">
            {addFile ? addFile.name : "Click to upload image"}
          </p>
          <p className="text-xs text-gray-500">
            Max {MAX_IMAGE_KB}KB
          </p>
        </div>
      </label>

      {addFile && !addFileError && (
        <p className="text-xs text-green-600 mt-2 flex gap-1">
          <CheckCircleIcon className="w-4 h-4" />
          Selected ({(addFile.size / 1024).toFixed(1)} KB)
        </p>
      )}

      {addFileError && (
        <ErrorDisplay error={addFileError} type="form" />
      )}
    </div>
  );
};

export default ImageUpload;