// src/components/admin/orderManagement/DeleteModal.jsx
import React from "react";
import { X, AlertTriangle } from "lucide-react";

const DeleteModal = ({ order, onCancel, onDelete }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"   onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="text-white" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Delete Order</h2>
              <p className="text-white/80 text-sm mt-1">
                Order #{order._id?.slice(-6) || "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:text-gray-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Are you sure you want to delete this order?
            </h3>
            <p className="text-gray-600">
              This action cannot be undone. The order will be permanently deleted.
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">Order Details:</h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Customer:</span> {order.customerName}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Phone:</span> {order.customerPhone}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Order Type:</span> {order.orderType}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Total Items:</span> {order.items?.length || 0}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Total Amount:</span> ₹{order.totalAmount || 0}
              </p>
            </div>
          </div>

          {/* Warning Note */}
          {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Warning:</span> Deleting this order will remove all associated data including payment information and order history.
            </p>
          </div> */}

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center space-x-2"
            >
              <AlertTriangle size={18} />
              <span>Delete Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;