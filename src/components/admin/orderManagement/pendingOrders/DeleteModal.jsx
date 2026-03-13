// src/components/admin/orderManagement/DeleteModal.jsx
import React from "react";
import { AlertTriangle } from "lucide-react";
import { XCircleIcon } from "@heroicons/react/24/solid";

const DeleteModal = ({ order, onCancel, onDelete }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]" onClick={onCancel}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-orange-100 bg-white/95 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_20px_45px_-24px_rgba(2,6,23,0.95)]" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-50/90 via-orange-50 to-white p-4 dark:border-slate-700 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Delete Order</h2>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-orange-100 hover:text-orange-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-orange-300"
          >
            <XCircleIcon className="h-6 w-6" />
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
          <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
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
              className="h-11 rounded-xl border border-orange-200 bg-white px-6 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="flex h-11 items-center space-x-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:from-red-600 hover:to-red-600"
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
