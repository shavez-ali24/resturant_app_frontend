/**
 * ImageUpload.jsx  (menu items — Add & Edit pages)
 * Adds crop / zoom / reposition via ImageCropperModal.
 * The cropped File is passed back through handleFileChange as a synthetic event
 * so existing form handlers (handleAddFormFileChange) work unchanged.
 *
 * Props (unchanged from original):
 *   addFile          — current File object in state
 *   addFileError     — validation error string
 *   handleFileChange — (e) => void  (called with synthetic event)
 *   existingImageUrl — optional current image URL (edit mode)
 */

import React, { useEffect, useMemo, useState, useRef } from "react";
import { CheckCircle, Image, Crop, X } from "lucide-react";
import ErrorDisplay from "./ErrorDisplay";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_KB } from "../../../Lib/constants";
import ImageCropperModal from "../../../../common/ImageCropperModal";

const ImageUpload = ({
  addFile,
  addFileError,
  handleFileChange,
  existingImageUrl = null,
}) => {
  const fileInputRef = useRef(null);

  // Raw file selected from disk (before crop)
  const [rawFile, setRawFile]         = useState(null);
  const [rawPreview, setRawPreview]   = useState("");
  const [showCropper, setShowCropper] = useState(false);

  // Preview of the final (cropped) file
  const croppedPreviewUrl = useMemo(
    () => (addFile ? URL.createObjectURL(addFile) : ""),
    [addFile]
  );

  useEffect(() => {
    return () => {
      if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    };
  }, [croppedPreviewUrl]);

  useEffect(() => {
    return () => {
      if (rawPreview) URL.revokeObjectURL(rawPreview);
    };
  }, [rawPreview]);

  const displayUrl = croppedPreviewUrl || existingImageUrl || "";

  // ── Step 1: user picks a file → open cropper ──────────────────────────────
  const handleRawFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Basic type check before opening cropper
    const allowedMime = ["image/jpeg","image/jpg","image/png","image/gif","image/webp","image/avif"];
    if (!allowedMime.includes(selected.type)) {
      // Pass through to original handler so it shows the error
      handleFileChange(e);
      return;
    }

    const url = URL.createObjectURL(selected);
    setRawFile(selected);
    setRawPreview(url);
    setShowCropper(true);

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Step 2: crop done → synthesize event for existing handler ─────────────
  const handleCropDone = (croppedFile) => {
    setShowCropper(false);
    URL.revokeObjectURL(rawPreview);
    setRawPreview("");
    setRawFile(null);

    // Synthesize an event object that matches what handleAddFormFileChange expects
    const syntheticEvent = {
      target: {
        files: [croppedFile],
        value: croppedFile.name,
      },
    };
    handleFileChange(syntheticEvent);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    URL.revokeObjectURL(rawPreview);
    setRawPreview("");
    setRawFile(null);
  };

  const handleClearImage = (e) => {
    e.stopPropagation();
    const syntheticEvent = { target: { files: [], value: "" } };
    handleFileChange(syntheticEvent);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#a8a29e] dark:text-slate-400">
          Product Image
        </label>

        {/* Upload / preview area */}
        <div
          className={`relative block w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ${
            addFileError
              ? "border-red-400 bg-red-50 dark:bg-red-900/20"
              : "border-[#d6cfc8] bg-[#f7f3ef] hover:border-orange-400 hover:bg-[#fff7ed] dark:border-slate-600 dark:bg-slate-800/60 dark:hover:border-orange-500 dark:hover:bg-slate-700/60"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="relative h-44 w-full">
            {displayUrl ? (
              <>
                <img
                  src={displayUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                <div className={`rounded-xl p-3 ${addFileError ? "bg-red-100 dark:bg-red-900/30" : "bg-white dark:bg-slate-700"}`}>
                  <Image
                    size={28}
                    className={addFileError ? "text-red-400" : "text-[#d6cfc8] dark:text-slate-500"}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#78716c] dark:text-slate-400">
                    Click to upload image
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#a8a29e] dark:text-slate-500">
                    JPEG, PNG, WebP — max {MAX_IMAGE_KB}KB
                  </p>
                </div>
              </div>
            )}

            {/* Bottom overlay */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/40 py-1.5 text-xs font-medium text-white">
              <Crop size={11} />
              {displayUrl ? "Click to replace & crop" : "Click to upload & crop"}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleRawFileSelect}
          />
        </div>

        {/* Status messages */}
        {addFile && !addFileError && (
          <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircle size={12} />
            {addFile.name} ({(addFile.size / 1024).toFixed(1)} KB) — cropped & ready
          </p>
        )}

        {!addFile && existingImageUrl && (
          <p className="text-xs text-[#a8a29e] dark:text-slate-500">
            Current image shown. Upload a new one to replace it.
          </p>
        )}

        {addFileError && <ErrorDisplay error={addFileError} type="form" />}
      </div>

      {/* Crop modal */}
      {showCropper && rawPreview && (
        <ImageCropperModal
          imageSrc={rawPreview}
          aspect={1}
          title="Crop Product Image"
          outputFileName={rawFile?.name || "product-image.jpg"}
          onCropDone={handleCropDone}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
};

export default ImageUpload;
