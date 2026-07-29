import React from "react";
import { AlertTriangle } from "lucide-react";
import { XCircleIcon } from "@heroicons/react/24/solid";

const DeleteModal = ({
  order,
  onCancel,
  onDelete,
  onCancelRoomBooking = () => {},
  onCancelFoodOnly = () => {},
}) => {
  if (!order) return null;

  const isRoomStay = order.stay?.enabled;
  const hasFoodItems = order.items && order.items.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-orange-100 bg-white/95 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_20px_45px_-24px_rgba(2,6,23,0.95)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-50/90 via-orange-50 to-white p-4 dark:border-slate-700 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {isRoomStay ? "Cancel Room Order" : "Delete Order"}
              </h2>
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
          {isRoomStay ? (
            hasFoodItems ? (
              // Room booking with food items
              <div className="mb-6">
                <div className="text-center mb-5">
                  <AlertTriangle className="mx-auto text-amber-500 mb-3" size={44} />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1">
                    Cancel Stay & Food Items
                  </h3>
                  <p className="text-sm text-gray-650 dark:text-slate-400">
                    This order for room <strong>{order.source?.unitName}</strong> has both an active room stay and food items. Select what you would like to cancel:
                  </p>
                </div>

                {/* Option Actions List */}
                <div className="space-y-3 mt-4">
                  {/* Option 1: Cancel Food Only */}
                  <button
                    onClick={onCancelFoodOnly}
                    className="w-full flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3 text-left transition hover:bg-orange-100/60 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/70"
                  >
                    <div className="mt-0.5 rounded-lg bg-orange-100 p-2 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800 dark:text-slate-200">
                        Cancel Food Items Only
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Cancel/clear food items, but keep the room stay check-in active.
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Cancel Room Stay Only */}
                  <button
                    onClick={onCancelRoomBooking}
                    className="w-full flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/30 p-3 text-left transition hover:bg-red-100/50 dark:border-slate-700/50 dark:bg-slate-900/30 dark:hover:bg-slate-900/50"
                  >
                    <div className="mt-0.5 rounded-lg bg-red-100 p-2 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800 dark:text-slate-200">
                        Cancel Room Booking Only
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Cancel room stay and free the room.
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Cancel Both Room & Food */}
                  <button
                    onClick={onCancelRoomBooking}
                    className="w-full flex items-start gap-3 rounded-xl border border-red-200 bg-red-500/10 p-3 text-left transition hover:bg-red-500/20 dark:border-red-950/40 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                  >
                    <div className="mt-0.5 rounded-lg bg-red-600 p-2 text-white">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-slate-100">
                        Cancel Both (Room & Food)
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Cancel the room stay booking and clear all ordered food items.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              // Room booking ONLY, no food items
              <div className="text-center mb-6">
                <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-2">
                  Cancel Room Booking
                </h3>
                <p className="text-gray-650 dark:text-slate-450">
                  Are you sure you want to cancel the room booking for room <strong>{order.source?.unitName}</strong>? This will free the room and make it available.
                </p>
              </div>
            )
          ) : (
            // Standard Table/Delivery/Takeaway order
            <div className="text-center mb-6">
              <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-2">
                Are you sure you want to delete this order?
              </h3>
              <p className="text-gray-650 dark:text-slate-450">
                This action cannot be undone. The order will be permanently deleted.
              </p>
            </div>
          )}

          {/* Order Summary */}
          {(!isRoomStay || !hasFoodItems) && (
            <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <h4 className="font-semibold text-gray-850 dark:text-slate-205 mb-2">Order Details:</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  <span className="font-medium">Customer:</span> {order.customerName}
                </p>
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  <span className="font-medium">Phone:</span> {order.customerPhone}
                </p>
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  <span className="font-medium">Order Type:</span> {order.orderType}
                </p>
                {order.source?.unitName && (
                  <p className="text-sm text-gray-700 dark:text-slate-300">
                    <span className="font-medium">{isRoomStay ? "Room:" : "Table:"}</span> {order.source.unitName}
                  </p>
                )}
                {order.items?.length > 0 && (
                  <p className="text-sm text-gray-700 dark:text-slate-300">
                    <span className="font-medium">Total Items:</span> {order.items?.length || 0}
                  </p>
                )}
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  <span className="font-medium">Total Amount:</span> ₹{order.totalAmount || 0}
                </p>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="h-11 rounded-xl border border-orange-200 bg-white px-6 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {isRoomStay && hasFoodItems ? "Close" : "Cancel"}
            </button>
            {(!isRoomStay || (isRoomStay && !hasFoodItems)) && (
              <button
                onClick={isRoomStay ? onCancelRoomBooking : onDelete}
                className="flex h-11 items-center space-x-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:from-red-600 hover:to-red-600"
              >
                <AlertTriangle size={18} />
                <span>{isRoomStay ? "Cancel Booking" : "Delete Order"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
