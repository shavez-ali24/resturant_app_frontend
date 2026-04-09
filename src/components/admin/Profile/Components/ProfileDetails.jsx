import { ProfileField } from './commanProfile/ProfileField';
import { CategoryChips } from './commanProfile/CategoryChips';
import { OrderModeStatus } from './commanProfile/OrderModeStatus';
import {
  Image,
  QrCode,
  Tag,
  Mail,
  Phone,
  MapPin,
  Globe,
  Hash,
  Building,
  Store,
  Users,
  ScanLine,
  SlidersHorizontal,
  Layers3,
} from 'lucide-react';

export default function ProfileDetails({ profileData }) {
  const userRole = localStorage.getItem("userRole") || "";
  const isStaff = userRole === "staff";
  const emailOfAdmin = localStorage.getItem("userEmail") || "";
  const userName = localStorage.getItem("userName") || "";
  const restaurantName =
    (typeof profileData?.restaurantName === "string"
      ? profileData.restaurantName.trim()
      : "") ||
    (typeof profileData?.name === "string" ? profileData.name.trim() : "") ||
    "Restaurant";
  const restaurantSlug = restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const cardClass =
    "overflow-hidden rounded-2xl border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-slate-950/40";
  const headerClass =
    "border-b border-orange-100 bg-gradient-to-r from-orange-50/90 via-orange-50 to-white p-4 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800";
  const titleRowClass = "flex items-center gap-2 text-lg font-semibold text-orange-700 dark:text-orange-300";
  const iconBadgeClass =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm";
  const categoryCount = Array.isArray(profileData?.categories)
    ? profileData.categories.length
    : 0;

  const getFinalQR = () => {
    const rawQR =
      (typeof profileData?.qrCode === "string" ||
      typeof profileData?.qrCode === "number")
        ? String(profileData?.qrCode)
        : (
            profileData?.qrCode?.url ||
            profileData?.qrCode?.secure_url ||
            profileData?.qrCode?.secureUrl ||
            profileData?.qrCode?.path ||
            profileData?.qrCode?.base64 ||
            ""
          );
    const cleanedQR = String(rawQR || "").replace(/\s/g, "");
    if (!cleanedQR) return "";
    if (cleanedQR.startsWith("data:image")) return cleanedQR;
    if (/^https?:\/\//i.test(cleanedQR)) return cleanedQR;
    return `data:image/png;base64,${cleanedQR}`;
  };

  const handleQRDownload = () => {
    const qrUrl = getFinalQR();
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `${restaurantSlug || "restaurant"}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isStaff) {
    return (
      <div className={cardClass}>
        <div className={headerClass}>
          <h2 className={titleRowClass}>
            <span className={iconBadgeClass}>
              <Users className="h-4 w-4" />
            </span>
            Staff Information
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
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
    <div className="space-y-4 overflow-hidden">
      {/* Contact & Basic Info Card */}
      <div className={cardClass}>
        <div className={headerClass}>
          <h2 className={titleRowClass}>
            <span className={iconBadgeClass}>
              <Store className="h-4 w-4" />
            </span>
            Restaurant Information
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileField
            icon={<Tag className="w-4 h-4" />}
            label="Restaurant Name"
            value={profileData?.restaurantName || profileData?.name}
          />
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={cardClass}>
          <div className={headerClass}>
            <h2 className={titleRowClass}>
              <span className={iconBadgeClass}>
                <Building className="h-4 w-4" />
              </span>
              Financial Settings
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <ProfileField label="Delivery Charges" value={`₹${profileData?.deliveryCharges ?? 0}`} />
            <ProfileField icon={<Building className="w-4 h-4" />} label="GST Status" value={profileData?.gstEnabled ? "Enabled" : "Disabled"} />
            <ProfileField icon={<Building className="w-4 h-4" />} label="GST Rate" value={`${profileData?.gstRate}%`} />
            <ProfileField icon={<Building className="w-4 h-4" />} label="GST Number" value={profileData?.gstNumber} />
          </div>
        </div>

        <div className={cardClass}>
          <div className={headerClass}>
            <h2 className={titleRowClass}>
              <span className={iconBadgeClass}>
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              Order Modes
            </h2>
          </div>
          <div className="space-y-3 p-4">
            <OrderModeStatus label="Eat Here" isEnabled={profileData?.orderModes?.eathere} />
            <OrderModeStatus label="Takeaway" isEnabled={profileData?.orderModes?.takeaway} />
            <OrderModeStatus label="Delivery" isEnabled={profileData?.orderModes?.delivery} />
          </div>
        </div>
      </div>

      {/* Logo, QR & Categories Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className={`${cardClass} flex flex-col`}>
          <div className={headerClass}>
            <h2 className={titleRowClass}>
              <span className={iconBadgeClass}>
                <Image className="h-4 w-4" />
              </span>
              Restaurant Logo
            </h2>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            {profileData?.logo ? (
              <img
                src={profileData?.logo?.url}
                alt="Logo"
                className="h-32 w-32 rounded-xl border border-orange-100 object-contain shadow-sm sm:h-40 sm:w-40"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-orange-200 bg-orange-50">
                <Image className="h-8 w-8 text-orange-300" />
              </div>
            )}
          </div>
        </div>

        <div className={`${cardClass} flex flex-col`}>
          <div className={headerClass}>
            <h2 className={titleRowClass}>
              <span className={iconBadgeClass}>
                <ScanLine className="h-4 w-4" />
              </span>
              {restaurantName} QR
            </h2>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            {getFinalQR() ? (
              <div className="w-full text-center">
                <img src={getFinalQR()} alt="QR Code" className="mx-auto mb-3 h-40 w-40 rounded-lg border border-orange-100 object-contain" />
                <button
                  onClick={handleQRDownload}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600"
                >
                  Download QR
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <QrCode className="mb-2 h-16 w-16 text-orange-200" />
                <p className="text-sm text-gray-400 dark:text-slate-400">QR Not Generated</p>
              </div>
            )}
          </div>
        </div>

        <div className={`${cardClass} lg:col-span-2`}>
          <div className={headerClass}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={titleRowClass}>
                <span className={iconBadgeClass}>
                  <Layers3 className="h-4 w-4" />
                </span>
                Categories
              </h2>
              <span className="rounded-full border border-orange-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-600 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                {categoryCount}
              </span>
            </div>
          </div>
          <div className="p-4">
            <CategoryChips categories={profileData?.categories} />
          </div>
        </div>
      </div>
    </div>
  );
}
