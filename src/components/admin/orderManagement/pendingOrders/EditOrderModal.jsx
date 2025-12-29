import React, { useEffect, useRef, useState } from "react";
import { recalcTotal } from "../commonOrderFile/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";

const EditOrderModal = ({ 
  editingOrder, 
  setEditingOrder, 
  updateOrder, 
  menuItems
}) => {
  const itemsContainerRef = useRef(null);
  const [localOrderData, setLocalOrderData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);


  // =============================
  // INIT ORDER DATA (SAFE)
  // =============================
  useEffect(() => {
    if (editingOrder) {
      setLocalOrderData({
        ...editingOrder,
        items: editingOrder.items.map(item => ({
          ...item,
          menuItemId: item.menuItemId || item.menuItem?._id || item._id,
          name: item.name || item.menuItem?.name || "",
          price: item.price || item.menuItem?.price || 0,
          quantity: item.quantity || 1,
          variantName: item.variant || item.variantName || null,
          variants: item.variants || item.menuItem?.variantRates || null,
          customizations: item.customizations || ""
        }))
      });
      setIsDirty(false);
    }
  }, [editingOrder]);

  useEffect(() => {
    if (itemsContainerRef.current && localOrderData?.items) {
      itemsContainerRef.current.scrollTop =
        itemsContainerRef.current.scrollHeight;
    }
  }, [localOrderData?.items]);

  if (!editingOrder || !localOrderData) return null;

  // =============================
  // ADD ITEM
  // =============================
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

    const items = [...localOrderData.items, newItem];

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    setIsDirty(true);
  };

  // =============================
  // VARIANT CHANGE
  // =============================
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
    setIsDirty(true);
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
    setIsDirty(true);
  };

  // =============================
  // REMOVE ITEM (MIN 1)
  // =============================
  const handleRemoveItem = (idx) => {
    if (localOrderData.items.length <= 1) return;

    const items = localOrderData.items.filter((_, i) => i !== idx);

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    setIsDirty(true);
  };

  // =============================
  // 🔥 FINAL UPDATE ORDER (BACKEND SAFE)
  // =============================
  const handleUpdateOrder = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

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

      await updateOrder(localOrderData._id, payload);
      setEditingOrder(null);
    } catch (err) {
      console.error("Update Order Failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpdateDisabled =
  !isDirty || localOrderData.items.length === 0 || isSubmitting;


  const handleBackdropClick = (e) => {
    if (e.target.id === "editOrderBackdrop") {
      setEditingOrder(null);
    }
  };

  // =============================
  // UI (UNCHANGED)
  // =============================
  return (
    <div
      id="editOrderBackdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
    >
       <div
        className="bg-white rounded-2xl border-2 shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Edit Order</h3>

        {/* Items Section - Directly starts after title */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Order Items
            </label>
            <span className={`text-xs ${localOrderData.items.length === 0 ? 'text-red-500' : 'text-gray-500'}`}>
              {localOrderData.items.length} item{localOrderData.items.length !== 1 ? 's' : ''}
              {localOrderData.items.length === 0 && ' (Minimum 1 item required)'}
            </span>
          </div>
          
          <div
            ref={itemsContainerRef}
            className="space-y-3 mb-4 max-h-64 overflow-y-auto border border-orange-300 rounded-lg p-3 bg-gray-50"
          >
            {localOrderData.items.length === 0 ? (
              <div className="text-center py-4 text-gray-500 italic">
                No items in order. Please add at least one item.
              </div>
            ) : (
              localOrderData.items.map((item, idx) => (
                <div
                  key={`${item.menuItemId}-${idx}`}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-orange-300 shadow-sm"
                >
                  {/* Item Info */}
                  <div className="flex-1 mr-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-800">
                        {item.name}
                      </span>
                      <span className="font-bold text-orange-600 ml-2">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                    
                    {/* Variants Selector */}
                    {item.variants && Object.keys(item.variants).length > 0 ? (
                      <Select
                        value={item.variantName || ""}
                        onValueChange={(value) => handleVariantChange(idx, value)}
                      >
                        <SelectTrigger className="h-8 w-full border-orange-400 bg-orange-50 text-xs">
                          <SelectValue placeholder="Select variant" />
                        </SelectTrigger>
                        <SelectContent className="bg-orange-50 border-orange-300 shadow-lg rounded-lg">
                          <SelectGroup>
                            {Object.entries(item.variants).map(([key, price]) => (
                              <SelectItem key={key} value={key}>
                                {key} — ₹{price}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-600">
                        Price: ₹{item.price}
                      </div>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center mb-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        className="w-16 border rounded-lg px-2 py-1 text-center"
                      />
                    </div>
                    
                    {/* Remove Button - Disabled if only one item */}
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      disabled={localOrderData.items.length <= 1}
                      className={`px-2 py-1 rounded text-xs ${
                        localOrderData.items.length <= 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
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
            <SelectTrigger className="h-10 w-full rounded-lg border-orange-600 bg-orange-100 px-3 text-sm font-bold shadow-sm">
              <SelectValue placeholder="+ Add New Item" />
            </SelectTrigger>
            <SelectContent className="bg-orange-50 border-orange-300 shadow-xl rounded-xl border border-orange-300 p-1 min-w-full cursor-pointer">
              <SelectGroup>
                {menuItems.map((menu) => (
                  <SelectItem key={menu._id} value={menu._id} className="  border-orange-300 rounded-lg cursor-pointer 
    data-[highlighted]:bg-orange-100 
    data-[highlighted]:text-orange-700">
                    <div className="flex justify-between items-center w-full gap-4  pb-2 pt-1">
                      <span>{menu.name}</span>
                      <span className="text-sm text-gray-600 gap-2 flex items-center text-orange-600  ">
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

        {/* Total Amount */}
        <div className="mb-6 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">Total Amount</span>
            <span className="text-xl font-bold text-orange-600">
              ₹{localOrderData.totalAmount}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setEditingOrder(null)}
            className="px-4 py-2 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleUpdateOrder}
            disabled={isUpdateDisabled}
            className={`px-4 py-2 rounded-lg transition-colors ${
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
