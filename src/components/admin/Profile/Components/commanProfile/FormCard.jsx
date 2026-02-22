import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const FormCard = ({ title, icon, children, customIndex }) => (
  <motion.div
    className="rounded-2xl border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]"
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
    <div className="p-4 sm:p-5">
      {(title || icon) && (
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
          {icon ? <span className="text-orange-500">{icon}</span> : null}
          {title}
        </h3>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  </motion.div>
);
