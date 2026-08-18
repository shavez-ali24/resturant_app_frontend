import { useEffect, useState, Suspense, lazy } from "react";
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
  useGetRestaurantQuery, 
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
  
  const colors = useSelector((state) => state.admin.theme.colors);
  
  // Fetch restaurant profile (includes tables)
  const { 
    data: restaurantData,
    error: restaurantError, 
    isLoading: restaurantLoading 
  } = useGetRestaurantQuery();
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

  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  useEffect(() => {
    if (restaurantLoading) {
      const timer = setTimeout(() => {
        setShowTimeoutWarning(true);
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    } else {
      setShowTimeoutWarning(false);
    }
  }, [restaurantLoading]);

  return (
    <div className={`h-[100dvh] min-h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none ${isDarkMode ? "bg-[#0f172a] text-slate-100" : "bg-[#f7f3ef]"}`}>
      <SidebarProvider className="flex flex-col h-full">
        <Suspense
          fallback={
            <div className="h-16 w-full border-b bg-white/80" style={{ borderBottomColor: colors.primaryMid }} />
          }
        >
          <SiteHeader
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
          />
        </Suspense>

        <div className="flex flex-1 overflow-hidden">
          <div className="lg:hidden">
            <Suspense
              fallback={
                <div className="hidden h-full w-64 border-r" style={{ borderRightColor: colors.primaryMid, backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : colors.primaryLight }} />
              }
            >
              <AppSidebar isDarkMode={isDarkMode} />
            </Suspense>
          </div>

          <SidebarInset className="flex flex-1 overflow-hidden min-h-0 overscroll-none">
            {/* ✅ GLOBAL SINGLE SCROLL CONTAINER - ALL PAGES SCROLL HERE */}
            <div className={`flex flex-1 flex-col overflow-y-auto overscroll-y-auto scroll-smooth [-webkit-overflow-scrolling:touch] [--admin-scroll-container:true] ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
              {restaurantLoading && (
                <div className="p-4 flex flex-col gap-3">
                  <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
                    Loading restaurant...
                  </p>
                  {showTimeoutWarning && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left max-w-lg dark:border-amber-900/30 dark:bg-amber-950/15">
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <svg className="w-4 h-4 text-amber-600 dark:text-amber-450 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Duplicate Tab Detected?
                      </h3>
                      <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-semibold">
                        This page is taking longer than expected to load. Having the KDS or Admin Panel open in multiple tabs can block new connections.
                      </p>
                      <p className="mt-1 text-xs text-amber-800 dark:text-amber-200 font-bold">
                        Please close duplicate tabs and refresh this tab to load the data.
                      </p>
                    </div>
                  )}
                </div>
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
