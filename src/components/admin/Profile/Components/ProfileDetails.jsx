import { ProfileField } from './commanProfile/ProfileField';
import { CategoryChips } from './commanProfile/CategoryChips';
import { OrderModeStatus } from './commanProfile/OrderModeStatus';
import { Image, Landmark, QrCode, Tag, User, Utensils } from 'lucide-react';

export default function ProfileDetails({ profileData }) {
    const userRole = localStorage.getItem("userRole") || "";
    const isStaff = userRole === "staff";
    const emailOfAdmin = localStorage.getItem("userEmail") || "";
    const userName = localStorage.getItem("userName") || "";

    // ✅ QR FIX — works for both raw base64 & prefixed base64
    const getFinalQR = () => {
        const rawQR = profileData?.qrCode || "";
        const cleanedQR = rawQR.replace(/\s/g, "");
        return cleanedQR.startsWith("data:image")
            ? cleanedQR
            : `data:image/png;base64,${cleanedQR}`;
    };

    // If staff, show simplified view
    if (isStaff) {
        return (
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Card 1: Staff Account */}
                <div className="bg-white rounded-2xl shadow-lg border border-orange-500">
                    <div className="p-6 border-b border-orange-500">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            <User />
                            Staff Account
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProfileField label="Name" value={userName} />
                        <ProfileField label="Email Address" value={emailOfAdmin} />
                        <ProfileField label="Role" value="Staff" />
                    </div>
                </div>

                {/* Card 2: Restaurant Info */}
                <div className="bg-white rounded-2xl shadow-lg border border-orange-500">
                    <div className="p-6 border-b border-orange-500">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            <Utensils />
                            Restaurant Info
                        </h3>
                    </div>
                    <div className="p-6">
                        <ProfileField label="Restaurant Name" value={profileData?.name} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Card 1: Admin Account */}
                    <div className="bg-white rounded-2xl shadow-lg border border-orange-500">
                        <div className="p-6 border-b border-orange-500">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <User />
                                Admin Account
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProfileField label="Restaurant Name" value={profileData?.name} />
                            <ProfileField label="Email Address" value={emailOfAdmin} />
                        </div>
                    </div>

                    {/* Card 2: Restaurant Details */}
                    <div className="bg-white rounded-2xl shadow-lg border border-orange-500">
                        <div className="p-6 border-b border-orange-500">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <Utensils />
                                Restaurant Details
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <ProfileField label="Full Address" value={profileData?.address} />
                            </div>
                            <ProfileField label="Contact Phone" value={profileData?.phoneNumber} />
                            <ProfileField label="Total Tables" value={profileData?.tableNumbers} />
                            <div className="md:col-span-2">
                                <ProfileField label="Client Domain" value={profileData?.domain} />
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                    Active Order Modes
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <OrderModeStatus mode="Eat Here" isEnabled={profileData?.orderModes?.eathere} />
                                    <OrderModeStatus mode="Takeaway" isEnabled={profileData?.orderModes?.takeaway} />
                                    <OrderModeStatus mode="Delivery" isEnabled={profileData?.orderModes?.delivery} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Financial Settings */}
                    <div className="bg-white rounded-2xl shadow-lg border border-orange-500">
                        <div className="p-6 border-b border-orange-500">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <Landmark />
                                Financial Settings
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProfileField label="Delivery Charges" value={`₹${profileData?.deliveryCharges || 0}`} icon="₹" />
                            <ProfileField label="GST Status" value={profileData?.gstEnabled ? "Enabled" : "Disabled"} />
                            <ProfileField label="GST Rate" value={`${profileData?.gstRate}%`} icon="%" />
                            <div className="md:col-span-2">
                                <ProfileField label="GST Number" value={profileData?.gstNumber} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-1 space-y-8">
                    
                    {/* Logo */}
                    <div className="bg-white rounded-2xl shadow-lg border border-orange-500">
                        <div className="p-6 border-b border-orange-500">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <Image />
                                Restaurant Logo
                            </h3>
                        </div>
                        <div className="p-6 flex justify-center items-center">
                            {profileData?.logo ? (
                                <img
                                    src={profileData?.logo?.url}
                                    alt="Restaurant Logo"
                                    className="w-48 h-48 object-cover rounded-xl border p-1 bg-orange-50"
                                />
                            ) : (
                                <div className="w-48 h-48 bg-gray-100 rounded-xl border border-dashed flex items-center justify-center">
                                    <p className="text-gray-500">No logo uploaded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="bg-white rounded-2xl shadow-lg border border-orange-500">
                        <div className="p-6 border-b border-orange-500">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <Tag />
                                Categories
                            </h3>
                        </div>
                        <div className="p-6">
                            <CategoryChips categories={profileData?.categories} />
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white rounded-2xl shadow-lg border border-orange-500">
                        <div className="p-6 border-b border-orange-500">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <QrCode />
                                Tap N' Order QR
                            </h3>
                        </div>

                        <div className="p-6">
                            {profileData?.qrCode ? (
                                <div className="text-center">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-500 inline-block ">
                                        <img
                                            src={getFinalQR()}
                                            alt="QR Code"
                                            className="w-48 h-48 object-contain"
                                        />
                                    </div>

                                    <a
                                        href={getFinalQR()}
                                        download="restaurant-qr.png"
                                        className="w-full mt-4 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Download QR
                                    </a>
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
