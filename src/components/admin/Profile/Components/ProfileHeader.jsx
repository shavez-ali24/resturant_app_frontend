import React from 'react'
import { useSelector } from 'react-redux'
import { Button } from "../../../ui/button"
import { useNavigate } from 'react-router-dom'
import { Users, Settings, Store, Table2 } from 'lucide-react'

export default function ProfileHeader({ restaurantName, restaurantLogo, onUpdateClick, showStaffButton, showUpdateButton, isEditing }) {
    const navigate = useNavigate()
    const colors = useSelector((state) => state.admin.theme.colors);
    const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

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
    
    const btnStyle = {
        borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
        backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
        color: isDarkMode ? colors.primary : colors.primaryText,
    };

    const handleMouseEnter = (e) => {
        e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}35` : `${colors.primary}22`;
    };
    const handleMouseLeave = (e) => {
        e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}20` : colors.primaryLight;
    };

    return (
        <div data-tour="profile-heading" className="rounded-2xl border border-[#ede8e3] bg-white overflow-hidden shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
            <div 
                className="h-auto min-h-14 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 gap-3 border-b border-[#ede8e3]/50 dark:border-slate-700/50"
                style={{ backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "#f8f3ef" }}
            >
                <div className="flex items-center gap-3">
                    <div 
                        className="w-9 h-9 rounded-lg overflow-hidden border shadow-sm bg-white flex-shrink-0"
                        style={{ borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33` }}
                    >
                        {restaurantLogo ? (
                            <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div 
                                className="w-full h-full flex items-center justify-center"
                                style={{ background: isDarkMode ? `linear-gradient(to bottom right, ${colors.primary}20, ${colors.primary}10)` : `linear-gradient(to bottom right, ${colors.primary}15, ${colors.primary}05)` }}
                            >
                                <Store className="w-5 h-5" style={{ color: colors.primary }} />
                            </div>
                        )}
                    </div>
                    <h1
                        style={{ fontSize: `${autoFontSize}px`, color: isDarkMode ? colors.primary : colors.primaryText }}
                        className="font-extrabold leading-tight"
                    >
                        {displayName || "My Restaurant"}
                    </h1>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-center sm:justify-end">
                    {showStaffButton && isAdmin && (
                        <Button
                          variant="outline"
                          onClick={() => navigate('/admin/staff')}
                          className="h-8 text-xs px-3 shadow-sm transition-all duration-150"
                          style={btnStyle}
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                            <Users className="w-3.5 h-3.5 mr-1" /> Staff
                        </Button>
                    )}
                    {isAdmin && (
                        <Button
                          variant="outline"
                          onClick={() => navigate('/admin/tables')}
                          className="h-8 text-xs px-3 shadow-sm transition-all duration-150"
                          style={btnStyle}
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                            <Table2 className="w-3.5 h-3.5 mr-1" /> Table Management
                        </Button>
                    )}
                    {showUpdateButton && (
                        <Button
                          data-tour="profile-edit-btn"
                          onClick={onUpdateClick}
                          className="h-8 text-xs px-3 shadow-sm transition-all duration-150"
                          style={isEditing ? {
                              borderColor: "rgba(239, 68, 68, 0.4)",
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                              color: "rgb(239, 68, 68)"
                          } : btnStyle}
                          onMouseEnter={isEditing ? (e) => { e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)" } : handleMouseEnter}
                          onMouseLeave={isEditing ? (e) => { e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)" } : handleMouseLeave}
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
