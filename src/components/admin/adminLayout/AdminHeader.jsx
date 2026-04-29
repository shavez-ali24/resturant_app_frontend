import { useEffect, Suspense, lazy } from "react";
import { Outlet } from "react-router-dom";
const AppSidebar = lazy(() =>
  import("@/components/admin/adminLayout/app-sidebar").then((module) => ({
    default: module.AppSidebar,
  }))
);
const SiteHeader = lazy(() =>
  import("@/components/admin/adminLayout/site-header").then((module) => ({
    default: module.SiteHeader,
  }))
);
// import { SiteHeader } from "@/components/admin/adminLayout/SiteHeader/SiteHeader";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useDispatch, useSelector } from "react-redux";
import { setRestaurantDetails } from "@/redux/adminRedux/billSlice";
import { 
  useGetRestaurantProfileQuery, 
  useGetMenuQuery,
  useUpdateOrderMutation
} from "@/redux/adminRedux/adminAPI";

const BillModal = lazy(() => import("../orderManagement/bill/BillModal"));

export default function AdminHeader({
  isDarkMode = false,
  onToggleDarkMode = () => {},
}) {
  const dispatch = useDispatch();
  const isBillOpen = useSelector((state) => state.bill?.open);
  
  // Fetch restaurant profile (includes tables)
  const { 
    data: restaurantData,
    error: restaurantError, 
    isLoading: restaurantLoading 
  } = useGetRestaurantProfileQuery();
  // console.log("Restaurant Data:", restaurantData);
  
  // Fetch menu items
  const { data: menuItems } = useGetMenuQuery(undefined, {
    skip: !isBillOpen,
  });
  
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
    <div className={`h-[100dvh] min-h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none ${isDarkMode ? "bg-slate-950 text-slate-100" : ""}`}>
      <SidebarProvider className="flex flex-col h-full">
        <Suspense
          fallback={
            <div className="h-16 w-full border-b border-orange-200 bg-white/80" />
          }
        >
          <SiteHeader
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
          />
        </Suspense>

        <div className="flex flex-1 overflow-hidden">
          <Suspense
            fallback={
              <div className="hidden h-full w-64 border-r border-orange-100 bg-orange-50/40 lg:block" />
            }
          >
            <AppSidebar isDarkMode={isDarkMode} />
          </Suspense>

          <SidebarInset className="flex flex-1 overflow-hidden min-h-0 overscroll-none">
            {/* ✅ GLOBAL SINGLE SCROLL CONTAINER - ALL PAGES SCROLL HERE */}
            <div className="flex flex-1 flex-col overflow-y-auto overscroll-y-auto scroll-smooth [-webkit-overflow-scrolling:touch] [--admin-scroll-container:true]">
              {restaurantLoading && (
                <p className={`p-4 ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
                  Loading restaurant...
                </p>
              )}
              {restaurantError && (
                <p className={`p-4 ${isDarkMode ? "text-red-300" : "text-red-500"}`}>
                  Failed to load restaurant
                </p>
              )}

              <Outlet />
              {isBillOpen && (
                <Suspense fallback={null}>
                  <BillModal
                    menuItems={menuItems || []}
                    tables={tables}
                    updateOrder={updateOrder}
                  />
                </Suspense>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>

  );
}
