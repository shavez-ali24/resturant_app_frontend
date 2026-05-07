import React from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

// Reusable toggle — works in both light and dark mode
const Toggle = ({ id, checked, onChange, disabled }) => (
    <label className="relative inline-flex cursor-pointer items-center">
        <input
            type="checkbox"
            id={id}
            className="sr-only peer"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
        />
        <div className={`
            relative w-10 h-5 rounded-full transition-colors
            bg-[#d6cfc8] peer-checked:bg-orange-500
            dark:bg-slate-600 dark:peer-checked:bg-orange-500
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
            peer-focus:ring-2 peer-focus:ring-orange-300 peer-focus:ring-offset-1
            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
            after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow
            after:transition-all peer-checked:after:translate-x-5
        `}></div>
    </label>
);

export default function UpdateOrderModeForm({ atLeastOneModeActive, formData, handleOrderModeToggle, activeModesCount }) {
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
            {modes.map(({ id, key, label }) => (
                <div key={key} className="flex flex-col items-center gap-2 rounded-lg border border-[#ede8e3] bg-[#f7f3ef] p-3 dark:border-slate-600 dark:bg-slate-800/40">
                    <span className="text-xs font-semibold text-[#1c1917] dark:text-slate-200">{label}</span>
                    <Toggle
                        id={id}
                        checked={formData.orderModes[key]}
                        onChange={() => handleOrderModeToggle(key)}
                        disabled={formData.orderModes[key] && activeModesCount === 1}
                    />
                </div>
            ))}
        </div>
    );
}
