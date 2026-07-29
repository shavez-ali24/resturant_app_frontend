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

const MAX_NOTIFICATIONS = 2; // Better UX - limit concurrent toasts on screen

const NotificationToasts = lazy(() => import("./NotificationToasts"));

import { SSEConnectionManager } from "@/utils/sseConnectionManager";
import { getFriendlyAdminMessage } from "@/utils/errorHelpers";

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [sseEvent, setSseEvent] = useState(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [newlyAddedItemsOrderIds, setNewlyAddedItemsOrderIds] = useState(() => new Set());
  // Map<orderId, Set<itemKey>> — tracks which specific items are new per order
  const [newItemsByOrderId, setNewItemsByOrderId] = useState(() => new Map());
  const sseManagerRef = useRef(null);
  const lastEventSignatureRef = useRef(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const token = localStorage.getItem("admin_token");
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
        const actualOrder = payload?.data?.order || payload?.data;
        const eventSignature = [
          actualOrder?._id || actualOrder?.id || actualOrder?.orderId || actualOrder?.unitId || "",
          actualOrder?.status || actualOrder?.action || "",
          actualOrder?.updatedAt || Date.now(),
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
    <NotificationContext.Provider value={{
      notify,
      sseEvent,
      sseConnected,
      newlyAddedItemsOrderIds,
      setNewlyAddedItemsOrderIds,
      newItemsByOrderId,
      setNewItemsByOrderId,
    }}>
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
