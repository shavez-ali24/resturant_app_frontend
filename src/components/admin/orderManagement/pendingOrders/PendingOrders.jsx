import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNotification } from "../../Bell/NotificationContext";
import { SlRefresh } from "react-icons/sl";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import OrdersTable from "./OrdersTable";
import EditOrderModal from "./EditOrderModal";
import DeleteModal from "./DeleteModal";
import ItemsModal from "../commonOrderFile/ItemsModal";
import CustomizationsModal from "./CustomizationsModal";
import Heading from "../../common/Heading";

import {
  useGetOrdersQuery,
  useGetMenuQuery,
  useGetRestaurantProfileQuery,
  useUpdateOrderMutation,
  useDeleteOrderMutation
} from "../../../../redux/adminRedux/adminAPI";

const Orders = () => {
  const { notify } = useNotification();

  // --- Local States ---
  const [currentPage, setCurrentPage] = useState(1);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [orderForBillModal, setOrderForBillModal] = useState(null);
  const [selectedOrderForCustomizations, setSelectedOrderForCustomizations] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(
    () => localStorage.getItem("autoRefresh") || "OFF"
  );
  const autoRefIntervalId = useRef(null);
  const itemsPerPage = 10;

  // --- RTK Query Hook with API parameters ---
  const {
    data: ordersResponse = {},
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorObj,
    refetch: refetchOrders,
  } = useGetOrdersQuery({
    status: "pending",
    page: currentPage,
    limit: itemsPerPage,
    range: "all",
  });

  const { data: menuItems = [] } = useGetMenuQuery();
  
  // ✅ Restaurant profile se tables extract karenge
  const { 
    data: restaurantData,
    isLoading: restaurantLoading,
    error: restaurantError,
    refetch: refetchRestaurant
  } = useGetRestaurantProfileQuery();
  
  const [updateOrderApi] = useUpdateOrderMutation();
  const [deleteOrderApi] = useDeleteOrderMutation();

  // ✅ FIXED: Extract tables from restaurant profile
  // Aapke API response ke format ke hisab se adjust karna
  const extractTablesFromRestaurant = () => {
    if (!restaurantData) return [];
    
    const restaurant = restaurantData.restaurant || restaurantData;
    
    // Format 1: Direct tables array in restaurant
    if (Array.isArray(restaurant.tables)) {
      return restaurant.tables;
    }
    
    // Format 2: Tables as separate field
    if (restaurant.tables && Array.isArray(restaurant.tables)) {
      return restaurant.tables;
    }
    
    // Format 3: tableNumbers se generate karna
    if (restaurant.tableNumbers && typeof restaurant.tableNumbers === 'number') {
      const tables = [];
      for (let i = 1; i <= restaurant.tableNumbers; i++) {
        tables.push({
          _id: `T${i}`,
          tableNumber: i,
          name: `T${i}`,
          // capacity: 4
        });
      }
      return tables;
    }
    
    // Format 4: Agar koi aur field mein hai
    // Aapke API response ko check karke add karein
    // console.log("Restaurant Object for debugging:", restaurant);
    
    return [];
  };

  const tables = extractTablesFromRestaurant();

  // --- Extract data from API response ---
  const orders = Array.isArray(ordersResponse?.orders) ? ordersResponse.orders : [];
  const totalOrders = ordersResponse?.totalOrders || 0;
  const totalPages = ordersResponse?.totalPages || 1;
  const loading = ordersLoading || restaurantLoading;
  const error = ordersError ? ordersErrorObj : null;

  // Debug logs
  useEffect(() => {
    if (restaurantData) {
      // console.log("Full Restaurant API Response:", restaurantData);
      // console.log("Restaurant Object:", restaurantData.restaurant || restaurantData);
      // console.log("Tables extracted:", tables);
      // console.log("Table count:", tables.length);
      
      // Aapke API response ke structure ko check karein
      const restaurant = restaurantData.restaurant || restaurantData;
      // console.log("Available keys in restaurant:", Object.keys(restaurant));
      // console.log("tableNumbers field:", restaurant.tableNumbers);
    }
  }, [restaurantData, tables]);

  // Update lastUpdated timestamp
  useEffect(() => {
    if (ordersResponse.orders) setLastUpdated(new Date());
  }, [ordersResponse]);

  // Update bill modal live
  useEffect(() => {
    if (orderForBillModal && orders.length) {
      const updated = orders.find((o) => o._id === orderForBillModal._id);
      setOrderForBillModal(updated ?? null);
    }
  }, [orders, orderForBillModal]);

  // Manual Refresh
  const handleManualRefresh = useCallback(async () => {
    try {
      await refetchOrders();
      await refetchRestaurant(); // ✅ Restaurant profile bhi refresh karein
      notify("Orders & Restaurant data refreshed", "success");
    } catch (err) {
      notify("Failed to refresh", "error");
    }
  }, [refetchOrders, refetchRestaurant, notify]);

  // Update Order
  const updateOrder = async (orderId, updatedData) => {
    try {
      // ✅ FIX: Ensure orderId is a string
      const orderIdString = String(orderId);
      
      // console.log("Updating order:", { orderIdString, updatedData });
      
      // ✅ FIX: Call API with correct parameters
      await updateOrderApi({ 
        orderId: orderIdString, 
        updatedData 
      }).unwrap();
      
      notify("Order updated successfully!", "success");
      refetchOrders();
      setEditingOrder(null);
    } catch (err) {
      console.error("Update order error:", err);
      const msg = err?.data?.message || "Failed to update order";
      notify(msg, "error");
    }
  };

  // Delete Order
  const deleteOrder = async (orderId) => {
    try {
      await deleteOrderApi(orderId).unwrap();
      notify("Order deleted successfully!", "success");
      refetchOrders();
      setShowConfirmDelete(null);
    } catch (err) {
      const msg = err?.data?.message || "Failed to delete order";
      notify(msg, "error");
    }
  };

  // Function to handle customizations click
  const handleCustomizationsClick = (order) => {
    if (order && order.items) {
      setSelectedOrderForCustomizations(order);
    }
  };

  // --- Auto Refresh ---
  const stopAutoRefresh = useCallback(() => {
    if (autoRefIntervalId.current) {
      clearInterval(autoRefIntervalId.current);
      autoRefIntervalId.current = null;
    }
    setAutoRefresh("OFF");
    localStorage.setItem("autoRefresh", "OFF");
    notify("Auto-refresh turned off", "info");
  }, [notify]);

  const startAutoRefresh = useCallback(
    (minutes) => {
      if (autoRefIntervalId.current) clearInterval(autoRefIntervalId.current);

      const id = setInterval(() => {
        refetchOrders();
        refetchRestaurant(); // ✅ Restaurant data bhi refresh karein
      }, minutes * 60 * 1000);

      autoRefIntervalId.current = id;
      setAutoRefresh(`${minutes}`);
      localStorage.setItem("autoRefresh", `${minutes}`);
      notify(`Auto-refresh set to every ${minutes} min`, "success");
    },
    [refetchOrders, refetchRestaurant, notify]
  );

  useEffect(() => {
    const saved = localStorage.getItem("autoRefresh");
    if (saved && saved !== "OFF") {
      const mins = parseInt(saved, 10);
      if (!isNaN(mins) && mins > 0) startAutoRefresh(mins);
    }

    return () => {
      if (autoRefIntervalId.current) clearInterval(autoRefIntervalId.current);
    };
  }, [startAutoRefresh]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Generate page numbers with ellipsis logic
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pageNumbers.push(1);

    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      startPage = 2;
      endPage = 4;
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
      endPage = totalPages - 1;
    }

    if (startPage > 2) {
      pageNumbers.push('ellipsis-left');
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages - 1) {
      pageNumbers.push('ellipsis-right');
    }

    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  // Handle backdrop click for modals
  const handleBackdropClick = (e, closeFunction) => {
    if (e.target === e.currentTarget) {
      closeFunction();
    }
  };

  return (
    <div className="min-h-screen py-6 sm:px-4 lg:px-4 bg-gradient-to-r from-orange-50/30 to-orange-100/40">
      {/* Header */}
      <div className="flex flex-row items-center justify-between p-3 sm:p-4 mb-4 gap-3">
        <Heading title="Pending Orders" />

        <div className="flex items-center gap-4">
          <button
            onClick={handleManualRefresh}
            className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2"
          >
            <SlRefresh />
            <span className="hidden sm:inline text-sm">Refresh</span>
          </button>

          {/* Auto Refresh */}
          <Select
            value={autoRefresh}
            onValueChange={(value) => {
              if (value === "OFF") {
                stopAutoRefresh();
              } else {
                const mins = parseInt(value, 10);
                if (!isNaN(mins)) startAutoRefresh(mins);
              }
            }}
          >
            <SelectTrigger className="h-9 w-[140px] rounded-lg border-orange-600 bg-orange-100 px-3 text-xs font-bold uppercase shadow-sm ring-1 ring-gray-300 text-orange-700">
              <SelectValue placeholder="Auto Refresh" />
            </SelectTrigger>

            <SelectContent className="bg-orange-50 border-orange-300 shadow-xl rounded-xl p-1 min-w-[140px] cursor-pointer ">
              <SelectGroup>
                <SelectItem value="OFF" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Off</SelectItem>
                <SelectItem value="1" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Every 1 min</SelectItem>
                <SelectItem value="2" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Every 2 min</SelectItem>
                <SelectItem value="5" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Every 5 min</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        loading={loading}
        error={error}
        setEditingOrder={setEditingOrder}
        setShowConfirmDelete={setShowConfirmDelete}
        setOrderForBillModal={setOrderForBillModal}
        updateOrder={updateOrder}
        tableType="pending"
        onCustomizationsClick={handleCustomizationsClick}
      />

      {/* Server-side Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {getPageNumbers().map((pageNum, index) => {
                if (pageNum === 'ellipsis-left' || pageNum === 'ellipsis-right') {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <span className="px-3 py-2">...</span>
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === pageNum}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) handlePageChange(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modals */}
      
      {/* Customizations Modal */}
      {selectedOrderForCustomizations && (
        <CustomizationsModal
          order={selectedOrderForCustomizations}
          onClose={() => setSelectedOrderForCustomizations(null)}
        />
      )}

      {/* Items Modal */}
      {orderForBillModal && (
        <ItemsModal
          order={orderForBillModal}
          restaurantDetails={restaurantData}
          onClose={() => setOrderForBillModal(null)}
        />
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          editingOrder={editingOrder}
          setEditingOrder={setEditingOrder}
          updateOrder={updateOrder}
          menuItems={menuItems}
          tables={tables} // ✅ Passing tables from restaurant profile
        />
      )}

      {/* Delete Modal */}
      {showConfirmDelete && (
        <DeleteModal
          order={showConfirmDelete}
          onCancel={() => setShowConfirmDelete(null)}
          onDelete={() => deleteOrder(showConfirmDelete._id)}
        />
      )}
    </div>
  );
};

export default Orders;