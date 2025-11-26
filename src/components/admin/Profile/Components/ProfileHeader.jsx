import React from 'react'
import { Button } from "../../../ui/button"
import Heading from '../../ui/Heading'
import { LoadingSpinner } from './ui/LoadingSpinner'

export default function ProfileHeader({ restaurantName, error, onUpdateClick }) {
    return (
        <div className="mb-8 flex justify-between items-center">
            <div>
                <Heading title={restaurantName} />
                {error && (
                    <p className="text-sm text-red-600 mt-2">{error}</p>
                )}
            </div>
            <div>
                <Button onClick={onUpdateClick}>
                    Update Profile
                </Button>
            </div>
        </div>)
}
