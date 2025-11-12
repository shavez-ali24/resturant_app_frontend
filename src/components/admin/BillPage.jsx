import React, { useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion"; // Optional: for modal animation

const BillPage = ({ order, restaurantDetails, onClose }) => {
  console.log(order)
  const billRef = useRef();

  const handlePrint = () => {
    const printContents = billRef.current.innerHTML;
    const styles = `<style>
            @media print {
                body * { visibility: hidden; }
                .printable-bill, .printable-bill * { visibility: visible; }
                .printable-bill { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; font-family: sans-serif; font-size: 10pt; }
                .no-print { display: none !important; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                th, td { border: 1px solid #ccc; padding: 5px; text-align: left; }
                th { background-color: #eee; font-weight: bold; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .border-t { border-top: 1px solid #ccc; }
                .pt-2 { padding-top: 8px; }
                .mt-2 { margin-top: 0.5rem; }
                .mb-4 { margin-bottom: 1rem; }
                .mb-6 { margin-bottom: 1.5rem; }
                .space-y-1 > * + * { margin-top: 0.25rem; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .gap-x-4 { column-gap: 1rem; }
                .gap-y-1 { row-gap: 0.25rem; }
                .capitalize { text-transform: capitalize; }
                .w-full { width: 100%; }
                .max-w-xs { max-width: 20rem; }
                .ml-auto { margin-left: auto; }
                .flex-col { flex-direction: column; }
                .items-end { align-items: flex-end; }
                .p-3 { padding: 0.75rem; }
                .bg-gray-50 { background-color: #f9fafb; }
                .rounded-lg { border-radius: 0.5rem; }
                .border { border: 1px solid #e5e7eb; }
                .text-gray-800 { color: #1f2937; }
                .text-gray-600 { color: #4b5563; }
                .mt-1 { margin-top: 0.25rem; }
            }
        </style>`;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML =
      styles + `<div class="printable-bill">${printContents}</div>`;
    window.print();
    document.body.innerHTML = originalContents;
    onClose(); // Close modal after print
  };

  const fallbackSubtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Use the saved 'subtotal' if it exists, otherwise use the fallback.
  const displaySubtotal =
    order.subtotal !== undefined ? order.subtotal : fallbackSubtotal;

  // Use the saved GST rate, GST amount, and Grand Total from the order.
  const displayGstRate = order.gstRate || 0;
  const displayGstAmount = order.gstAmount || 0;
  const displayGrandTotal = order.totalAmount || 0;
  // --- End Bill Totals ---
  // --- End Dynamic Calculations ---

  // --- Safe Restaurant Details ---
  const restaurantName =
    restaurantDetails?.restaurantName ||
    restaurantDetails?.name ||
    "Restaurant Name";
  const restaurantAddress = restaurantDetails?.address || "Restaurant Address";
  const restaurantPhone = restaurantDetails?.phoneNumber || "N/A";
  const restaurantGstin =
    restaurantDetails?.gstEnabled && restaurantDetails.gstNumber
      ? restaurantDetails.gstNumber
      : null;
  // --- End Safe Details ---

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 no-print"
      onClick={onClose} // Close on backdrop click
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing on modal content click
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
          <h3 className="text-lg font-semibold text-gray-800">
            Order Details & Bill
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        {/* Scrollable Bill Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Bill content area for printing */}
          <div ref={billRef} className="printable-bill">
            {/* Restaurant Header - Dynamic */}
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-xl md:text-2xl font-bold">
                🍴 {restaurantName}
              </h2>
              <p className="text-gray-600 text-sm">{restaurantAddress}</p>
              <p className="text-gray-600 text-sm">Phone: {restaurantPhone}</p>
              {restaurantGstin && (
                <p className="text-gray-600 text-sm">
                  GSTIN: {restaurantGstin}
                </p>
              )}
            </div>

            {/* Customer & Order Info - Dynamic */}
            <div className="mb-4 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
              <p>
                <span className="font-semibold">Order ID:</span>{" "}
                {order._id.slice(-6)}
              </p>

              {/* ✅✅✅ THIS IS THE FIX ✅✅✅ */}
              {/* Only show Table row if tableId exists */}
              {order.tableId && (
                <p>
                  <span className="font-semibold">Table:</span> {order.tableId}
                </p>
              )}
              {/* ✅✅✅ END OF FIX ✅✅✅ */}

              <p>
                <span className="font-semibold">Customer:</span>{" "}
                {order.customerName}
              </p>
              <p>
                <span className="font-semibold">Phone:</span>{" "}
                {order.customerPhone}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>

              <p>
                <span className="font-semibold">Type:</span>{" "}
                <span className="capitalize">{order.orderType || "N/A"}</span>
              </p>
            </div>

            {/* Conditionally show address for Delivery */}
            {order.orderType === "Delivery" && order.address && (
              <div className="mb-4 text-sm p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p>
                  <span className="font-semibold text-gray-800">
                    Delivery Address:
                  </span>
                  <br />
                  <span className="text-gray-600">{order.address}</span>
                </p>
              </div>
            )}

            {/* Items Table - Dynamic */}
            <table className="w-full text-sm border-t border-b mb-4">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="py-2 px-2 font-semibold">Item</th>
                  <th className="py-2 px-1 text-center font-semibold">Qty</th>
                  <th className="py-2 px-2 text-right font-semibold">Price</th>
                  <th className="py-2 px-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr
                    key={item._id || idx}
                    className="border-b last:border-b-0"
                  >
                    <td className="py-1.5 px-2">{item.name}</td>
                    <td className="py-1.5 px-1 text-center">{item.quantity}</td>
                    <td className="py-1.5 px-2 text-right">
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals - Dynamic */}
            <div className="text-sm space-y-1 mb-6 flex flex-col items-end w-full max-w-xs ml-auto">
              <div className="flex justify-between w-full">
                <span>Subtotal</span>
                <span>₹{displaySubtotal.toFixed(2)}</span>
              </div>
              {displayGstAmount > 0 && ( // Show if GST *amount* is > 0
                <div className="flex justify-between w-full">
                  <span>GST ({displayGstRate}%)</span>
                  <span>₹{displayGstAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2 mt-2 w-full">
                <span>Grand Total</span>
                <span>₹{displayGrandTotal.toFixed(2)}</span>
              </div>
            </div>
            {/* Totals - Dynamic */}

            {/* Footer */}
            <p className="text-center text-gray-600 text-xs border-t pt-3">
              ⭐ Thank you! Visit again! ⭐
            </p>
          </div>{" "}
          {/* End printable-bill */}
        </div>{" "}
        {/* End Scrollable Area */}
        {/* Modal Footer with Buttons */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm2 0v1h6V4H7zm6 5H7a1 1 0 000 2h6a1 1 0 100-2zm-3 4H7a1 1 0 100 2h3a1 1 0 100-2z"
                clipRule="evenodd"
              ></path>
            </svg>
            Print Bill
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BillPage;
