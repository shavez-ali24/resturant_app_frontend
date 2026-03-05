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
  const userRole = localStorage.getItem("userRole") || "";
  const isAdmin = userRole === "admin";

  const { data: restaurant, isLoading: loading, isError: error, refetch } = useGetRestaurantProfileQuery();
  // console.log("Fetched restaurant profile data:", restaurant);

  const handleUpdateSuccess = () => {
    setIsUpdateModalOpen(false);
    notify("Profile updated successfully!", "success");
    refetch();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error?.data?.message || error?.message || "Failed to load profile"} />;

  const resData = restaurant?.data || restaurant?.restaurant;

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30 p-3 dark:bg-none dark:bg-slate-950 md:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <ProfileHeader
          onUpdateClick={() => setIsUpdateModalOpen(true)}
          showStaffButton={isAdmin}
          restaurantName={resData?.name}
          restaurantLogo={resData?.logo?.url}
          showUpdateButton={isAdmin}
        />
        <ProfileDetails profileData={resData} />
        {isUpdateModalOpen && isAdmin && (
          <UpdateProfileModal initialData={resData} token={token} onClose={() => setIsUpdateModalOpen(false)} onUpdateSuccess={handleUpdateSuccess} />
        )}
      </div>
    </div>
  );
};

export default Profile;
