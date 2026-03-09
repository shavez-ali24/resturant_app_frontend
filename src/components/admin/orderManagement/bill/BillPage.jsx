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
import {
  getOrderTypeBadgeClass,
  getOrderTypeItemClass,
  getOrderTypeKey,
  getOrderTypeLabel,
  recalcTotal,
} from "../commonOrderFile/utils";

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;
    const updateMode = () =>
      setIsDarkMode(
        root.classList.contains("admin-dark") || root.classList.contains("dark")
      );

    updateMode();
    const observer = new MutationObserver(updateMode);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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
    const currentType = getOrderTypeKey(localOrderData.orderType);
    const newType = getOrderTypeKey(orderType);
    
    // Clear fields based on transition
    if (currentType === "delivery" && (newType === "eat_here" || newType === "take_away")) {
      setAddress("");
    }
    if (currentType === "eat_here" && (newType === "take_away" || newType === "delivery")) {
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

    const selectedOrderTypeKey = getOrderTypeKey(localOrderData.orderType);
    
    if (selectedOrderTypeKey === "eat_here" && !selectedTableId) {
      setError("Please select a table for Eat Here order");
      return;
    }
    
    if (selectedOrderTypeKey === "delivery" && !address.trim()) {
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

      if (selectedOrderTypeKey === "eat_here" && selectedTableId) {
        payload.tableId = selectedTableId;
      }

      if (selectedOrderTypeKey === "delivery" && address.trim()) {
        payload.address = address.trim();
      }

      if (selectedOrderTypeKey === "take_away") {
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
    switch (getOrderTypeKey(type)) {
      case "eat_here":
        return <Utensils size={16} />;
      case "take_away":
        return <Home size={16} />;
      case "delivery":
        return <Truck size={16} />;
      default:
        return <Utensils size={16} />;
    }
  };
  const getOrderTypeBadge = (type) => getOrderTypeBadgeClass(type);

  const availableTables = Array.isArray(tables) ? tables : [];
  const MotionDiv = motion.div;

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <MotionDiv
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] ${
          isDarkMode
            ? "border-slate-700 bg-slate-950 text-slate-100 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.95)]"
            : "border-orange-100 bg-white/95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b p-4 ${
            isDarkMode
              ? "border-slate-700 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800"
              : "border-orange-100 bg-gradient-to-r from-orange-50/90 via-orange-50 to-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
              Order Details & Bill
            </h3>
            {isStaff && !isEditMode && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                isDarkMode
                  ? "border-orange-500/40 bg-orange-500/20 text-orange-200"
                  : "border-orange-200 bg-orange-100 text-orange-700"
              }`}>
                Staff View
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isStaff && !isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                className={`rounded-lg p-2 transition-colors ${
                  isDarkMode
                    ? "text-orange-300 hover:bg-slate-800"
                    : "text-orange-700 hover:bg-orange-100"
                }`}
                title="Edit Order"
              >
                <Edit3 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className={`rounded-full p-1 transition-colors ${
                isDarkMode
                  ? "text-slate-400 hover:bg-slate-800 hover:text-orange-300"
                  : "text-gray-400 hover:bg-orange-100 hover:text-orange-700"
              }`}
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
          <div className={`flex items-center justify-between border-b px-4 py-2 ${
            isDarkMode ? "border-slate-700 bg-slate-900" : "border-orange-100 bg-orange-50/80"
          }`}>
            <span className={`text-sm font-medium ${isDarkMode ? "text-orange-300" : "text-orange-700"}`}>Edit Mode</span>
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className={`rounded-lg p-1.5 transition-colors ${
                  isDarkMode
                    ? "text-slate-400 hover:bg-slate-800"
                    : "text-gray-500 hover:bg-orange-100"
                }`}
                title="Cancel"
              >
                <X size={16} />
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSubmitting}
                className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
                  isDarkMode
                    ? "text-emerald-300 hover:bg-emerald-500/15"
                    : "text-green-600 hover:bg-green-100"
                }`}
                title="Save"
              >
                <Save size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`border-b px-4 py-2 ${
            isDarkMode ? "border-red-500/40 bg-red-500/15" : "border-red-200 bg-red-50"
          }`}>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={billRef} className="printable-bill">

            {/* Restaurant Header */}
            <div className={`mb-4 border-b pb-4 text-center ${isDarkMode ? "border-slate-700" : ""}`}>
              <h2 className="text-xl font-bold">{restaurantName}</h2>
              <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>{restaurantAddress}</p>
              <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>Phone: {restaurantPhone}</p>
              {restaurantGstin && (
                <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>GSTIN: {restaurantGstin}</p>
              )}
            </div>

            {/* Customer & Order Info */}
            <div className="mb-4 text-sm grid grid-cols-2 gap-x-4">
              <p>
                <strong>Customer:</strong> {order?.customerName || "Guest"}
              </p>
              <p>
                <strong>Phone:</strong> {order?.customerPhone || "N/A"}
              </p>
              {order?.tableId && (
                <p>
                  <strong>Table:</strong> {order.tableId}
                </p>
              )}
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
              <div className={`mb-4 rounded border p-3 text-sm ${
                isDarkMode ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-gray-50"
              }`}>
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
                  <label className={`mb-1 block text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-gray-700"}`}>
                    Order Type
                  </label>
                  <Select
                    value={localOrderData?.orderType}
                    onValueChange={handleOrderTypeChange}
                  >
                    <SelectTrigger className={`h-10 w-full rounded-xl border px-3 text-sm font-medium shadow-sm ring-1 ring-black/5 transition-all outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 ${getOrderTypeBadge(localOrderData?.orderType)}`}>
                      <div className="flex items-center gap-2 text-sm">
                        {getOrderTypeIcon(localOrderData?.orderType)}
                        <span>{getOrderTypeLabel(localOrderData?.orderType)}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className={`rounded-xl border p-1 shadow-xl ${
                      isDarkMode ? "border-slate-700 bg-slate-950" : "border-gray-200 bg-white"
                    }`}>
                      <SelectGroup>
                        <SelectItem value="Eat Here" className={`cursor-pointer rounded-lg py-2 text-sm font-medium ${getOrderTypeItemClass("Eat Here")}`}>
                          <div className="flex items-center gap-2">
                            <Utensils size={16} /> Eat Here
                          </div>
                        </SelectItem>
                        <SelectItem value="Take Away" className={`cursor-pointer rounded-lg py-2 text-sm font-medium ${getOrderTypeItemClass("Take Away")}`}>
                          <div className="flex items-center gap-2">
                            <Home size={16} /> Take Away
                          </div>
                        </SelectItem>
                        <SelectItem value="Delivery" className={`cursor-pointer rounded-lg py-2 text-sm font-medium ${getOrderTypeItemClass("Delivery")}`}>
                          <div className="flex items-center gap-2">
                            <Truck size={16} /> Delivery
                          </div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table Selection - Eat Here */}
                {getOrderTypeKey(localOrderData?.orderType) === "eat_here" && (
                  <div>
                    <label className={`mb-1 block text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-gray-700"}`}>
                      Select Table *
                    </label>
                    <Select value={selectedTableId} onValueChange={handleTableChange}>
                      <SelectTrigger className={`h-10 w-full rounded-xl border px-3 text-sm font-medium shadow-sm transition-all outline-none ${
                        isDarkMode
                          ? "border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-600"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                      }`}>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent className={`rounded-xl border p-1 shadow-xl ${
                        isDarkMode ? "border-slate-700 bg-slate-950" : "border-gray-200 bg-white"
                      }`}>
                        <SelectGroup>
                          {availableTables.map((table) => (
                            <SelectItem key={table._id} value={table._id} className={`cursor-pointer rounded-lg py-2 text-sm font-medium ${
                              isDarkMode
                                ? "text-slate-200 hover:bg-slate-800 data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-50"
                                : "text-gray-700 hover:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                            }`}>
                              Table {table.tableNumber || table.number || table._id.slice(-4)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Address - Delivery */}
                {getOrderTypeKey(localOrderData?.orderType) === "delivery" && (
                  <div>
                    <label className={`mb-1 block text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-gray-700"}`}>
                      Delivery Address *
                    </label>
                    <textarea
                      value={address}
                      onChange={handleAddressChange}
                      placeholder="Enter delivery address"
                      className={`w-full resize-none rounded-xl border p-3 text-sm shadow-sm transition-all outline-none ${
                        isDarkMode
                          ? "border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-600"
                          : "border-gray-300 bg-white hover:border-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                      }`}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Items Table */}
            <table className={`mb-4 w-full border-y text-sm ${
              isDarkMode ? "border-slate-700" : "border-gray-200"
            }`}>
              <thead>
                <tr className={isDarkMode ? "bg-slate-900" : "bg-gray-50"}>
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
                    <tr key={i} className={isDarkMode ? "border-b border-slate-700" : "border-b border-gray-200"}>
                      <td className="py-1.5 px-2">
                        <div>
                          {item.name}
                          {item.variant && (
                            <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>({item.variant})</div>
                          )}
                          {item.customizations && (
                            <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>{item.customizations}</div>
                          )}
                          {item.comboItems && (
                            <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
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
                              className={`rounded p-1 transition-colors ${
                                isDarkMode
                                  ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(i, item.quantity + 1)}
                              className={`rounded p-1 transition-colors ${
                                isDarkMode
                                  ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
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
                            <SelectTrigger className={`h-8 w-24 rounded-lg border text-xs font-medium shadow-sm transition-all outline-none ${
                              isDarkMode
                                ? "border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-600"
                                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                            }`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={`rounded-xl border p-1 shadow-xl ${
                              isDarkMode ? "border-slate-700 bg-slate-950" : "border-gray-200 bg-white"
                            }`}>
                              {Object.entries(item.variants).map(([variant, price]) => (
                                <SelectItem key={variant} value={variant} className={`cursor-pointer rounded-lg py-1 text-xs font-medium ${
                                  isDarkMode
                                    ? "text-slate-200 hover:bg-slate-800 data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-50"
                                    : "text-gray-700 hover:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                                }`}>
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
                            className="rounded p-1 text-red-500 transition-colors hover:bg-red-50"
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
                <label className={`mb-1 block text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-gray-700"}`}>
                  Add Item
                </label>
                <Select onValueChange={handleAddItem}>
                  <SelectTrigger className={`h-10 w-full rounded-xl border px-3 text-sm font-medium shadow-sm transition-all outline-none ${
                    isDarkMode
                      ? "border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-600"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                  }`}>
                    <SelectValue placeholder="Select item to add..." />
                  </SelectTrigger>
                  <SelectContent className={`max-h-60 rounded-xl border p-1 shadow-xl ${
                    isDarkMode ? "border-slate-700 bg-slate-950" : "border-gray-200 bg-white"
                  }`}>
                    <SelectGroup>
                      {menuItems.map((item) => (
                        <SelectItem key={item._id} value={item._id} className={`cursor-pointer rounded-lg py-2 text-sm font-medium ${
                          isDarkMode
                            ? "text-slate-200 hover:bg-slate-800 data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-50"
                            : "text-gray-700 hover:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span>{item.name}</span>
                            <span className={`ml-2 text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
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
            <div className={`ml-auto max-w-xs space-y-1 rounded-xl border p-3 text-sm ${
              isDarkMode ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-gray-50"
            }`}>
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

            <p className={`mt-4 border-t pt-3 text-center text-xs ${
              isDarkMode ? "border-slate-700 text-slate-400" : "text-gray-600"
            }`}>
              Thank you! Visit again!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 border-t p-4 ${
          isDarkMode
            ? "border-slate-700 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800"
            : "border-orange-100 bg-gradient-to-r from-orange-50/70 to-white"
        }`}>
          {isEditMode && (
            <button
              onClick={handleCancelEdit}
              className={`h-11 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                isDarkMode
                  ? "border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  : "border-orange-200 bg-white text-gray-700 hover:bg-orange-50"
              }`}
            >
              Cancel
            </button>
          )}
          
          <button
            onClick={onClose}
            className={`h-11 rounded-xl border px-4 text-sm font-semibold transition-colors ${
              isDarkMode
                ? "border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                : "border-orange-200 bg-white text-gray-700 hover:bg-orange-50"
            }`}
          >
            Close
          </button>

          <button
            onClick={handlePrint}
            className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600"
          >
            Print Bill
          </button>
        </div>
      </MotionDiv>
    </MotionDiv>
  );
};

export default BillPage;
