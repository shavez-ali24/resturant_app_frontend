"use client";
import React, { useState, useEffect } from "react";
import ProfileHeader from "./components/ProfileHeader";
import ProfileDetails from "./components/ProfileDetails";
import { LoadingSpinner } from "./Components/commanProfile/LoadingSpinner";
import { ErrorMessage } from "./Components/commanProfile/ErrorMessage";
import { useNotify } from "../common/NotificationModal";
import { useGetRestaurantProfileQuery } from "@/redux/adminRedux/adminAPI";
import { useAdminTour } from "../../../hooks/useAdminTour";
import { TOUR_KEYS, getProfileSteps } from "../../../utils/adminTour";
import { useUpdateProfileForm } from "./Hooks/useUpdateProfileForm";
import UpdateCoreProfileForm from "./Components/UpdateCoreProfileForm";
import UpdateCategoriesForm from "./Components/UpdateCategoriesForm";
import UpdateOrderModeForm from "./Components/UpdateOrderModeForm";
import UpdateFinancialsForm from "./Components/UpdateFinancialsForm";
import UpdateBrandingForm from "./Components/UpdateBrandingForm";
import UpdateFormActions from "./Components/UpdateFormActions";
import { chipVariant } from "./Lib/motionVariants";

// ── Inner edit form — only rendered after resData is loaded ──────────────────
// Separate component so hooks always run with real data
function ProfileEditForm({ resData, token, isDarkMode, onSuccess, onClose }) {
  const form = useUpdateProfileForm(resData, token, onSuccess, onClose);

  return (
    <form onSubmit={form.handleSubmit} className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-y-scroll px-3 pt-4 pb-2 md:px-6">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <UpdateCoreProfileForm formData={form.formData} handleChange={form.handleChange} />
          <UpdateFinancialsForm
            formData={form.formData}
            handleChange={form.handleChange}
            handleGstToggle={form.handleGstToggle}
          />
          <div className="rounded-xl border border-[#ede8e3] bg-white shadow-sm dark:border-slate-700 dark:bg-[#1e293b] p-3 flex flex-col gap-3">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[#1c1917] dark:text-slate-100">Order Modes</h3>
              <UpdateOrderModeForm
                formData={form.formData}
                handleOrderModeToggle={form.handleOrderModeToggle}
                activeModesCount={form.activeModesCount}
                atLeastOneModeActive={form.atLeastOneModeActive}
              />
            </div>
            <div className="border-t border-[#ede8e3] dark:border-slate-700 pt-3">
              <h3 className="mb-2 text-sm font-semibold text-[#1c1917] dark:text-slate-100">Logo</h3>
              <UpdateBrandingForm
                file={form.file}
                fileError={form.fileError}
                handleFileChange={form.handleFileChange}
                currentLogo={resData?.logo?.url || ""}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <UpdateCategoriesForm
              categories={form.categories}
              currentCategoryInput={form.currentCategoryInput}
              setCurrentCategoryInput={form.setCurrentCategoryInput}
              handleCategoryKeyDown={form.handleCategoryKeyDown}
              handleAddCategory={form.handleAddCategory}
              handleRemoveCategory={form.handleRemoveCategory}
              categorySuggestions={form.categorySuggestions}
              chipVariant={chipVariant}
            />
          </div>
        </div>
      </div>
      <div className={`shrink-0 px-3 pt-4 pb-3 md:px-6 md:pb-5 border-t ${isDarkMode ? "border-slate-700" : "border-[#ede8e3]"}`}>
        <UpdateFormActions
          isSubmitting={form.isSubmitting}
          fileError={form.fileError}
          onClose={onClose}
        />
      </div>
    </form>
  );
}

// ── Main Profile component ────────────────────────────────────────────────────
const Profile = () => {
  const [token] = useState(() => localStorage.getItem("token") || "");
  const [isEditing, setIsEditing] = useState(false);
  const notify = useNotify();
  const userRole = localStorage.getItem("userRole") || "";
  const isAdmin = userRole === "admin";

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () =>
      setIsDarkMode(root.classList.contains("admin-dark") || root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useAdminTour(TOUR_KEYS.profile, getProfileSteps, isDarkMode, 800);

  const { data: restaurant, isLoading: loading, isError: error, refetch } = useGetRestaurantProfileQuery();
  const resData = restaurant?.data || restaurant?.restaurant;

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    notify("Profile updated successfully!", "success");
    refetch();
  };

  const handleClose = () => setIsEditing(false);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error?.data?.message || error?.message || "Failed to load profile"} />;

  return (
    <div className={`flex h-full flex-col overflow-hidden ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
      <div className="shrink-0 p-3 pb-0 md:p-6 md:pb-0">
        <ProfileHeader
          onUpdateClick={() => setIsEditing((v) => !v)}
          showStaffButton={isAdmin}
          restaurantName={resData?.restaurantName || resData?.name}
          restaurantLogo={resData?.logo?.url}
          showUpdateButton={isAdmin}
          isEditing={isEditing}
        />
      </div>

      {isEditing && isAdmin ? (
        // key=resData._id forces full remount if data changes
        <ProfileEditForm
          key={resData?._id}
          resData={resData}
          token={token}
          isDarkMode={isDarkMode}
          onSuccess={handleUpdateSuccess}
          onClose={handleClose}
        />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-4 pb-6 md:px-6">
          <ProfileDetails profileData={resData} />
        </div>
      )}
    </div>
  );
};

export default Profile;
