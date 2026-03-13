/* eslint-disable no-unused-vars */
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircleIcon, 
  XCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

const NotificationModalSimple = ({ type, message, onClose, show = true }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const isSuccess = type === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`fixed top-6 right-6 z-50 max-w-xs rounded-xl overflow-hidden shadow-2xl ${isSuccess 
        ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
        : 'bg-gradient-to-r from-rose-500 to-pink-500'}`}
    >
      {/* Animated progress bar */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 3, ease: "linear" }}
        className={`h-0.5 ${isSuccess ? 'bg-emerald-300' : 'bg-rose-300'}`}
      />
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 p-2 rounded-lg ${isSuccess ? 'bg-emerald-400/20' : 'bg-rose-400/20'}`}>
            {isSuccess ? (
              <CheckCircleIcon className="w-5 h-5 text-white" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-white" />
            )}
          </div>
          
          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm leading-tight">
              {message}
            </p>
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-2 h-2 border border-white/30 rounded-full" />
      <div className="absolute top-2 right-2 w-2 h-2 border border-white/30 rounded-full" />
      <div className="absolute bottom-2 left-2 w-2 h-2 border border-white/30 rounded-full" />
      <div className="absolute bottom-2 right-2 w-2 h-2 border border-white/30 rounded-full" />
    </motion.div>
  );
};

export default NotificationModalSimple;
