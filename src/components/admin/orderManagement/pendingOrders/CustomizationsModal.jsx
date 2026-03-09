// src/components/admin/orderManagement/CustomizationsModal.jsx
import React from "react";
import { XCircleIcon } from "@heroicons/react/24/solid";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-orange-100 bg-white/95 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-50/90 via-orange-50 to-white p-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order Customizations</h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-orange-100 hover:text-orange-700"
          >
            <XCircleIcon className="h-6 w-6" />
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
                    <div className="border-b bg-gradient-to-r from-orange-50/70 to-white p-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-800 text-lg">
                          {item.itemName}
                        </h4>
                        <div className="flex items-center gap-2">
                          {item.variant && (
                            <span className="rounded border border-orange-200 bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
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
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
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
        <div className="flex justify-end border-t border-orange-100 p-4">
          <button
            onClick={onClose}
            className="h-11 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationsModal;
