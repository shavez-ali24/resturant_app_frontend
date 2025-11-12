import React from 'react'
import { FormCard } from './ui/FormCard';

export default function UpdateOrderModeForm({ atLeastOneModeActive, formData, handleOrderModeToggle, activeModesCount }) {
    return (
        <div>
            <FormCard title="Order Mode" icon="📋" customIndex={2}>
                <div className="space-y-4">
                    {/* ✅ NEW: Error message if no mode is active */}
                    {!atLeastOneModeActive && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                            <p className="text-sm font-medium">
                                At least one order mode must be enabled.
                            </p>
                        </div>
                    )}

                    <div className="flex items-center rounded-xl justify-between border border-gray-200 p-4 bg-gray-50">
                        <label
                            htmlFor="eathere-toggle" 
                            className="text-gray-700 font-semibold"
                        >
                            🍴 Eat Here
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="eathere-toggle" 
                                className="sr-only peer"
                                checked={formData.orderModes.eathere}
                                onChange={() => handleOrderModeToggle("eathere")} // ✅ UPDATED
                                // ✅ NEW: Disable if this is the last active toggle
                                disabled={
                                    formData.orderModes.eathere && activeModesCount === 1
                                }
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        </label>
                    </div>
                    <div className="flex items-center rounded-xl justify-between border border-gray-200 p-4 bg-gray-50">
                        <label
                            htmlFor="takeaway-toggle" // ✅ UPDATED: Unique ID
                            className="text-gray-700 font-semibold"
                        >
                            🛍️ Take Away
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="takeaway-toggle" // ✅ UPDATED: Unique ID
                                className="sr-only peer"
                                checked={formData.orderModes.takeaway}
                                onChange={() => handleOrderModeToggle("takeaway")} // ✅ UPDATED
                                // ✅ NEW: Disable if this is the last active toggle
                                disabled={
                                    formData.orderModes.takeaway && activeModesCount === 1
                                }
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        </label>
                    </div>
                    <div className="flex items-center rounded-xl justify-between border border-gray-200 p-4 bg-gray-50">
                        <label
                            htmlFor="delivery-toggle" // ✅ UPDATED: Unique ID
                            className="text-gray-700 font-semibold"
                        >
                            🛵 Delivery
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="delivery-toggle" 
                                className="sr-only peer"
                                checked={formData.orderModes.delivery}
                                onChange={() => handleOrderModeToggle("delivery")} // ✅ UPDATED
                                // ✅ NEW: Disable if this is the last active toggle
                                disabled={
                                    formData.orderModes.delivery && activeModesCount === 1
                                }
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        </label>
                    </div>
                </div>
            </FormCard>
        </div>
    )
}
