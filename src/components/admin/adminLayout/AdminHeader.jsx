import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/admin/adminLayout/app-sidebar";
import { SiteHeader } from "@/components/admin/adminLayout/site-header";
// import { SiteHeader } from "@/components/admin/adminLayout/SiteHeader/SiteHeader";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import BillModal from "../orderManagement/bill/BillModal";
import { useDispatch } from "react-redux";
import { setRestaurantDetails } from "@/redux/adminRedux/billSlice";
import { 
  useGetRestaurantProfileQuery, 
  useGetMenuQuery,
  useUpdateOrderMutation
} from "@/redux/adminRedux/adminAPI";

export default function AdminHeader() {
  const dispatch = useDispatch();
  
  // Fetch restaurant profile (includes tables)
  const { 
    data: restaurantData,
    error: restaurantError, 
    isLoading: restaurantLoading 
  } = useGetRestaurantProfileQuery();
  // console.log("Restaurant Data:", restaurantData);
  
  // Fetch menu items
  const { data: menuItems } = useGetMenuQuery();
  
  // Update order mutation
  const [updateOrder] = useUpdateOrderMutation();

  useEffect(() => {
    if (restaurantData?.restaurant) {
      dispatch(setRestaurantDetails(restaurantData.restaurant));
    }
  }, [restaurantData, dispatch]);

  // Extract tables from restaurant profile
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
          _id: `table-${i}`,
          tableNumber: i,
          capacity: restaurant.tableCapacity || 4
        });
      }
      return tables;
    }
    
    return [];
  };

  const tables = extractTablesFromRestaurant();

  return (
    <div className="h-screen overflow-hidden">
      <SidebarProvider className="flex flex-col h-full">
        <SiteHeader />

        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />

          <SidebarInset className="flex flex-1 overflow-hidden">
            {/* 👇 ONLY THIS PART SCROLLS */}
            <div className="flex flex-1 flex-col overflow-y-auto">
              {restaurantLoading && <p className="p-4">Loading restaurant...</p>}
              {restaurantError && (
                <p className="p-4 text-red-500">
                  Failed to load restaurant
                </p>
              )}

              <Outlet />
              <BillModal 
                menuItems={menuItems || []}
                tables={tables}
                updateOrder={updateOrder}
              />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>

  );
}
