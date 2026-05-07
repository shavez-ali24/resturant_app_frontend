import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const LoadingSpinner = () => (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ef] dark:bg-[#0f172a]">
        <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#78716c] dark:text-slate-300">Loading profile...</p>
        </div>
    </div>
);
