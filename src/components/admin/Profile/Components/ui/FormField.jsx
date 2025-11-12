import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const FormField = ({ label, name, value, onChange, placeholder, type = "text", min, }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            min={min}
            className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            placeholder={placeholder}
        />
    </div>
);