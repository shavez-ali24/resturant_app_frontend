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
import { getCompactPageNumbers } from "@/lib/pagination";

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

  const getRawErrorText = useCallback((errorObj) => {
    if (!errorObj) return "";
    if (typeof errorObj === "string") return errorObj;
    if (typeof errorObj?.data === "string") return errorObj.data;
    return (
      errorObj?.data?.message ||
      errorObj?.data?.error ||
      errorObj?.message ||
      errorObj?.error ||
      ""
    );
  }, []);

  const getFriendlyMenuError = useCallback((errorObj, context = "general") => {
    const status = errorObj?.status || errorObj?.originalStatus;
    const rawMessage = getRawErrorText(errorObj).toLowerCase();

    if (status === 401) return "Your session has expired. Please login again.";
    if (status === 403) return "You do not have permission for this action.";
    if (status === 404) return "Menu item not found. Please refresh and try again.";
    if (status === 409) return "This menu item already exists.";
    if (status === 413) return "Image size is too large. Please upload a smaller image.";
    if (status === 429) return "Too many requests. Please wait and try again.";
    if (status >= 500) return "Server is busy right now. Please try again in a moment.";

    if (
      rawMessage.includes("network") ||
      rawMessage.includes("fetch") ||
      rawMessage.includes("timeout")
    ) {
      return "Network issue detected. Please check your connection and retry.";
    }

    if (rawMessage.includes("image")) return "Please upload a valid image file.";
    if (rawMessage.includes("category")) return "Please select a valid category.";
    if (rawMessage.includes("price")) return "Please enter a valid price.";

    if (context === "add") return "Unable to add menu item right now.";
    if (context === "update") return "Unable to update menu item right now.";
    if (context === "delete") return "Unable to delete menu item right now.";
    return "Something went wrong. Please try again.";
  }, [getRawErrorText]);

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
  }, [normalizedItems, filters]);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const pageNumbers = useMemo(
    () => getCompactPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

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

  return fd;
};


  const handleAddItem = async (formData, file) => {
    try {
      const fd = prepareFormData(formData, file);
      await createMenuItem(fd).unwrap();
      notify("Menu item added successfully.", "success");
      setIsAddModalOpen(false);
      refetch();
    } catch (error) {
      notify(getFriendlyMenuError(error, "add"), "error");
    }
  };

  const handleUpdateItem = async (formData, file) => {
    try {
      const fd = prepareFormData(formData, file);
      await updateMenuItem({ itemId: formData._id, updatedData: fd }).unwrap();
      notify("Menu item updated successfully.", "success");
      setEditingItem(null);
      refetch();
    } catch (error) {
      notify(getFriendlyMenuError(error, "update"), "error");
    }
  };

  const handleDeleteItem = async () => {
    try {
      await deleteMenuItem(deleteConfirm.id).unwrap();
      notify("Menu item deleted successfully.", "success");
      setDeleteConfirm(null);
      refetch();
    } catch (error) {
      notify(getFriendlyMenuError(error, "delete"), "error");
    }
  };

  const handleFilterResetNotification = useCallback(() => {
    notify("Filters reset successfully.", "success");
  }, [notify]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30 px-2 py-3 sm:px-4 sm:py-4 md:px-6">
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

      <div className="mx-auto max-w-7xl pb-4">
        <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-orange-100 bg-white/95 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:gap-3 sm:p-4">
          <div className="min-w-0 flex-1">
            <Heading title="Menu Management" />
          </div>
          {isAdmin && (
            <Button
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600 sm:h-11 sm:gap-2 sm:px-4"
              onClick={() => setIsAddModalOpen(true)}
            >
              <CirclePlus size={16} />
              <span className="hidden min-[390px]:inline">Add Item</span>
              <span className="inline min-[390px]:hidden">Add</span>
            </Button>
          )}
        </div>

        <div className="mb-5 rounded-2xl border border-orange-100 bg-white/95 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:p-4">
          <MenuFilter
            value={filters}
            onFilterChange={(v) => setFilters({ ...filters, ...v })}
            categories={restaurantCategories}
            onResetNotify={handleFilterResetNotification}
          />
        </div>

        <div className="mb-5 flex items-center justify-between rounded-2xl border border-orange-100 bg-white/90 px-4 py-3 shadow-sm sm:mb-6">
          <h2 className="text-lg font-bold text-gray-800 sm:text-xl">Total Items</h2>
          <span className="inline-flex min-w-[44px] justify-center rounded-full bg-orange-100 px-3 py-1 text-sm font-extrabold text-orange-700">
            {filteredItems.length}
          </span>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white/90 py-12 text-center text-sm text-gray-600 sm:text-base">
            Loading menu items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white/90 py-12 text-center text-sm text-gray-600 sm:text-base">
            No menu item found for current filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 2xl:grid-cols-3">
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
              <div className="mt-6 px-2">
                <div className="w-full max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <Pagination className="min-w-max cursor-pointer justify-center">
                    <PaginationContent className="w-max min-w-max gap-1 rounded-xl border border-orange-200 bg-white/95 px-1.5 py-1 shadow-sm sm:px-2">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                          className={`h-7 rounded-md border border-orange-200 bg-white px-1.5 text-xs hover:bg-orange-50 cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:h-9 sm:rounded-lg sm:px-3 sm:text-sm sm:[&>span]:inline sm:[&_svg]:h-4 sm:[&_svg]:w-4 ${
                            currentPage === 1 ? "pointer-events-none opacity-50" : ""
                          }`}
                        />
                      </PaginationItem>

                      {pageNumbers.map((page, idx) => (
                        <PaginationItem key={idx}>
                          {typeof page === "string" ? (
                            <PaginationEllipsis className="h-7 w-7 cursor-pointer sm:h-9 sm:w-9" />
                          ) : (
                            <PaginationLink
                              isActive={currentPage === page}
                              className={`h-7 w-7 rounded-md border border-orange-200 p-0 text-[11px] cursor-pointer sm:h-9 sm:w-9 sm:rounded-lg sm:text-sm ${
                                currentPage === page
                                  ? "border-orange-500 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-600"
                                  : "bg-white text-gray-700 hover:bg-orange-50"
                              }`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                          className={`h-7 rounded-md border border-orange-200 bg-white px-1.5 text-xs hover:bg-orange-50 cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:h-9 sm:rounded-lg sm:px-3 sm:text-sm sm:[&>span]:inline sm:[&_svg]:h-4 sm:[&_svg]:w-4 ${
                            currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                          }`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Menu;
