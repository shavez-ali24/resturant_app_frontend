/* eslint-disable no-unused-vars */
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import audio from "@/assets/orderRing.mp3";
import config from "../../../config";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";

// ⚡ Faster but safe polling interval
const POLLING_INTERVAL = 3000; // 3 seconds

export default function NotificationBell() {
  const dispatch = useDispatch();
  const bellRef = useRef(null);

  const [notificationCount, setNotificationCount] = useState(0);
  const [latestOrders, setLatestOrders] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const knownOrderIds = useRef(new Set());
  const notificationSound = useMemo(() => new Audio(audio), []);

  const token = localStorage.getItem("token");

  // 🔥 Initial load — mark existing orders as "known"
  const runInitialCheck = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${config.BASE_URL}/api/order`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const allOrders = Array.isArray(data) ? data : data.orders || [];

      // store only recent 30 ids
      allOrders
        .slice(0, 30)
        .forEach((order) => knownOrderIds.current.add(order._id));
    } catch (err) {
      console.error("Initial order fetch failed:", err);
    }
  }, [token]);

  // 🔥 Poll server fast and detect ONLY new pending orders
  const checkForNewOrders = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${config.BASE_URL}/api/order`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const allOrders = Array.isArray(data) ? data : data.orders || [];

      // sort newest → oldest
      const sorted = [...allOrders].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // check only top 15 newest orders
      const recentOrders = sorted.slice(0, 15);

      const fresh = recentOrders.filter(
        (o) => o.status === "pending" && !knownOrderIds.current.has(o._id)
      );

      if (fresh.length > 0) {
        // alert sound
        if (!isDropdownOpen) {
          notificationSound.play().catch(() => {});
        }

        // UI badge count
        setNotificationCount((prev) => prev + fresh.length);

        // Latest list for dropdown
        setLatestOrders((prev) =>
          [...fresh, ...prev].slice(0, 10) // keep latest 10
        );

        // mark as known
        fresh.forEach((o) => knownOrderIds.current.add(o._id));
      }

      // prevent memory explosion
      if (knownOrderIds.current.size > 200) {
        knownOrderIds.current = new Set(
          [...knownOrderIds.current].slice(-80)
        );
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, [token, notificationSound, isDropdownOpen]);

  // 🔥 Initialize + start polling
  useEffect(() => {
    runInitialCheck();
    const intervalId = setInterval(checkForNewOrders, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [runInitialCheck, checkForNewOrders]);

  // close dropdown when clicked outside
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellClick = () => {
    setIsDropdownOpen((open) => !open);
    if (!isDropdownOpen) setNotificationCount(0);
  };

  return (
    <div className="relative" ref={bellRef}>
      <button onClick={handleBellClick} className="relative text-gray-600">
        <Bell size={30} color="#ffc107" />

        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
            {notificationCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-white border shadow-xl rounded-lg z-50"
          >
            <div className="p-3 border-b">
              <h4 className="font-semibold">New Orders</h4>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {latestOrders.length > 0 ? (
                latestOrders.map((order) => (
                  <div
                    key={order._id}
                    className="p-3 border-b hover:bg-gray-50 text-sm"
                  >
                    <p className="font-medium">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      Total: ₹{order.totalAmount}
                    </p>

                    <button
                      onClick={() => dispatch(showBill(order))}
                      className="text-xs text-blue-600 underline"
                    >
                      View Bill
                    </button>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-sm text-gray-500">
                  No new orders.
                </p>
              )}
            </div>

            {latestOrders.length > 0 && (
              <button
                onClick={() => {
                  setLatestOrders([]);
                  setIsDropdownOpen(false);
                }}
                className="w-full p-2 text-xs text-gray-600 bg-gray-50 border-t hover:text-black"
              >
                Clear List
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
