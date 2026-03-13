import React, { useEffect, useMemo } from "react";
import { CheckCircleIcon, PhotoIcon } from "@heroicons/react/24/solid";
import ErrorDisplay from "./ErrorDisplay";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_KB } from "../../../Lib/constants";

const ImageUpload = ({ addFile, addFileError, handleFileChange }) => {
  const previewUrl = useMemo(
    () => (addFile ? URL.createObjectURL(addFile) : ""),
    [addFile]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        Product Image
      </label>

      <label
        className={`block w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          addFileError
            ? "border-red-500 bg-red-50"
            : "border-orange-300 bg-orange-50/60 hover:bg-orange-100/60"
        }`}
      >
        <div className="relative h-44 w-full sm:h-48">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="New product preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <PhotoIcon
                className={`h-10 w-10 ${addFileError ? "text-red-400" : "text-orange-300"}`}
              />
              <p className="text-sm font-medium text-gray-500">Image preview will appear here</p>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-black/45 px-3 py-2 text-center text-xs font-semibold text-white">
            {previewUrl ? "Click to replace image" : "Click to upload product image"}
          </div>
        </div>

        <input
          type="file"
          className="hidden"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleFileChange}
        />
      </label>

      <p className="text-xs text-gray-500">Max {MAX_IMAGE_KB}KB</p>

      {addFile && !addFileError && (
        <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
          <CheckCircleIcon className="w-4 h-4" />
          {addFile.name} ({(addFile.size / 1024).toFixed(1)} KB)
        </p>
      )}

      {addFileError && (
        <ErrorDisplay error={addFileError} type="form" />
      )}
    </div>
  );
};

export default ImageUpload;
