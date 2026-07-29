import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const ErrorMessage = React.memo(({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ef] dark:bg-[#0f172a] p-4">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg dark:border-red-500/40 dark:bg-[#1e293b]">
            <h2 className="text-2xl font-bold text-red-600 mb-3">Error Loading Profile</h2>
            <p className="text-[#78716c] dark:text-slate-200">{error || "An unknown error occurred."}</p>
        </div>
    </div>
));
