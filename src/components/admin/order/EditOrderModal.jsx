import React, { useEffect, useRef } from "react";
import { recalcTotal } from "./utils";

const EditOrderModal = ({ editingOrder, setEditingOrder, updateOrder, menuItems }) => {
  const itemsContainerRef = useRef(null);

  console.log(menuItems)


  useEffect(() => {
    if (itemsContainerRef.current) {
      itemsContainerRef.current.scrollTop = itemsContainerRef.current.scrollHeight;
    }
  }, [editingOrder.items]);
  if (!editingOrder) return null;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border-2 shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Edit Order</h3>

        {/* Table ID */}
        <label className="block text-sm font-medium mb-1">Table ID</label>
        <input
          type="text"
          value={editingOrder.tableId}
          onChange={(e) =>
            setEditingOrder({ ...editingOrder, tableId: e.target.value })
          }
          className="w-full border rounded-lg px-3 py-2 mb-3"
        />

        {/* Items Section */}
        <label className="block text-sm font-medium mb-1">Items</label>
        <div ref={itemsContainerRef} className="space-y-3 mb-4 max-h-64 overflow-y-auto border rounded-lg p-2">
          {editingOrder.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-800">{item.name}</span>

                {item.variants ? (
                  <select
                    value={item.variantName}
                    onChange={(e) => {
                      const newVariant = e.target.value;
                      const newPrice = item.variants[newVariant];

                      const updatedItems = [...editingOrder.items];
                      updatedItems[idx] = {
                        ...item,
                        variantName: newVariant,
                        price: newPrice,
                      };

                      setEditingOrder({
                        ...editingOrder,
                        items: updatedItems,
                        totalAmount: recalcTotal(updatedItems),
                      });
                    }}
                    className="border rounded px-2 py-1 text-sm mt-1 bg-white"
                  >
                    {Object.keys(item.variants).map((key) => (
                      <option key={key} value={key}>
                        {key} — ₹{item.variants[key]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-gray-600 text-sm">₹{item.price}</span>
                )}
              </div>

              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => {
                  const newItems = [...editingOrder.items];
                  newItems[idx].quantity = Number(e.target.value);
                  setEditingOrder({
                    ...editingOrder,
                    items: newItems,
                    totalAmount: recalcTotal(newItems),
                  });
                }}
                className="w-16 border rounded-lg px-2 py-1 mx-2"
              />

              <button
                onClick={() => {
                  const newItems = editingOrder.items.filter((_, i) => i !== idx);
                  setEditingOrder({
                    ...editingOrder,
                    items: newItems,
                    totalAmount: recalcTotal(newItems),
                  });
                }}
                className="px-2 py-1 rounded bg-red-100 text-red-600"
              >
                ✖
              </button>
            </div>
          ))}
        </div>


        {/* Add New Item */}
        <select
          onChange={(e) => {
            const selected = menuItems.find((m) => m._id === e.target.value);
            if (!selected) return;

            let newItem;

            if (selected.pricingType === "variant" && selected.variantRates) {
              const firstKey = Object.keys(selected.variantRates)[0];
              newItem = {
                name: selected.name,
                quantity: 1,
                variantName: firstKey,
                price: selected.variantRates[firstKey],
                variants: selected.variantRates,
              };
            } else {
              newItem = {
                name: selected.name,
                quantity: 1,
                price: selected.price,
                variantName: null,
                variants: null,
              };
            }

            const newItems = [...editingOrder.items, newItem];

            setEditingOrder({
              ...editingOrder,
              items: newItems,
              totalAmount: recalcTotal(newItems),
            });

            e.target.value = "";
          }}
          defaultValue=""
          className="w-full border rounded-lg px-3 py-2 mb-3"
        >
          <option value="">+ Add Item</option>

          {menuItems.map((menu) => (
            <option key={menu._id} value={menu._id}>
              {menu.name} —
              {menu.pricingType === "variant"
                ? "Variants Available"
                : `₹${menu.price}`}
            </option>
          ))}
        </select>


        {/* Total */}
        <label className="block text-sm font-medium mb-1">Total Amount</label>
        <input
          type="number"
          value={editingOrder.totalAmount}
          readOnly
          className="w-full border rounded-lg px-3 py-2 mb-4 bg-gray-100 cursor-not-allowed"
        />

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setEditingOrder(null)}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              updateOrder(editingOrder._id, {
                tableId: editingOrder.tableId,
                items: editingOrder.items,
                totalAmount: editingOrder.totalAmount,
                status: editingOrder.status,
              })
            }
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
