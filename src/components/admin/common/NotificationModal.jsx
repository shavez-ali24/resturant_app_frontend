import React, { createContext, useContext, useEffect, useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Create Context
const NotificationContext = createContext();

// Provider Component
export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const notify = (message, type = "success") => {
    setNotification({ show: true, message, type });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  return (
    <NotificationContext.Provider value={{ notify, closeNotification }}>
      {children}
      <NotificationModal
        notification={notification}
        onClose={closeNotification}
      />
    </NotificationContext.Provider>
  );
};

// Hook to use notification
export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return a no-op function if used outside provider
    return (message, type) => console.warn("useNotify used outside NotificationProvider");
  }
  return context.notify;
};

// Modal Component
const NotificationModal = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const { show = false, message = "", type = "" } = notification || {};

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, onClose]);

  if (!isVisible) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed top-6 right-6 z-50 max-w-xs w-full">
      <div className={`rounded-xl shadow-2xl overflow-hidden ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {isSuccess ? (
                <CheckCircleIcon className="w-5 h-5 text-white" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">
                {message}
              </p>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="flex-shrink-0 text-white/70 hover:text-white"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
