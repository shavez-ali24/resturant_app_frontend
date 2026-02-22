import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const FormCard = ({ title, icon, children, customIndex }) => (
    <motion.div
        className="bg-white rounded-xl border border-orange-100 shadow-sm"
        variants={{
            hidden: { opacity: 0, y: 20 },
            visible: (i) => ({
                opacity: 1,
                y: 0,
                transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
            }),
        }}
        initial="hidden"
        animate="visible"
        custom={customIndex}
    >
        <div className="p-5">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-orange-500">{icon}</span>
                {title}
            </h3>
            <div className="space-y-4">{children}</div>
        </div>
    </motion.div>
);
