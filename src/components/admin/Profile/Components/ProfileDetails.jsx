import { ProfileField } from './commanProfile/ProfileField';
import { OrderModeStatus } from './commanProfile/OrderModeStatus';
import {
  Image,
  Tag,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building,
  Store,
  Users,
  SlidersHorizontal,
} from 'lucide-react';

export default function ProfileDetails({ profileData }) {
  const userRole = localStorage.getItem("userRole") || "";
  const isStaff = userRole === "staff";
  const emailOfAdmin = localStorage.getItem("userEmail") || "";
  const userName = localStorage.getItem("userName") || "";
  const cardClass =
    "overflow-hidden rounded-2xl border border-[#ede8e3] bg-white shadow-sm dark:border-slate-700 dark:bg-[#1e293b]";
  const headerClass =
    "border-b border-[#ede8e3]/50 px-6 py-4 dark:border-slate-700/50 bg-[#fff8f5] dark:bg-orange-950/20";
  const titleRowClass = "flex items-center gap-2.5 text-base font-extrabold text-orange-700 dark:text-orange-400";

  if (isStaff) {
    return (
      <div className={cardClass}>
        <div className={headerClass}>
          <h2 className={titleRowClass}>
            <Users className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
            Staff Information
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <ProfileField icon={<Image className="w-4 h-4" />} label="Name" value={userName} />
          <ProfileField icon={<Mail className="w-4 h-4" />} label="Email" value={emailOfAdmin} />
          <ProfileField icon={<Tag className="w-4 h-4" />} label="Role" value="Staff" />
          <ProfileField
            icon={<Store className="w-4 h-4" />}
            label="Restaurant"
            value={profileData?.restaurantName || profileData?.name}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      {/* Unified Sections */}
      <div className="divide-y divide-[#ede8e3]/50 dark:divide-slate-700/50 bg-white dark:bg-[#1e293b]">
        {/* Section 1: Business Profile */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-sm font-bold text-[#1c1917] dark:text-slate-100 uppercase tracking-wider">
              Business Profile
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <ProfileField
              icon={<Tag className="w-4 h-4" />}
              label="Business Name"
              value={profileData?.restaurantName || profileData?.name}
            />
            <ProfileField icon={<Mail className="w-4 h-4" />} label="Contact Email" value={emailOfAdmin} />
            <ProfileField icon={<Phone className="w-4 h-4" />} label="Contact Number" value={profileData?.phoneNumber} />
            <ProfileField icon={<Globe className="w-4 h-4" />} label="Web URL" value={profileData?.domain} />
            <div className="sm:col-span-2 md:col-span-3 lg:col-span-4">
              <ProfileField icon={<MapPin className="w-4 h-4" />} label="Business Address" value={profileData?.address} />
            </div>
          </div>
        </div>

        {/* Section 2: Financials & Operations */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Billing & Taxes Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <h3 className="text-sm font-bold text-[#1c1917] dark:text-slate-100 uppercase tracking-wider">
                  Billing & Taxes
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <ProfileField label="Delivery Fee" value={`₹${profileData?.deliveryCharges ?? 0}`} />
                <ProfileField icon={<Building className="w-4 h-4" />} label="Tax Status" value={profileData?.gstEnabled ? "Enabled" : "Disabled"} />
                <ProfileField icon={<Building className="w-4 h-4" />} label="Tax Rate (%)" value={`${profileData?.gstRate}%`} />
                <ProfileField icon={<Building className="w-4 h-4" />} label="Tax ID / GSTIN" value={profileData?.gstNumber} />
              </div>
            </div>

            {/* Service Modes Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <SlidersHorizontal className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <h3 className="text-sm font-bold text-[#1c1917] dark:text-slate-100 uppercase tracking-wider">
                  Service Modes
                </h3>
              </div>
              <div className="space-y-1">
                <OrderModeStatus label="Eat Here" isEnabled={profileData?.orderModes?.eathere} />
                <OrderModeStatus label="Takeaway" isEnabled={profileData?.orderModes?.takeaway} />
                <OrderModeStatus label="Delivery" isEnabled={profileData?.orderModes?.delivery} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Brand Identity */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-sm font-bold text-[#1c1917] dark:text-slate-100 uppercase tracking-wider">
              Brand Identity
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {profileData?.logo ? (
              <div className="relative overflow-hidden rounded-xl border border-orange-100 bg-[#fff8f5] p-2 dark:border-slate-700 dark:bg-slate-800 shrink-0">
                <img
                  src={profileData?.logo?.url}
                  alt="Logo"
                  className="h-20 w-32 object-contain"
                />
              </div>
            ) : (
              <div className="flex h-20 w-32 items-center justify-center rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 shrink-0">
                <Image className="h-8 w-8 text-orange-300" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-[#1c1917] dark:text-slate-100">Restaurant Logo</h4>
              <p className="text-xs text-[#78716c] dark:text-slate-400 mt-1">
                This logo is displayed on the customer-facing menu and receipts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

