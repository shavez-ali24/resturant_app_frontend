import { useState, useEffect, Suspense, lazy } from "react";
import { PanelRightClose, Store, AlertTriangle, CheckCircle, Moon, Sun } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useNotification } from "../Bell/NotificationContext";
import {
  useGetRestaurantProfileQuery,
  useToggleRestaurantMutation,
} from "@/redux/adminRedux/adminAPI";

const NotificationBell = lazy(() => import("../Bell/NotificationBell"));

export function SiteHeader({
  isDarkMode = false,
  onToggleDarkMode = () => {},
}) {
  const { toggleSidebar } = useSidebar();
  const { notify } = useNotification();

  const { data: profileData, isLoading: profileLoading } =
    useGetRestaurantProfileQuery();

  // Get current user role from localStorage
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

    

  const [toggleRestaurant, { isLoading: toggleLoading }] =
    useToggleRestaurantMutation();

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
      <header className={`sticky top-0 z-30 w-full border-b shadow-sm backdrop-blur-sm ${
        isDarkMode
          ? "border-slate-700 bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-900/95"
          : "border-orange-200 bg-gradient-to-r from-orange-50/95 to-orange-200/95"
      }`}>
        <div className="flex h-14 w-full flex-wrap items-center justify-between gap-2 px-3 md:px-6">
          {/* Left Side - Menu Toggle */}
          <div className="flex shrink-0 items-center gap-3">
            <Button
              onClick={toggleSidebar}
              variant="outline"
              size="icon"
              className={`h-9 w-9 rounded-xl transition-colors ${
                isDarkMode
                  ? "border-slate-700/50 bg-slate-900/50 text-slate-200 hover:bg-slate-800 hover:text-orange-300"
                  : "border-orange-200 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600"
              }`}
              aria-label="Toggle sidebar"
            >
              <PanelRightClose size={20} />
            </Button>

            <Separator
              orientation="vertical"
              className={`h-7 ${isDarkMode ? "bg-slate-700/30" : "bg-orange-200/50"}`}
            />

            {/* Restaurant Info - only show on md+ */}
            <div className="hidden items-center gap-3 md:flex">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-sm ${
                isDarkMode
                  ? "bg-gradient-to-br from-orange-400 to-orange-500"
                  : "bg-gradient-to-br from-orange-500 to-orange-600"
              }`}>
                <Store size={20} className="text-white" />
              </div>
              <div>
                <p
                  className={`text-[9px] font-medium uppercase tracking-[0.16em] ${
                    isDarkMode ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  TapNbite
                </p>
                <h1 className={`text-lg font-bold leading-tight ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
                  {restaurantName}
                </h1>
                {/* <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>Dashboard Panel</p> */}
              </div>
            </div>
          </div>

          {/* Right Side - Controls */}
          <div className="mt-0 flex shrink-0 items-center gap-2 md:gap-4">
            {/* Status Toggle Card - Only for Admin */}
            {isAdmin && (
              <>
                <div 
                  data-tour="header-restaurant-toggle"
                  className={`flex items-center gap-2 rounded-xl border px-2 py-1 shadow-sm md:gap-3 md:px-3 md:py-1 restaurant-toggle-card  ${
                    isDarkMode
                      ? "border-slate-700 bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-900/95"
                      : "border-orange-200 bg-white"
                  }`}
                  style={isDarkMode ? { backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(100, 116, 139, 0.35)' } : {}}
                >
                  <div className="flex flex-col">
                    <span className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>Restaurant</span>
                    <span className={`text-xs font-semibold ${isOpen ? (isDarkMode ? 'text-emerald-300' : 'text-emerald-800') : (isDarkMode ? 'text-rose-300' : 'text-rose-700')}`}>
                      {isOpen === true ? 'OPEN' : isOpen === false ? 'CLOSED' : '...'}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="checkbox"
                      id="status-toggle"
                      className="sr-only"
                      checked={isOpen === true}
                      disabled={loading || toggleLoading}
                      onChange={handleToggleClick}
                    />
                    <label
                      htmlFor="status-toggle"
                      className={`relative inline-flex items-center h-5 w-10 cursor-pointer rounded-full transition-all duration-300 ${
                        loading || toggleLoading ? 'opacity-50 cursor-not-allowed' : ''
                      } ${isOpen ? (isDarkMode ? 'bg-emerald-400' : 'bg-green-600') : (isDarkMode ? 'bg-rose-500' : 'bg-red-600')}`}
                    >
                      <span
                        className={`inline-block w-3 h-3 transform bg-white rounded-full transition-all duration-300 shadow-md ${
                          isOpen ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </label>
                    {(loading || toggleLoading) && (
                      <div className="absolute -right-1 -top-1 h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"></div>
                    )}
                  </div>
                </div>
                <Separator
                  orientation="vertical"
                  className={`hidden h-7 md:block ${isDarkMode ? "bg-slate-700/30" : "bg-orange-200/50"}`}
                />
              </>
            )}

            <Button
              type="button"
              onClick={onToggleDarkMode}
              variant="outline"
              size="icon"
              className={`h-9 w-9 rounded-xl transition-colors ${
                isDarkMode
                  ? "border-slate-700/50 bg-slate-900/50 text-orange-300 hover:bg-slate-800"
                  : "border-orange-200 bg-white text-orange-600 hover:bg-orange-50"
              }`}
              aria-label="Toggle admin dark mode"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            {/* Notifications */}
            {showBell ? (
              <Suspense
                fallback={
                  <div
                    className={`h-9 w-9 rounded-full border shadow-sm ${
                      isDarkMode
                        ? "border-slate-700 bg-slate-900"
                        : "border-orange-200 bg-white"
                    }`}
                    aria-hidden="true"
                  />
                }
              >
                <NotificationBell />
              </Suspense>
            ) : (
              <div
                className={`h-9 w-9 rounded-full border shadow-sm ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-900"
                    : "border-orange-200 bg-white"
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </header>

      {/* Confirmation Dialog - Fixed positioning */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]" onClick={handleCancelToggle}>
          <div 
            className={`w-full max-w-md scale-100 transform rounded-2xl border p-6 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] transition-all duration-200 ${
              isDarkMode
                ? "border-slate-700 bg-slate-900/95"
                : "border-orange-100 bg-white/95"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                pendingStatus 
                  ? isDarkMode ? 'bg-green-500/20' : 'bg-gradient-to-br from-green-100 to-emerald-100'
                  : isDarkMode ? 'bg-red-500/20' : 'bg-gradient-to-br from-orange-100 to-amber-100'
              }`}>
                {pendingStatus ? (
                  <CheckCircle className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                ) : (
                  <AlertTriangle className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`} />
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

            <div className={`flex flex-col gap-3 border-t pt-4 sm:flex-row ${
              isDarkMode ? "border-slate-700" : "border-orange-100"
            }`}>
              <Button
                onClick={handleCancelToggle}
                variant="outline"
                className={`h-11 flex-1 rounded-xl border text-sm font-semibold transition-colors ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    : "border-orange-200 bg-white text-gray-700 hover:bg-orange-50"
                }`}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmToggle}
                disabled={toggleLoading}
                className={`h-11 flex-1 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                  pendingStatus
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
