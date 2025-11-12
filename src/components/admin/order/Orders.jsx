/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OrdersTable from "./OrdersTable";
import EditOrderModal from "./EditOrderModal";
import DeleteModal from "./DeleteModal";
import ItemsModal from "./ItemsModal";
import config from "../../../config";
import { SlRefresh } from "react-icons/sl";
import Heading from "../ui/Heading";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [orderForBillModal, setOrderForBillModal] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // ✅ State from PendingOrders
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(
    localStorage.getItem("autoRefresh") || "OFF"
  );
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);



  const token = localStorage.getItem("token") || "";
  const API_URL = `${config.BASE_URL}/api/order`;

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000
    );
  };

  const closeNotification = () =>
    setNotification({ show: false, message: "", type: "" });

  const fetchRestaurantDetails = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${config.BASE_URL}/api/restaurant/admin`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch restaurant details");

      const data = await res.json();

      if (data.restaurant) {
        setRestaurantDetails(data.restaurant);
      } else {
        throw new Error("Restaurant data not found in response");
      }
    } catch (err) {
      console.error(err);
      showNotification("Could not load restaurant details for bills", "error");
    }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    if (!token)
      return showNotification("No token found. Please login first", "error");
    try {
      setLoading(true);
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid data format from API");
      setOrders(data.reverse());
      setLastUpdated(new Date()); // Already here, perfect
    } catch (err) {
      console.error(err);
      setError(err.message);
      showNotification("Failed to fetch orders", "error");
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  const fetchMenuItems = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${config.BASE_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch menu items");
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.menu || data.data || [];
      if (!Array.isArray(items)) throw new Error("Invalid menu data");
      setMenuItems(items);
    } catch (err) {
      console.error(err);
      setMenuItems([]);
      showNotification("Failed to fetch menu items", "error");
    }
  }, [token]);

  const updateOrder = async (orderId, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error("Failed to update order");
      await fetchOrders(); // This fetches new orders, which will trigger the sync effect
      setEditingOrder(null);
      showNotification("Order updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification(err.message, "error");
    }
  };
  useEffect(() => {

    if (orderForBillModal) {

      const updatedOrder = orders.find(
        (o) => o._id === orderForBillModal._id
      );

      if (updatedOrder) {

        setOrderForBillModal(updatedOrder);
      } else {

        setOrderForBillModal(null);
      }
    }

  }, [orders]);

  // ✅ 2. FILLED IN deleteOrder (copied from PendingOrders)
  const deleteOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete order");
      await fetchOrders();
      setShowConfirmDelete(null);
      showNotification("Order deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification(err.message, "error");
    }
  };

  // ✅ 3. ADDED REFRESH HANDLERS (copied from PendingOrders)
  const handleManualRefresh = async () => {
    await fetchOrders();
  };

  const startAutoRefresh = (minutes) => {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    const id = setInterval(() => {
      console.log("🔁 Auto-refresh triggered");
      fetchOrders();
    }, minutes * 60 * 1000);
    setAutoRefreshInterval(id);
    localStorage.setItem("autoRefresh", `${minutes} min`);
  };

  const stopAutoRefresh = () => {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    setAutoRefresh("OFF");
    setAutoRefreshInterval(null);
    localStorage.setItem("autoRefresh", "OFF");
  };

  // Main useEffect (unchanged, still fetches restaurantDetails)
  useEffect(() => {
    if (!token) {
      showNotification("No token found. Please login first", "error");
      setLoading(false);
      return;
    }
    fetchOrders();
    fetchMenuItems();
    fetchRestaurantDetails(); // 👈 Your logic is preserved
  }, [token, fetchOrders, fetchMenuItems, fetchRestaurantDetails]);

  // ✅ 4. ADDED Auto-Refresh Persistence useEffect (copied from PendingOrders)
  useEffect(() => {
    const saved = localStorage.getItem("autoRefresh");
    if (saved && saved !== "OFF") {
      const mins = parseInt(saved);
      if (!isNaN(mins)) {
        setAutoRefresh(saved);
        startAutoRefresh(mins);
      }
    }
    return () => {
      if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    };
  }, []); // Runs once on mount

  const pendingOrders = orders.filter((o) => o.status === "pending");

  return (
    <div className="min-h-screen  px-4 py-6 sm:px-6 lg:px-8 relative">

      {/* ✅ 5. ADDED Notification Modal JSX (copied from PendingOrders) */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeNotification}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.3 }}
              className={`relative rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-auto ${notification.type === "success"
                ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
                : "bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200"
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div
                  className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 ${notification.type === "success"
                    ? "bg-green-100 text-green-600 border-2 border-green-200"
                    : "bg-red-100 text-red-600 border-2 border-red-200"
                    }`}
                >
                  {notification.type === "success" ? (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h3 className={`text-3xl font-bold mb-4 ${notification.type === "success" ? "text-green-900" : "text-red-900"}`}>
                  {notification.type === "success" ? "Success!" : "Oops!"}
                </h3>
                <p className={`text-xl mb-8 leading-relaxed ${notification.type === "success" ? "text-green-700" : "text-red-700"}`}>
                  {notification.message}
                </p>
                <motion.button
                  onClick={closeNotification}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  className={`w-full py-5 rounded-2xl text-xl font-bold shadow-lg transition-all ${notification.type === "success"
                    ? "bg-green-500 text-white hover:bg-green-600 shadow-green-200"
                    : "bg-red-500 text-white hover:bg-red-600 shadow-red-200"
                    }`}
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ 6. ADDED Header/Buttons JSX (copied from PendingOrders) */}
      <div className="">
        <div className="flex flex-row items-center justify-between mb-6 gap-3">
          <Heading title="Pending Orders" />
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              className="p-2 sm:px-3 sm:py-2 bg-orange-500 text-white font-normal rounded-xl hover:bg-orange-600 transition flex items-center gap-1 sm:gap-2"
            >
              <SlRefresh className="text-sm sm:text-base" />
              <span className="hidden xs:inline text-xs sm:text-sm">Refresh</span>
            </button>

            {/* Auto Refresh Dropdown */}
            <div className="flex items-center gap-1 sm:gap-2">
              <label htmlFor="autoRefresh" className="hidden sm:inline text-sm text-gray-600 font-medium whitespace-nowrap">
                Auto Refresh:
              </label>
              <select
                id="autoRefresh"
                value={autoRefresh}
                onChange={(e) => {
                  const value = e.target.value;
                  setAutoRefresh(value);
                  if (value === "OFF") stopAutoRefresh();
                  else {
                    const mins = parseInt(value);
                    if (!isNaN(mins)) startAutoRefresh(mins);
                  }
                }}
                className="px-2 py-1 sm:px-3 sm:py-2 border rounded-lg text-xs sm:text-sm font-medium bg-white hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-20 sm:min-w-32"
              >
                <option value="OFF">Off</option>
                <option value="1 min">1 min</option>
                <option value="2 min">2 min</option>
                <option value="5 min">5 min</option>
              </select>
            </div>
          </div>
        </div>

        {/* Last updated text */}
        {lastUpdated && (
          <p className="text-right text-xs text-gray-500 mb-2">
            Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        <OrdersTable
          orders={pendingOrders}
          loading={loading}
          error={error}
          setEditingOrder={setEditingOrder}
          setShowConfirmDelete={setShowConfirmDelete}
          setOrderForBillModal={setOrderForBillModal}
          updateOrder={updateOrder}
          tableType="pending" // ✅ 7. Added tableType prop
        />
      </div>

      {/* Modals (Unchanged) */}
      {orderForBillModal && (
        <ItemsModal
          order={orderForBillModal}
          restaurantDetails={restaurantDetails} // 👈 Your prop is preserved
          onClose={() => setOrderForBillModal(null)}
        />
      )}
      {editingOrder && (
        <EditOrderModal
          editingOrder={editingOrder}
          setEditingOrder={setEditingOrder}
          updateOrder={updateOrder}
          menuItems={menuItems}
        />
      )}
      {showConfirmDelete && (
        <DeleteModal
          order={showConfirmDelete}
          onCancel={() => setShowConfirmDelete(null)}
          onDelete={() => deleteOrder(showConfirmDelete._id)}
        />
      )}
    </div>
  );
};

export default Orders