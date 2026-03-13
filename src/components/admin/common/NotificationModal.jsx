/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

const MAX_NOTIFICATIONS = 3;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const notify = useCallback((message, type = "success") => {
    const id = Date.now();

    setNotifications((prev) => {
      const updated = [...prev, { id, message, type }];
      return updated.slice(-MAX_NOTIFICATIONS); // Keep last 3 notifications
    });

    // Auto remove after 3 seconds
    setTimeout(() => removeNotification(id), 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {/* Notification Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-80">
        <AnimatePresence>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

const NotificationItem = ({ notification, onClose }) => {
  const { message, type } = notification;
  const isSuccess = type === "success";

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      className={`rounded-xl overflow-hidden shadow-2xl relative ${isSuccess 
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

// Hook for using notifications
export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotify must be used within NotificationProvider");
  }
  return context.notify;
};

export default NotificationProvider;
