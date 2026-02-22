import { useState, useEffect } from "react";
import { PanelRightClose, Store, AlertTriangle, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import NotificationBell from "../Bell/NotificationBell";
import { useNotification } from "../Bell/NotificationContext";
import {
  useGetRestaurantProfileQuery,
  useToggleRestaurantMutation,
} from "@/redux/adminRedux/adminAPI";

export function SiteHeader() {
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

  useEffect(() => {
    if (!profileData) return;

    let status = null;
    let name = "Restaurant";

    if (typeof profileData.isOpen === "boolean") {
      status = profileData.isOpen;
    } else if (
      profileData.restaurant &&
      typeof profileData.restaurant.isOpen === "boolean"
    ) {
      status = profileData.restaurant.isOpen;
    }

    if (profileData.restaurant?.name) {
      name = profileData.restaurant.name;
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
      <header className="sticky top-0 z-30 w-full border-b border-orange-200 bg-gradient-to-r from-orange-50/95 to-orange-200/95 shadow-sm backdrop-blur-sm">
        <div className="flex h-16 w-full flex-wrap items-center justify-between gap-2 px-3 md:px-6">
          {/* Left Side - Menu Toggle */}
          <div className="flex shrink-0 items-center gap-3">
            <Button
              onClick={toggleSidebar}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-orange-200 bg-white text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
              aria-label="Toggle sidebar"
            >
              <PanelRightClose size={22} />
            </Button>

            <Separator orientation="vertical" className="h-8 bg-orange-200/50" />

            {/* Restaurant Info - only show on md+ */}
            <div className="hidden items-center gap-3 md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm">
                <Store size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight text-gray-800">{restaurantName}</h1>
                <p className="text-xs text-gray-600">Dashboard Panel</p>
              </div>
            </div>
          </div>

          {/* Right Side - Controls */}
          <div className="mt-0 flex shrink-0 items-center gap-2 md:gap-4">
            {/* Status Toggle Card - Only for Admin */}
            {isAdmin && (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-2 py-1 shadow-sm md:gap-3 md:px-4 md:py-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500">Restaurant</span>
                    <span className={`text-sm font-semibold ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
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
                      className={`relative inline-flex items-center h-6 w-11 cursor-pointer rounded-full transition-all duration-300 ${
                        loading || toggleLoading ? 'opacity-50 cursor-not-allowed' : ''
                      } ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}
                    >
                      <span
                        className={`inline-block w-5 h-5 transform bg-white rounded-full transition-all duration-300 shadow-md ${
                          isOpen ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </label>
                    {(loading || toggleLoading) && (
                      <div className="absolute -right-1 -top-1 h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"></div>
                    )}
                  </div>
                </div>
                <Separator orientation="vertical" className="h-8 bg-orange-200/50 hidden md:block" />
              </>
            )}

            {/* Notifications */}
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Confirmation Dialog - Fixed positioning */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]" onClick={handleCancelToggle}>
          <div 
            className="w-full max-w-md scale-100 transform rounded-2xl border border-orange-100 bg-white/95 p-6 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                pendingStatus 
                  ? 'bg-gradient-to-br from-green-100 to-emerald-100' 
                  : 'bg-gradient-to-br from-orange-100 to-amber-100'
              }`}>
                {pendingStatus ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {pendingStatus ? 'Open Restaurant?' : 'Close Restaurant?'}
                </h3>
                <p className="text-gray-600">
                  {pendingStatus 
                    ? 'Are you sure you want to open the restaurant? New orders will be accepted.'
                    : 'Are you sure you want to close the restaurant? New orders will be paused.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-orange-100">
              <Button
                onClick={handleCancelToggle}
                variant="outline"
                className="h-11 flex-1 rounded-xl border border-orange-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50"
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
