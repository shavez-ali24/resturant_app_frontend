import React from 'react'
import { Button } from "../../../ui/button"
import { useNavigate } from 'react-router-dom'
import { Users, Settings, Store } from 'lucide-react'

export default function ProfileHeader({ restaurantName, restaurantLogo, onUpdateClick, showStaffButton, showUpdateButton }) {
    const navigate = useNavigate()
    const userRole = localStorage.getItem("userRole") || "";
    const isAdmin = userRole === "admin";
    
    return (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden">
            <div className="h-auto min-h-14 bg-orange-300 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border-2 border-white shadow-sm bg-white flex-shrink-0">
                        {restaurantLogo ? (
                            <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-orange-100">
                                <Store className="w-5 h-5 text-orange-500" />
                            </div>
                        )}
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800 text-center sm:text-left">{restaurantName || "My Restaurant"}</h1>
                </div>
                <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                    {showStaffButton && isAdmin && (
                        <Button variant="outline" onClick={() => navigate('/admin/staff')} className="border-white/50 text-white hover:bg-white/20 bg-transparent text-sm">
                            <Users className="w-4 h-4 mr-1" /> Staff
                        </Button>
                    )}
                    {showUpdateButton && (
                        <Button onClick={onUpdateClick} className="bg-white text-orange-600 hover:bg-gray-100 text-sm">
                            <Settings className="w-4 h-4 mr-1" /> Edit
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
