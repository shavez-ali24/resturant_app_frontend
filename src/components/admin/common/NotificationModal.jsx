/* eslint-disable no-unused-vars */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  lazy,
  Suspense,
} from "react";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

const MAX_NOTIFICATIONS = 3;
const NotificationToasts = lazy(() => import("./NotificationToasts"));

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

      {notifications.length > 0 && (
        <Suspense fallback={null}>
          <NotificationToasts
            notifications={notifications}
            onClose={removeNotification}
          />
        </Suspense>
      )}
    </NotificationContext.Provider>
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
