import React from 'react'
import { FormCard } from './ui/FormCard';


export default function UpdateBrandingForm({ handleFileChange, file, fileError }) {
    return (
        <FormCard title="Branding" icon="🖼️" customIndex={3}>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Restaurant Logo
                </label>
                <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-orange-400 transition-colors bg-gray-50">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        id="logo-upload"
                        accept=".jpeg,.jpg,.png,.gif,.webp,.avif,image/*"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-3xl">📁</span>
                            <div>
                                <p className="text-gray-700 font-medium">
                                    {file ? file.name : "Click to upload logo"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    JPEG, JPG, PNG up to 300KB
                                </p>
                            </div>
                        </div>
                    </label>
                </div>
                {file && !fileError && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                        <span>✅</span> Selected: {file.name} (
                        {(file.size / 1024).toFixed(2)} KB)
                    </p>
                )}
                {fileError && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
                        <span>❌</span> {fileError}
                    </p>
                )}
            </div>
        </FormCard>)
}
