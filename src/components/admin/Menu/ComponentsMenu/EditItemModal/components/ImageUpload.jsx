import React from "react";
import { ExclamationCircleIcon, PhotoIcon } from "@heroicons/react/24/solid";
import { MAX_IMAGE_KB } from "../../../Lib/constants";

const ImageUpload = ({ imageFile, currentImage, imageError, handleFileChange, isEditMode = false }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      Product Image {isEditMode && "(Optional)"}
    </label>
    
    {/* Image Preview */}
    <div className="mb-3">
      <img
        src={
          imageFile
            ? URL.createObjectURL(imageFile)
            : currentImage ||
              "https://placehold.co/300x200?text=No+Image"
        }
        alt="Preview"
        className="w-full h-48 object-cover rounded-lg border border-orange-300"
      />
    </div>
    
    {/* File Upload */}
    <label className={`
      flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors
      ${imageError ? 'border-red-500 bg-red-50' : 'border-orange-500 hover:bg-orange-50'}
    `}>
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <PhotoIcon className={`w-10 h-10 mb-3 ${imageError ? 'text-red-500' : 'text-orange-500'}`} />
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Max {MAX_IMAGE_KB}KB
        </p>
      </div>
      <input
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
      />
    </label>
    
    <p className="text-xs text-gray-500 mt-1">
      {isEditMode 
        ? "Select a new file to replace the current image." 
        : "Upload an image for the product."}
    </p>
    
    {imageError && (
      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
        <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
        {imageError}
      </p>
    )}
  </div>
);

export default ImageUpload;