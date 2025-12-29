// src/components/admin/orderManagement/CustomizationsModal.jsx
import React from "react";
import { X } from "lucide-react";

const CustomizationsModal = ({ order, onClose }) => {
  if (!order || !order.items) return null;

  // Extract all customizations from order items
  const customizations = order.items
    .filter(item => item.customizations && item.customizations.trim() !== "")
    .map(item => ({
      itemName: item.name,
      variant: item.variant,
      customizations: item.customizations
    }));

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Order Customizations</h2>
            <p className="text-white/80 text-sm mt-1">
              Order #{order._id?.slice(-6) || "N/A"} • {order.customerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {customizations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No customizations in this order</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                  Items with Customizations ({customizations.length})
                </h3>
                {/* <p className="text-sm text-gray-600">
                  Below are the custom requests for each menu item
                </p> */}
              </div>

              {/* Customizations List */}
              <div className="space-y-4">
                {customizations.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl overflow-hidden shadow-sm transition"
                  >
                    {/* Item Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 border-b">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-800 text-lg">
                          {item.itemName}
                        </h4>
                        <div className="flex items-center gap-2">
                          {item.variant && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              {item.variant}
                            </span>
                          )}
                          <span className="text-sm text-gray-600">
                            Item #{index + 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Customizations Content */}
                    <div className="p-4 bg-white">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1 w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-gray-600 mb-2">
                            Customer Request:
                          </h5>
                          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <p className="text-gray-800 whitespace-pre-wrap">
                              {item.customizations}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600">Order Details</h4>
                    <p className="text-sm text-gray-800 mt-1">
                      <span className="font-medium">Total Items:</span> {order.items?.length || 0}
                    </p>
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">Customized Items:</span> {customizations.length}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600">Customer</h4>
                    <p className="text-sm text-gray-800 mt-1">{order.customerName}</p>
                    <p className="text-sm text-gray-800">{order.customerPhone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationsModal;