import React from 'react'
import { Button } from "../../../ui/button"
import Heading from '../../common/Heading'
import { LoadingSpinner } from './commanProfile/LoadingSpinner'
import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'

export default function ProfileHeader({ restaurantName, error, onUpdateClick, showStaffButton, showUpdateButton }) {
    const navigate = useNavigate()
    const userRole = localStorage.getItem("userRole") || "";
    const isAdmin = userRole === "admin";
    
    return (
        <div className="mb-8 flex justify-between items-center">
            <div>
                <Heading title={restaurantName || (isAdmin ? "My Restaurant" : "My Profile")} />
                {error && (
                    <p className="text-sm text-red-600 mt-2">{error}</p>
                )}
            </div>
            <div className="flex gap-2">
                {showStaffButton && isAdmin && (
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/admin/staff')}
                        className="flex items-center gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                        <Users className="h-4 w-4" />
                        Staff Detail
                    </Button>
                )}
                {showUpdateButton && (
                    <Button onClick={onUpdateClick}>
                        Update Profile
                    </Button>
                )}
            </div>
        </div>)
}
