 
import React, { useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import Heading from "../ui/Heading";
import MenuFilter from "../Filter/MenuFilter";
import MenuItemCard from "./Components/MenuItemCard";
import AddItemModal from "./Components/AddItemModal";
import EditItemModal from "./Components/EditItemModal";
import DeleteConfirmModal from "./Components/DeleteConfirmModal";
import NotificationModal from "./Components/NotificationModal";

import {
  useGetMenuQuery,
  useDeleteMenuItemMutation,
  useUpdateMenuItemMutation,
  useCreateMenuItemMutation,
  useGetRestaurantProfileQuery,
} from "../../../redux/adminRedux/adminAPI";

const Menu = () => {
  // ✅ Fetch menu items
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMenuQuery();

  // ✅ Fetch restaurant categories
  const {
    data: restaurantData,
    isLoading: loadingCategories,
    isError: categoryError,
  } = useGetRestaurantProfileQuery();

  const restaurantCategories =
    restaurantData?.restaurant?.categories?.length > 0
      ? [...restaurantData.restaurant.categories].sort()
      : [];

  // ✅ Mutations
  const [createMenuItem] = useCreateMenuItemMutation();
  const [updateMenuItem] = useUpdateMenuItemMutation();
  const [deleteMenuItem] = useDeleteMenuItemMutation();

  // ✅ Local states
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    type: "all",
    available: "all",
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // ✅ Notifications
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification((prev) => (prev.show ? { ...prev, show: false } : prev));
    }, 3000);
  }, []);

  const closeNotification = useCallback(
    () => setNotification({ show: false, message: "", type: "" }),
    []
  );

  // ✅ Filtering logic
  const handleFilterChange = (newFilters) => setFilters(newFilters);

  const filteredItems = useMemo(() => {
    const searchLower = filters.search.toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !searchLower ||
        item?.name?.toLowerCase().includes(searchLower) ||
        item?.category?.toLowerCase().includes(searchLower);
      const matchesCategory =
        filters.category === "all" || item?.category === filters.category;
      const matchesType = filters.type === "all" || item?.type === filters.type;
      const matchesAvailability =
        filters.available === "all" ||
        String(item?.available) === String(filters.available);
      return matchesSearch && matchesCategory && matchesType && matchesAvailability;
    });
  }, [items, filters]);

  // ✅ Add item
  const handleAddItem = async (formData, file) => {
    try {
      const dataToSend = new FormData();

      // Append fields safely
      Object.keys(formData).forEach((key) => {
        if (key === "variantRates") {
          Object.entries(formData.variantRates).forEach(([variant, value]) => {
            if (value !== "" && value !== null && !isNaN(value)) {
              dataToSend.append(`variantRates[${variant}]`, value);
            }
          });
        } else if (key !== "image" && key !== "price") {
          if (typeof formData[key] === "boolean") {
            dataToSend.append(key, formData[key] ? "true" : "false");
          } else if (
            formData[key] !== undefined &&
            formData[key] !== null &&
            formData[key] !== ""
          ) {
            dataToSend.append(key, formData[key]);
          }
        }
      });

      // ✅ Handle single price
      if (
        formData.pricingType === "single" &&
        formData.price !== "" &&
        formData.price !== null &&
        !isNaN(formData.price)
      ) {
        dataToSend.append("price", Number(formData.price));
      }

      // ✅ Append file if selected
      if (file) dataToSend.append("file", file);

      await createMenuItem(dataToSend).unwrap();
      showNotification("Item added successfully!", "success");
      setIsAddModalOpen(false);
      refetch(); // ✅ refresh menu list
    } catch (err) {
      console.error("Add item error:", err);
      showNotification(err?.data?.error || "Failed to add item", "error");
    }
  };

  // ✅ Update item
  const handleUpdateItem = async (formData, file) => {
    try {
      const dataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "variantRates") {
          Object.entries(formData.variantRates).forEach(([variant, value]) => {
            if (value !== "" && value !== null && !isNaN(value)) {
              dataToSend.append(`variantRates[${variant}]`, value);
            }
          });
        } else if (key !== "image" && key !== "price") {
          if (typeof formData[key] === "boolean") {
            dataToSend.append(key, formData[key] ? "true" : "false");
          } else if (
            formData[key] !== undefined &&
            formData[key] !== null &&
            formData[key] !== ""
          ) {
            dataToSend.append(key, formData[key]);
          }
        }
      });

      if (
        formData.pricingType === "single" &&
        formData.price !== "" &&
        formData.price !== null &&
        !isNaN(formData.price)
      ) {
        dataToSend.append("price", Number(formData.price));
      }

      if (file) dataToSend.append("file", file);

      await updateMenuItem({
        itemId: formData._id,
        updatedData: dataToSend,
      }).unwrap();

      showNotification("Item updated successfully!", "success");
      setEditingItem(null);
      refetch(); // ✅ refresh menu
    } catch (err) {
      console.error("Update error:", err);
      showNotification(err?.data?.error || "Failed to update item", "error");
    }
  };

  // ✅ Delete item
  const handleDeleteItem = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMenuItem(deleteConfirm.id).unwrap();
      showNotification("Item deleted successfully!", "success");
      setDeleteConfirm(null);
      refetch(); // ✅ refresh menu
    } catch (err) {
      showNotification(err?.data?.message || "Failed to delete item", "error");
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 relative">
      {/* ✅ Notifications */}
      <NotificationModal notification={notification} onClose={closeNotification} />

      {/* ✅ Delete modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        itemName={deleteConfirm?.name}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteItem}
      />

      {/* ✅ Add modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddItem}
        restaurantCategories={restaurantCategories}
        loadingCategories={loadingCategories}
        errorCategories={categoryError ? "Failed to load categories" : null}
      />

      {/* ✅ Edit modal */}
      <AnimatePresence>
        {editingItem && (
          <EditItemModal
            item={editingItem}
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onSubmit={handleUpdateItem}
            restaurantCategories={restaurantCategories}
          />
        )}
      </AnimatePresence>

      {/* ✅ Page heading */}
      <Heading title="Menu Management" />

      {/* ✅ Filter + Add button */}
      <div className="my-6 flex justify-between items-center">
        <MenuFilter
          value={filters}
          onFilterChange={handleFilterChange}
          categories={restaurantCategories}
        />
        <Button
          className="py-3 text-lg bg-orange-500 text-white"
          onClick={() => setIsAddModalOpen(true)}
        >
          Add <CirclePlus size={22} className="ml-2" />
        </Button>
      </div>

      {/* ✅ Data states */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <p className="text-red-600 font-medium">
            {error?.data?.message || "Failed to load menu"}
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-2xl font-semibold text-gray-700">No Items Found</h3>
          <p className="text-gray-500 mt-2">Try adding some menu items.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item._id}
                item={item}
                onEdit={() => setEditingItem(item)}
                onDelete={() =>
                  setDeleteConfirm({ id: item._id, name: item.name })
                }
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Menu;
