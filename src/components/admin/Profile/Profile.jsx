"use client";
import React, { useState } from "react";

import ProfileHeader from "./components/ProfileHeader";
import ProfileDetails from "./components/ProfileDetails";
import { UpdateProfileModal } from "./components/UpdateProfileModal";
import { LoadingSpinner } from "./Components/commanProfile/LoadingSpinner";
import { ErrorMessage } from "./Components/commanProfile/ErrorMessage";
import { useNotify } from "../common/NotificationModal";

import { useGetRestaurantProfileQuery } from "@/redux/adminRedux/adminAPI";

const Profile = () => {
  const [token] = useState(() => localStorage.getItem("token") || "");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const notify = useNotify();

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
  // UPDATE SUCCESS HANDLER
  // -----------------------------
  const handleUpdateSuccess = () => {
    setIsUpdateModalOpen(false);
    
    // Show success notification
    notify("Profile updated successfully!", "success");
    
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

      {/* UPDATE MODAL (Admin Only) */}
      {isUpdateModalOpen && isAdmin && (
        <UpdateProfileModal
          initialData={resData}
          token={token}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default Profile;
