import React, { useEffect, useMemo } from "react";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_KB } from "../../../Lib/constants";

const ImageUpload = ({ imageFile, currentImage, imageError, handleFileChange, isEditMode = false }) => {
  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const finalImageUrl =
    previewUrl || currentImage || "https://placehold.co/300x200?text=No+Image";

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        Product Image {isEditMode && "(Optional)"}
      </label>

      <label
        className={`
          block w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors
          ${imageError ? "border-red-500 bg-red-50" : "border-orange-300 bg-orange-50/60 hover:bg-orange-100/60"}
        `}
      >
        <div className="relative h-44 w-full sm:h-48">
          <img
            src={finalImageUrl}
            alt="Preview"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-x-0 bottom-0 bg-black/45 px-3 py-2 text-center text-xs font-semibold text-white">
            {isEditMode ? "Click to replace file" : "Click to upload file"}
          </div>
        </div>

        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={ALLOWED_IMAGE_TYPES.join(",")}
        />
      </label>

      <p className="mt-0.5 text-xs text-gray-500">Max {MAX_IMAGE_KB}KB</p>

      {imageFile && !imageError && (
        <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
          <CheckCircleIcon className="h-4 w-4" />
          {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
        </p>
      )}

      <p className="text-xs text-gray-500">
        {isEditMode
          ? "Select a new file to replace the current file."
          : "Upload a file for the product."}
      </p>

      {imageError && (
        <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
          <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
          {imageError}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
