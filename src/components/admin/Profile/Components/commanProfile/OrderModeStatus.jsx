import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const OrderModeStatus = ({ mode, icon, isEnabled }) => (
    <div
        className={`flex items-center gap-3 p-4 rounded-xl transition-all ${isEnabled
            ? "bg-orange-50 border border-orange-200"
            : "bg-gray-100 border border-gray-200"
            }`}
    >
        <span className="text-xl">{icon}</span>
        <span
            className={`font-semibold ${isEnabled ? "text-orange-900" : "text-gray-600"
                }`}
        >
            {mode}
        </span>
        <span
            className={`text-sm font-bold uppercase ml-auto px-2.5 py-0.5 rounded-md ${isEnabled
                ? "bg-orange-200 text-orange-800"
                : "bg-gray-200 text-gray-500"
                }`}
        >
            {isEnabled ? "On" : "Off"}
        </span>
    </div>
);