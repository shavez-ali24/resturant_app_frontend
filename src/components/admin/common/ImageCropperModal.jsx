/**
 * ImageCropperModal.jsx
 * Reusable image crop/zoom/reposition modal using react-easy-crop.
 * Converts the cropped area to a Blob/File and calls onCropDone(file).
 * Does NOT touch any backend — purely frontend.
 *
 * Props:
 *   imageSrc   — data-URL or object-URL of the source image
 *   aspect     — crop aspect ratio (default 1 = square)
 *   onCropDone — (croppedFile: File) => void
 *   onCancel   — () => void
 *   title      — optional modal title string
 *   outputFileName — filename for the resulting File object
 */

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from "lucide-react";

// ── Helper: canvas crop ───────────────────────────────────────────────────────
async function getCroppedBlob(imageSrc, pixelCrop, outputType = "image/jpeg") {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");

  // Ensure canvas is clear for PNG transparency
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), outputType, 0.92);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ImageCropperModal({
  imageSrc,
  aspect = 1,
  onCropDone,
  onCancel,
  title = "Crop Image",
  outputFileName = "cropped-image.jpg",
  mimeType,
}) {
  const [crop, setCrop]           = useState({ x: 0, y: 0 });
  const [zoom, setZoom]           = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      let detectedType = mimeType || "";

      if (!detectedType) {
        if (imageSrc && imageSrc.startsWith("data:")) {
          const match = imageSrc.match(/data:([^;]+);/);
          if (match && match[1]) {
            detectedType = match[1];
          }
        }

        if (!detectedType) {
          const fileString = outputFileName || imageSrc || "";
          const cleanUrl = fileString.split("?")[0].split("#")[0];
          const extension = cleanUrl.split(".").pop()?.toLowerCase();

          if (extension === "png") {
            detectedType = "image/png";
          } else if (extension === "webp") {
            detectedType = "image/webp";
          } else if (extension === "gif") {
            detectedType = "image/gif";
          } else {
            detectedType = "image/jpeg";
          }
        }
      }

      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, detectedType);
      const extension = detectedType.split("/")[1] || "jpg";
      const baseName = outputFileName.replace(/\.[^/.]+$/, "");
      const finalFileName = `${baseName}.${extension === "jpeg" ? "jpg" : extension}`;

      const file = new File([blob], finalFileName, { type: detectedType });
      onCropDone(file);
    } catch (err) {
      console.error("Crop error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ede8e3] px-4 py-3 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-[#1c1917] dark:text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-[#78716c] transition-colors hover:bg-[#f7f3ef] hover:text-[#1c1917] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Crop area */}
        <div
          className="relative h-72 w-full sm:h-80"
          style={{
            backgroundImage: "repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%)",
            backgroundSize: "16px 16px",
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={true}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: { border: "2px solid #f97316" },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 border-t border-[#ede8e3] px-4 py-3 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
            className="rounded-lg p-1.5 text-[#78716c] transition-colors hover:bg-[#f7f3ef] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ZoomOut size={16} />
          </button>

          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#ede8e3] accent-orange-500 dark:bg-slate-700"
          />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="rounded-lg p-1.5 text-[#78716c] transition-colors hover:bg-[#f7f3ef] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ZoomIn size={16} />
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset"
            className="rounded-lg p-1.5 text-[#78716c] transition-colors hover:bg-[#f7f3ef] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Hint */}
        <p className="px-4 pb-1 text-center text-[11px] text-[#a8a29e] dark:text-slate-500">
          Drag to reposition · Pinch or scroll to zoom
        </p>

        {/* Actions */}
        <div className="flex gap-2 border-t border-[#ede8e3] px-4 py-3 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[#ede8e3] bg-white py-2 text-sm font-semibold text-[#78716c] transition-colors hover:bg-[#f7f3ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            disabled={isProcessing}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
          >
            {isProcessing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Check size={15} />
            )}
            {isProcessing ? "Processing…" : "Apply Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
