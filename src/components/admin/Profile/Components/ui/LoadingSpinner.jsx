import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const LoadingSpinner = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading profile...</p>
        </div>
    </div>
);