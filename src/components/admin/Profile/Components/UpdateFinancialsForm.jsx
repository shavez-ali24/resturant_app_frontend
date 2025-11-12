/* eslint-disable no-unused-vars */
import React from 'react'
import { FormCard } from './ui/FormCard'
import { FormField } from './ui/FormField'
import { motion, AnimatePresence } from 'framer-motion'

export default function UpdateFinancialsForm({ formData, handleGstToggle, handleChange }) {
    return (
        <FormCard title="Financials" icon="💳" customIndex={2}>
            <div className="space-y-4 rounded-xl border border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                    <label
                        htmlFor="gst-toggle"
                        className="text-gray-700 font-semibold"
                    >
                        Enable GST
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            id="gst-toggle"
                            className="sr-only peer"
                            checked={formData.gstEnabled}
                            onChange={handleGstToggle}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                </div>

                <AnimatePresence>
                    {formData.gstEnabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{
                                opacity: 1,
                                height: "auto",
                                marginTop: "1rem",
                            }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4 overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    label="GST Number"
                                    name="gstNumber"
                                    value={formData.gstNumber}
                                    onChange={handleChange}
                                    placeholder="e.g. 22AAAAA0000A1Z5"
                                />
                                <FormField
                                    label="GST Rate (%)"
                                    name="gstRate"
                                    type="text" // Keep as text to allow decimal
                                    value={formData.gstRate}
                                    onChange={handleChange}
                                    placeholder="e.g. 5"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </FormCard>
    )
}
