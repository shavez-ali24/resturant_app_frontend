import React, { useCallback, useEffect, useState, useMemo } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import OrdersTable from "./OrdersTable";
import EditOrderModal from "./EditOrderModal";
import DeleteModal from "./DeleteModal";
import ItemsModal from "./ItemsModal";
import config from "../../../config";
import Heading from "../ui/Heading";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { getStatusBadge } from "./utils";
import { Calendar1, CalendarCheck, CalendarFold, CalendarRange, ClipboardCheck, Hourglass, List, X } from "lucide-react";

const CompletedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [restaurantDetails, setRestaurantDetails] = useState(null);

  // ✅ 1. Add state for filters
  const [dateFilter, setDateFilter] = useState("today"); // Default to 'today'
  // const [nameFilter, setNameFilter] = useState("");

  const token = localStorage.getItem("token") || "";
  const API_URL = `${config.BASE_URL}/api/order`;
  const tableType = "complete";

  const showNotification = (message, type = "success") => {
    // ... (your existing showNotification function)
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      2000
    );
  };

  const closeNotification = () =>
    setNotification({ show: false, message: "", type: "" });

  const fetchOrders = useCallback(async () => {
    // ... (your existing fetchOrders function)
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
    } catch (err) {
      console.error(err);
      setError(err.message);
      showNotification("Failed to fetch orders", "error");
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  const fetchMenuItems = useCallback(async () => {
    // ... (your existing fetchMenuItems function)
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

  const fetchRestaurantDetails = useCallback(async () => {
    // ... (your existing fetchRestaurantDetails function)
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

  const updateOrder = async (orderId, updatedData) => {
    // ... (your existing updateOrder function)
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
      await fetchOrders();
      setEditingOrder(null);
      showNotification("Order updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification(err.message, "error");
    }
  };

  const deleteOrder = async (orderId) => {
    // ... (your existing deleteOrder function)
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

  useEffect(() => {
    // ... (your existing useEffect)
    if (!token) {
      showNotification("No token found. Please login first", "error");
      setLoading(false);
      return;
    }
    fetchOrders();
    fetchMenuItems();
    fetchRestaurantDetails();
  }, [token, fetchOrders, fetchMenuItems, fetchRestaurantDetails]);

  // ✅ 2. Create the filtering logic
  const filteredCompletedOrders = useMemo(() => {
    // Get reference dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const startOfWeek = new Date(today);
    // Adjust to Monday as start of week if needed, here it's Sunday
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders
      .filter((o) => o.status === "completed") // Filter by status first
      .filter((o) => { // Finally, filter by date
        const orderDate = new Date(o.createdAt);
        switch (dateFilter) {
          case "today":
            return orderDate >= today;
          case "yesterday":
            return orderDate >= yesterday && orderDate < today;
          case "week":
            return orderDate >= startOfWeek;
          case "month":
            return orderDate >= startOfMonth;
          case "all":
          default:
            return true;
        }
      });
  }, [orders, dateFilter]); // Re-filter when data or filters change

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 relative">
      <AnimatePresence>
        {notification.show && (
          // ... (your existing notification JSX)
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
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.3,
              }}
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
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
                <h3
                  className={`text-3xl font-bold mb-4 ${notification.type === "success"
                    ? "text-green-900"
                    : "text-red-900"
                    }`}
                >
                  {notification.type === "success" ? "Success!" : "Oops!"}
                </h3>
                <p
                  className={`text-xl mb-8 leading-relaxed ${notification.type === "success"
                    ? "text-green-700"
                    : "text-red-700"
                    }`}
                >
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

      <div>
        <div className="mb-4 flex flex-col sm:flex-row justify-between gap-4">
          <Heading title={"Completed Orders"} />

          {/* NEW DATE FILTER ONLY (Old one removed) */}
          <Select
            value={dateFilter}
            onValueChange={(val) => setDateFilter(val)}
          >
            <SelectTrigger className="h-9 w-[160px] rounded-lg border px-3 text-xs font-bold uppercase shadow-sm ring-1 ring-gray-300 transition-all hover:bg-gray-50">
              <span className="mx-auto">
                <SelectValue placeholder="Filter" />
              </span>
            </SelectTrigger>

            <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl p-1 min-w-[140px]">
              <SelectGroup>
                {/* Today */}
                <SelectItem
                  value="today"
                  className="cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CalendarCheck size={16} /> Today
                  </div>
                </SelectItem>

                {/* Yesterday */}
                <SelectItem
                  value="yesterday"
                  className="cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CalendarFold size={16} /> Yesterday
                  </div>
                </SelectItem>

                {/* Week */}
                <SelectItem
                  value="week"
                  className="cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CalendarRange size={16} /> This Week
                  </div>
                </SelectItem>

                {/* Month */}
                <SelectItem
                  value="month"
                  className="cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar1 size={16} /> This Month
                  </div>
                </SelectItem>

                {/* All Time */}
                <SelectItem
                  value="all"
                  className="cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <List size={16} /> All Time
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <OrdersTable
          // ✅ 4. Pass the new filtered list
          orders={filteredCompletedOrders}
          loading={loading}
          error={error}
          setEditingOrder={setEditingOrder}
          setShowConfirmDelete={setShowConfirmDelete}
          setOrderForBillModal={setSelectedItems}
          updateOrder={updateOrder}
          tableType={tableType}
        />
      </div>

      {/* ... (Your Modals: ItemsModal, EditOrderModal, DeleteModal) ... */}
      {selectedItems && (
        <ItemsModal
          order={selectedItems}
          restaurantDetails={restaurantDetails}
          onClose={() => setSelectedItems(null)}
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

export default CompletedOrders;