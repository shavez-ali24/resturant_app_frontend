import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const ErrorMessage = ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-slate-950 dark:to-slate-900">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg dark:border-red-500/40 dark:bg-slate-900">
            <h2 className="text-2xl font-bold text-red-600 mb-3">
                Error Loading Profile
            </h2>
            <p className="text-gray-700 dark:text-slate-200">{error || "An unknown error occurred."}</p>
        </div>
    </div>
);
