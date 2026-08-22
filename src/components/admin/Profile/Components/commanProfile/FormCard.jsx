import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

import { useSelector } from "react-redux";

export const FormCard = ({ title, icon, children, customIndex }) => {
  const colors = useSelector((state) => state.admin?.theme?.colors) || {
    primary: "#EF9F27",
    primaryText: "#7c2d12",
    primaryLight: "#fff8f5"
  };

  return (
    <motion.div
      className="rounded-xl border border-[#ede8e3] bg-white shadow-sm dark:border-slate-700 dark:bg-[#1e293b]"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
          opacity: 1,
          y: 0,
          transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" },
        }),
      }}
      initial="hidden"
      animate="visible"
      custom={customIndex}
    >
      <div className="p-3 sm:p-4">
        {(title || icon) && (
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1c1917] dark:text-slate-100">
            {icon ? <span style={{ color: colors.primary }}>{icon}</span> : null}
            {title}
          </h3>
        )}
        <div className="space-y-3">{children}</div>
      </div>
    </motion.div>
  );
};
