"use client"
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { SuperAdminSidebar } from "@/components/superAdmin/sidebar/superAdminSidebar";
import { SiteHeader } from "@/components/superAdmin/sidebar/siteHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

export default function SuperAdminLayout() {
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSuperAdminAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
          navigate('/super-login');
          return;
        }

        const user = JSON.parse(userData);
        if (user.role !== 'superadmin') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/super-login');
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/super-login');
      } finally {
        setLoading(false);
      }
    };

    checkSuperAdminAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30 [--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <SuperAdminSidebar />
          <SidebarInset>
            <main className="flex-1 p-4 sm:p-5 lg:p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
