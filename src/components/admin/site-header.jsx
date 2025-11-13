// src/components/common/SiteHeader.jsx
import { useState, useEffect } from "react";
import { PanelRightClose, Store } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import NotificationBell from "./Filter/NotificationBell";
import {
  useGetRestaurantProfileQuery,
  useToggleRestaurantMutation,
} from "../../redux/adminRedux/adminAPI";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const [isOpenLocal, setIsOpenLocal] = useState(false);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const { data: profileData, isLoading: profileLoading, isError } =
    useGetRestaurantProfileQuery();

  const [toggleRestaurant, { isLoading: toggleLoading }] =
    useToggleRestaurantMutation();

  useEffect(() => {
    if (profileData && typeof profileData.isOpen !== "undefined") {
      setIsOpenLocal(Boolean(profileData.isOpen));
    }
  }, [profileData]);

  const handleToggle = async () => {
    const newStatus = !isOpenLocal;
    
    try {
      setLoadingLocal(true);
      await toggleRestaurant({ isOpen: newStatus }).unwrap();
      setIsOpenLocal(newStatus);
      
      setShowStatus(true);
      setTimeout(() => {
        setShowStatus(false);
      }, 2000);
      
    } catch (err) {
      console.error("Failed to toggle restaurant:", err);
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <header className="flex sticky top-0 z-50 w-full items-center border-b bg-white/80 backdrop-blur-sm p-1 shadow-sm">
      <div className="flex h-12 w-full items-center gap-3 px-4">
        {/* Sidebar Toggle */}
        <div 
          onClick={toggleSidebar}
          className="cursor-pointer hover:bg-orange-50 rounded-lg transition-all duration-200 p-1.5"
        >
          <PanelRightClose 
            size={22} 
            className="text-gray-600 hover:text-orange-500 transition-colors" 
          />
        </div>

        <Separator orientation="vertical" className="h-5" />
        
        {/* Compact Restaurant Status */}
        <div className="w-full flex justify-end">
          <div className="flex items-center rounded-lg justify-between gap-3 p-2   transition-shadow">
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                isOpenLocal ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Store 
                  size={16} 
                  className={isOpenLocal ? 'text-green-600' : 'text-red-500'} 
                />
              </div>
              
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium">Status</span>
                <span className={`text-sm font-bold ${
                  isOpenLocal ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isOpenLocal ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>

            {/* Compact Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isOpenLocal}
                disabled={loadingLocal || toggleLoading || profileLoading}
                onChange={handleToggle}
              />
              <div className={`
                w-12 h-6 rounded-full peer 
                transition-all duration-300
                ${isOpenLocal 
                  ? 'bg-green-400' 
                  : 'bg-gray-300'
                }
                ${(loadingLocal || toggleLoading || profileLoading) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:opacity-80'
                }
              `}>
                <div className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md
                  transition-all duration-300
                  transform ${isOpenLocal ? 'translate-x-6' : 'translate-x-0'}
                `}></div>
              </div>
            </label>

            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Notification Bell */}
            <div className="pl-1">
              <NotificationBell />
            </div>
          </div>
        </div>
      </div>

      {/* Compact Status Notification */}
      {showStatus && (
        <div className={`
          absolute top-14 right-4 px-4 py-2 rounded-lg shadow-lg 
          border backdrop-blur-sm transform transition-all duration-300
          animate-in slide-in-from-right-5
          ${isOpenLocal 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
          }
        `}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isOpenLocal ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              {isOpenLocal ? 'Open for orders' : 'Closed'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}

export default SiteHeader;