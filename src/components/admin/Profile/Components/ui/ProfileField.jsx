import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const ProfileField = ({ label, value, icon }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">{icon}</span>
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                {label}
            </label>
        </div>
        <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-gray-900 break-all">
                {value || "Not Available"}
            </p>
        </div>
    </div>
);