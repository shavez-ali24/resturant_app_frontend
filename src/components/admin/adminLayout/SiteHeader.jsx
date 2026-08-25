import { useState, useEffect, Suspense, lazy, useMemo } from "react";
import { 
  PanelRightClose, 
  Store, 
  AlertTriangle, 
  CheckCircle, 
  Moon, 
  Sun, 
  LayoutGrid,
  ChevronDown,
  ChefHat,
  ClipboardList,
  Utensils,
  TrendingUp,
  Settings
} from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import logo from "@/assets/tapNbite-176x96.png";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useNotification } from "../Bell/NotificationContext";
import {
  useGetRestaurantQuery,
  useUpdateRestaurantStatusMutation,
} from "@/redux/adminRedux/adminAPI";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const NotificationBell = lazy(() => import("../Bell/NotificationBell"));
import { NavUser } from "@/components/admin/adminLayout/NavUser";

export function SiteHeader({
  isDarkMode = false,
  onToggleDarkMode = () => { },
}) {
  const toggleSidebar = useSidebar().toggleSidebar;
  const { notify } = useNotification();
  const colors = useSelector((state) => state.admin?.theme?.colors) || {
    primary: "#EF9F27",
    primaryMid: "#fde68a",
    primaryLight: "#fff8f5"
  };
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoToLiveTables = () => {
    localStorage.setItem("orderViewMode", "layout");
    localStorage.setItem("orderLayoutFilter", "eat_here");
    if (location.pathname === "/admin/orders") {
      window.dispatchEvent(new Event("goToLiveTables"));
    } else {
      navigate("/admin/orders");
    }
  };

  const { data: profileData, isLoading: profileLoading } =
    useGetRestaurantQuery();

  // Get current user role from localStorage
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const userData = {
    name: typeof window !== 'undefined' ? (localStorage.getItem("userName") || "User") : "User",
    email: typeof window !== 'undefined' ? (localStorage.getItem("userEmail") || "") : "",
    avatar: typeof window !== 'undefined' ? (localStorage.getItem("userAvatar") || "") : "",
  };

  const [toggleRestaurant, { isLoading: toggleLoading }] =
    useUpdateRestaurantStatusMutation();

  const [isOpen, setIsOpen] = useState(null);
  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showBell, setShowBell] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let idleId;
    const enableBell = () => setShowBell(true);

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(enableBell, { timeout: 800 });
    } else {
      idleId = window.setTimeout(enableBell, 600);
    }

    return () => {
      if ("cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, []);

  useEffect(() => {
    if (!profileData) return;

    let status = null;
    let name = "Restaurant";
    const restaurantInfo = profileData?.restaurant || profileData;

    if (typeof restaurantInfo?.isOpen === "boolean") {
      status = restaurantInfo.isOpen;
    }

    const rawName =
      restaurantInfo?.restaurantName ||
      restaurantInfo?.name ||
      "";
    if (rawName) {
      name = typeof rawName === "string" ? rawName : String(rawName).trim();
    }

    setIsOpen(status ?? false);
    setRestaurantName(name);
  }, [profileData]);

  const handleToggleClick = () => {
    const newStatus = !isOpen;
    setPendingStatus(newStatus);
    setShowConfirmDialog(true);
  };

  const handleConfirmToggle = async () => {
    try {
      await toggleRestaurant({ isOpen: pendingStatus }).unwrap();
      setIsOpen(pendingStatus);
      setShowConfirmDialog(false);
      notify(
        `Restaurant successfully ${pendingStatus ? "opened" : "closed"}`,
        "success"
      );
    } catch {
      notify("Failed to update restaurant status", "error");
    } finally {
      setPendingStatus(null);
    }
  };

  const handleCancelToggle = () => {
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  const loading = profileLoading || toggleLoading;

  const navMainConfig = [
    {
      title: "Kitchen KDS",
      icon: ChefHat,
      roles: ["admin", "staff"],
      items: [{ title: "Kitchen View", url: "/kds", target: "_blank" }],
    },
    {
      title: "Orders",
      icon: ClipboardList,
      roles: ["admin", "staff"],
      items: [
        { title: "Live orders", url: "/admin/orders" },
        { title: "Completed orders", url: "/admin/completedorder" },
        { title: "Cancelled orders", url: "/admin/cancelledorder" },
      ],
    },
    {
      title: "Digital menu",
      icon: Utensils,
      roles: ["admin", "staff"],
      items: [{ title: "Edit Menu", url: "/admin/menu" }],
    },
    {
      title: "Analytics",
      icon: TrendingUp,
      roles: ["admin"],
      items: [
        { title: "Revenue", url: "/admin/revenue" },
        { title: "Sales", url: "/admin/sales" },
      ],
    },
  ];

  const filteredNavItems = useMemo(() => {
    return navMainConfig.filter(
      (item) => item.roles.includes(userRole || "admin")
    );
  }, [userRole]);

  const isGroupActive = (items) => {
    return items.some(item => {
      if (!item.url || item.url === "#") return false;
      return location.pathname.startsWith(item.url);
    });
  };

  const getGroupLabel = (item) => {
    const activeSubItem = item.items.find(subItem => {
      if (!subItem.url || subItem.url === "#") return false;
      return location.pathname.startsWith(subItem.url);
    });
    return activeSubItem ? activeSubItem.title : item.title;
  };

  // Reusable hover values based on CSS variables instead of dynamic inline JS event listeners
  const cancelBtnStyle = {
    "--hover-bg": isDarkMode ? "rgba(51, 65, 85, 0.95)" : colors.primaryLight,
    borderColor: isDarkMode ? '#334155' : colors.primaryMid,
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    color: isDarkMode ? '#e2e8f0' : '#374151'
  };

  return (
    <>
      {/* Main Header */}
      <header className={`sticky top-0 z-30 w-full border-b shadow-sm backdrop-blur-sm ${
        isDarkMode ? "border-slate-700/60 bg-[#0f172a]/95" : "border-[#ede8e3] bg-white/95"
      }`}>
        <div className="flex h-14 w-full flex-nowrap items-center justify-between gap-1.5 px-2.5 md:px-6">
          {/* Left Side - Menu Toggle */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              onClick={toggleSidebar}
              className="md:hidden relative flex h-9 w-9 items-center justify-center transition-colors duration-200 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 focus:outline-none"
              aria-label="Toggle sidebar"
            >
              <PanelRightClose size={20} className="stroke-[1.5]" />
            </button>

            <Separator
              orientation="vertical"
              className={`h-7 md:hidden ${isDarkMode ? "bg-slate-700/30" : "bg-[#ede8e3]"}`}
            />

            {/* Restaurant Info - only show on md+ */}
            <div className="hidden items-center md:flex select-none shrink-0">
              <img src={logo} alt="TapnBite Logo" className="h-8 w-auto object-contain" />
            </div>
          </div>

          <Separator
            orientation="vertical"
            className={`hidden md:block h-6 ${isDarkMode ? "bg-slate-700/40" : "bg-gray-300"} mx-1.5`}
          />

          {/* Middle Side - Horizontal Navigation (Desktop only) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5 mx-4 flex-1 justify-start">
            {filteredNavItems.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = isGroupActive(item.items);

              return (
                <div key={item.title} className="flex items-center gap-1.5 lg:gap-2.5">
                  {index > 0 && (
                    <Separator
                      orientation="vertical"
                      className={`h-5 ${isDarkMode ? "bg-slate-700/40" : "bg-gray-300"}`}
                    />
                  )}
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs lg:text-sm font-bold rounded-lg transition-all duration-200 focus:outline-none select-none border border-transparent ${
                          isActive
                            ? ""
                            : isDarkMode
                            ? "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                            : "text-[#57524e] hover:bg-gray-100 hover:text-[#1c1917]"
                        }`}
                        style={{
                          backgroundColor: isActive
                            ? (isDarkMode ? `${colors.primary}20` : `${colors.primary}12`)
                            : undefined,
                          borderColor: isActive
                            ? (isDarkMode ? `${colors.primary}40` : `${colors.primary}25`)
                            : undefined,
                          color: isActive ? colors.primary : undefined,
                        }}
                      >
                        <IconComponent size={15} className="shrink-0" />
                        <span>{getGroupLabel(item)}</span>
                        <ChevronDown size={12} className="transition-transform duration-200 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      sideOffset={6}
                      className={`w-44 p-1 rounded-xl shadow-lg border z-[999] ${
                        isDarkMode
                          ? "bg-[#0f172a] border-slate-700/80 text-slate-100"
                          : "bg-white border-[#ede8e3] text-gray-900"
                      }`}
                    >
                      {item.items.map((subItem) => {
                        const isSubActive = location.pathname === subItem.url;
                        return (
                          <DropdownMenuItem
                            key={subItem.title}
                            asChild
                            className={`rounded-lg cursor-pointer text-xs lg:text-sm font-semibold ${
                              isSubActive
                                ? isDarkMode
                                  ? "bg-slate-800 text-white"
                                  : "bg-gray-50 text-gray-900"
                                : ""
                            }`}
                          >
                            {subItem.target === "_blank" ? (
                              <a
                                href={subItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full px-2.5 py-1.5 block"
                              >
                                {subItem.title}
                              </a>
                            ) : (
                              <Link
                                to={subItem.url}
                                className="w-full px-2.5 py-1.5 block"
                                style={{
                                  color: isSubActive ? colors.primary : undefined,
                                }}
                              >
                                {subItem.title}
                              </Link>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </nav>

          {/* Right Side - Controls */}
          <div className="mt-0 flex shrink-0 items-center gap-1.5 sm:gap-2.5 md:gap-4">
            {/* Status Toggle */}
            {isAdmin && (
              <>
                <button
                  onClick={handleToggleClick}
                  disabled={loading || toggleLoading}
                  className="flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors focus:outline-none"
                  title="Toggle Restaurant Status"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
                  />
                  <span className={`text-[10px] sm:text-xs md:text-sm font-black transition-colors select-none ${
                    isDarkMode ? "text-slate-200 hover:text-slate-100" : "text-[#57524e] hover:text-[#1c1917]"
                  }`}>
                    {isOpen === true ? 'Restaurant Open' : isOpen === false ? 'Restaurant Closed' : '...'}
                  </span>
                </button>
                <Separator
                  orientation="vertical"
                  className={`hidden h-7 md:block ${isDarkMode ? "bg-slate-700/30" : "bg-[#ede8e3]"}`}
                />
              </>
            )}

            {/* Live Orders shortcut button */}
            {location.pathname !== "/admin/orders" && (
              <>
                <button
                  onClick={handleGoToLiveTables}
                  className={`flex h-9 items-center justify-center rounded-full px-2 sm:px-3.5 text-xs font-black transition-all duration-150 active:scale-[0.95] border shadow-sm ${
                    isDarkMode
                      ? "border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                      : "border-transparent text-[#57524e] hover:bg-[#fbfaf8] hover:text-[#1c1917]"
                  }`}
                  style={{
                    backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}08`,
                    borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}30`,
                    color: isDarkMode ? "#fb923c" : colors.primary,
                  }}
                  title="Instant Live Orders View"
                >
                  <LayoutGrid size={16} className="shrink-0" style={{
                    color: isDarkMode ? "#fb923c" : colors.primary
                  }} />
                  <span className="hidden sm:inline ml-1">Live Orders</span>
                </button>

                <Separator
                  orientation="vertical"
                  className={`hidden h-7 md:block ${isDarkMode ? "bg-slate-700/30" : "bg-[#ede8e3]"}`}
                />
              </>
            )}

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="relative flex h-9 w-9 items-center justify-center transition-colors duration-200 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 focus:outline-none"
              aria-label="Toggle admin dark mode"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {/* Notifications */}
            {showBell ? (
              <Suspense
                fallback={
                  <div
                    className="h-9 w-9 rounded-full border shadow-sm bg-white"
                    style={{ borderColor: isDarkMode ? '#475569' : colors.primaryMid }}
                    aria-hidden="true"
                  />
                }
              >
                <NotificationBell />
              </Suspense>
            ) : (
              <div
                className="h-9 w-9 rounded-full border shadow-sm bg-white"
                style={{ borderColor: isDarkMode ? '#475569' : colors.primaryMid }}
                aria-hidden="true"
              />
            )}

            {/* Profile Settings Link */}
            <button
              onClick={() => navigate("/admin/profile")}
              className="relative flex h-9 w-9 items-center justify-center transition-colors duration-200 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 focus:outline-none"
              aria-label="Admin Profile Settings"
              title="Profile / Settings"
            >
              <Settings size={20} className="stroke-[1.8]" />
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]" onClick={handleCancelToggle}>
          <div
            className="w-full max-w-md scale-100 transform rounded-2xl border p-6 transition-all duration-200"
            style={{
              boxShadow: '0 20px 45px -24px rgba(239, 159, 39, 0.55)',
              borderColor: isDarkMode ? '#334155' : colors.primaryLight,
              backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: pendingStatus
                    ? (isDarkMode ? 'rgba(74, 222, 128, 0.2)' : 'rgba(209, 250, 229, 0.8)')
                    : (isDarkMode ? 'rgba(239, 159, 39, 0.2)' : colors.primaryLight)
                }}
              >
                {pendingStatus ? (
                  <CheckCircle className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                ) : (
                  <AlertTriangle className="w-6 h-6" style={{ color: isDarkMode ? '#f87171' : colors.primaryText }} />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`mb-1 text-lg font-bold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                  {pendingStatus ? 'Open Restaurant?' : 'Close Restaurant?'}
                </h3>
                <p className={isDarkMode ? "text-slate-300" : "text-gray-600"}>
                  {pendingStatus
                    ? 'Are you sure you want to open the restaurant? New orders will be accepted.'
                    : 'Are you sure you want to close the restaurant? New orders will be paused.'}
                </p>
              </div>
            </div>

            <div
              className="flex flex-col gap-3 border-t pt-4 sm:flex-row"
              style={{ borderTopColor: isDarkMode ? '#334155' : colors.primaryLight }}
            >
              <Button
                onClick={handleCancelToggle}
                variant="outline"
                style={cancelBtnStyle}
                className="h-11 flex-1 rounded-xl border text-sm font-semibold transition-colors hover:bg-[var(--hover-bg)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmToggle}
                disabled={toggleLoading}
                className={`h-11 flex-1 rounded-xl border text-sm font-semibold transition-all duration-200 ${pendingStatus
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-green-600'
                  : 'bg-gradient-to-r from-red-500 to-red-500 hover:from-red-600 hover:to-red-600 text-white border-red-600'
                }`}
              >
                {toggleLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </span>
                ) : pendingStatus ? (
                  'Yes, Open Restaurant'
                ) : (
                  'Yes, Close Restaurant'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default SiteHeader;
