import React, { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import Heading from "../common/Heading";
import MenuFilter from "./ComponentsMenu/MenuFilter";
import MenuItemCard from "./ComponentsMenu/MenuItemCard";
import MenuItemViewModal from "./ComponentsMenu/MenuItemViewModal";
import AddItemModal from "./ComponentsMenu/AddItemModal";
import EditItemModal from "./ComponentsMenu/EditItemModal";
import DeleteConfirmModal from "./ComponentsMenu/DeleteConfirmModal";
import { useNotify } from "../common/NotificationModal";

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
  // Simply pass items as they come from backend
  const normalizedItems = useMemo(() => items || [], [items]);
  const { data: restaurantData } = useGetRestaurantProfileQuery();
  
  // Get user role
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

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
  const [viewingItem, setViewingItem] = useState(null);

  const notify = useNotify();

  const showNotification = useCallback((message, type = "success") => {
    notify(message, type);
  }, [notify]);

  useEffect(() => setCurrentPage(1), [filters]);

  const filteredItems = useMemo(() => {
    const searchLower = filters.search.toLowerCase();
    return normalizedItems.filter((item) => {
      return (
        (!searchLower ||
          item?.name?.toLowerCase().includes(searchLower) ||
          item?.category?.toLowerCase().includes(searchLower)) &&
        (filters.category === "all" ||
          item.category?.toLowerCase() === filters.category.toLowerCase()) &&
        (filters.type === "all" || item.type === filters.type) &&
        (filters.available === "all" ||
          String(!!item.available) === filters.available)
      );
    });
  }, [items, filters]);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const getPageNumbers = () => {
    const pages = [];
    if (currentPage > 3) pages.push(1, "ellipsis-1");
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis-2", totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

// ✅ Fully fixed prepareFormData with robust discount handling
const prepareFormData = (formData, file) => {
  const fd = new FormData();

  fd.append("name", formData.name || "");
  fd.append("description", formData.description || "");
  fd.append("pricingType", formData.pricingType || "single");
  fd.append("type", formData.type || "veg");
  fd.append("category", formData.category || "");
  fd.append("available", formData.available ? "true" : "false");

  // Helper: sanitize discount - preserve actual value and active state
  const sanitizeDiscount = (discount) => {
    // console.log("🔥 sanitizeDiscount input:", discount);
    
    if (!discount) return { type: "flat", value: 0, active: false };
    
    // Parse the value as integer
    const rawValue = discount.value;
    let val = 0;
    if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
      val = parseInt(rawValue.toString().trim(), 10);
      if (isNaN(val)) val = 0;
    }
    
    // Check active - handle both boolean and string representations
    const isActive = discount.active === true || discount.active === "true";
    
    const result = {
      type: discount.type || "flat",
      value: val,
      active: isActive,
    };
    
    // console.log("🔥 sanitizeDiscount result:", result);
    return result;
  };

  // SINGLE PRICING
  if (formData.pricingType === "single") {
    fd.append("price", (formData.price ?? "0").toString());

    const discount = sanitizeDiscount(formData.discount);
    fd.append("discount[type]", discount.type);
    fd.append("discount[value]", discount.value.toString());
    fd.append("discount[active]", discount.active.toString());

    // console.log("[prepareFormData] single discount ->", discount);
  }

  // VARIANT PRICING
  if (formData.pricingType === "variant") {
    Object.entries(formData.variantRates || {}).forEach(([key, val]) => {
      if (val?.price !== undefined) {
        fd.append(`variantRates[${key}][price]`, val.price.toString());

        const discount = sanitizeDiscount(val.discount);
        fd.append(`variantRates[${key}][discount][type]`, discount.type);
        fd.append(`variantRates[${key}][discount][value]`, discount.value.toString());
        fd.append(`variantRates[${key}][discount][active]`, discount.active.toString());

        // console.log(`[prepareFormData] variant ${key} discount ->`, discount);
      }
    });
  }

  // COMBO PRICING
  if (formData.pricingType === "combo") {
    fd.append("comboPrice", (formData.comboPrice ?? "0").toString());
    
    const discount = sanitizeDiscount(formData.discount);
    fd.append("discount[type]", discount.type);
    fd.append("discount[value]", discount.value.toString());
    fd.append("discount[active]", discount.active.toString());
    
    (formData.comboItems || []).forEach((item, index) => {
      fd.append(`comboItems[${index}][menuItemId]`, item.menuItemId);
      fd.append(`comboItems[${index}][variant]`, item.variant || "");
      fd.append(`comboItems[${index}][quantity]`, (item.quantity ?? 1).toString());
    });
  }

  // FILE
  if (file) fd.append("file", file);

  // Debug: log all entries
  // console.log("[prepareFormData] FormData entries:");
  Array.from(fd.entries()).forEach(([key, value]) => {
    // console.log(`  ${key}: ${value}`);
  });

  return fd;
};


  const handleAddItem = async (formData, file) => {
    try {
      const fd = prepareFormData(formData, file);
      await createMenuItem(fd).unwrap();
      notify("Item added successfully", "success");
      setIsAddModalOpen(false);
      refetch();
    } catch (error) {
      notify(error?.data?.error || "Failed to add item", "error");
    }
  };

  const handleUpdateItem = async (formData, file) => {
    try {
      const fd = prepareFormData(formData, file);
      await updateMenuItem({ itemId: formData._id, updatedData: fd }).unwrap();
      notify("Item updated successfully", "success");
      setEditingItem(null);
      refetch();
    } catch (error) {
      notify(error?.data?.error || "Failed to update item", "error");
    }
  };

  const handleDeleteItem = async () => {
    try {
      await deleteMenuItem(deleteConfirm.id).unwrap();
      notify("Item deleted successfully", "success");
      setDeleteConfirm(null);
      refetch();
    } catch {
      notify("Failed to delete item", "error");
    }
  };

  return (
    <div className="bg-gray-50 py-6 px-4 relative bg-gradient-to-r from-orange-50/30 to-orange-100/40 bg-fixed">
      <MenuItemViewModal item={viewingItem} isOpen={!!viewingItem} onClose={() => setViewingItem(null)} menu={normalizedItems} />

      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        itemName={deleteConfirm?.name}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteItem}
      />

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddItem}
        restaurantCategories={restaurantCategories}
        menuItems={normalizedItems}
      />

      <AnimatePresence>
          {editingItem && (
          <EditItemModal
            isOpen={!!editingItem}
            item={editingItem}
            onClose={() => setEditingItem(null)}
            restaurantCategories={restaurantCategories}
              menuItems={normalizedItems.filter(item => item._id !== editingItem._id)}
            onSubmit={handleUpdateItem}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Heading title="Menu Management" />
          {isAdmin && (
            <Button
              className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600"
              onClick={() => setIsAddModalOpen(true)}
            >
              <CirclePlus size={18} className="mr-2" />
              Add Item
            </Button>
          )}
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
          <div className="text-center py-12">Loading menu items...</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-2">
              {currentItems.map((item) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => setDeleteConfirm({ id: item._id, name: item.name })}
                  onView={() => setViewingItem(item)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-4 cursor-pointer justify-center">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} />
                  </PaginationItem>

                  {pageNumbers.map((page, idx) => (
                    <PaginationItem key={idx}>
                      {typeof page === "string" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink isActive={currentPage === page} onClick={() => setCurrentPage(page)}>
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} />
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

