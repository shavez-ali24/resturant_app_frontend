/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

// --- Notification Sounds ---
const successSound = new Audio("/sounds/success.mp3");
const errorSound = new Audio("/sounds/error.mp3");
const infoSound = new Audio("/sounds/info.mp3");
const warningSound = new Audio("/sounds/warning.mp3");

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

// MAX NUMBER OF TOASTS VISIBLE AT ONCE
const MAX_TOASTS = 3;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const playSound = (type) => {
    try {
      if (type === "success") successSound.play();
      if (type === "error") errorSound.play();
      if (type === "warning") warningSound.play();
      if (type === "info") infoSound.play();
    } catch {}
  };

  const remove = (id) => {
    setNotifications((prev) => prev.filter((t) => t.id !== id));
  };

  const notify = useCallback((message, type = "success") => {
    const id = Date.now();

    setNotifications((prev) => {
      const updated = [...prev, { id, message, type }];
      return updated.slice(-MAX_TOASTS); // keep last 3
    });

    playSound(type);

    // Auto remove after 3 seconds
    setTimeout(() => remove(id), 3000);
  }, []);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-700" />,
    error: <XCircle className="w-5 h-5 text-red-700" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-700" />,
    info: <Info className="w-5 h-5 text-blue-700" />,
  };

  const colors = {
    success: "bg-green-50 border-green-300",
    error: "bg-red-50 border-red-300",
    warning: "bg-yellow-50 border-yellow-300",
    info: "bg-blue-50 border-blue-300",
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-[300px]">
        <AnimatePresence>
          {notifications.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              drag="x"
              onDragEnd={(e, info) => {
                if (info.offset.x > 120) remove(note.id);
              }}
              className={`
                relative overflow-hidden
                rounded-xl shadow-xl backdrop-blur-xl border
                py-4 px-4 flex gap-3 items-start
                ${colors[note.type]}
              `}
            >
              {/* Icon */}
              <div className="mt-1">{icons[note.type]}</div>

              {/* Message */}
              <div>
                <p className="font-semibold text-sm uppercase tracking-wide">
                  {note.type}
                </p>
                <p className="text-sm text-gray-700 leading-snug">
                  {note.message}
                </p>
              </div>

              {/* Progress bar (bottom) */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: 0 }}
                transition={{ duration: 3, ease: "linear" }}
                className={`
                  absolute bottom-0 left-0 h-[3px]
                  ${note.type === "success" && "bg-green-600"}
                  ${note.type === "error" && "bg-red-600"}
                  ${note.type === "warning" && "bg-yellow-600"}
                  ${note.type === "info" && "bg-blue-600"}
                `}
              ></motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
