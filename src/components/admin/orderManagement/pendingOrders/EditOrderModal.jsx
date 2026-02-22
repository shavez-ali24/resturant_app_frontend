import React, { useEffect, useRef, useState } from "react";
import { recalcTotal } from "../commonOrderFile/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Truck, Utensils, AlertCircle, X } from "lucide-react";

const EditOrderModal = ({ 
  editingOrder, 
  setEditingOrder, 
  updateOrder, 
  getFriendlyErrorMessage,
  menuItems,
  tables
}) => {
  const itemsContainerRef = useRef(null);
  const [localOrderData, setLocalOrderData] = useState(null);
  const [initialOrderData, setInitialOrderData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [address, setAddress] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [initialAddress, setInitialAddress] = useState("");
  const [initialTableId, setInitialTableId] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    table: "",
    address: "",
    items: ""
  });

  // =============================
  // INIT ORDER DATA (SAFE)
  // =============================
  useEffect(() => {
    if (editingOrder) {
      const normalizedItems = editingOrder.items.map(item => {
        // Look up the menu item from menuItems prop to get variantRates
        const menuItem = menuItems.find(m => m._id === (item.menuItemId || item.menuItem?._id || item._id));
        return {
          ...item,
          menuItemId: item.menuItemId || item.menuItem?._id || item._id,
          name: item.name || item.menuItem?.name || menuItem?.name || "",
          price: item.price || item.menuItem?.price || menuItem?.price || 0,
          quantity: item.quantity || 1,
          // Ensure variantName is set for variant items
          variantName: item.variantName || item.variant || null,
          variant: item.variant || item.variantName || null,
          // Get variants from menuItems lookup
          variants: item.variants || item.menuItem?.variantRates || menuItem?.variantRates || null,
          customizations: item.customizations || ""
        };
      });

      const newLocalOrderData = {
        ...editingOrder,
        items: normalizedItems
      };
      
      setLocalOrderData(newLocalOrderData);
      setInitialOrderData(JSON.parse(JSON.stringify(newLocalOrderData))); // Deep copy for comparison
      
      // Set address if exists (for Delivery orders)
      if (editingOrder.address) {
        setAddress(editingOrder.address);
        setInitialAddress(editingOrder.address);
      }
      
      // Set tableId if exists (for Eat Here orders)
      if (editingOrder.tableId) {
        setSelectedTableId(editingOrder.tableId);
        setInitialTableId(editingOrder.tableId);
      }
      
      setIsDirty(false);
      setValidationErrors({
        table: "",
        address: "",
        items: ""
      });
    }
  }, [editingOrder]);

  // Check if any changes were made
  useEffect(() => {
    if (!localOrderData || !initialOrderData) return;
    
    // Check order type change
    const orderTypeChanged = localOrderData.orderType !== initialOrderData.orderType;
    
    // Check items changes
    const itemsChanged = JSON.stringify(localOrderData.items) !== JSON.stringify(initialOrderData.items);
    
    // Check address change
    const addressChanged = address !== initialAddress;
    
    // Check table change
    const tableChanged = selectedTableId !== initialTableId;
    
    const hasChanges = orderTypeChanged || itemsChanged || addressChanged || tableChanged;
    setIsDirty(hasChanges);
    
  }, [localOrderData, initialOrderData, address, selectedTableId, initialAddress, initialTableId]);

  useEffect(() => {
    if (itemsContainerRef.current && localOrderData?.items) {
      itemsContainerRef.current.scrollTop =
        itemsContainerRef.current.scrollHeight;
    }
  }, [localOrderData?.items]);

  if (!editingOrder) return null;

  // Show loading state while data is initializing
  if (!localOrderData) {
    return (
      <div
        id="editOrderBackdrop"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      >
        <div className="bg-white rounded-2xl border-2 shadow-lg max-w-md w-full p-6">
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // =============================
  // ADD ITEM
  // =============================
  const handleAddItem = (menuItemId) => {
    const selected = menuItems.find(m => m._id === menuItemId);
    if (!selected) return;

    let newItem;

    if (selected.pricingType === "variant" && selected.variantRates) {
      // Get first variant key
      const firstVariantKey = Object.keys(selected.variantRates)[0];
      const firstVariantData = selected.variantRates[firstVariantKey];
      // Handle both formats: { quarter: 100 } or { quarter: { price: 100, discount: {...} } }
      const firstVariantPrice = typeof firstVariantData === 'object' ? firstVariantData.price : firstVariantData;
      
      newItem = {
        menuItemId: selected._id,
        name: selected.name,
        quantity: 1,
        variantName: firstVariantKey,
        variants: selected.variantRates,
        price: firstVariantPrice,
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

    const items = [...localOrderData.items, newItem];

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    
    // Clear items validation error when adding item
    if (validationErrors.items) {
      setValidationErrors(prev => ({ ...prev, items: "" }));
    }
    
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // VARIANT CHANGE
  // =============================
  const handleVariantChange = (idx, variant) => {
    const items = [...localOrderData.items];
    const item = items[idx];

    if (!item.variants || !item.variants[variant]) return;

    item.variantName = variant;
    // Handle both formats: { quarter: 100 } or { quarter: { price: 100, discount: {...} } }
    const variantData = item.variants[variant];
    item.price = typeof variantData === 'object' ? variantData.price : variantData;

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // QUANTITY CHANGE
  // =============================
  const handleQuantityChange = (idx, qty) => {
    const quantity = Math.max(1, parseInt(qty) || 1);
    const items = [...localOrderData.items];
    items[idx].quantity = quantity;

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // REMOVE ITEM (MIN 1)
  // =============================
  const handleRemoveItem = (idx) => {
    if (localOrderData.items.length <= 1) {
      setValidationErrors(prev => ({ 
        ...prev, 
        items: "Minimum 1 item required" 
      }));
      return;
    }

    const items = localOrderData.items.filter((_, i) => i !== idx);

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    
    // Clear items validation error if items exist
    if (items.length > 0 && validationErrors.items) {
      setValidationErrors(prev => ({ ...prev, items: "" }));
    }
    
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // ORDER TYPE CHANGE
  // =============================
  const handleOrderTypeChange = (orderType) => {
    const currentType = localOrderData.orderType?.toLowerCase();
    const newType = orderType.toLowerCase();
    
    // Clear fields based on transition
    if (currentType === "delivery" && newType === "eat here") {
      // Delivery → Eat Here: Need tableId, clear address
      setAddress("");
    } else if (currentType === "delivery" && newType === "take away") {
      // Delivery → Take Away: Clear address
      setAddress("");
    } else if (currentType === "eat here" && newType === "take away") {
      // Eat Here → Take Away: Clear tableId
      setSelectedTableId("");
    } else if (currentType === "eat here" && newType === "delivery") {
      // Eat Here → Delivery: Need address, clear tableId
      setSelectedTableId("");
    } else if (currentType === "take away" && newType === "eat here") {
      // Take Away → Eat Here: Need tableId
      // Keep as is
    } else if (currentType === "take away" && newType === "delivery") {
      // Take Away → Delivery: Need address
      // Keep as is
    }

    // Clear validation errors when order type changes
    setValidationErrors({
      table: "",
      address: "",
      items: validationErrors.items // Keep items error if any
    });

    setLocalOrderData(prev => ({
      ...prev,
      orderType
    }));
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // TABLE SELECTION CHANGE
  // =============================
  const handleTableChange = (tableId) => {
    setSelectedTableId(tableId);
    
    // Clear table validation error when user selects a table
    if (tableId && validationErrors.table) {
      setValidationErrors(prev => ({ ...prev, table: "" }));
    }
    
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // ADDRESS CHANGE
  // =============================
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    
    // Clear address validation error when user starts typing
    if (value.trim() && validationErrors.address) {
      setValidationErrors(prev => ({ ...prev, address: "" }));
    }
    
    // setIsDirty(true); // Automatically set by useEffect
  };

  // =============================
  // 🔥 FIXED: FINAL UPDATE ORDER (WITHOUT ALERT)
  // =============================
  const handleUpdateOrder = async () => {
    if (isSubmitting || !isDirty) return;
    
    // Validate based on order type
    let errors = {
      table: "",
      address: "",
      items: ""
    };
    let hasError = false;

    // Items validation
    if (localOrderData.items.length === 0) {
      errors.items = "Minimum 1 item required";
      hasError = true;
    }
    
    if (localOrderData.orderType?.toLowerCase() === "eat here" && !selectedTableId) {
      errors.table = "Please select a table for Eat Here order";
      hasError = true;
    }
    
    if (localOrderData.orderType?.toLowerCase() === "delivery" && !address.trim()) {
      errors.address = "Please enter address for Delivery order";
      hasError = true;
    }
    
    setValidationErrors(errors);
    
    if (hasError) {
      // Scroll to first error
      setTimeout(() => {
        const errorElements = document.querySelectorAll('[data-error="true"]');
        if (errorElements.length > 0) {
          errorElements[0].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      return;
    }
    
    setIsSubmitting(true);

    try {
      const payload = {
        status: localOrderData.status,
        orderType: localOrderData.orderType,
        items: localOrderData.items.map(item => {
          // For variant items, ensure variant is set
          const variantValue = item.variantName || item.variant || null;
          return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            variant: variantValue,
            customizations: item.customizations || ""
          };
        })
      };

      // Add tableId for Eat Here
      if (localOrderData.orderType?.toLowerCase() === "eat here" && selectedTableId) {
        payload.tableId = selectedTableId;
      }

      // Add address for Delivery
      if (localOrderData.orderType?.toLowerCase() === "delivery" && address.trim()) {
        payload.address = address.trim();
      }

      // Clear tableId for Take Away (if exists from previous state)
      if (localOrderData.orderType?.toLowerCase() === "take away") {
        payload.tableId = null;
        payload.address = null;
      }

      // ✅ FIXED: Call updateOrder with correct parameters
      await updateOrder(localOrderData._id, payload);
      
      setEditingOrder(null);
    } catch (err) {
      console.error("Update Order Failed:", err);
      const errorMsg =
        typeof getFriendlyErrorMessage === "function"
          ? getFriendlyErrorMessage(err, "update")
          : "Unable to update order right now.";
      // Show error in items section
      setValidationErrors(prev => ({
        ...prev,
        items: errorMsg
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpdateDisabled = isSubmitting || localOrderData.items.length === 0 || !isDirty;
  const itemsSubtotal = recalcTotal(localOrderData?.items || []);

  const handleBackdropClick = (e) => {
    if (e.target.id === "editOrderBackdrop") {
      setEditingOrder(null);
    }
  };

  // =============================
  // ORDER TYPE ICON HELPER
  // =============================
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

  // =============================
  // ORDER TYPE BADGE HELPER
  // =============================
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

  // Format tables data (dynamic from props)
  const availableTables = Array.isArray(tables) ? tables : [];

  // Find current table to display
  const currentTable = availableTables.find(table => 
    table._id === selectedTableId || table.tableNumber === selectedTableId
  );

  // =============================
  // UI
  // =============================
  return (
    <div
      id="editOrderBackdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 z-[9999]"
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl border-2 shadow-lg w-full max-w-[calc(100vw-1rem)] sm:max-w-md p-4 sm:p-6 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Edit Order</h3>
          <button
            onClick={() => setEditingOrder(null)}
            className="p-1.5 rounded-full hover:bg-orange-100 text-orange-500 hover:text-orange-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Order Type Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Type
          </label>
          <Select
            value={localOrderData.orderType}
            onValueChange={handleOrderTypeChange}
          >
            <SelectTrigger className={`h-10 w-full rounded-lg border-0 px-3 text-sm font-medium shadow-sm ring-1 ring-black/5 transition-all hover:brightness-95 focus:ring-2 focus:ring-offset-1 ${getOrderTypeBadge(localOrderData.orderType)}`}>
              <div className="flex items-center gap-2">
                {getOrderTypeIcon(localOrderData.orderType)}
                <span>{localOrderData.orderType || "Select Type"}</span>
              </div>
            </SelectTrigger>
            <SelectContent
              side="top"
              sideOffset={6}
              className="w-[var(--radix-select-trigger-width)] max-h-[45dvh] sm:max-h-[60vh] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-[10050]"
            >
              <SelectGroup>
                <SelectItem 
                  value="Eat Here" 
                  className="cursor-pointer rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-green-100 hover:text-green-800 data-[highlighted]:bg-green-100 data-[highlighted]:text-green-800"
                >
                  <div className="flex items-center gap-2">
                    <Utensils size={16} />
                    Eat Here
                  </div>
                </SelectItem>
                <SelectItem 
                  value="Take Away" 
                  className="cursor-pointer rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-800 data-[highlighted]:bg-blue-100 data-[highlighted]:text-blue-800"
                >
                  <div className="flex items-center gap-2">
                    <Home size={16} />
                    Take Away
                  </div>
                </SelectItem>
                <SelectItem 
                  value="Delivery" 
                  className="cursor-pointer rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-100 data-[highlighted]:text-orange-800"
                >
                  <div className="flex items-center gap-2">
                    <Truck size={16} />
                    Delivery
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Table Selection - Only show when "Eat Here" is selected */}
        {localOrderData.orderType?.toLowerCase() === "eat here" && (
          <div className="mb-4" data-error={!!validationErrors.table}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Table *
            </label>
            <Select
              value={selectedTableId}
              onValueChange={handleTableChange}
            >
              <SelectTrigger className={`h-10 w-full rounded-lg px-3 text-sm font-bold shadow-sm ${
                validationErrors.table 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-orange-600 bg-orange-100'
              }`}>
                {selectedTableId && currentTable ? (
                  <span>Table {currentTable.tableNumber || currentTable.name}</span>
                ) : (
                  <SelectValue placeholder="Select Table" />
                )}
              </SelectTrigger>
              <SelectContent
                side="top"
                sideOffset={6}
                className="w-[var(--radix-select-trigger-width)] max-h-[45dvh] sm:max-h-[60vh] bg-orange-50 border-orange-300 shadow-xl rounded-xl p-1 cursor-pointer z-[10050]"
              >
                <SelectGroup>
                  {availableTables.length > 0 ? (
                    availableTables.map((table) => (
                      <SelectItem
                        key={table._id}
                        value={table._id} // Use _id as value
                        className="border-orange-300 rounded-lg cursor-pointer hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-100 data-[highlighted]:text-orange-800"
                      >
                        <div className="flex justify-between items-center w-full gap-4 pb-2 pt-1">
                          <span>Table {table.tableNumber || table.name}</span>
                          {table.capacity && (
                            <span className="text-sm text-gray-600 gap-2 flex items-center text-orange-600">
                              {table.capacity} seats
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-tables" disabled className="text-gray-400">
                      No tables available
                    </SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            {validationErrors.table && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {validationErrors.table}
              </p>
            )}
          </div>
        )}

        {/* Address Input - Only show when "Delivery" is selected */}
        {localOrderData.orderType?.toLowerCase() === "delivery" && (
          <div className="mb-4" data-error={!!validationErrors.address}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Address *
            </label>
            <textarea
              value={address}
              onChange={handleAddressChange}
              placeholder="Enter delivery address"
              className={`w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                validationErrors.address 
                  ? 'border-red-500 bg-red-50 focus:border-red-500' 
                  : 'border-orange-300 focus:border-orange-500'
              }`}
              required
            />
            {validationErrors.address && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {validationErrors.address}
              </p>
            )}
          </div>
        )}

        {/* Items Section */}
        <div className="mb-4" data-error={!!validationErrors.items}>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Order Items
            </label>
            <span className={`text-xs ${
              validationErrors.items || localOrderData.items.length === 0 
                ? 'text-red-500' 
                : 'text-gray-500'
            }`}>
              {localOrderData.items.length} item{localOrderData.items.length !== 1 ? 's' : ''}
              {validationErrors.items && ` - ${validationErrors.items}`}
            </span>
          </div>
          
          <div
            ref={itemsContainerRef}
            className={`space-y-3 mb-4 max-h-52 sm:max-h-64 overflow-y-auto border rounded-lg p-3 ${
              validationErrors.items 
                ? 'border-red-300 bg-red-50' 
                : 'border-orange-300 bg-gray-50'
            }`}
          >
            {localOrderData.items.length === 0 ? (
              <div className="text-center py-4 text-gray-500 italic">
                No items in order. Please add at least one item.
              </div>
            ) : (
              localOrderData.items.map((item, idx) => (
                <div
                  key={`${item.menuItemId}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-orange-300 shadow-sm"
                >
                  {/* Item Info */}
                  <div className="flex-1 sm:mr-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-800">
                        {item.name}
                      </span>
                      <span className="font-bold text-orange-600 ml-2">
                        ₹{((item.price || 0) * (item.quantity || 1))}
                      </span>
                    </div>
                    
                    {/* Variants Selector */}
                    {item.variants && Object.keys(item.variants).length > 0 ? (
                      <Select
                        value={item.variantName || ""}
                        onValueChange={(value) => handleVariantChange(idx, value)}
                      >
                        <SelectTrigger className="h-8 w-full border-orange-400 bg-orange-50 text-xs hover:bg-orange-100">
                          <SelectValue placeholder="Select variant" />
                        </SelectTrigger>
                        <SelectContent className="bg-orange-50 border-orange-300 shadow-lg rounded-lg z-[10050]">
                          <SelectGroup>
                            {item.variants && item.variants !== null && Object.entries(item.variants).map(([key, variantData]) => {
                              // Handle both formats: { quarter: 100 } or { quarter: { price: 100, discount: {...} } }
                              if (!variantData) return null;
                              const price = typeof variantData === 'object' ? variantData.price : variantData;
                              return (
                                <SelectItem 
                                  key={key} 
                                  value={key}
                                  className="hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-100 data-[highlighted]:text-orange-800"
                                >
                                  {key} — ₹{price}
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-600">
                        Price: ₹{item.price || 0}
                      </div>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start gap-2">
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        className="w-16 border rounded-lg px-2 py-1 text-center hover:border-orange-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                      />
                    </div>
                    
                    {/* Remove Button - Disabled if only one item */}
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      disabled={localOrderData.items.length <= 1}
                      className={`px-2 py-1 rounded text-xs ${
                        localOrderData.items.length <= 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                      }`}
                      title={localOrderData.items.length <= 1 ? "Minimum 1 item required" : "Remove item"}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add New Item Dropdown */}
        <div className="mb-4">
          <Select onValueChange={handleAddItem}>
            <SelectTrigger className="h-10 w-full rounded-lg border-orange-600 bg-orange-100 px-3 text-sm font-bold shadow-sm hover:bg-orange-200">
              <SelectValue placeholder="+ Add New Item" />
            </SelectTrigger>
            <SelectContent
              side="top"
              sideOffset={6}
              className="w-[var(--radix-select-trigger-width)] max-h-[45dvh] sm:max-h-[60vh] bg-orange-50 border-orange-300 shadow-xl rounded-xl border border-orange-300 p-1 cursor-pointer z-[10050]"
            >
              <SelectGroup>
                {menuItems.map((menu) => (
                  <SelectItem 
                    key={menu._id} 
                    value={menu._id} 
                    className="border-orange-300 rounded-lg cursor-pointer hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-100 data-[highlighted]:text-orange-800"
                  >
                    <div className="flex justify-between items-center w-full gap-3 pb-2 pt-1">
                      <span className="truncate">{menu.name}</span>
                      <span className="text-xs sm:text-sm text-gray-600 gap-2 flex items-center text-orange-600 shrink-0">
                        {menu.pricingType === "variant"
                          ? "Variants"
                          : `₹${menu.price}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Items Subtotal */}
        <div className="mb-6 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">Items Total</span>
            <span className="text-xl font-bold text-orange-600">
              ₹{itemsSubtotal}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            onClick={() => setEditingOrder(null)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleUpdateOrder}
            disabled={isUpdateDisabled}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors ${
              isUpdateDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isSubmitting ? 'Updating...' : 'Update Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
