/* eslint-disable no-unused-vars */
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

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [sseEvent, setSseEvent] = useState(null);
  const [sseConnected, setSseConnected] = useState(false);
  const sseRef = useRef(null);
  const lastEventIdRef = useRef(null);

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

    if (sseRef.current) {
      sseRef.current.close();
    }

    const source = new EventSource(sseUrl);
    sseRef.current = source;

    source.onopen = () => {
      setSseConnected(true);
    };

    source.onmessage = (event) => {
      if (!event?.data) return;
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (!payload || payload.type === "CONNECTED") return;

      const eventId =
        payload?.data?._id ||
        payload?.data?.id ||
        payload?.data?.orderId ||
        null;

      if (eventId && lastEventIdRef.current === eventId) return;
      if (eventId) lastEventIdRef.current = eventId;

      setSseEvent({ ...payload, ts: Date.now() });
    };

    source.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      source.close();
      setSseConnected(false);
      if (sseRef.current === source) {
        sseRef.current = null;
      }
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
