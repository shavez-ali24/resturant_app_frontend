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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalContentVariant}
            className="relative rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-auto bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900">
                Are you sure?
              </h3>
              <p className="text-gray-600 mt-2">
                Do you really want to delete "
                <strong>{itemName}</strong>"? This action cannot be
                undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-800 py-3 px-6 rounded-xl text-lg font-semibold shadow-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-xl text-lg font-semibold shadow-sm hover:bg-red-700 transition-colors"
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