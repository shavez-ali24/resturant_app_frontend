/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  Suspense,
  lazy,
  useEffect,
  useRef,
} from "react";
import config from "@/config";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

const MAX_NOTIFICATIONS = 3;

const NotificationToasts = lazy(() => import("./NotificationToasts"));

import { SSEConnectionManager } from "@/utils/sseConnectionManager";

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [sseEvent, setSseEvent] = useState(null);
  const [sseConnected, setSseConnected] = useState(false);
  const sseManagerRef = useRef(null);
  const lastEventSignatureRef = useRef(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const token = localStorage.getItem("token");
    if (!token || !config?.BASE_URL) return undefined;

    const baseUrl = String(config.BASE_URL).replace(/\/$/, "");
    const sseUrl = `${baseUrl}/api/notifications?token=${encodeURIComponent(token)}`;

    // Create and initialize SSE manager
    sseManagerRef.current = new SSEConnectionManager({
      url: sseUrl,
      onConnectionChange: (connected) => {
        setSseConnected(connected);
      },
      onMessage: (event) => {
        if (!event?.data) return;
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (!payload || payload.type === "CONNECTED") return;

        // Only deduplicate identical events: same order + same status + same timestamp
        const eventSignature = [
          payload?.data?._id || payload?.data?.id || payload?.data?.orderId || "",
          payload?.data?.status || "",
          payload?.data?.updatedAt || Date.now(),
        ].join(":");

        if (eventSignature && lastEventSignatureRef.current === eventSignature) {
          return;
        }
        if (eventSignature) {
          lastEventSignatureRef.current = eventSignature;
        }

        setSseEvent({ ...payload, ts: Date.now() });
      },
    });

    sseManagerRef.current.connect();

    return () => {
      if (sseManagerRef.current) {
        sseManagerRef.current.destroy();
        sseManagerRef.current = null;
      }
      setSseConnected(false);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, sseEvent, sseConnected }}>
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
