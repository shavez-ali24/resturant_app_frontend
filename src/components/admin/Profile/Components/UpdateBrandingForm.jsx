/**
 * UpdateBrandingForm.jsx
 * Logo upload with crop/zoom/reposition.
 * Frontend-only — sends final cropped File via existing handleFileChange prop.
 */

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";
import { Crop } from "lucide-react";
import ImageCropperModal from "../../common/ImageCropperModal";

export default function UpdateBrandingForm({
  handleFileChange,
  file,
  fileError,
  currentLogo,
}) {
  const fileInputRef = useRef(null);

  const [rawPreview, setRawPreview] = useState("");
  const [rawFile, setRawFile]       = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const croppedPreviewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file]
  );

  useEffect(() => () => { if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl); }, [croppedPreviewUrl]);
  useEffect(() => () => { if (rawPreview) URL.revokeObjectURL(rawPreview); }, [rawPreview]);

  const displayImage = croppedPreviewUrl || currentLogo || "";

  const handleRawSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const allowedMime = ["image/jpeg","image/jpg","image/png","image/gif","image/webp","image/avif"];
    if (!allowedMime.includes(selected.type)) {
      handleFileChange(e);
      return;
    }
    setRawFile(selected);
    setRawPreview(URL.createObjectURL(selected));
    setShowCropper(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropDone = (croppedFile) => {
    setShowCropper(false);
    URL.revokeObjectURL(rawPreview);
    setRawPreview("");
    setRawFile(null);
    handleFileChange({ target: { files: [croppedFile], value: croppedFile.name } });
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    URL.revokeObjectURL(rawPreview);
    setRawPreview("");
    setRawFile(null);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-[#78716c] dark:text-slate-300">
          Restaurant Logo
        </p>

        <div
          className={`relative block w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ${
            fileError
              ? "border-red-400 bg-red-50 dark:bg-red-500/10"
              : "border-[#d6cfc8] bg-[#f7f3ef] hover:border-orange-400 hover:bg-[#fff7ed] dark:border-slate-600 dark:bg-slate-800/60 dark:hover:border-orange-500"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="relative h-36 w-full">
            {displayImage ? (
              <img src={displayImage} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1">
                <PhotoIcon className={`h-8 w-8 ${fileError ? "text-red-400" : "text-[#d6cfc8] dark:text-slate-600"}`} />
                <p className="text-xs text-[#a8a29e] dark:text-slate-500">Click to upload</p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/40 py-1 text-[11px] font-medium text-white">
              <Crop size={10} />
              {displayImage ? "Click to replace & crop" : "Upload & crop logo"}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleRawSelect}
            className="hidden"
            accept=".jpeg,.jpg,.png,.gif,.webp,.avif,image/*"
          />
        </div>

        <div className="flex flex-col gap-0.5 text-xs">
          <p className="text-[#a8a29e] dark:text-slate-500">JPEG, PNG, WebP — max 300KB</p>
          {file && !fileError && (
            <p className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
              {file.name} ({(file.size / 1024).toFixed(1)} KB) — cropped & ready
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

      {showCropper && rawPreview && (
        <ImageCropperModal
          imageSrc={rawPreview}
          aspect={1}
          title="Crop Restaurant Logo"
          outputFileName={rawFile?.name || "logo.jpg"}
          onCropDone={handleCropDone}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}
