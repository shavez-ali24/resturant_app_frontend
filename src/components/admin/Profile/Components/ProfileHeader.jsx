import React from 'react'
import { Button } from "../../../ui/button"
import { useNavigate } from 'react-router-dom'
import { Users, Settings, Store, Table2 } from 'lucide-react'

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
        <div data-tour="profile-heading" className="rounded-2xl border border-[#ede8e3] bg-white overflow-hidden shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
            <div className="h-auto min-h-14 bg-[#fff8f5] dark:bg-orange-950/10 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 gap-3 border-b border-[#ede8e3]/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-orange-200 dark:border-orange-500/30 shadow-sm bg-white flex-shrink-0">
                        {restaurantLogo ? (
                            <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                                <Store className="w-5 h-5 text-orange-500" />
                            </div>
                        )}
                    </div>
                    <h1
                        style={{ fontSize: `${autoFontSize}px` }}
                        className="font-extrabold text-orange-700 dark:text-orange-400 leading-tight"
                    >
                        {displayName || "My Restaurant"}
                    </h1>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-center sm:justify-end">
                    {showStaffButton && isAdmin && (
                        <Button
                          variant="outline"
                          onClick={() => navigate('/admin/staff')}
                          className="h-8 border-orange-200 bg-white text-xs text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300 shadow-sm dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400 dark:hover:bg-orange-950/40 px-3"
                        >
                            <Users className="w-3.5 h-3.5 mr-1" /> Staff
                        </Button>
                    )}
                    {isAdmin && (
                        <Button
                          variant="outline"
                          onClick={() => navigate('/admin/tables')}
                          className="h-8 border-orange-200 bg-white text-xs text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300 shadow-sm dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400 dark:hover:bg-orange-950/40 px-3"
                        >
                            <Table2 className="w-3.5 h-3.5 mr-1" /> Table Management
                        </Button>
                    )}
                    {showUpdateButton && (
                        <Button
                          data-tour="profile-edit-btn"
                          onClick={onUpdateClick}
                          className={`h-8 text-xs px-3 shadow-sm border ${
                            isEditing 
                              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25" 
                              : "border-orange-200 bg-white text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300 dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400 dark:hover:bg-orange-950/40"
                          }`}
                        >
                            <Settings className="w-3.5 h-3.5 mr-1" />
                            {isEditing ? "Cancel" : "Edit"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
