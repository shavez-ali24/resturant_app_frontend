// Menu.jsx (Updated with View Modal)
import React, { useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import Heading from "../common/Heading";
import MenuFilter from "./ComponentsMenu/MenuFilter";
import MenuItemCard from "./ComponentsMenu/MenuItemCard";
import MenuItemViewModal from "./ComponentsMenu/MenuItemViewModal"; // Import new component
import AddItemModal from "./ComponentsMenu/AddItemModal";
import EditItemModal from "./ComponentsMenu/EditItemModal";
import DeleteConfirmModal from "./ComponentsMenu/DeleteConfirmModal";
import NotificationModal from "../common/NotificationModal";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

import {
  useGetMenuQuery,
  useDeleteMenuItemMutation,
  useUpdateMenuItemMutation,
  useCreateMenuItemMutation,
  useGetRestaurantProfileQuery,
} from "../../../redux/adminRedux/adminAPI";

const Menu = () => {
  const { data: items = [], isLoading, refetch } = useGetMenuQuery();
  const { data: restaurantData } = useGetRestaurantProfileQuery();

  const restaurantCategories = useMemo(() => {
    return restaurantData?.restaurant?.categories?.length > 0
      ? [...restaurantData.restaurant.categories].sort()
      : [];
  }, [restaurantData]);

  const [createMenuItem] = useCreateMenuItemMutation();
  const [updateMenuItem] = useUpdateMenuItemMutation();
  const [deleteMenuItem] = useDeleteMenuItemMutation();

  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    type: "all",
    available: "all",
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewingItem, setViewingItem] = useState(null); // New state for view modal

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      3000
    );
  }, []);
  const closeNotification = () => {
    setNotification({ show: false, type: "", message: "" });
  };

  const filteredItems = useMemo(() => {
    const searchLower = filters.search.toLowerCase();

    return items.filter((item) => {
      const matchSearch =
        !searchLower ||
        item?.name?.toLowerCase().includes(searchLower) ||
        item?.category?.toLowerCase().includes(searchLower);

      const matchCategory =
        filters.category === "all" || item.category === filters.category;

      const matchType = filters.type === "all" || item.type === filters.type;

      const matchAvail =
        filters.available === "all" ||
        String(item.available) === filters.available;

      return matchSearch && matchCategory && matchType && matchAvail;
    });
  }, [items, filters]);

  /* Pagination */
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const getPageNumbers = () => {
    const pages = [];
    if (currentPage > 3) {
      pages.push(1);
      pages.push("ellipsis-1");
    }
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) {
      pages.push("ellipsis-2");
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 relative bg-gradient-to-r from-orange-50/30 to-orange-100/40">
      {/* View Modal */}
      <MenuItemViewModal
        item={viewingItem}
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
      />

      {/* Notification Modal */}
      {notification.show && (
        <NotificationModal
          notification={notification}
          onClose={closeNotification}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        itemName={deleteConfirm?.name}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          await deleteMenuItem(deleteConfirm.id).unwrap();
          showNotification("Item deleted", "success");
          setDeleteConfirm(null);
          refetch();
        }}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (formData, file) => {
          const fd = new FormData();
          Object.entries(formData).forEach(([k, v]) => {
            if (v === "" || v === null) return;
            if (k === "variantRates") {
              Object.entries(v).forEach(([rateKey, rateValue]) => {
                fd.append(`variantRates[${rateKey}]`, rateValue);
              });
            } else {
              fd.append(k, v);
            }
          });
          if (file) fd.append("file", file);
          await createMenuItem(fd).unwrap();
          showNotification("Item added", "success");
          setIsAddModalOpen(false);
          refetch();
        }}
        restaurantCategories={restaurantCategories}
      />

      {/* Edit Item Modal */}
      <AnimatePresence>
        {editingItem && (
          <EditItemModal
            isOpen={!!editingItem}
            item={editingItem}
            onClose={() => setEditingItem(null)}
            restaurantCategories={restaurantCategories}
            onSubmit={async (formData, file) => {
              const fd = new FormData();
              Object.entries(formData).forEach(([key, value]) => {
                if (value === "" || value === null) return;
                if (key === "variantRates") {
                  Object.entries(value).forEach(([rateKey, rateValue]) => {
                    if (rateValue) {
                      fd.append(`variantRates[${rateKey}]`, rateValue);
                    }
                  });
                } else if (key !== "image") {
                  fd.append(key, value);
                }
              });
              if (file) fd.append("file", file);
              await updateMenuItem({
                itemId: formData._id,
                updatedData: fd,
              }).unwrap();
              showNotification("Item updated", "success");
              setEditingItem(null);
              refetch();
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Heading title="Menu Management" />
          <Button
            className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors"
            onClick={() => setIsAddModalOpen(true)}
          >
            <CirclePlus size={18} className="mr-2" />
            Add Item
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-8">
          <MenuFilter
            value={filters}
            onFilterChange={(v) => setFilters({ ...filters, ...v })}
            categories={restaurantCategories}
          />
        </div>

        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Total Items <span className="text-orange-600 font-extrabold">({filteredItems.length})</span>
        </h2>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading menu items...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            {/* <div className="text-gray-400 mb-4">🍽️</div> */}
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
            <p className="text-gray-500">Try adjusting your filters or add a new item</p>
          </div>
        ) : (
          <>
    <div className="grid  gap-4 sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-2">
  {currentItems.map((item) => (
    <MenuItemCard
      key={item._id}
      item={item}
      onEdit={() => setEditingItem(item)}
      onDelete={() =>
        setDeleteConfirm({ id: item._id, name: item.name })
      }
      onView={() => setViewingItem(item)}
    />
  ))}
</div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mb-12 mt-4  cursor-pointer justify-center">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
                      }
                      className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}
                    />
                  </PaginationItem>

                  {pageNumbers.map((page, idx) => (
                    <PaginationItem key={idx}>
                      {typeof page === "string" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page)}
                          className="hover:bg-orange-50"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages && setCurrentPage(currentPage + 1)
                      }
                      className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Menu;