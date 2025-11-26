import React, { useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const BillPage = ({ order, restaurantDetails, onClose }) => {
  const billRef = useRef();

  const handlePrint = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";

    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;

    // --- PREPARE DATA VARIABLES FOR PRINT ---
    const rName = restaurantDetails?.restaurantName || restaurantDetails?.name || "Restaurant Name";
    const rAddress = restaurantDetails?.address || "";
    const rPhone = restaurantDetails?.phoneNumber ? `Tel: ${restaurantDetails.phoneNumber}` : "";
    const rGst = restaurantDetails?.gstEnabled && restaurantDetails.gstNumber ? `GSTIN: ${restaurantDetails.gstNumber}` : "";

    const orderId = order._id.slice(-6).toUpperCase();
    const orderDate = new Date(order.createdAt).toLocaleString();
    const customerName = order.customerName || "Guest";
    const customerPhone = order.customerPhone || "";
    const tableInfo = order.tableId ? `Table: ${order.tableId}` : (order.orderType === 'Delivery' ? 'Delivery Order' : 'Takeaway');

    // Items Row Generation
    const itemsRows = order.items.map(item => `
      <tr>
        <td class="col-item">
          <span class="item-name">${item.name}</span>
        </td>
        <td class="col-qty">${item.quantity}</td>
        <td class="col-price">₹${item.price}</td>
        <td class="col-total">₹${item.price * item.quantity}</td>
      </tr>
    `).join('');

    // Totals Calculation
    const subtotal = order.subtotal !== undefined ? order.subtotal : order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const gstRow = order.gstAmount > 0 ? `
      <div class="summary-row">
        <span>GST (${order.gstRate}%)</span>
        <span>₹${order.gstAmount}</span>
      </div>` : '';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${orderId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
              background-color: #fff;
              color: #1a1a1a;
              margin: 0;
              padding: 20px; /* Padding for A4/Page logic */
              font-size: 13px;
              line-height: 1.5;
            }

            /* Container to constrain width for thermal or look like A4 center */
            .invoice-container {
              max-width: 80mm; /* Adjust to 100% or 210mm for A4, 80mm is standard thermal receipt width */
              margin: 0 auto;
              background: white;
            }

            /* --- HEADER --- */
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 15px;
            }
            .brand-name {
              font-size: 20px;
              font-weight: 800;
              text-transform: uppercase;
              margin: 0 0 5px 0;
              letter-spacing: 0.5px;
            }
            .brand-details {
              font-size: 11px;
              color: #555;
            }

            /* --- META INFO (Customer, Date) --- */
            .invoice-meta {
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 1px solid #eee;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            .label { font-weight: 600; color: #555; }
            .val { font-weight: 500; text-align: right; }

            /* --- TABLE --- */
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th {
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
              color: #555;
              border-bottom: 1px solid #000;
              padding: 5px 0;
            }
            td {
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
              vertical-align: top;
            }
            
            /* Column Widths */
            .col-item { width: 55%; }
            .col-qty { width: 10%; text-align: center; }
            .col-price { width: 15%; text-align: right; }
            .col-total { width: 20%; text-align: right; }

            .item-name {
              font-weight: 600;
              display: block;
            }

            /* --- SUMMARY / TOTALS --- */
            .summary-section {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              margin-top: 10px;
              border-top: 1px dashed #ccc;
              padding-top: 10px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              width: 100%; /* Or smaller width like 60% if you want it compact right */
              margin-bottom: 4px;
            }
            .grand-total {
              font-size: 16px;
              font-weight: 800;
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
              padding: 8px 0;
              margin-top: 5px;
            }

            /* --- FOOTER --- */
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 11px;
              color: #777;
            }
            .footer strong {
              color: #000;
              display: block;
              margin-bottom: 4px;
              font-size: 12px;
            }

            /* PRINT SETTINGS */
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
              @page { margin: 0; } /* Removes browser header/footer info */
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            
            <div class="header">
              <div class="brand-name">${rName}</div>
              <div class="brand-details">
                ${rAddress}<br/>
                ${rPhone}<br/>
                ${rGst}
              </div>
            </div>

            <div class="invoice-meta">
              <div class="meta-row">
                <span class="label">Invoice No:</span>
                <span class="val">#${orderId}</span>
              </div>
              <div class="meta-row">
                <span class="label">Date:</span>
                <span class="val">${orderDate}</span>
              </div>
              <div class="meta-row">
                <span class="label">Type:</span>
                <span class="val">${tableInfo}</span>
              </div>
              <div class="meta-row">
                <span class="label">Customer:</span>
                <span class="val">${customerName} ${customerPhone ? `(${customerPhone})` : ''}</span>
              </div>
              ${order.address ? `
              <div class="meta-row" style="margin-top:5px">
                <span class="label">Del. Address:</span>
                <span class="val" style="font-size:11px; max-width:60%;">${order.address}</span>
              </div>` : ''}
            </div>

            <table>
              <thead>
                <tr>
                  <th class="col-item">Item Name</th>
                  <th class="col-qty">Qty</th>
                  <th class="col-price">Price</th>
                  <th class="col-total">Amt</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="summary-section">
              <div class="summary-row">
                <span class="label">Subtotal</span>
                <span class="val">₹${subtotal}</span>
              </div>
              ${gstRow}
              <div class="summary-row grand-total">
                <span>Total</span>
                <span>₹${order.totalAmount}</span>
              </div>
            </div>

            <div class="footer">
              <strong>Thank You for Visiting!</strong>
              Please come again.
            </div>

          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.onload = () => {
      // Small delay to ensure styles render before print dialog
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 500);

      // Cleanup after print
      // Note: Some browsers pause JS during print dialog, so this runs after dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
        onClose();
      }, 1000);
    };
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
                      ₹{item.price}
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      ₹{(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals - Dynamic */}
            <div className="text-sm space-y-1 mb-6 flex flex-col items-end w-full max-w-xs ml-auto">
              <div className="flex justify-between w-full">
                <span>Subtotal</span>
                <span>₹{displaySubtotal}</span>
              </div>
              {displayGstAmount > 0 && ( // Show if GST *amount* is > 0
                <div className="flex justify-between w-full">
                  <span>GST ({displayGstRate}%)</span>
                  <span>₹{displayGstAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2 mt-2 w-full">
                <span>Grand Total</span>
                <span>₹{displayGrandTotal}</span>
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
