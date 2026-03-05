import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function UpdateFormActions({ onClose, isSubmitting, fileError }) {
  return (
    <motion.div
      className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
          opacity: 1,
          y: 0,
          transition: {
            delay: i * 0.05,
            duration: 0.4,
            ease: "easeOut",
          },
        }),
      }}
      initial="hidden"
      animate="visible"
      custom={5}
    >
      <button
        type="button"
        onClick={onClose}
        className="h-11 w-full rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
      >
        Cancel
      </button>

      <motion.button
        type="submit"
        disabled={isSubmitting || !!fileError}
        whileTap={{ scale: 0.98 }}
        className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isSubmitting ? "Updating..." : "Update Profile"}
      </motion.button>
    </motion.div>
  );
}
