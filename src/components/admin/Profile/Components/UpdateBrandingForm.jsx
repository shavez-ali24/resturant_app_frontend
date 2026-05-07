import React, { useEffect, useMemo } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";

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
    <div className="flex flex-col gap-2">
      {/* Upload area */}
      <label
        htmlFor="logo-upload"
        className={`relative block w-full cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          fileError
            ? "border-red-400 bg-red-50 dark:bg-red-500/10"
            : "border-[#d6cfc8] bg-[#f7f3ef] hover:border-orange-400 hover:bg-[#fff7ed] dark:border-slate-600 dark:bg-slate-800/60 dark:hover:border-orange-500"
        }`}
      >
        <div className="relative h-40 w-full">
          {displayImage ? (
            <img src={displayImage} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <PhotoIcon className={`h-8 w-8 ${fileError ? "text-red-400" : "text-[#d6cfc8] dark:text-slate-600"}`} />
              <p className="text-xs text-[#a8a29e] dark:text-slate-500">Click to upload</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-black/40 py-0.5 text-center text-[10px] font-medium text-white">
            {displayImage ? "Click to replace" : "Upload logo"}
          </div>
        </div>
        <input type="file" onChange={handleFileChange} className="hidden" id="logo-upload" accept=".jpeg,.jpg,.png,.gif,.webp,.avif,image/*" />
      </label>

      {/* Info below image */}
      <div className="flex flex-col gap-0.5 text-xs">
        <p className="font-semibold text-[#78716c] dark:text-slate-300">Restaurant Logo</p>
        <p className="text-[#a8a29e] dark:text-slate-500">JPEG, PNG, WebP — max 300KB</p>
        {file && !fileError && (
          <p className="flex items-center gap-1 text-green-600">
            <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
        {fileError && (
          <p className="flex items-center gap-1 text-red-600">
            <ExclamationCircleIcon className="h-3.5 w-3.5 shrink-0" />
            {fileError}
          </p>
        )}
      </div>
    </div>
  );
}
