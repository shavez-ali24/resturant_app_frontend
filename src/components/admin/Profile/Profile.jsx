"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import ProfileHeader from "./components/ProfileHeader";
import ProfileDetails from "./components/ProfileDetails";
import { LoadingSpinner } from "./Components/commanProfile/LoadingSpinner";
import { ErrorMessage } from "./Components/commanProfile/ErrorMessage";
import { useNotify } from "../common/NotificationModal";

import {
  useGetRestaurantQuery,
} from "@/redux/adminRedux/adminAPI";

import { useUpdateProfileForm } from "./Hooks/useUpdateProfileForm";
import UpdateCoreProfileForm from "./Components/UpdateCoreProfileForm";
import UpdateOrderModeForm from "./Components/UpdateOrderModeForm";
import UpdateFinancialsForm from "./Components/UpdateFinancialsForm";
import UpdateBrandingForm from "./Components/UpdateBrandingForm";
import UpdateFormActions from "./Components/UpdateFormActions";
import { useNotification } from "@/components/admin/Bell/NotificationContext";

/* -------------------------------------------------------------------------- */
/*                             Profile Edit Form                              */
/* -------------------------------------------------------------------------- */

function ProfileEditForm({
  resData,
  isDarkMode,
  onSuccess,
  onClose,
}) {
  const form = useUpdateProfileForm(
    resData,
    onSuccess
  );

  return (
    <form
      onSubmit={form.handleSubmit}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 pt-4 md:px-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <UpdateCoreProfileForm
            formData={form.formData}
            handleChange={form.handleChange}
          />

          <UpdateFinancialsForm
            formData={form.formData}
            handleChange={form.handleChange}
            handleGstToggle={form.handleGstToggle}
            isDarkMode={isDarkMode}
          />

          <section className="flex flex-col gap-4 rounded-xl border border-[#ede8e3] bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#1e293b] lg:col-span-2">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Order Modes */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[#1c1917] dark:text-slate-100">
                  Order Modes
                </h3>

                <UpdateOrderModeForm
                  formData={form.formData}
                  handleOrderModeToggle={form.handleOrderModeToggle}
                  activeModesCount={form.activeModesCount}
                  atLeastOneModeActive={form.atLeastOneModeActive}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Branding */}
              <div className="border-t border-[#ede8e3] pt-4 dark:border-slate-700 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <h3 className="mb-2 text-sm font-semibold text-[#1c1917] dark:text-slate-100">
                  Logo & Branding
                </h3>

                <UpdateBrandingForm
                  file={form.file}
                  fileError={form.fileError}
                  handleFileChange={form.handleFileChange}
                  currentLogo={resData?.logo?.url ?? ""}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Fixed Form Actions */}
      <div
        className={`shrink-0 border-t px-3 pb-3 pt-4 md:px-6 md:pb-5 ${isDarkMode
            ? "border-slate-700"
            : "border-[#ede8e3]"
          }`}
      >
        <UpdateFormActions
          isSubmitting={form.isSubmitting}
          fileError={form.fileError}
          onClose={onClose}
          isDarkMode={isDarkMode}
        />
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Profile                                 */
/* -------------------------------------------------------------------------- */

const Profile = () => {
  const notify = useNotify();
  const { sseEvent } = useNotification() || {};

  const [isEditing, setIsEditing] = useState(false);

  /*
   * Read auth values once.
   * Keeping these outside render calculations avoids repeatedly
   * reading localStorage on every render.
   */
  const [auth] = useState(() => {
    if (typeof window === "undefined") {
      return {
        token: "",
        role: "",
      };
    }

    return {
      token: localStorage.getItem("admin_token") || "",
      role: localStorage.getItem("userRole") || "",
    };
  });

  const isAdmin = auth.role === "admin";

  /*
   * Keep current approach only because your theme is controlled
   * through document root classes.
   *
   * If theme already exists in Redux, use that instead and remove
   * this observer completely.
   */
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;

    const root = document.documentElement;

    return (
      root.classList.contains("admin-dark") ||
      root.classList.contains("dark")
    );
  });

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    const syncTheme = () => {
      const nextIsDarkMode =
        root.classList.contains("admin-dark") ||
        root.classList.contains("dark");

      setIsDarkMode((previous) =>
        previous === nextIsDarkMode
          ? previous
          : nextIsDarkMode
      );
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const {
    data: restaurant,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetRestaurantQuery();

  const resData =
    restaurant?.data ??
    restaurant?.restaurant ??
    null;

  /*
   * Refetch only for the restaurant update event.
   */
  useEffect(() => {
    if (sseEvent?.type !== "RESTAURANT_UPDATED") return;

    refetch();
  }, [sseEvent?.type, refetch]);

  const handleUpdateSuccess = useCallback(() => {
    setIsEditing(false);
    notify("Profile updated successfully!", "success");
    refetch();
  }, [notify, refetch]);

  const handleClose = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleUpdateClick = useCallback(() => {
    setIsEditing((previous) => !previous);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <ErrorMessage
        error={
          error?.data?.message ||
          error?.message ||
          "Failed to load profile"
        }
      />
    );
  }

  /*
   * Protect against an unexpected successful response
   * that contains no restaurant data.
   */
  if (!resData) {
    return (
      <ErrorMessage error="Restaurant profile data is unavailable." />
    );
  }

  return (
    <main
      className="animate-in flex h-full flex-col overflow-hidden fade-in duration-300"
      style={{
        backgroundColor: isDarkMode
          ? "#0f172a"
          : "#f8f3ef",
      }}
    >
      {/* Header */}
      <div className="shrink-0 p-3 pb-0 md:p-6 md:pb-0">
        <ProfileHeader
          onUpdateClick={handleUpdateClick}
          showStaffButton={isAdmin}
          showUpdateButton={isAdmin}
          restaurantName={
            resData.restaurantName ||
            resData.name ||
            ""
          }
          restaurantLogo={resData.logo?.url}
          isEditing={isEditing}
        />
      </div>

      {/* Content */}
      {isEditing && isAdmin ? (
        <ProfileEditForm
          resData={resData}
          isDarkMode={isDarkMode}
          onSuccess={handleUpdateSuccess}
          onClose={handleClose}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-4 md:px-6">
          <ProfileDetails profileData={resData} isDarkMode={isDarkMode} />
        </div>
      )}
    </main>
  );
};

export default Profile;
