import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/admin/adminLayout/app-sidebar";
import { SiteHeader } from "@/components/admin/adminLayout/site-header";
// import { SiteHeader } from "@/components/admin/adminLayout/SiteHeader/SiteHeader";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import BillModal from "../orderManagement/bill/BillModal";
import { useDispatch } from "react-redux";
import { setRestaurantDetails } from "@/redux/adminRedux/billSlice";
import { useGetRestaurantProfileQuery } from "@/redux/adminRedux/adminAPI";

export default function AdminHeader() {
  const dispatch = useDispatch();
  const { data, error, isLoading } = useGetRestaurantProfileQuery();

  useEffect(() => {
    if (data?.restaurant) {
      dispatch(setRestaurantDetails(data.restaurant));
    }
  }, [data]);

  return (
    <div className="h-screen overflow-hidden">
  <SidebarProvider className="flex flex-col h-full">
    <SiteHeader />

    <div className="flex flex-1 overflow-hidden">
      <AppSidebar />

      <SidebarInset className="flex flex-1 overflow-hidden">
        {/* 👇 ONLY THIS PART SCROLLS */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {isLoading && <p className="p-4">Loading restaurant...</p>}
          {error && (
            <p className="p-4 text-red-500">
              Failed to load restaurant
            </p>
          )}

          <Outlet />
          <BillModal />
        </div>
      </SidebarInset>
    </div>
  </SidebarProvider>
</div>

  );
}
