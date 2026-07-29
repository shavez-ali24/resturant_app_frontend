/* eslint-disable no-unused-vars */
import React from 'react'
import { useSelector } from 'react-redux';
import { FormCard } from './commanProfile/FormCard'
import { FormField } from './commanProfile/FormField'
import { motion, AnimatePresence } from 'framer-motion'

const Toggle = ({ id, checked, onChange, colors }) => (
    <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" id={id} className="sr-only peer" checked={checked} onChange={onChange} />
        <div 
            className={`
                relative w-10 h-5 rounded-full transition-all duration-200
                bg-[#ede8e3] dark:bg-slate-700
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm
                after:transition-all peer-checked:after:translate-x-5
            `}
            style={checked ? { backgroundColor: colors.primary } : {}}
        ></div>
    </label>
);

export default function UpdateFinancialsForm({ formData, handleGstToggle, handleChange }) {
    const colors = useSelector((state) => state.admin.theme.colors);
    const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

    const gstNumberError = formData.gstEnabled && !String(formData.gstNumber || "").trim()
        ? "GST number is required." : "";
    const gstRateMissing = formData.gstEnabled && (formData.gstRate === "" || formData.gstRate === null || formData.gstRate === undefined || Number(formData.gstRate) <= 0);
    const gstRateError = gstRateMissing ? "GST rate is required." : "";

    return (
        <FormCard title="Financials" customIndex={4}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                    label="Delivery Charges (₹)"
                    name="deliveryCharges"
                    type="text"
                    value={formData.deliveryCharges || 0}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                />
                <div 
                    className="flex items-center justify-between rounded-lg border px-3 py-2 transition-all duration-200"
                    style={{
                        borderColor: formData.gstEnabled 
                            ? (isDarkMode ? `${colors.primary}50` : `${colors.primary}33`) 
                            : (isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3"),
                        backgroundColor: formData.gstEnabled 
                            ? (isDarkMode ? `${colors.primary}20` : colors.primaryLight) 
                            : (isDarkMode ? "rgba(30, 41, 59, 0.4)" : "#f7f3ef")
                    }}
                >
                    <label 
                        htmlFor="gst-toggle" 
                        className="text-xs font-semibold cursor-pointer"
                        style={{
                            color: formData.gstEnabled 
                                ? (isDarkMode ? colors.primary : colors.primaryText) 
                                : (isDarkMode ? "#e2e8f0" : "#1c1917")
                        }}
                    >
                        Enable GST
                    </label>
                    <Toggle id="gst-toggle" checked={formData.gstEnabled} onChange={handleGstToggle} colors={colors} />
                </div>
            </div>
            <AnimatePresence>
                {formData.gstEnabled && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-3">
                            <FormField label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} error={gstNumberError} placeholder="e.g. 22AAAAA0000A1Z5" />
                            <FormField label="GST Rate (%)" name="gstRate" type="text" value={formData.gstRate} onChange={handleChange} error={gstRateError} placeholder="e.g. 5" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </FormCard>
    )
}
