import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const FormCard = ({ title, icon, children, customIndex }) => (
    <motion.div
        className="bg-white rounded-xl"
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
        <div className="p-6 md:p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-orange-500">{icon}</span>
                {title}
            </h3>
            <div className="space-y-6 ">{children}</div>
        </div>
    </motion.div>
);