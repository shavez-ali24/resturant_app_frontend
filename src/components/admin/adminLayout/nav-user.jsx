"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronsUpDown, LogOut, User } from "lucide-react";
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
import { useGetRestaurantQuery } from "@/redux/adminRedux/adminAPI";


export function NavUser({ user, isDarkMode = false, inHeader = false }) {
  const sidebar = useSidebar();
  const isMobile = sidebar ? sidebar.isMobile : false;
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [restaurantImage, setRestaurantImage] = useState("");
  const colors = useSelector((state) => state.admin.theme.colors);
  
  const [hoverTrigger, setHoverTrigger] = useState(false);
  const [hoverProfileItem, setHoverProfileItem] = useState(false);

  const token = localStorage.getItem("admin_token");

  const {
    data: restaurantData,
    isLoading,
    error,
  } = useGetRestaurantQuery(undefined, {
    skip: !token,
  });

  const restaurantLabel = (() => {
    const raw =
      restaurantData?.restaurant?.restaurantName ||
      restaurantData?.data?.restaurant?.restaurantName;
    if (typeof raw === "string") return raw;
    const fallback = user?.name || "Restaurant";
    if (raw === null || raw === undefined) return fallback;
    const text = String(raw).trim();
    return text || fallback;
  })();

  useEffect(() => {
    if (restaurantData) {
      const logoObj =
        restaurantData.restaurant?.logo ||
        restaurantData?.data?.restaurant?.logo;

      if (logoObj?.url) {
        setRestaurantImage(logoObj.url);
      }
    }
  }, [restaurantData]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
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
  if (inHeader) {
    return (
      <div className="relative">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center rounded-full transition-transform duration-200 active:scale-95 focus:outline-none"
            >
              {isLoading ? (
                <div 
                  className="h-8 w-8 rounded-full border animate-pulse"
                  style={{
                    borderColor: isDarkMode ? '#475569' : colors.primaryMid,
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
                  }}
                />
              ) : (
                <Avatar 
                  className="h-8 w-8 rounded-full border shadow-sm"
                  style={{
                    borderColor: isDarkMode ? '#475569' : colors.primaryMid,
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
                  }}
                >
                  {restaurantImage && (
                    <AvatarImage
                      src={restaurantImage}
                      alt={user?.name || "Restaurant"}
                      className="object-cover"
                    />
                  )}

                  <AvatarFallback 
                    className="rounded-full text-white font-semibold text-xs flex items-center justify-center h-full w-full"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56 rounded-2xl border p-1 shadow-xl"
            style={{
              borderColor: isDarkMode ? '#334155' : colors.primaryMid,
              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff'
            }}
            side="bottom"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div
                onMouseEnter={() => setHoverProfileItem(true)}
                onMouseLeave={() => setHoverProfileItem(false)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors duration-150 ${isDarkMode ? "text-slate-200" : "text-gray-900"}`}
                style={{
                  backgroundColor: hoverProfileItem
                    ? (isDarkMode ? 'rgba(51, 65, 85, 0.95)' : colors.primaryLight)
                    : 'transparent'
                }}
                onClick={handleProfileClick}
              >
                <div className="relative">
                  {isLoading ? (
                    <div 
                      className="h-10 w-10 rounded-xl border animate-pulse"
                      style={{
                        borderColor: isDarkMode ? '#475569' : colors.primaryMid,
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
                      }}
                    ></div>
                  ) : (
                    <Avatar 
                      className="h-10 w-10 rounded-xl border"
                      style={{
                        borderColor: isDarkMode ? '#475569' : colors.primaryMid,
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
                      }}
                    >
                      {restaurantImage ? (
                        <AvatarImage
                          src={restaurantImage}
                          alt={user?.name || "Restaurant"}
                          className="object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : null}
                      <AvatarFallback 
                        className="rounded-xl text-white font-semibold flex items-center justify-center h-full w-full"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div 
                    className="absolute -bottom-1 -right-1 rounded-full p-0.5 border"
                    style={{
                      borderColor: isDarkMode ? '#475569' : colors.primaryMid,
                      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff'
                    }}
                  >
                    <User className="h-3 w-3" style={{ color: isDarkMode ? colors.primary : colors.primaryText }} />
                  </div>
                </div>
                <div className="flex-1">
                  <span className={`truncate font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                    {restaurantLabel}
                  </span>

                  <p className={`mt-0.5 text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>View Profile</p>
                  {error && (
                    <p className="mt-1 text-xs text-red-500">
                      Failed to load restaurant data
                    </p>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1" style={{ backgroundColor: isDarkMode ? '#334155' : colors.primaryLight }} />

            <DropdownMenuItem
              onClick={handleLogout}
              className={`mt-1 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors duration-150 ${isDarkMode ? "hover:bg-red-500/20 hover:text-red-400" : "hover:bg-red-50 hover:text-red-700"
                }`}
            >
              <div className={`rounded-lg p-1.5 ${isDarkMode ? "bg-red-500/20" : "bg-red-100"}`}>
                <LogOut className="h-4 w-4" />
              </div>
              <span className="font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <SidebarMenu className={`rounded-xl border transition-shadow duration-200 hover:shadow-sm ${isDarkMode
        ? "border-slate-700/60 bg-slate-800/60"
        : "border-[#ede8e3] bg-[#f7f3ef]"
      }`}>
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              onMouseEnter={() => setHoverTrigger(true)}
              onMouseLeave={() => setHoverTrigger(false)}
              className={`h-14 rounded-xl px-2.5 transition-colors duration-200 ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}
              style={{
                backgroundColor: hoverTrigger || isOpen
                  ? (isDarkMode ? 'rgba(30, 41, 59, 0.8)' : colors.primaryLight)
                  : 'transparent'
              }}
            >
              {isLoading ? (
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-xl border animate-pulse"
                  style={{
                    borderColor: isDarkMode ? '#475569' : colors.primaryMid,
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
                  }}
                >
                  <div 
                    className="h-6 w-6 rounded"
                    style={{
                      backgroundColor: isDarkMode ? '#475569' : colors.primaryMid
                    }}
                  ></div>
                </div>
              ) : (
                <Avatar 
                  className="h-10 w-10 rounded-xl border"
                  style={{
                    borderColor: isDarkMode ? '#475569' : colors.primaryMid,
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
                  }}
                >
                  {restaurantImage && (
                    <AvatarImage
                      src={restaurantImage}
                      alt={user.name || "Restaurant"}
                      className="object-cover"
                    />
                  )}

                  <AvatarFallback 
                    className="rounded-xl text-white font-semibold flex items-center justify-center h-full w-full"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className={`truncate font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                  {restaurantLabel}
                </span>

                <span className={`truncate text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className={`ml-auto size-4 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-2xl border p-1 shadow-xl"
            style={{
              borderColor: isDarkMode ? '#334155' : colors.primaryMid,
              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff'
            }}
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div
                onMouseEnter={() => setHoverProfileItem(true)}
                onMouseLeave={() => setHoverProfileItem(false)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors duration-150 ${isDarkMode ? "text-slate-200" : "text-gray-900"}`}
                style={{
                  backgroundColor: hoverProfileItem
                    ? (isDarkMode ? 'rgba(51, 65, 85, 0.95)' : colors.primaryLight)
                    : 'transparent'
                }}
                onClick={handleProfileClick}
              >
                <div className="relative">
                  {isLoading ? (
                    <div 
                      className="h-10 w-10 rounded-xl border animate-pulse"
                      style={{
                        borderColor: isDarkMode ? '#475569' : colors.primaryMid,
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
                      }}
                    ></div>
                  ) : (
                    <Avatar 
                      className="h-10 w-10 rounded-xl border"
                      style={{
                        borderColor: isDarkMode ? '#475569' : colors.primaryMid,
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
                      }}
                    >
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
                      <AvatarFallback 
                        className="rounded-xl text-white font-semibold flex items-center justify-center h-full w-full"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div 
                    className="absolute -bottom-1 -right-1 rounded-full p-0.5 border"
                    style={{
                      borderColor: isDarkMode ? '#475569' : colors.primaryMid,
                      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff'
                    }}
                  >
                    <User className="h-3 w-3" style={{ color: isDarkMode ? colors.primary : colors.primaryText }} />
                  </div>
                </div>
                <div className="flex-1">
                  <span className={`truncate font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                    {restaurantLabel}
                  </span>

                  <p className={`mt-0.5 text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>View Profile</p>
                  {error && (
                    <p className="mt-1 text-xs text-red-500">
                      Failed to load restaurant data
                    </p>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1" style={{ backgroundColor: isDarkMode ? '#334155' : colors.primaryLight }} />

            <DropdownMenuItem
              onClick={handleLogout}
              className={`mt-1 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors duration-150 ${isDarkMode ? "hover:bg-red-500/20 hover:text-red-400" : "hover:bg-red-50 hover:text-red-700"
                }`}
            >
              <div className={`rounded-lg p-1.5 ${isDarkMode ? "bg-red-500/20" : "bg-red-100"}`}>
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
