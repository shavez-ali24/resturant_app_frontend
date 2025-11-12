import React from 'react'
import { Button } from "../../../ui/button"
import Heading from '../../ui/Heading'

export default function ProfileHeader({ restaurantName, loading, error, onUpdateClick }) {
    return (
        <div className="mb-8 flex justify-between items-center">
            <div>
                <Heading title={restaurantName} />
                {loading && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Updating...</span>
                    </div>
                )}
                {error && (
                    <p className="text-sm text-red-600 mt-2">{error.message || "Failed to update"}</p>
                )}
            </div>
            <div>
                <Button onClick={onUpdateClick}>
                    Update Profile
                </Button>
            </div>
        </div>)
}
