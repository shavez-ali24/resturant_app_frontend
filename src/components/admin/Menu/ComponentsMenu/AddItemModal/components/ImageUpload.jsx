import React, { useEffect, useMemo } from "react";
import { CheckCircle, Image } from "lucide-react";
import ErrorDisplay from "./ErrorDisplay";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_KB } from "../../../Lib/constants";

// existingImageUrl — optional: current image URL (used in edit mode)
const ImageUpload = ({ addFile, addFileError, handleFileChange, existingImageUrl = null }) => {
  const newPreviewUrl = useMemo(
    () => (addFile ? URL.createObjectURL(addFile) : ""),
    [addFile]
  );

  useEffect(() => {
    return () => { if (newPreviewUrl) URL.revokeObjectURL(newPreviewUrl); };
  }, [newPreviewUrl]);

  // Show new file preview first, then fall back to existing image
  const displayUrl = newPreviewUrl || existingImageUrl || "";

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-[#a8a29e] dark:text-slate-400">
        Product Image
      </label>

      <label
        className={`block w-full cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          addFileError
            ? "border-red-400 bg-red-50 dark:bg-red-900/20"
            : "border-[#d6cfc8] bg-[#f7f3ef] hover:border-orange-300 hover:bg-[#fff7ed] dark:border-slate-600 dark:bg-slate-800/60 dark:hover:border-slate-500 dark:hover:bg-slate-700/60"
        }`}
      >
        <div className="relative h-40 w-full">
          {displayUrl ? (
            <img src={displayUrl} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <Image size={32} className={addFileError ? "text-red-400" : "text-[#d6cfc8] dark:text-slate-600"} />
              <p className="text-xs text-[#a8a29e] dark:text-slate-500">Click to upload image</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-black/40 px-3 py-1.5 text-center text-xs font-medium text-white">
            {displayUrl ? "Click to replace" : "Click to upload"}
          </div>
        </div>
        <input
          type="file"
          className="hidden"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleFileChange}
        />
      </label>

      <p className="text-xs text-[#a8a29e] dark:text-slate-500">Max {MAX_IMAGE_KB}KB</p>

      {addFile && !addFileError && (
        <p className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle size={12} />
          {addFile.name} ({(addFile.size / 1024).toFixed(1)} KB)
        </p>
      )}

      {!addFile && existingImageUrl && (
        <p className="text-xs text-[#a8a29e] dark:text-slate-500">
          Current image shown. Upload a new one to replace it.
        </p>
      )}

      {addFileError && <ErrorDisplay error={addFileError} type="form" />}
    </div>
  );
};

export default ImageUpload;
