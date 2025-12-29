import React, { useRef } from "react";
import { motion } from "framer-motion";

const BillPage = ({ order, restaurantDetails, onClose }) => {
  const billRef = useRef();

  const handlePrint = () => {
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = 0;
    printFrame.style.bottom = 0;
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";

    document.body.appendChild(printFrame);
    const doc = printFrame.contentWindow.document;

    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("");
        } catch {
          return "";
        }
      })
      .join("");

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>${styles}</style>
        </head>
        <body>
          ${billRef.current.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      }, 300);

      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    };
  };


  const itemsTotal = order.items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const gstRate = Number(order.gstRate || 0);
  const gstAmount = (itemsTotal * gstRate) / 100;
  const displaySubtotal = itemsTotal;
  const displayGrandTotal = itemsTotal + gstAmount;

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0  bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
          <h3 className="text-lg font-semibold text-gray-800">
            Order Details & Bill
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={billRef} className="printable-bill">

            {/* Restaurant Header */}
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold">{restaurantName}</h2>
              <p className="text-gray-600 text-sm">{restaurantAddress}</p>
              <p className="text-gray-600 text-sm">Phone: {restaurantPhone}</p>
              {restaurantGstin && (
                <p className="text-gray-600 text-sm">GSTIN: {restaurantGstin}</p>
              )}
            </div>

            {/* Customer & Order Info */}
            <div className="mb-4 text-sm grid grid-cols-2 gap-x-4">
              <p>
                <strong>Order ID:</strong> {order._id.slice(-6)}
              </p>
              {order.tableId && (
                <p>
                  <strong>Table:</strong> {order.tableId}
                </p>
              )}
              <p>
                <strong>Customer:</strong> {order.customerName || "Guest"}
              </p>
              <p>
                <strong>Phone:</strong> {order.customerPhone || "N/A"}
              </p>
              <p>
                <strong>Time:</strong>{" "}

              {new Date(order.createdAt).toLocaleTimeString([], {
  hour12: true
})}

              </p>
              <p>
                <strong>Type:</strong> {order.orderType || "N/A"}
              </p>
            </div>

            {order.orderType === "Delivery" && order.address && (
              <div className="mb-4 text-sm bg-gray-50 p-3 rounded border">
                <strong>Delivery Address:</strong>
                <br />
                {order.address}
              </div>
            )}

            {/* Items Table */}
            <table className="w-full text-sm border-t border-b mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-2 text-left">Item</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">Price</th>
                  <th className="py-2 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-1.5 px-2">{item.name}</td>
                    <td className="py-1.5 px-2 text-center">{item.quantity}</td>
                    <td className="py-1.5 px-2 text-right">₹{item.price}</td>
                    <td className="py-1.5 px-2 text-right">
                      ₹{item.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="text-sm space-y-1 max-w-xs ml-auto">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{displaySubtotal.toFixed(2)}</span>
              </div>

              {gstRate > 0 && (
                <div className="flex justify-between">
                  <span>GST ({gstRate}%)</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>Grand Total</span>
                <span>₹{displayGrandTotal.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-center text-gray-600 text-xs border-t pt-3 mt-4">
              ⭐ Thank you! Visit again! ⭐
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg"
          >
            Close
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            Print Bill
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BillPage;