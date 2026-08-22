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

const MAX_NOTIFICATIONS = 2; // Better UX - limit concurrent toasts on screen
const NotificationToasts = lazy(() => import("./AppNotificationToasts"));

import { getFriendlyAdminMessage } from "@/utils/errorHelpers";

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const notify = useCallback((message, type = "success") => {
    const id = Date.now();
    const friendlyMessage = getFriendlyAdminMessage(message, type);

    setNotifications((prev) => {
      // De-duplicate: ignore exact same consecutive message within toast stack
      if (prev.length > 0 && prev[prev.length - 1].message === friendlyMessage) {
        return prev;
      }
      const updated = [...prev, { id, message: friendlyMessage, type }];
      return updated.slice(-MAX_NOTIFICATIONS);
    });

    // Auto remove after 4.5 seconds to give users sufficient time to read
    setTimeout(() => removeNotification(id), 4500);
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
