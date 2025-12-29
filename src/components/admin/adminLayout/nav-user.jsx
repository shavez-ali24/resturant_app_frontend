"use client";
import { ChevronsUpDown, LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useState, useEffect } from "react";
import { useGetRestaurantProfileQuery } from "@/redux/adminRedux/adminAPI";

export function NavUser({ user }) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [restaurantImage, setRestaurantImage] = useState("");

  const token = localStorage.getItem("token");

  const {
    data: restaurantData,
    isLoading,
    error,
  } = useGetRestaurantProfileQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (restaurantData) {
      const logoObj =
        restaurantData.restaurant?.logo

      if (logoObj?.url) {
        setRestaurantImage(logoObj.url);
      }
      if (!user.name && restaurantObj?.restaurantName) {
        user.name = restaurantObj.restaurantName; // Safe assign for UI
      }
    }
  }, [restaurantData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userAvatar");
    navigate("/login", { replace: true });
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    setTimeout(() => {
      navigate("/admin/profile");
    }, 100);
  };

  const getUserInitials = () => {
    if (!user.name) return "R";
    const nameParts = user.name.split(" ");
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <SidebarMenu className="bg-gradient-to-r from-orange-100 to-orange-300 border border-orange-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="bg-transparent hover:bg-orange-50/50 text-gray-800 data-[state=open]:bg-orange-50 transition-colors duration-200 rounded-xl"
            >
              {isLoading ? (
                <div className="h-9 w-9 rounded-lg border border-orange-200 bg-white animate-pulse flex items-center justify-center">
                  <div className="h-6 w-6 bg-orange-200 rounded"></div>
                </div>
              ) : (
                <Avatar className="h-9 w-9 rounded-lg border border-orange-200 bg-white">
                  {restaurantImage && (
                    <AvatarImage
                      src={restaurantImage}
                      alt={user.name || "Restaurant"}
                      className="object-cover"
                    />
                  )}

                  <AvatarFallback className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-gray-900">
                  {restaurantData?.restaurant?.restaurantName ||
                    restaurantData?.data?.restaurant?.restaurantName ||
                    user.name}
                </span>

                <span className="truncate text-xs text-gray-600">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-orange-600" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radiox-dropdown-menu-trigger-width] min-w-56 rounded-xl border border-orange-100 shadow-xl bg-white"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div
                className="flex items-center gap-3 px-3 py-3 text-left text-sm rounded-lg cursor-pointer hover:bg-orange-50 transition-colors duration-150"
                onClick={handleProfileClick}
              >
                <div className="relative">
                  {isLoading ? (
                    <div className="h-10 w-10 rounded-lg border border-orange-200 bg-white animate-pulse"></div>
                  ) : (
                    <Avatar className="h-10 w-10 rounded-lg border border-orange-200">
                      {restaurantImage ? (
                        <AvatarImage
                          src={restaurantImage}
                          alt={user.name || "Restaurant"}
                          className="object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : null}
                      <AvatarFallback className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-orange-200">
                    <User className="h-3 w-3 text-orange-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <span className="truncate font-semibold text-gray-900">
                    {restaurantData?.restaurant?.restaurantName ||
                      restaurantData?.data?.restaurant?.restaurantName ||
                      user.name}
                  </span>

                  <p className="text-xs text-gray-500 mt-0.5">View Profile</p>
                  {error && (
                    <p className="text-xs text-red-500 mt-1">
                      Failed to load restaurant data
                    </p>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1 border-orange-100" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer rounded-lg mt-1 transition-colors duration-150"
            >
              <div className="p-1.5 bg-red-100 rounded-lg">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
