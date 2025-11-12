import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Link } from "react-router-dom"; // ✅ Import Link
import audio from "@/assets/orderRing.mp3";
import config from "../../../config"; // ✅ Ensure this path is correct
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion"; // ✅ Import motion
import { Bell } from "lucide-react";

const POLLING_INTERVAL = 30000; // 30 seconds

export default function NotificationBell() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [latestOrders, setLatestOrders] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const knownOrderIds = useRef(new Set());
  const notificationSound = useMemo(() => new Audio(audio), []);
  const [token] = useState(() => localStorage.getItem("token") || "");

  const checkForNewOrders = useCallback(async () => {
    if (!token) return;
    try {
      // ✅ Use config.BASE_URL
      const res = await fetch(`${config.BASE_URL}/api/order`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch orders during poll");

      let data = await res.json();
      const allOrders = Array.isArray(data) ? data : data.orders || [];

      if (!Array.isArray(allOrders)) {
        console.error("Fetched data is not an array:", allOrders);
        return;
      }

      const newOrdersFound = [];

      // ✅ Filter for *only* new 'pending' orders
      for (const order of allOrders) {
        if (order.status === "pending" && !knownOrderIds.current.has(order._id)) {
          newOrdersFound.push(order);
          knownOrderIds.current.add(order._id);
        }
      }

      if (newOrdersFound.length > 0) {
        console.log("Found new pending orders:", newOrdersFound);

        notificationSound
          .play()
          .catch((e) => console.error("Error playing sound:", e));

        setNotificationCount((prevCount) => prevCount + newOrdersFound.length);
        setLatestOrders((prevOrders) =>
          [...newOrdersFound, ...prevOrders].slice(0, 10) // Keep latest 10
        );
      }
    } catch (error) {
      console.error("Error polling for orders:", error);
    }
  }, [notificationSound, token]);

  const runInitialCheck = useCallback(async () => {
    if (!token) return;
    try {
      // ✅ Use config.BASE_URL
      const res = await fetch(`${config.BASE_URL}/api/order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Initial order fetch failed");
      let data = await res.json();
      const allOrders = Array.isArray(data) ? data : data.orders || [];

      if (Array.isArray(allOrders)) {
        
        allOrders.forEach((order) => knownOrderIds.current.add(order._id));
       
      }
    } catch (error) {
      console.error("Error on initial order fetch:", error);
    }
  }, [token]);

  useEffect(() => {
    runInitialCheck();
    const intervalId = setInterval(checkForNewOrders, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [runInitialCheck, checkForNewOrders]);

  const handleBellClick = () => {
    setIsDropdownOpen((prev) => !prev);
    // Only reset count when OPENING the dropdown
    if (!isDropdownOpen) {
      setNotificationCount(0);
    }
  };

  const handleLinkClick = () => {
    setIsDropdownOpen(false); // Close dropdown when a link is clicked
  };

  return (
    <div className="relative">
      {/* Bell Icon and Badge */}
      <button onClick={handleBellClick} className="relative text-gray-600 focus:outline-none">
        <Bell size={30} color="#ffc107" strokeWidth={2.25} />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white pointer-events-none">
            {notificationCount}
          </span>
        )}
      </button>

      {/* Dropdown List */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-72 rounded-lg bg-white shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-gray-100">
              <h4 className="text-base font-semibold text-gray-800">New Orders</h4>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {latestOrders.length > 0 ? (
                latestOrders.map((order) => (
                  <div
                    key={order._id}
                    className="border-b border-gray-100 p-3 hover:bg-gray-50 text-sm"
                  >
                    <p className="font-medium text-gray-700">
                      Order #{order._id.slice(-6).toUpperCase()}
                      <span className="text-xs text-gray-500 ml-1">({order.customerName || 'Unknown'})</span>
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      Total: ₹{order.totalAmount?.toFixed(2) ?? 'N/A'}
                    </p>

                    {/* ✅ --- MODIFIED LINK --- */}
                    {/* This now links to the orders page with the correct query param */}
                    <Link
                      // Change '/admin/orders' if your route is different
                      to={`/admin/orders?orderId=${order._id}`} 
                      onClick={handleLinkClick} // Close dropdown on click
                      className="text-xs text-blue-500 hover:underline"
                    >
                      View Order Bill
                    </Link>
                    {/* --- End Change --- */}

                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-sm text-gray-500">No new orders.</p>
              )}
            </div>
            {latestOrders.length > 0 && (
                 <div className="p-2 bg-gray-50 border-t border-gray-100">
                      <button
                           onClick={() => {
                                setLatestOrders([]);
                                setIsDropdownOpen(false);
                           }}
                           className="w-full text-center text-xs text-gray-600 hover:text-black focus:outline-none"
                      >
                           Clear List
                      </button>
                 </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}