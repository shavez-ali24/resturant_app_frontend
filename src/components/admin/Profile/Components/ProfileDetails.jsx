import React from 'react'
import { ProfileField } from './Ui/ProfileField';
import { CategoryChips } from './Ui/CategoryChips';
import { OrderModeStatus } from './Ui/OrderModeStatus';
import { UserCircleIcon, BuildingOfficeIcon, CreditCardIcon, PhotoIcon, TagIcon, QrCodeIcon } from '@heroicons/react/24/outline';

export default function ProfileDetails({ profileData, onDownloadQRCode }) {
    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Card 1: Admin Account */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <UserCircleIcon className="w-6 h-6 text-orange-500" />
                                Admin Account
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProfileField
                                label="Full Name"
                                value={profileData.name}
                                icon="👤"
                            />
                            <ProfileField
                                label="Email Address"
                                value={profileData.email}
                                icon="📧"
                            />
                        </div>
                    </div>

                    {/* Card 2: Restaurant Details */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <BuildingOfficeIcon className="w-6 h-6 text-orange-500" />
                                Restaurant Details
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <ProfileField
                                    className="w-64"
                                    label="Full Address"
                                    value={profileData.address}
                                    icon="📍"
                                />
                            </div>
                            <ProfileField
                                label="Contact Phone"
                                value={profileData.phoneNumber}
                                icon="📞"
                            />
                            <ProfileField
                                label="Total Tables"
                                value={profileData.tableNumbers}
                                icon="🪑"
                            />
                            <div className="md:col-span-2">
                                <ProfileField
                                    label="Client Domain"
                                    value={profileData.domain}
                                    icon="🌐"
                                />
                            </div>

                            {/* ✅ NEW: Display Order Modes */}
                            <div className="md:col-span-2 space-y-4">
                                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                    Active Order Modes
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <OrderModeStatus
                                        mode="Eat Here"
                                        Note icon="🍴"
                                        isEnabled={profileData.orderModes.eathere}
                                    />
                                    <OrderModeStatus
                                        mode="Takeaway"
                                        icon="🛍️"
                                        isEnabled={profileData.orderModes.takeaway}
                                    />
                                    <OrderModeStatus
                                        mode="Delivery"
                                        icon="🛵"
                                        isEnabled={profileData.orderModes.delivery}
                                    />
                                </div>
                            </div>
                            {/* ✅ END: Display Order Modes */}
                        </div>
                    </div>

                    {/* Card 3: Financial Settings */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <CreditCardIcon className="w-6 h-6 text-orange-500" />
                                Financial Settings
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProfileField
                                label="GST Status"
                                value={profileData.gstEnabled ? "Enabled" : "Disabled"}
                                icon="🧾"
                            />
                            <ProfileField label="GST Rate"
                                value={`${profileData.gstRate}%`}
                                icon="%"
                            />
                            <div className="md:col-span-2">
                                <ProfileField
                                    label="GST Number"
                                    value={profileData.gstNumber}
                                    icon="🔢"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN (1/3 width) --- */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Card 1: Logo */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <PhotoIcon className="w-6 h-6 text-orange-500" />
                                Restaurant Logo
                            </h3>
                        </div>
                        <div className="p-6 flex justify-center items-center">
                            {profileData.logoUrl ? (
                                <img
                                    src={profileData.logoUrl}
                                    alt="Restaurant Logo"
                                    className="w-48 h-48 object-cover rounded-xl border p-1 bg-gray-50"
                                />
                            ) : (
                                <div className="w-48 h-48 bg-gray-100 rounded-xl border border-dashed flex items-center justify-center">
                                    <p className="text-gray-500">No logo uploaded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 2: Categories */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <TagIcon className="w-6 h-6 text-orange-500" />
                                Categories
                            </h3>
                        </div>
                        <div className="p-6">
                            <CategoryChips categories={profileData.categories} />
                        </div>
                    </div>

                    {/* Card 3: QR Code */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <QrCodeIcon className="w-6 h-6 text-orange-500" />
                                Tap N' Order QR
                            </h3>
                        </div>
                        <div className="p-6">
                            {profileData.qrCode ? (
                                <div className="text-center">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 inline-block">
                                        <img
                                            src={profileData.qrCode}
                                            alt="QR Code"
                                            className="w-48 h-48 object-contain"
                                        />
                                    </div>
                                    <button
                                        onClick={onDownloadQRCode}
                                        className="w-full mt-4 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>📥</span>
                                        Download QR
                                    </button>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center">
                                    QR Code not generated.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
