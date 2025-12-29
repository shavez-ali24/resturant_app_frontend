import { useState, useEffect, useRef } from "react";
import { PanelRightClose, Store, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import NotificationBell from "../Bell/NotificationBell";
import {
  useGetRestaurantProfileQuery,
  useToggleRestaurantMutation,
} from "@/redux/adminRedux/adminAPI";
import { data } from "react-router-dom";
import { set } from "zod";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();

  const { data: profileData, isLoading: profileLoading } =
    useGetRestaurantProfileQuery();

    

  const [toggleRestaurant, { isLoading: toggleLoading }] =
    useToggleRestaurantMutation();

  const [isOpen, setIsOpen] = useState(null);
  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  const alertTimeoutRef = useRef(null);

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

  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  // const showToast = (message, type = "success") => {
  //   setAlertMessage(message);
  //   setAlertType(type);
  //   setShowAlert(true);
    
  //   if (alertTimeoutRef.current) {
  //     clearTimeout(alertTimeoutRef.current);
  //   }
    
  //   alertTimeoutRef.current = setTimeout(() => {
  //     setShowAlert(false);
  //   }, 3000);
  // };

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
      // showToast(
      //   `Restaurant successfully ${pendingStatus ? "opened" : "closed"}`,
      //   "success"
      // );
    } catch (err) {
      showToast("Failed to update restaurant status", "error");
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
      <header className="sticky top-0 z-30 w-full bg-gradient-to-r from-orange-50 to-orange-200 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between h-16 w-full px-4 md:px-6">
          {/* Left Side - Menu Toggle */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Button
              onClick={toggleSidebar}
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-xl bg-white/80 hover:bg-white text-gray-700 hover:text-orange-600 border-orange-100"
              aria-label="Toggle sidebar"
            >
              <PanelRightClose size={22} />
            </Button>

            <Separator orientation="vertical" className="h-8 bg-orange-200/50" />

            {/* Restaurant Info - only show on md+ */}
            <div className="hidden md:flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
                <Store size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800 text-lg leading-tight">{restaurantName}</h1>
                <p className="text-xs text-gray-600">Dashboard Panel</p>
              </div>
            </div>
          </div>

          {/* Right Side - Controls */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 mt-2 md:mt-0 ">
            {/* Status Toggle Card */}
            <div className="flex items-center gap-2 md:gap-4 bg-white/90 backdrop-blur-sm rounded-xl px-2 md:px-4 py-1 md:py-2 shadow-sm border border-orange-500">
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
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </div>

            <Separator orientation="vertical" className="h-8 bg-orange-200/50 hidden md:block" />

            {/* Notifications */}
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Confirmation Dialog - Fixed positioning */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleCancelToggle}>
          <div 
            className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-2xl border border-orange-200 max-w-md w-full p-6 transform transition-all duration-200 scale-100"
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
                className="flex-1 h-12 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmToggle}
                disabled={toggleLoading}
                className={`flex-1 h-12 font-semibold rounded-xl border transition-all duration-200 ${
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

      {/* Alert Toast */}
      {showAlert && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform ${
          showAlert ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        } ${
          alertType === "success" 
            ? "bg-green-50 border border-green-200 text-green-800" 
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          <div className={`w-10 h-10 rounded-full ${
            alertType === "success" ? "bg-green-100" : "bg-red-100"
          } flex items-center justify-center mr-2`}>
            {alertType === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <p className="font-semibold">
              {alertType === "success" ? "Success!" : "Error!"}
            </p>
            <p className="text-sm">{alertMessage}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAlert(false)}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  );
}

export default SiteHeader;