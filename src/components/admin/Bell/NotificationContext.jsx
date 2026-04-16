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

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [sseEvent, setSseEvent] = useState(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [sseRetryKey, setSseRetryKey] = useState(0);
  const sseRef = useRef(null);
  const lastEventSignatureRef = useRef(null);
  const sseRetryTimer = useRef(null);
  const sseRetryCount = useRef(0);

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
      sseRef.current = null;
    }

    const connectSource = () => {
      const source = new EventSource(sseUrl);
      sseRef.current = source;

      source.onopen = () => {
        setSseConnected(true);
        sseRetryCount.current = 0;
        if (sseRetryTimer.current) {
          window.clearTimeout(sseRetryTimer.current);
          sseRetryTimer.current = null;
        }
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

        const eventSignature = [
          payload?.type || "",
          payload?.data?._id || payload?.data?.id || payload?.data?.orderId || "",
          payload?.data?.status || "",
          payload?.data?.preparingStartedAt || "",
          payload?.data?.updatedAt || "",
          payload?.data?.createdAt || "",
        ].join(":");

        if (eventSignature && lastEventSignatureRef.current === eventSignature) {
          return;
        }
        if (eventSignature) {
          lastEventSignatureRef.current = eventSignature;
        }

        setSseEvent({ ...payload, ts: Date.now() });
      };

      source.onerror = () => {
        setSseConnected(false);
        if (sseRetryTimer.current) return;

        source.close();

        const delay = Math.min(30000, 3000 + sseRetryCount.current * 3000);
        sseRetryTimer.current = window.setTimeout(() => {
          sseRetryTimer.current = null;
          sseRetryCount.current += 1;
          setSseRetryKey((prev) => prev + 1);
        }, delay);
      };
    };

    connectSource();

    return () => {
      if (sseRetryTimer.current) {
        window.clearTimeout(sseRetryTimer.current);
        sseRetryTimer.current = null;
      }
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      setSseConnected(false);
    };
  }, [sseRetryKey]);

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
