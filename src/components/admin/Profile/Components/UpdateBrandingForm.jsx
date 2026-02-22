import React, { useEffect, useMemo } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";
import { FormCard } from "./commanProfile/FormCard";

export default function UpdateBrandingForm({
  handleFileChange,
  file,
  fileError,
  currentLogo,
}) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const displayImage = previewUrl || currentLogo || "";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <FormCard title="Branding" customIndex={5}>
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Restaurant Logo
        </label>

        <label
          htmlFor="logo-upload"
          className={`block w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
            fileError
              ? "border-red-500 bg-red-50"
              : "border-orange-300 bg-orange-50/60 hover:bg-orange-100/60"
          }`}
        >
          <div className="relative h-44 w-full sm:h-48">
            {displayImage ? (
              <img
                src={displayImage}
                alt="Restaurant logo preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                <PhotoIcon
                  className={`h-10 w-10 ${fileError ? "text-red-400" : "text-orange-300"}`}
                />
                <p className="text-sm font-medium text-gray-500">
                  Logo preview will appear here
                </p>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-black/45 px-3 py-2 text-center text-xs font-semibold text-white">
              {displayImage ? "Click to replace logo" : "Click to upload logo"}
            </div>
          </div>

          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="logo-upload"
            accept=".jpeg,.jpg,.png,.gif,.webp,.avif,image/*"
          />
        </label>

        <p className="text-xs text-gray-500">JPEG, JPG, PNG up to 300KB</p>

        {file && !fileError && (
          <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <CheckCircleIcon className="h-4 w-4" />
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}

        {fileError && (
          <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
            {fileError}
          </p>
        )}
      </div>
    </FormCard>
  );
}
