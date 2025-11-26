"use client";
import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useProfileData } from "./Hooks/useProfileData"; // <-- Your hook
import ProfileHeader from "./components/ProfileHeader"; // <-- Your component
import ProfileDetails from "./components/ProfileDetails"; // <-- Your component
import { UpdateProfileModal } from "./components/UpdateProfileModal"; // <-- Your component
import { LoadingSpinner } from "./components/ui/LoadingSpinner"; // <-- Your UI
import { ErrorMessage } from "./Components/Ui/ErrorMessage";
import { useGetRestaurantProfileQuery } from "@/redux/adminRedux/adminAPI";
const Profile = () => {
    const [token] = useState(() => localStorage.getItem("token") || "");
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [triggerRefetch, setTriggerRefetch] = useState(0);

    const { profileData, loading, error } = useProfileData(token, triggerRefetch);



    const {
        data: restaurant,
        isLoading: dataLoading,
        isError: getProfileError
    } = useGetRestaurantProfileQuery();

    // console.log(r)
    // console.log(getProfileError, dataLoading)

    console.log(useGetRestaurantProfileQuery())




    const handleUpdateSuccess = () => {
        setIsUpdateModalOpen(false);
        setTriggerRefetch((prev) => prev + 1);
    };

    // --- Render ---
    if (loading && triggerRefetch === 0) {
        return <LoadingSpinner />;
    }

    if (error && !profileData.restaurantName) {
        return <ErrorMessage error={error} />;
    }

    return (
        <>
            <div>
                <div className="mx-auto p-10">
                    <ProfileHeader
                        restaurantName={restaurant?.restaurant.restaurantName}
                        loading={dataLoading}
                        error = {getProfileError ? "Failed to load name" : null}
                        onUpdateClick={() => setIsUpdateModalOpen(true)}
                    />
                    <ProfileDetails
                        profileData={restaurant?.restaurant}
                    />
                </div>
            </div>

            <AnimatePresence>
                {isUpdateModalOpen && (
                    <UpdateProfileModal
                        initialData={profileData}
                        token={token}
                        onClose={() => setIsUpdateModalOpen(false)}
                        onUpdateSuccess={handleUpdateSuccess}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Profile;