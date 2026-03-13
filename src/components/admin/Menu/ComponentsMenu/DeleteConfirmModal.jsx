/* eslint-disable no-unused-vars */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";  
import { modalOverlayVariant, modalContentVariant } from "../Lib/constants";

const DeleteConfirmModal = ({ isOpen, itemName, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlayVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.div
            variants={modalContentVariant}
            className="relative mx-auto w-full max-w-sm rounded-2xl border border-orange-100 bg-white/95 p-6 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto mb-4 h-14 w-14 text-red-500 sm:h-16 sm:w-16" />
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                Are you sure?
              </h3>
              <p className="mt-2 text-sm text-gray-600 sm:text-base">
                Do you really want to delete "
                <strong>{itemName}</strong>"? This action cannot be
                undone.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
              <button
                onClick={onClose}
                className="h-11 w-full rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-orange-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="h-11 w-full rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;


