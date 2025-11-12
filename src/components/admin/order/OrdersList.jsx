/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import OrdersTable from "./OrdersTable";
import EditOrderModal from "./EditOrderModal";
import DeleteModal from "./DeleteModal";
import ItemsModal from "./ItemsModal";
import config from "../../../config";

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(null);

  const API_URL = `${config.BASE_URL}/api/order`;

  const fetchOrders = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();

      // ✅ Just reverse orders, no order number logic
      setOrders(data.reverse());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch(`${config.BASE_URL}/api/menu`);
      if (!res.ok) throw new Error("Failed to fetch menu items");
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const updateOrder = async (orderId, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error("Failed to update order");
      fetchOrders();
      setEditingOrder(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete order");
      fetchOrders();
      setShowConfirmDelete(null);
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();

    const interval = setInterval(fetchOrders, 2000);
    return () => clearInterval(interval);
    
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Orders Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">
            Showing {orders.length} Order{orders.length !== 1 && "s"}
          </p>
        </div>

        <OrdersTable
          orders={orders}
          loading={loading}
          error={error}
          updateOrder={updateOrder}
          setEditingOrder={setEditingOrder}
          setShowConfirmDelete={setShowConfirmDelete}
          setSelectedItems={setSelectedItems}
        />
      </div>

      {selectedItems && (
        <ItemsModal
          order={selectedItems}
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

export default OrdersList;
