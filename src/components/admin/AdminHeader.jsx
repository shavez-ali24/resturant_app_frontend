/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { SiteHeader } from "@/components/admin/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import BillModal from "./BillModal";
import { useDispatch } from "react-redux";
import { setRestaurantDetails } from "@/redux/adminRedux/billSlice";
import config from "@/config";


export default function AdminHeader() {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  useEffect(() => {
    async function loadRestaurantDetails() {
      if (!token) return;

      try {
        const res = await fetch(`${config.BASE_URL}/api/restaurant/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load restaurant data");

        const data = await res.json();
        if (data.restaurant) {
          dispatch(setRestaurantDetails(data.restaurant));
        }
      } catch (error) {
        console.error("Error loading restaurant:", error);
      }
    }

    loadRestaurantDetails();
  }, [token]);

  return (
    <div>

      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col">
              <Outlet /> {/* Your routed content will appear here */}
              <BillModal />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
