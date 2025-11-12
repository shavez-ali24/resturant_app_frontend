"use client";
import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useProfileData } from "./Hooks/useProfileData"; // <-- Your hook
import ProfileHeader from "./components/ProfileHeader"; // <-- Your component
import ProfileDetails from "./components/ProfileDetails"; // <-- Your component
import { UpdateProfileModal } from "./components/UpdateProfileModal"; // <-- Your component
import { LoadingSpinner } from "./components/ui/LoadingSpinner"; // <-- Your UI
import { ErrorMessage } from "./Components/Ui/ErrorMessage";

const Profile = () => {
    // --- State ---
    const [token] = useState(() => localStorage.getItem("token") || "");
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [triggerRefetch, setTriggerRefetch] = useState(0);

    // --- Logic ---
    const { profileData, loading, error } = useProfileData(token, triggerRefetch);

    const handleUpdateSuccess = () => {
        setIsUpdateModalOpen(false);
        setTriggerRefetch((prev) => prev + 1);
    };

    const downloadQRCode = () => {
        // ... (copy your download QR code logic here)
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
            <div className="py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
                <div className="mx-auto max-w-7xl">
                    <ProfileHeader
                        restaurantName={profileData.restaurantName}
                        loading={loading && triggerRefetch > 0}
                        error={error && triggerRefetch > 0 ? error : null}
                        onUpdateClick={() => setIsUpdateModalOpen(true)}
                    />
                    <ProfileDetails
                        profileData={profileData}
                        onDownloadQRCode={downloadQRCode}
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