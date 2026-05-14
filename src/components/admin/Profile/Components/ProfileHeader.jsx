import React from 'react'
import { Button } from "../../../ui/button"
import { useNavigate } from 'react-router-dom'
import { Users, Settings, Store } from 'lucide-react'

export default function ProfileHeader({ restaurantName, restaurantLogo, onUpdateClick, showStaffButton, showUpdateButton, isEditing }) {
    const navigate = useNavigate()
    const userRole = localStorage.getItem("userRole") || "";
    const isAdmin = userRole === "admin";
    const safeRestaurantName =
        typeof restaurantName === "string"
            ? restaurantName
            : String(restaurantName || "").trim();

    // Auto font size: longer name → smaller font, shorter name → bigger font
    // Capped at 25 characters display
    const displayName = safeRestaurantName.slice(0, 25);
    const len = displayName.length;
    const autoFontSize =
        len <= 8  ? 22 :
        len <= 12 ? 20 :
        len <= 16 ? 18 :
        len <= 20 ? 16 :
                    14;
    
    return (
        <div data-tour="profile-heading" className="rounded-2xl border border-[#ede8e3] bg-white shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
            <div className="h-auto min-h-14 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border-2 border-white shadow-sm bg-white flex-shrink-0">
                        {restaurantLogo ? (
                            <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-150">
                                <Store className="w-5 h-5 text-orange-500" />
                            </div>
                        )}
                    </div>
                    <h1
                        style={{ fontSize: `${autoFontSize}px` }}
                        className="font-bold text-white leading-tight"
                    >
                        {displayName || "My Restaurant"}
                    </h1>
                </div>
                <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                    {showStaffButton && isAdmin && (
                        <Button
                          variant="outline"
                          onClick={() => navigate('/admin/staff')}
                          className="border-white/50 bg-transparent text-sm text-white hover:bg-white/20"
                        >
                            <Users className="w-4 h-4 mr-1" /> Staff
                        </Button>
                    )}
                    {showUpdateButton && (
                        <Button
                          data-tour="profile-edit-btn"
                          onClick={onUpdateClick}
                          className={`text-sm ${isEditing ? "bg-white text-red-500 hover:bg-red-50 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-slate-700" : "bg-white text-orange-600 hover:bg-[#f7f3ef] dark:bg-slate-800 dark:text-orange-300 dark:hover:bg-slate-700"}`}
                        >
                            <Settings className="w-4 h-4 mr-1" />
                            {isEditing ? "Cancel" : "Edit"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
