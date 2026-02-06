"use client";
import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import ProfileHeader from "./components/ProfileHeader";
import ProfileDetails from "./components/ProfileDetails";
import { UpdateProfileModal } from "./components/UpdateProfileModal";
import { LoadingSpinner } from "./Components/commanProfile/LoadingSpinner";
import { ErrorMessage } from "./Components/commanProfile/ErrorMessage";
import NotificationModal from "./Components/commanProfile/NotificationModal";

import { useGetRestaurantProfileQuery } from "@/redux/adminRedux/adminAPI";

const Profile = () => {
  const [token] = useState(() => localStorage.getItem("token") || "");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: ""
  });

  // Get user role
  const userRole = localStorage.getItem("userRole") || "";
  const isAdmin = userRole === "admin";

  // -----------------------------
  // 🔥 DATA DIRECTLY FROM REDUX (RTK QUERY)
  // -----------------------------
  const {
    data: restaurant,
    isLoading: loading,
    isError: error,
    refetch,
  } = useGetRestaurantProfileQuery();

  // -----------------------------
  // CLOSE NOTIFICATION
  // -----------------------------
  const closeNotification = () => {
    setNotification({ show: false, type: "", message: "" });
  };

  // -----------------------------
  // AUTO-CLOSE NOTIFICATION
  // -----------------------------
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        closeNotification();
      }, 3000); // Close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // -----------------------------
  // UPDATE SUCCESS HANDLER
  // -----------------------------
  const handleUpdateSuccess = () => {
    setIsUpdateModalOpen(false);
    
    // Show success notification
    setNotification({
      show: true,
      type: "success",
      message: "Profile updated successfully!"
    });
    
    refetch(); // redux data refresh
  };

  // -----------------------------
  // LOADING & ERROR UI (UI same)
  // -----------------------------
  if (loading) return <LoadingSpinner />;
  if (error) {
    const errorMessage = error?.data?.message || error?.message || "Failed to load restaurant profile";
    return <ErrorMessage error={errorMessage} />;
  }

  const resData = restaurant?.data || restaurant?.restaurant; // Handle both response formats

  return (
    <>
      <div>
        {/* Notification Modal */}
        <AnimatePresence>
          {notification.show && (
            <NotificationModal
              type={notification.type}
              message={notification.message}
              onClose={closeNotification}
            />
          )}
        </AnimatePresence>

        <div className="mx-auto p-10 bg-gradient-to-r from-orange-50/30 to-orange-100/40">
          <ProfileHeader
            loading={loading}
            error={error ? "Failed to load name" : null}
            onUpdateClick={() => setIsUpdateModalOpen(true)}
            showStaffButton={isAdmin}
            restaurantName={resData?.name}
            showUpdateButton={isAdmin}
          />

          <ProfileDetails profileData={resData} />
        </div>
      </div>

      {/* ----------------------------- */}
      {/* UPDATE MODAL (Admin Only) */}
      {/* ----------------------------- */}
      {isUpdateModalOpen && isAdmin && (
        <UpdateProfileModal
          initialData={resData}
          token={token}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );
};

export default Profile;