/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { PanelRightClose } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import NotificationBell from "./Filter/NotificationBell";

import {
  useGetRestaurantProfileQuery,
  useToggleRestaurantMutation,
} from "@/redux/adminRedux/adminAPI";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();

  const { data: profileData, isLoading: profileLoading } =
    useGetRestaurantProfileQuery();

  const [toggleRestaurant, { isLoading: toggleLoading }] =
    useToggleRestaurantMutation();

  const [isOpen, setIsOpen] = useState(null);

  // For showing animated alert
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!profileData) return;

    let status = null;

    if (typeof profileData.isOpen === "boolean") {
      status = profileData.isOpen;
    } else if (
      profileData.restaurant &&
      typeof profileData.restaurant.isOpen === "boolean"
    ) {
      status = profileData.restaurant.isOpen;
    }

    setIsOpen(status ?? false);
  }, [profileData]);

  const handleToggle = async () => {
    const newStatus = !isOpen;

    try {
      await toggleRestaurant({ isOpen: newStatus }).unwrap();
      setIsOpen(newStatus);

      // Show animated CSS alert
      setAlertMessage(newStatus ? "Restaurant is now OPEN" : "Restaurant is now CLOSED");
      setShowAlert(true);

      setTimeout(() => {
        setShowAlert(false);
      }, 2000); // auto close
    } catch (err) {
      setAlertMessage("Failed to update status");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
    }
  };

  const loading = profileLoading || toggleLoading;

  return (
    <>
      {showAlert && (
        <div className="fixed top-4 right-4 px-4 py-2 rounded-lg shadow-md bg-black text-white animate-fadeInOut z-[9999]">
          {alertMessage}
        </div>
      )}

      <header className="flex sticky top-0 z-50 w-full items-center border-b bg-background p-1">
        <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
          <PanelRightClose size={30} onClick={toggleSidebar} className="cursor-pointer" />
          <Separator orientation="vertical" />

          <div className="w-full flex justify-end sm:ml-auto sm:w-auto">
            <div className="flex items-center rounded-xl justify-between border gap-5 border-gray-200 p-2 bg-gray-50">
              <label className="text-gray-700 font-semibold">🏬 Restaurant</label>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isOpen === true}
                  disabled={loading}
                  onChange={handleToggle}
                />

                <div
                  className="
                    w-11 h-6 bg-gray-200 rounded-full peer
                    peer-checked:bg-orange-500
                    peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                    after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all
                    peer-checked:after:translate-x-full
                  "
                ></div>
              </label>

              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
          .animate-fadeInOut {
            animation: fadeInOut 2s ease-in-out forwards;
          }
        `}
      </style>
    </>
  );
}

export default SiteHeader;
