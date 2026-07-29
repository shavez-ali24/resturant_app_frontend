import { useState, useEffect, Suspense, lazy } from "react";
import { PanelRightClose, Store, AlertTriangle, CheckCircle, Moon, Sun } from "lucide-react";
import { useSelector } from "react-redux";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useNotification } from "../Bell/NotificationContext";
import {
  useGetRestaurantQuery,
  useUpdateRestaurantStatusMutation,
} from "@/redux/adminRedux/adminAPI";

const NotificationBell = lazy(() => import("../Bell/NotificationBell"));
import { NavUser } from "@/components/admin/adminLayout/nav-user";

export function SiteHeader({
  isDarkMode = false,
  onToggleDarkMode = () => { },
}) {
  const toggleSidebar = useSidebar().toggleSidebar;
  const { notify } = useNotification();
  const colors = useSelector((state) => state.admin.theme.colors);

  const [hoverSidebarToggle, setHoverSidebarToggle] = useState(false);
  const [hoverToggleCard, setHoverToggleCard] = useState(false);
  const [hoverDarkToggle, setHoverDarkToggle] = useState(false);
  const [hoverCancelBtn, setHoverCancelBtn] = useState(false);

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

  return (
    <>
      {/* Main Header */}
      <header className={`sticky top-0 z-30 w-full border-b shadow-sm backdrop-blur-sm ${isDarkMode
          ? "border-slate-700/60 bg-[#0f172a]/95"
          : "border-[#ede8e3] bg-white/95"
        }`}>
        <div className="flex h-14 w-full flex-wrap items-center justify-between gap-2 px-3 md:px-6">
          {/* Left Side - Menu Toggle */}
          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="relative flex h-9 w-9 items-center justify-center transition-colors duration-200 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 focus:outline-none"
              aria-label="Toggle sidebar"
            >
              <PanelRightClose size={20} className="stroke-[1.5]" />
            </button>

            <Separator
              orientation="vertical"
              className={`h-7 ${isDarkMode ? "bg-slate-700/30" : "bg-[#ede8e3]"}`}
            />

            {/* Restaurant Info - only show on md+ */}
            <div className="hidden items-center md:flex">
              <div>
                <p
                  className={`text-[9px] font-bold uppercase tracking-[0.16em] ${isDarkMode ? "text-slate-400" : "text-[#87807b]"
                    }`}
                >
                  TapNbite
                </p>
                <h1 className={`text-sm font-extrabold leading-tight ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>
                  {restaurantName}
                </h1>
              </div>
            </div>
          </div>

          {/* Right Side - Controls */}
          <div className="mt-0 flex shrink-0 items-center gap-2 md:gap-4">
            {/* Status Toggle - styled as a clean indicator dot and text like the image */}
            {isAdmin && (
              <>
                <button
                  onClick={handleToggleClick}
                  disabled={loading || toggleLoading}
                  className="flex items-center gap-2 rounded-full px-2 py-1.5 transition-colors focus:outline-none"
                  title="Toggle Restaurant Status"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
                  />
                  <span className={`text-sm font-extrabold transition-colors select-none ${isDarkMode ? "text-slate-200 hover:text-slate-100" : "text-[#57524e] hover:text-[#1c1917]"
                    }`}>
                    {isOpen === true ? 'Open' : isOpen === false ? 'Closed' : '...'}
                  </span>
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

            {/* Profile Dropdown */}
            <NavUser user={userData} isDarkMode={isDarkMode} inHeader={true} />
          </div>
        </div>
      </header>

      {/* Confirmation Dialog - Fixed positioning */}
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
                onMouseEnter={() => setHoverCancelBtn(true)}
                onMouseLeave={() => setHoverCancelBtn(false)}
                variant="outline"
                className="h-11 flex-1 rounded-xl border text-sm font-semibold transition-colors"
                style={{
                  borderColor: isDarkMode ? '#334155' : colors.primaryMid,
                  backgroundColor: hoverCancelBtn
                    ? (isDarkMode ? 'rgba(51, 65, 85, 0.95)' : colors.primaryLight)
                    : (isDarkMode ? '#0f172a' : '#ffffff'),
                  color: isDarkMode ? '#e2e8f0' : '#374151'
                }}
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
