import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import { showBill } from "@/redux/adminRedux/billSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import audio from "@/assets/orderRing.mp3";
import { useGetOrdersQuery } from "@/redux/adminRedux/adminAPI";

const POLLING_INTERVAL = 60000; // 60 seconds for notifications

export default function NotificationBell() {
  const MotionDiv = motion.div;
  const MotionSpan = motion.span;
  const dispatch = useDispatch();
  const bellRef = useRef(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [latestOrders, setLatestOrders] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const knownOrderIds = useRef(new Set());
  const notificationSound = useMemo(() => new Audio(audio), []);

  // ✅ RTK Query with polling for PENDING orders only
  const { data: ordersResponse = {}, refetch } = useGetOrdersQuery({
    status: "pending",
    page: 1,
    limit: 20, // Get more orders for notifications
    range: "all"
  }, {
    pollingInterval: POLLING_INTERVAL,
  });

  
  const orders = useMemo(() => {
    if (!ordersResponse) return [];
    
    if (Array.isArray(ordersResponse)) return ordersResponse;
    if (Array.isArray(ordersResponse.orders)) return ordersResponse.orders;
    if (Array.isArray(ordersResponse.data)) return ordersResponse.data;
    
    return [];
  }, [ordersResponse]);

  useEffect(() => {
    if (!orders.length) return;

    const sortedOrders = [...orders].sort(
      (a, b) => new Date(b.createdAt || b.createdAt) - new Date(a.createdAt || a.createdAt)
    );

  
    const recentOrders = sortedOrders.slice(0, 15);

    
    const freshOrders = recentOrders.filter((order) => {
      if (!order._id || order.status !== "pending") return false;
      
      const isNew = !knownOrderIds.current.has(order._id);
      return isNew;
    });


    if (freshOrders.length > 0) {
      // Play sound for new orders
      try {
        notificationSound.currentTime = 0;
        notificationSound.play()
      } catch (err) {
        console.log("Sound error:", err);
      }

      // Update notification count
      setNotificationCount((prev) => prev + freshOrders.length);

      // Add new orders to the top
      setLatestOrders((prev) => {
        const newOrders = [...freshOrders, ...prev];
        // Remove duplicates by id
        const uniqueOrders = Array.from(
          new Map(newOrders.map(order => [order._id, order])).values()
        );
        return uniqueOrders.slice(0, 10); // Keep only latest 10
      });

      // Mark these orders as known
      freshOrders.forEach((order) => {
        if (order._id) knownOrderIds.current.add(order._id);
      });
    }

    const currentIds = new Set(recentOrders.map(o => o._id).filter(Boolean));
    knownOrderIds.current = new Set(
      [...knownOrderIds.current].filter(id => currentIds.has(id))
    );

  }, [orders, notificationSound]);

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
    const wasOpen = isDropdownOpen;
    setIsDropdownOpen(!wasOpen);
    
    if (!wasOpen) {
      setNotificationCount(0);
    }
  };

  const handleViewBill = (order) => {
   
    dispatch(showBill(order));
    setIsDropdownOpen(false);
  };

  const handleClearAll = () => {
    setLatestOrders([]);
    setNotificationCount(0);
    knownOrderIds.current.clear();
    setIsDropdownOpen(false);
  };

  const handleManualRefresh = () => {
    refetch();
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-orange-600 hover:text-orange-600 transition-colors duration-200 rounded-full hover:bg-orange-50 bg-orange-50"
        title="Order Notifications"
      >
        <Bell size={26} className="relative z-0" />
        
        {/* Notification counter badge */}
        {notificationCount > 0 && (
          <MotionSpan
            key={notificationCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold shadow-md"
          >
            {notificationCount > 9 ? "9+" : notificationCount}
          </MotionSpan>
        )}
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <MotionDiv
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] md:w-96"
          >
            {/* Header */}
            <div className="border-b border-orange-100 bg-gradient-to-r from-orange-400 to-orange-500 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-lg">New Orders</h4>
                  <p className="mt-1 text-sm text-orange-50">
                    Real-time notifications
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {notificationCount > 0 && (
                    <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-sm font-bold text-orange-700">
                      {notificationCount} new
                    </span>
                  )}
                  {/* <button
                    onClick={handleManualRefresh}
                    className="text-white hover:text-orange-200 p-1"
                    title="Refresh"
                  >
                    ↻
                  </button> */}
                </div>
              </div>
            </div>

            {/* Orders list */}
            <div className="max-h-96 overflow-y-auto bg-white">
              {latestOrders.length > 0 ? (
                <div className="divide-y divide-orange-100">
                  {latestOrders.map((order, index) => (
                    <MotionDiv
                      key={order._id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 transition-colors duration-150 hover:bg-orange-50/70"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Pending
                            </span>
                            <span className="text-xs text-gray-500">
                              #{order._id ? order._id.slice(-6).toUpperCase() : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">
                              ₹{order.totalAmount || 0}
                            </p>
                            {order.items && (
                              <p className="text-sm text-gray-600 line-clamp-1">
                                {order.items.map(item => item.name).join(', ')}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {order.createdAt ? (
                                new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: true
                                })
                              ) : 'Just now'}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleViewBill(order)}
                          className="ml-3 whitespace-nowrap rounded-lg border border-orange-200 bg-orange-100 px-3 py-2 text-xs font-semibold text-orange-700 transition-colors duration-200 hover:bg-orange-200"
                        >
                          View Bill
                        </button>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                    <Bell size={24} className="text-orange-500" />
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-800">No new orders</h3>
                  <p className="mb-4 text-sm text-gray-500">
                    New pending orders will appear here
                  </p>
                  <button
                    onClick={handleManualRefresh}
                    className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100"
                  >
                    Check for orders
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-orange-100 bg-white">
              <div className="flex items-center justify-between p-3">
                <button
                  onClick={handleClearAll}
                  disabled={latestOrders.length === 0}
                  className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                    latestOrders.length > 0 
                      ? "font-semibold text-orange-700 hover:bg-orange-200 hover:text-orange-900" 
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Clear all
                </button>
                
                <div className="text-xs font-medium text-gray-600">
                  {latestOrders.length} order{latestOrders.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
