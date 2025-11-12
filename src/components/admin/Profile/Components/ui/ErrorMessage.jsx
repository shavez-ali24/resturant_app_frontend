import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const ErrorMessage = ({ error }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-3">
                Error Loading Profile
            </h2>
            <p className="text-gray-700">{error || "An unknown error occurred."}</p>
        </div>
    </div>
);