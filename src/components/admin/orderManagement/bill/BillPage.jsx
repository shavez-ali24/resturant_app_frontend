import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { Plus, Minus, Trash2, Home, Truck, Utensils, Edit3, Save, X } from "lucide-react";
import { recalcTotal } from "../commonOrderFile/utils";

const BillPage = ({ 
  order, 
  restaurantDetails, 
  onClose, 
  menuItems = [], 
  tables = [],
  updateOrder 
}) => {
  const billRef = useRef();
  const user = useSelector((state) => state.admin.user);
  const isStaff = user?.role === "staff";
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [localOrderData, setLocalOrderData] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Initialize local order data
  useEffect(() => {
    if (order) {
      const newLocalOrderData = {
        ...order,
        items: order.items.map(item => ({
          ...item,
          menuItemId: item.menuItemId || item.menuItem?._id || item._id,
          name: item.name || item.menuItem?.name || "",
          price: item.discountedPrice || item.price || 0,
          quantity: item.quantity || 1,
          variantName: item.variant || item.variantName || null,
          variants: item.variants || item.menuItem?.variantRates || null,
          customizations: item.customizations || ""
        }))
      };
      
      setLocalOrderData(newLocalOrderData);
      setSelectedTableId(order.tableId || "");
      setAddress(order.address || "");
    }
  }, [order]);

  // Use backend data directly - already calculated with discounts
  const gstAmount = Number(order?.gstAmount || 0);
  const deliveryCharges = (order?.orderType === "Delivery") ? Number(order?.deliveryCharges || 0) : 0;
  const grandTotal = Number(order?.totalAmount || 0);

  // For item display, use discountedPrice if available (already calculated by backend)
  const displaySubtotal = grandTotal - gstAmount - deliveryCharges;

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

  // =============================
  // EDIT MODE FUNCTIONS
  // =============================

  // Add item
  const handleAddItem = (menuItemId) => {
    const selected = menuItems.find(m => m._id === menuItemId);
    if (!selected) return;

    let newItem;

    if (selected.pricingType === "variant" && selected.variantRates) {
      const firstVariant = Object.keys(selected.variantRates)[0];
      newItem = {
        menuItemId: selected._id,
        name: selected.name,
        quantity: 1,
        variantName: firstVariant,
        variants: selected.variantRates,
        price: selected.variantRates[firstVariant],
        customizations: ""
      };
    } else {
      newItem = {
        menuItemId: selected._id,
        name: selected.name,
        quantity: 1,
        variantName: null,
        variants: null,
        price: selected.price,
        customizations: ""
      };
    }

    const items = [...(localOrderData?.items || []), newItem];

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
  };

  // Remove item
  const handleRemoveItem = (idx) => {
    if (localOrderData.items.length <= 1) {
      setError("Minimum 1 item required");
      return;
    }

    const items = localOrderData.items.filter((_, i) => i !== idx);

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    setError("");
  };

  // Update quantity
  const handleQuantityChange = (idx, qty) => {
    const quantity = Math.max(1, parseInt(qty) || 1);
    const items = [...localOrderData.items];
    items[idx].quantity = quantity;

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
  };

  // Update variant
  const handleVariantChange = (idx, variant) => {
    const items = [...localOrderData.items];
    const item = items[idx];

    if (!item.variants || !item.variants[variant]) return;

    item.variantName = variant;
    item.price = item.variants[variant];

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
  };

  // Order type change
  const handleOrderTypeChange = (orderType) => {
    const currentType = localOrderData.orderType?.toLowerCase();
    const newType = orderType.toLowerCase();
    
    // Clear fields based on transition
    if (currentType === "delivery" && (newType === "eat here" || newType === "take away")) {
      setAddress("");
    }
    if (currentType === "eat here" && (newType === "take away" || newType === "delivery")) {
      setSelectedTableId("");
    }

    setLocalOrderData(prev => ({
      ...prev,
      orderType
    }));
  };

  // Table change
  const handleTableChange = (tableId) => {
    setSelectedTableId(tableId);
  };

  // Address change
  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (isSubmitting || !localOrderData) return;
    
    // Validation
    if (localOrderData.items.length === 0) {
      setError("Minimum 1 item required");
      return;
    }
    
    if (localOrderData.orderType?.toLowerCase() === "eat here" && !selectedTableId) {
      setError("Please select a table for Eat Here order");
      return;
    }
    
    if (localOrderData.orderType?.toLowerCase() === "delivery" && !address.trim()) {
      setError("Please enter address for Delivery order");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        status: localOrderData.status,
        orderType: localOrderData.orderType,
        items: localOrderData.items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          variant: item.variantName || null,
          customizations: item.customizations || ""
        }))
      };

      if (localOrderData.orderType?.toLowerCase() === "eat here" && selectedTableId) {
        payload.tableId = selectedTableId;
      }

      if (localOrderData.orderType?.toLowerCase() === "delivery" && address.trim()) {
        payload.address = address.trim();
      }

      if (localOrderData.orderType?.toLowerCase() === "take away") {
        payload.tableId = null;
        payload.address = null;
      }

      await updateOrder(localOrderData._id, payload);
      setIsEditMode(false);
    } catch (err) {
      console.error("Update Order Failed:", err);
      setError(err?.data?.message || "Failed to update order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    // Reset to original data
    const newLocalOrderData = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        menuItemId: item.menuItemId || item.menuItem?._id || item._id,
        name: item.name || item.menuItem?.name || "",
        price: item.discountedPrice || item.price || 0,
        quantity: item.quantity || 1,
        variantName: item.variant || item.variantName || null,
        variants: item.variants || item.menuItem?.variantRates || null,
        customizations: item.customizations || ""
      }))
    };
    
    setLocalOrderData(newLocalOrderData);
    setSelectedTableId(order.tableId || "");
    setAddress(order.address || "");
    setIsEditMode(false);
    setError("");
  };

  const handlePrint = () => {
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
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

  const getOrderTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case "eat here":
        return <Utensils size={16} />;
      case "take away":
        return <Home size={16} />;
      case "delivery":
        return <Truck size={16} />;
      default:
        return <Utensils size={16} />;
    }
  };

  const getOrderTypeBadge = (type) => {
    switch(type?.toLowerCase()) {
      case "eat here":
        return "bg-green-100 text-green-700 ring-green-200";
      case "take away":
        return "bg-blue-100 text-blue-700 ring-blue-200";
      case "delivery":
        return "bg-orange-100 text-orange-700 ring-orange-200";
      default:
        return "bg-gray-100 text-gray-700 ring-gray-200";
    }
  };

  const availableTables = Array.isArray(tables) ? tables : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
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
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">
              Order Details & Bill
            </h3>
            {isStaff && !isEditMode && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                Staff View
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isStaff && !isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Edit Order"
              >
                <Edit3 size={18} />
              </button>
            )}
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
        </div>

        {/* Edit Mode Header */}
        {isEditMode && (
          <div className="bg-blue-50 px-4 py-2 border-b flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">Edit Mode</span>
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg"
                title="Cancel"
              >
                <X size={16} />
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSubmitting}
                className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg disabled:opacity-50"
                title="Save"
              >
                <Save size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 px-4 py-2 border-b">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

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
                <strong>Order ID:</strong> {(order?._id || order?.orderId || "").slice(-6)}
              </p>
              {order?.tableId && (
                <p>
                  <strong>Table:</strong> {order.tableId}
                </p>
              )}
              <p>
                <strong>Customer:</strong> {order?.customerName || "Guest"}
              </p>
              <p>
                <strong>Phone:</strong> {order?.customerPhone || "N/A"}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {new Date(order?.createdAt).toLocaleTimeString([], {
                  hour12: true
                })}
              </p>
              <p>
                <strong>Type:</strong> {order?.orderType || "N/A"}
              </p>
            </div>

            {order?.orderType === "Delivery" && order?.address && (
              <div className="mb-4 text-sm bg-gray-50 p-3 rounded border">
                <strong>Delivery Address:</strong>
                <br />
                {order.address}
              </div>
            )}

            {/* EDIT MODE: Order Type & Table/Address */}
            {isEditMode && (
              <div className="mb-4 space-y-3">
                {/* Order Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Type
                  </label>
                  <Select
                    value={localOrderData?.orderType}
                    onValueChange={handleOrderTypeChange}
                  >
                    <SelectTrigger className={`h-9 w-full rounded-lg border-0 shadow-sm ring-1 ring-black/5 ${getOrderTypeBadge(localOrderData?.orderType)}`}>
                      <div className="flex items-center gap-2 text-sm">
                        {getOrderTypeIcon(localOrderData?.orderType)}
                        <span>{localOrderData?.orderType || "Select"}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-xl rounded-xl">
                      <SelectGroup>
                        <SelectItem value="Eat Here" className="cursor-pointer py-2">
                          <div className="flex items-center gap-2">
                            <Utensils size={16} /> Eat Here
                          </div>
                        </SelectItem>
                        <SelectItem value="Take Away" className="cursor-pointer py-2">
                          <div className="flex items-center gap-2">
                            <Home size={16} /> Take Away
                          </div>
                        </SelectItem>
                        <SelectItem value="Delivery" className="cursor-pointer py-2">
                          <div className="flex items-center gap-2">
                            <Truck size={16} /> Delivery
                          </div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table Selection - Eat Here */}
                {localOrderData?.orderType?.toLowerCase() === "eat here" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Table *
                    </label>
                    <Select value={selectedTableId} onValueChange={handleTableChange}>
                      <SelectTrigger className="h-9 w-full rounded-lg border-0 shadow-sm ring-1 ring-black/5">
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-xl rounded-xl">
                        <SelectGroup>
                          {availableTables.map((table) => (
                            <SelectItem key={table._id} value={table._id} className="cursor-pointer py-2">
                              Table {table.tableNumber || table.number || table._id.slice(-4)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Address - Delivery */}
                {localOrderData?.orderType?.toLowerCase() === "delivery" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      value={address}
                      onChange={handleAddressChange}
                      placeholder="Enter delivery address"
                      className="w-full p-2 border rounded-lg text-sm resize-none"
                      rows={2}
                    />
                  </div>
                )}
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
                  {isEditMode && <th className="py-2 px-2 text-center">Action</th>}
                </tr>
              </thead>
              <tbody>
                {(isEditMode ? localOrderData?.items : order?.items)?.map((item, i) => {
                  const itemPrice = Number(item.discountedPrice || item.price || 0);
                  const itemTotal = itemPrice * Number(item.quantity || 1);
                  
                  return (
                    <tr key={i} className="border-b">
                      <td className="py-1.5 px-2">
                        <div>
                          {item.name}
                          {item.variant && (
                            <div className="text-xs text-gray-500">({item.variant})</div>
                          )}
                          {item.customizations && (
                            <div className="text-xs text-gray-500">{item.customizations}</div>
                          )}
                          {item.comboItems && (
                            <div className="text-xs text-orange-600">
                              Combo: {item.comboItems.length} items
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        {isEditMode ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleQuantityChange(i, item.quantity - 1)}
                              className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(i, item.quantity + 1)}
                              className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        {isEditMode && item.variants ? (
                          <Select
                            value={item.variantName}
                            onValueChange={(v) => handleVariantChange(i, v)}
                          >
                            <SelectTrigger className="h-7 w-20 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border shadow-xl rounded-xl">
                              {Object.entries(item.variants).map(([variant, price]) => (
                                <SelectItem key={variant} value={variant} className="cursor-pointer py-1">
                                  {variant}: ₹{price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          `₹${itemPrice}`
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right font-medium">
                        ₹{itemTotal.toFixed(2)}
                      </td>
                      {isEditMode && (
                        <td className="py-1.5 px-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(i)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* EDIT MODE: Add Item */}
            {isEditMode && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Item
                </label>
                <Select onValueChange={handleAddItem}>
                  <SelectTrigger className="h-9 w-full rounded-lg border-0 shadow-sm ring-1 ring-black/5">
                    <SelectValue placeholder="Select item to add..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-xl rounded-xl max-h-60">
                    <SelectGroup>
                      {menuItems.map((item) => (
                        <SelectItem key={item._id} value={item._id} className="cursor-pointer py-2">
                          <div className="flex items-center justify-between">
                            <span>{item.name}</span>
                            <span className="text-gray-500 text-xs ml-2">
                              {item.pricingType === "variant" 
                                ? "Variant" 
                                : `₹${item.price || 0}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Totals - Use backend data directly */}
            <div className="text-sm space-y-1 max-w-xs ml-auto">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{displaySubtotal.toFixed(2)}</span>
              </div>

              {gstAmount > 0 && (
                <div className="flex justify-between">
                  <span>GST {order?.gstRate ? `(${order.gstRate}%)` : ""}</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
              )}

              {deliveryCharges > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>₹{deliveryCharges.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-center text-gray-600 text-xs border-t pt-3 mt-4">
              Thank you! Visit again!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          {isEditMode && (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
          )}
          
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
