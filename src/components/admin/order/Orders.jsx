/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */

import React, { useEffect, useState, useCallback } from "react";
import { useNotification } from "../context/NotificationContext"; 
import { SlRefresh } from "react-icons/sl";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrdersTable from "./OrdersTable";
import EditOrderModal from "./EditOrderModal";
import DeleteModal from "./DeleteModal";
import ItemsModal from "./ItemsModal";
import Heading from "../ui/Heading";
import config from "../../../config";

const Orders = () => {
  const { notify } = useNotification();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [orderForBillModal, setOrderForBillModal] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantDetails, setRestaurantDetails] = useState(null);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(localStorage.getItem("autoRefresh") || "OFF");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);

  const token = localStorage.getItem("token") || "";
  const API_URL = `${config.BASE_URL}/api/order`;

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
        notify("Restaurant details not found", "error");
      }
    } catch (err) {
      notify("Could not load restaurant details", "error");
    }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    if (!token) return notify("No token found. Please login first", "error");

    try {
      setLoading(true);
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch orders");

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid data format");

      setOrders(data.reverse());
      setLastUpdated(new Date());
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMenuItems = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${config.BASE_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch menu items");

      const data = await res.json();
      const items = Array.isArray(data) ? data : data.menu || data.data || [];

      setMenuItems(items);
    } catch (err) {
      notify("Failed to fetch menu items", "error");
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

      await fetchOrders();
      setEditingOrder(null);
      notify("Order updated successfully!", "success");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  useEffect(() => {
    if (orderForBillModal) {
      const updatedOrder = orders.find((o) => o._id === orderForBillModal._id);
      setOrderForBillModal(updatedOrder || null);
    }
  }, [orders]);

  const deleteOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete order");

      await fetchOrders();
      setShowConfirmDelete(null);
      notify("Order deleted successfully!", "success");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleManualRefresh = async () => {
    notify("Refreshing orders...", "info");
    await fetchOrders();
  };

  const startAutoRefresh = (minutes) => {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);

    const id = setInterval(() => {
      fetchOrders();
    }, minutes * 60 * 1000);

    setAutoRefreshInterval(id);
    localStorage.setItem("autoRefresh", `${minutes} min`);
    notify(`Auto-refresh set to every ${minutes} min`, "success");
  };

  const stopAutoRefresh = () => {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    setAutoRefresh("OFF");
    setAutoRefreshInterval(null);
    localStorage.setItem("autoRefresh", "OFF");
    notify("Auto-refresh turned off", "info");
  };

  useEffect(() => {
    if (!token) {
      notify("No token found. Login required.", "error");
      setLoading(false);
      return;
    }
    fetchOrders();
    fetchMenuItems();
    fetchRestaurantDetails();
  }, [token]);

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
  }, []);

  const pendingOrders = orders.filter((o) => o.status === "pending");

  return (
    <div className="min-h-screen py-6 sm:px-4 lg:px-4">
      {/* Header */}
      <div className="flex flex-row items-center justify-between p-3 sm:p-4 mb-6 gap-3">
        <Heading title="Pending Orders" />

        <div className="flex items-center gap-2">

          <button
            onClick={handleManualRefresh}
            className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2"
          >
            <SlRefresh />
            <span className="hidden sm:inline text-sm">Refresh</span>
          </button>

          {/* Auto Refresh Select */}
          <Select
            value={autoRefresh}
            onValueChange={(value) => {
              setAutoRefresh(value);
              if (value === "OFF") stopAutoRefresh();
              else {
                const mins = parseInt(value);
                if (!isNaN(mins)) startAutoRefresh(mins);
              }
            }}
          >
            <SelectTrigger className="h-9 w-[140px] rounded-lg border px-3 text-xs font-bold uppercase shadow-sm ring-1 ring-gray-300">
              <SelectValue placeholder="Auto Refresh" />
            </SelectTrigger>

            <SelectContent className="bg-white border shadow-xl rounded-xl p-1 min-w-[140px]">
              <SelectGroup>
                <SelectItem value="OFF">Off</SelectItem>
                <SelectItem value="1">Every 1 min</SelectItem>
                <SelectItem value="2">Every 2 min</SelectItem>
                <SelectItem value="5">Every 5 min</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

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
        tableType="pending"
      />

      {orderForBillModal && (
        <ItemsModal
          order={orderForBillModal}
          restaurantDetails={restaurantDetails}
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

export default Orders;
