/* eslint-disable no-unused-vars */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { modalOverlayVariant, modalContentVariant } from "../Lib/constants";

const NotificationModal = ({ notification, onClose }) => {
  const { show, message, type } = notification;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={modalOverlayVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalContentVariant}
            className={`relative rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-auto ${type === "success"
              ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
              : "bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              {type === "success" ? (
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
              <p className="text-lg font-medium text-gray-800">
                {message}
              </p>
              <button
                onClick={onClose}
                className={`mt-6 w-full text-white py-3 px-8 rounded-xl text-lg font-semibold shadow-sm transition-colors ${type === "success"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
                  }`}
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;