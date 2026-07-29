import React from 'react'
import { useSelector } from 'react-redux';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

// Reusable toggle — works in both light and dark mode
const Toggle = ({ id, checked, onChange, disabled, colors }) => (
    <label className="relative inline-flex cursor-pointer items-center">
        <input
            type="checkbox"
            id={id}
            className="sr-only peer"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
        />
        <div 
            className={`
                relative w-10 h-5 rounded-full transition-all duration-200
                bg-[#ede8e3] dark:bg-slate-700
                peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm
                after:transition-all peer-checked:after:translate-x-5
            `}
            style={checked ? { backgroundColor: colors.primary } : {}}
        ></div>
    </label>
);

export default function UpdateOrderModeForm({ atLeastOneModeActive, formData, handleOrderModeToggle, activeModesCount }) {
    const colors = useSelector((state) => state.admin.theme.colors);
    const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

    const modes = [
        { id: "eathere-toggle", key: "eathere", label: "Eat Here" },
        { id: "takeaway-toggle", key: "takeaway", label: "Take Away" },
        { id: "delivery-toggle", key: "delivery", label: "Delivery" },
    ];

    return (
        <div className="grid grid-cols-3 gap-2">
            {!atLeastOneModeActive && (
                <div className="col-span-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-medium">At least one mode must be enabled.</p>
                </div>
            )}
            {modes.map(({ id, key, label }) => {
                const isActive = formData.orderModes[key];
                return (
                    <div
                        key={key}
                        className="flex flex-col items-center gap-2 rounded-lg border p-3 transition-all duration-200"
                        style={{
                            borderColor: isActive 
                                ? (isDarkMode ? `${colors.primary}50` : `${colors.primary}33`) 
                                : (isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3"),
                            backgroundColor: isActive 
                                ? (isDarkMode ? `${colors.primary}20` : colors.primaryLight) 
                                : (isDarkMode ? "rgba(30, 41, 59, 0.4)" : "#f7f3ef")
                        }}
                    >
                        <span 
                            className="text-xs font-semibold"
                            style={{
                                color: isActive 
                                    ? (isDarkMode ? colors.primary : colors.primaryText) 
                                    : (isDarkMode ? "#e2e8f0" : "#1c1917")
                            }}
                        >
                            {label}
                        </span>
                        <Toggle
                            id={id}
                            checked={isActive}
                            onChange={() => handleOrderModeToggle(key)}
                            disabled={isActive && activeModesCount === 1}
                            colors={colors}
                        />
                    </div>
                );
            })}
        </div>
    );
}
