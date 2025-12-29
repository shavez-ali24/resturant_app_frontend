import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const NotificationModalPremium2 = ({ notification, onClose }) => {
  const { show, message, type } = notification;

  // Auto-close after 3 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const isSuccess = type === "success";

  const getTheme = () => {
    if (isSuccess) {
      return {
        gradient: "bg-gradient-to-r from-emerald-500 to-green-500",
        progressBar: "bg-emerald-300",
        iconBg: "bg-emerald-400/20",
        icon: <CheckCircleIcon className="w-5 h-5 text-white" />,
        title: "Success!",
      };
    } else {
      return {
        gradient: "bg-gradient-to-r from-rose-500 to-pink-500",
        progressBar: "bg-rose-300",
        iconBg: "bg-rose-400/20",
        icon: <XCircleIcon className="w-5 h-5 text-white" />,
        title: "Oops!",
      };
    }
  };

  const theme = getTheme();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -20, 
            scale: 0.95,
            transition: { duration: 0.2 }
          }}
          className="fixed top-6 right-6 z-50 max-w-xs rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Main Container with Gradient Background */}
          <div className={`relative ${theme.gradient}`}>
            {/* Animated progress bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              className={`h-0.5 ${theme.progressBar}`}
            />
            
            {/* Content */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon with subtle background */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${theme.iconBg}`}>
                  {theme.icon}
                </div>
                
                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <p className="text-white/90 font-semibold text-xs mb-1">
                    {theme.title}
                  </p>
                  
                  {/* Message */}
                  <p className="text-white font-medium text-sm leading-tight">
                    {message}
                  </p>
                </div>
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 text-white/70 hover:text-white transition-colors ml-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              
              {/* Optional Action Button - Minimal */}
              {/* <div className="mt-3 flex justify-end">
                <button
                  onClick={onClose}
                  className="text-xs text-white/80 hover:text-white font-medium transition-colors px-2 py-1 rounded-md hover:bg-white/10"
                >
                  Dismiss
                </button>
              </div> */}
            </div>
            
            {/* Subtle corner accents */}
            <div className="absolute top-2 left-2 w-2 h-2 border border-white/20 rounded-full" />
            <div className="absolute top-2 right-2 w-2 h-2 border border-white/20 rounded-full" />
            <div className="absolute bottom-2 left-2 w-2 h-2 border border-white/20 rounded-full" />
            <div className="absolute bottom-2 right-2 w-2 h-2 border border-white/20 rounded-full" />
            
            {/* Premium floating element - Minimal */}
            <motion.div 
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                ease: "easeInOut" 
              }}
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white/20"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModalPremium2;