"use client";
import {
  ChevronsUpDown,
  LogOut,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export function NavUser({ user }) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    // Check if we're in super admin section
    const isSuperAdmin = location.pathname.includes('/super-admin');
    
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("user"); // Also remove the user data
    
    // Redirect to appropriate login page
    if (isSuperAdmin) {
      navigate("/super-login", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    setTimeout(() => {
      navigate("/super-admin/profile");
    }, 100);
  };

  return (
    <SidebarMenu className="rounded-2xl border border-orange-200 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-14 rounded-xl bg-transparent px-2.5 text-gray-800 transition-colors duration-200 hover:bg-gradient-to-r hover:from-orange-100 hover:to-orange-200 data-[state=open]:bg-orange-100/60"
            >
              <Avatar className="h-9 w-9 rounded-xl border border-orange-200 bg-white">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-gray-900">{user.name}</span>
                <span className="truncate text-xs text-gray-500">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-gray-500" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-2xl border border-orange-200 bg-white p-1 shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-3 text-left text-sm transition-colors duration-150 hover:bg-orange-50"
                onClick={handleProfileClick}
              >
                <Avatar className="h-9 w-9 rounded-xl border border-orange-200">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight" onClick={handleProfileClick}>
                  <span className="truncate font-semibold text-gray-900">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-gray-500">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 border-orange-100" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="mt-1 cursor-pointer rounded-xl px-3 py-2 text-red-600 transition-colors duration-150 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
