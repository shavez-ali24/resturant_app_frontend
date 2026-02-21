import { ProfileField } from './commanProfile/ProfileField';
import { CategoryChips } from './commanProfile/CategoryChips';
import { OrderModeStatus } from './commanProfile/OrderModeStatus';
import { Image, QrCode, Tag, Mail, Phone, MapPin, Globe, Hash, Building } from 'lucide-react';

export default function ProfileDetails({ profileData }) {
    const userRole = localStorage.getItem("userRole") || "";
    const isStaff = userRole === "staff";
    const emailOfAdmin = localStorage.getItem("userEmail") || "";
    const userName = localStorage.getItem("userName") || "";

    const getFinalQR = () => {
        const rawQR = profileData?.qrCode || "";
        const cleanedQR = rawQR.replace(/\s/g, "");
        return cleanedQR.startsWith("data:image") ? cleanedQR : `data:image/png;base64,${cleanedQR}`;
    };

    const handleQRDownload = () => {
        const qrUrl = getFinalQR();
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = 'restaurant-qr.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isStaff) {
        return (
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-orange-50">
                    <h2 className="text-lg font-semibold text-orange-700">Staff Information</h2>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ProfileField icon={<Image className="w-4 h-4" />} label="Name" value={userName} />
                    <ProfileField icon={<Mail className="w-4 h-4" />} label="Email" value={emailOfAdmin} />
                    <ProfileField icon={<Tag className="w-4 h-4" />} label="Role" value="Staff" />
                    <ProfileField icon={<Image className="w-4 h-4" />} label="Restaurant" value={profileData?.name} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Contact & Basic Info Card */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-orange-50">
                    <h2 className="text-lg font-semibold text-orange-700">Restaurant Information</h2>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ProfileField icon={<Tag className="w-4 h-4" />} label="Restaurant Name" value={profileData?.name} />
                    <ProfileField icon={<Mail className="w-4 h-4" />} label="Email Address" value={emailOfAdmin} />
                    <ProfileField icon={<Phone className="w-4 h-4" />} label="Phone Number" value={profileData?.phoneNumber} />
                    <ProfileField icon={<Hash className="w-4 h-4" />} label="Total Tables" value={profileData?.tableNumbers} />
                    <div className="sm:col-span-2">
                        <ProfileField icon={<MapPin className="w-4 h-4" />} label="Full Address" value={profileData?.address} />
                    </div>
                    <ProfileField icon={<Globe className="w-4 h-4" />} label="Client Domain" value={profileData?.domain} />
                </div>
            </div>

            {/* Financial & Order Modes Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Financial Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-orange-50">
                        <h2 className="text-lg font-semibold text-orange-700">Financial Settings</h2>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                        <ProfileField label="Delivery Charges" value={`₹${profileData?.deliveryCharges ?? 0}`} />
                        <ProfileField icon={<Building className="w-4 h-4" />} label="GST Status" value={profileData?.gstEnabled ? "Enabled" : "Disabled"} />
                        <ProfileField icon={<Building className="w-4 h-4" />} label="GST Rate" value={`${profileData?.gstRate}%`} />
                        <ProfileField icon={<Building className="w-4 h-4" />} label="GST Number" value={profileData?.gstNumber} />
                    </div>
                </div>

                {/* Order Modes Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-orange-50">
                        <h2 className="text-lg font-semibold text-orange-700">Order Modes</h2>
                    </div>
                    <div className="p-4 space-y-3">
                        <OrderModeStatus label="Eat Here" isEnabled={profileData?.orderModes?.eathere} />
                        <OrderModeStatus label="Takeaway" isEnabled={profileData?.orderModes?.takeaway} />
                        <OrderModeStatus label="Delivery" isEnabled={profileData?.orderModes?.delivery} />
                    </div>
                </div>
            </div>

            {/* Logo, QR & Categories Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Logo Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-orange-50">
                        <h2 className="text-lg font-semibold text-orange-700">Restaurant Logo</h2>
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-center">
                        {profileData?.logo ? (
                            <img src={profileData?.logo?.url} alt="Logo" className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-lg shadow-sm" />
                        ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <Image className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                    </div>
                </div>

                {/* QR Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-orange-50">
                        <h2 className="text-lg font-semibold text-orange-700">Tap N' Order QR</h2>
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-center">
                        {profileData?.qrCode ? (
                            <div className="text-center">
                                <img src={getFinalQR()} alt="QR Code" className="w-40 h-40 object-contain mx-auto mb-3" />
                                <button onClick={handleQRDownload} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                                    Download QR
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-8">
                                <QrCode className="w-16 h-16 text-gray-300 mb-2" />
                                <p className="text-gray-400 text-sm">QR Not Generated</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Categories Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden lg:col-span-2">
                    <div className="p-4 border-b border-gray-100 bg-orange-50">
                        <h2 className="text-lg font-semibold text-orange-700">Categories</h2>
                    </div>
                    <div className="p-4">
                        <CategoryChips categories={profileData?.categories} />
                    </div>
                </div>
            </div>
        </div>
    )
}
