import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Navigation, Utensils, Truck, Home, ArrowLeft, Loader2, ShoppingBag, IndianRupee } from "lucide-react";
import { getCurrentAddress } from "@/service/deliveryService";
import { AnimatePresence, motion } from "framer-motion";

const NAME_INPUT_PATTERN = /^[A-Za-z\s]*$/;
const NAME_VALID_PATTERN = /^[A-Za-z\s]+$/;
const PHONE_VALID_PATTERN = /^\d{10}$/;
const capitalizeFirstLetter = (value) =>
  String(value || "").replace(/^(\s*)([a-z])/, (_, spaces, char) => `${spaces}${char.toUpperCase()}`);

export default function OrderFormModal({
  qrInfo = null,
  showModal,
  setShowModal,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  tableId,
  setTableId,
  orderType,
  setOrderType,
  address,
  setAddress,
  useCurrentLocation,
  setUseCurrentLocation,
  loading,
  handleOrderSubmit,
  restaurantData,
  logo,
  resetForm,
  cartItems = {},
  totalAmount = 0,
  isDarkMode = false,
}) {
  const [selectedOrderType, setSelectedOrderType] = useState(orderType);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const orderModes = restaurantData?.restaurant?.orderModes;

  // ✅ Get delivery charges from restaurant data (only for display)
  const deliveryCharges = Number(restaurantData?.restaurant?.deliveryCharges || 0);

  // Read unitId from URL on mount for QR-scanned users
  const [scannedUnitId] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("unitId") || null;
    } catch { return null; }
  });

  const isRoomQR = qrInfo?.unitType === "ROOM" && !qrInfo?.requiresCustomerInfo;
  const effectiveOrderType = isRoomQR ? "Eat Here" : orderType;

  // Auto-select orderType for room QR stays to bypass type selection
  useEffect(() => {
    if (isRoomQR && orderType !== "Eat Here") {
      setOrderType("Eat Here");
      setSelectedOrderType("Eat Here");
    }
  }, [isRoomQR, orderType, setOrderType]);

  // Auto-select section when only one section exists and Eat Here is chosen
  useEffect(() => {
    if (orderType !== "Eat Here") return;
    const sections = Array.isArray(restaurantData?.restaurant?.sections) ? restaurantData.restaurant.sections : [];
    const activeSections = sections.filter(s => Array.isArray(s.units) && s.units.some(u => u.isActive !== false));
    
    // Only auto-select section (with empty table number) when there's exactly one section
    if (activeSections.length === 1 && !tableId) {
      setTableId(`${activeSections[0].name}:`);
    }
  }, [orderType, restaurantData, tableId, setTableId]);

  // Get cart items array
  const cartItemsArray = Object.values(cartItems);

  const orderTypeOptions = useMemo(() => {
    let baseOptions = [
      {
        value: "Eat Here",
        label: "Eat here",
        description: "Dine in at our restaurant",
        icon: Utensils,
        color: isDarkMode ? "bg-green-600" : "bg-green-500",
        modeKey: "eathere",
      },
      {
        value: "Take Away",
        label: "Take away",
        description: "Pick up your order",
        icon: ShoppingBag,
        color: isDarkMode ? "bg-blue-600" : "bg-blue-500",
        modeKey: "takeaway",
      },
      {
        value: "Delivery",
        label: "Delivery",
        description: "Get it delivered to you",
        icon: Truck,
        color: isDarkMode ? "bg-orange-600" : "bg-orange-500",
        modeKey: "delivery",
      },
    ];

    // Filter out Eat Here if not accessed via table/room QR stay scan
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const hasQrUnitId = urlParams ? !!urlParams.get("unitId") : false;
    if (!hasQrUnitId) {
      baseOptions = baseOptions.filter((opt) => opt.value !== "Eat Here");
    }

    if (!orderModes || typeof orderModes !== "object") {
      return baseOptions;
    }

    return baseOptions.filter((option) => Boolean(orderModes?.[option.modeKey]));
  }, [orderModes, isDarkMode]);

  useEffect(() => {
    setSelectedOrderType(orderType);
  }, [orderType]);

  useEffect(() => {
    if (orderType && !orderTypeOptions.some((option) => option.value === orderType)) {
      setOrderType("");
      setSelectedOrderType("");
    }
  }, [orderType, orderTypeOptions, setOrderType]);

  const handleOrderTypeSelect = (type) => {
    setOrderType(type);
    setSelectedOrderType(type);
    if (type !== "Delivery") {
      setAddress("");
      setUseCurrentLocation(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    setUseCurrentLocation(true);
    setAddress("Getting your location...");
    
    try {
      const address = await getCurrentAddress();
      setAddress(address);
      setUseCurrentLocation(true);
    } catch (error) {
      console.error("Error getting location:", error);
      setAddress("");
      setUseCurrentLocation(false);
      alert("We couldn't retrieve your current location automatically. Please enter your address manually.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const isFormValid = () => {
    const isRoomQR = qrInfo?.unitType === "ROOM" && !qrInfo?.requiresCustomerInfo;
    if (isRoomQR) return true;

    const trimmedName = customerName.trim();
    const isNameValid = NAME_VALID_PATTERN.test(trimmedName);

    if (!isNameValid || !PHONE_VALID_PATTERN.test(customerPhone)) {
      return false;
    }

    switch (orderType) {
      case "Eat Here": {
        // QR-scanned users don't need to select a table manually
        if (scannedUnitId) return true;
        const [sec, num] = (tableId || "").split(":");
        return !!(sec && num);
      }
      case "Take Away":
        return true;
      case "Delivery":
        return !!address && address.trim().length > 0;
      default:
        return false;
    }
  };

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[32px] border shadow-2xl ${
              isDarkMode
                ? "border-slate-700 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800"
                : "border-orange-100/90 bg-gradient-to-b from-white via-orange-50 to-orange-50"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="sticky top-0 px-5 py-4 bg-white dark:bg-slate-900 z-10 rounded-t-[32px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!effectiveOrderType ? (
                <button
                  onClick={() => setShowModal(false)}
                  className="flex items-center gap-3 text-left transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span className={`text-base font-bold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                    Back
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (isRoomQR) {
                      setShowModal(false);
                    } else {
                      setOrderType("");
                      setSelectedOrderType("");
                    }
                  }}
                  className="flex items-center gap-3 text-left transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span className={`text-base font-bold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                    {isRoomQR ? "Back" : "Back to order types"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 pt-1">
          {!effectiveOrderType ? (
            <div className="space-y-4">
              <h3 className={`text-xl font-black ${isDarkMode ? "text-slate-100" : "text-gray-900"} mb-4`}>
                Choose order type
              </h3>
              <div className="space-y-3">
                {orderTypeOptions.map((option) => {
                  const isSelected = selectedOrderType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleOrderTypeSelect(option.value)}
                      className={`w-full py-4 px-5 rounded-[20px] border transition-all text-left flex items-center justify-between ${
                        isSelected 
                          ? isDarkMode
                            ? "border-primary bg-primary/10"
                            : "border-primary bg-primary/5" 
                          : isDarkMode 
                            ? "border-slate-800 bg-slate-950/20 hover:bg-slate-800" 
                            : "border-orange-100/70 bg-white hover:bg-orange-50/20"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <option.icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-gray-400"}`} strokeWidth={2} />
                        <div>
                          <p className={`font-bold text-[15px] ${isSelected ? "text-primary" : isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
                            {option.label}
                          </p>
                          <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"} mt-0.5`}>
                            {option.description}
                            {option.value === "Delivery" && deliveryCharges > 0 && (
                              <span className="text-primary font-bold"> · ₹{deliveryCharges}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* Circle Radio indicator */}
                      <div className={`h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? "border-primary bg-primary text-white" 
                          : isDarkMode 
                            ? "border-slate-700 bg-transparent" 
                            : "border-zinc-200 bg-transparent"
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {qrInfo?.unitType === "ROOM" && !qrInfo?.requiresCustomerInfo ? (
                <div className={`mb-6 rounded-xl border p-4 shadow-sm ${
                  isDarkMode
                    ? "border-orange-500/20 bg-orange-500/5 text-orange-200"
                    : "border-orange-200 bg-[#fbf9f6] text-gray-700"
                }`}>
                  <p className="font-extrabold text-sm">Ordering for Room Stay</p>
                  {qrInfo?.customerName && (
                    <p className="text-xs mt-1.5 font-semibold text-gray-600 dark:text-slate-300">Guest Name: {qrInfo.customerName}</p>
                  )}
                  <p className="text-[11px] mt-1.5 text-gray-400">
                    Your details are linked automatically to the active room stay booking.
                  </p>
                </div>
              ) : (
                <>
                  {/* Customer Name */}
                  <div className="mb-5">
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-gray-400"}`}>
                      YOUR NAME *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => {
                        const { value } = e.target;
                        if (value.length <= 15 && NAME_INPUT_PATTERN.test(value)) {
                          setCustomerName(capitalizeFirstLetter(value));
                        }
                      }}
                      maxLength={15}
                      className={`w-full bg-transparent pt-2 pb-1.5 text-base font-bold outline-none border-b-2 transition-colors ${
                        isDarkMode ? "text-slate-100" : "text-gray-900"
                      } ${customerName ? "border-primary" : "border-gray-200 focus:border-primary"}`}
                    />
                    <p className={`mt-1.5 text-xs ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
                      Max 15 characters ({15 - customerName.length} left)
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div className="mb-5">
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-gray-400"}`}>
                      PHONE NUMBER *
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      value={customerPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 10) setCustomerPhone(value);
                      }}
                      maxLength={10}
                      inputMode="numeric"
                      className={`w-full bg-transparent pt-2 pb-1.5 text-base font-bold outline-none border-b-2 transition-colors ${
                        isDarkMode ? "text-slate-100" : "text-gray-900"
                      } ${customerPhone ? "border-primary" : "border-gray-200 focus:border-primary"}`}
                    />
                    <p className={`mt-1.5 text-xs ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
                      10-digit phone number required
                    </p>
                  </div>
                </>
              )}

              {/* Conditional Fields Based on Order Type */}
              <div className="space-y-5">
                {/* QR Scanned: unitId present — hide table selection, auto-assign */}
                {effectiveOrderType === "Eat Here" && scannedUnitId && !isRoomQR ? (
                  <div className="animate-fade-in space-y-3">
                    <div className={`flex items-start gap-3 rounded-xl border p-4 ${isDarkMode ? "border-orange-500/10 bg-orange-500/5 text-orange-200" : "border-orange-100 bg-[#fbf9f6] text-gray-700"}`}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`font-extrabold text-sm ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
                          Table assigned via QR
                        </p>
                        <p className={`text-xs mt-1 font-medium ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                          You're automatically assigned to this table.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : effectiveOrderType === "Eat Here" && !isRoomQR ? (
                  <div className="animate-fade-in space-y-3">
                    {(() => {
                      const sections = Array.isArray(restaurantData?.restaurant?.sections) ? restaurantData.restaurant.sections : [];
                      const sectionDefs = sections
                        .filter(s => Array.isArray(s.units) && s.units.length > 0)
                        .map(s => ({
                          key: s.name,
                          label: s.name,
                          units: s.units.filter(u => u.isActive !== false),
                        }));

                      const [selSection, selTable] = tableId ? tableId.split(":") : ["", ""];
                      const onlyOne = sectionDefs.length === 1;
                      const selectedDef = sectionDefs.find(s => s.key === selSection);

                      return (
                        <>
                          <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-gray-400"}`}>
                            {onlyOne ? "Select Table *" : "Select Section & Table *"}
                          </label>
                          {sectionDefs.length === 0 ? (
                            <p className={`rounded-xl border border-dashed p-3 text-sm text-center ${isDarkMode ? "border-slate-600 text-slate-400" : "border-orange-200 text-gray-500"}`}>
                              No tables configured yet.
                            </p>
                          ) : onlyOne ? (
                            <Select
                              value={selTable || ""}
                              onValueChange={(v) => setTableId(`${sectionDefs[0].key}:${v}`)}
                            >
                              <SelectTrigger className={`h-11 w-full rounded-xl border text-sm font-medium ${isDarkMode ? "border-orange-500 bg-slate-900 text-slate-100" : "border-primary bg-white text-gray-800"}`}>
                                <SelectValue placeholder="Select Table" />
                              </SelectTrigger>
                              <SelectContent className={`max-h-[180px] overflow-y-auto rounded-xl border shadow-xl ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-orange-200 bg-white"}`}>
                                <SelectGroup>
                                  {sectionDefs[0].units.map((unit) => (
                                    <SelectItem key={unit.name} value={unit.name}
                                      className={`cursor-pointer py-2 text-sm font-medium ${isDarkMode ? "text-slate-200 data-[highlighted]:bg-orange-500 data-[highlighted]:text-white" : "text-gray-700 data-[highlighted]:bg-orange-500 data-[highlighted]:text-white"}`}>
                                      {sectionDefs[0].label} {unit.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {sectionDefs.map(({ key, label, units }) => {
                                const isSelected = selSection === key;
                                return (
                                  <div key={key} className={`flex flex-col gap-1.5 ${isSelected ? "col-span-full" : ""}`}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) setTableId("");
                                        else setTableId(`${key}:`);
                                      }}
                                      className={`flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                                        isSelected
                                          ? "border-orange-500 bg-orange-500 text-white shadow-md"
                                          : isDarkMode
                                            ? "border-slate-600 bg-slate-800 text-slate-200 hover:border-orange-400"
                                            : "border-orange-200 bg-white text-gray-700 hover:border-orange-400 hover:bg-orange-50"
                                      }`}
                                    >
                                      <span className="flex-1 text-left">{label}</span>
                                      <span className={`text-xs font-normal ${isSelected ? "text-white/80" : isDarkMode ? "text-slate-400" : "text-gray-400"}`}>
                                        {units.length} {units.length > 1 ? "items" : "item"}
                                      </span>
                                    </button>
                                    {isSelected && (
                                      <Select
                                        value={selTable || ""}
                                        onValueChange={(v) => setTableId(`${key}:${v}`)}
                                      >
                                        <SelectTrigger className={`h-9 w-full rounded-lg border text-sm font-medium ${
                                          isDarkMode
                                            ? "border-orange-500 bg-slate-900 text-slate-100"
                                            : "border-orange-400 bg-white text-gray-800"
                                        }`}>
                                          <SelectValue placeholder="Select Table" />
                                        </SelectTrigger>
                                        <SelectContent className={`rounded-xl border shadow-xl max-h-[180px] overflow-y-auto ${
                                          isDarkMode ? "border-slate-700 bg-slate-900" : "border-orange-200 bg-white"
                                        }`}>
                                          <SelectGroup>
                                            {units.map((unit) => (
                                              <SelectItem
                                                key={unit.name}
                                                value={unit.name}
                                                className={`cursor-pointer py-2 text-sm font-medium ${
                                                  isDarkMode
                                                    ? "text-slate-200 data-[highlighted]:bg-orange-500 data-[highlighted]:text-white"
                                                    : "text-gray-700 data-[highlighted]:bg-orange-500 data-[highlighted]:text-white"
                                                }`}
                                              >
                                                {label} {unit.name}
                                              </SelectItem>
                                            ))}
                                          </SelectGroup>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {tableId && selTable && (
                            <p className="text-xs font-semibold text-primary">
                              ✓ {selectedDef?.label} {selTable} selected
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : null}

                {/* Delivery Address - Only for Delivery */}
                {orderType === "Delivery" && (
                  <div className="animate-fade-in space-y-3">
                    <div className="flex items-center justify-between">
                      <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-gray-400"}`}>
                        DELIVERY ADDRESS *
                      </label>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isGettingLocation}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isGettingLocation ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Getting location...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Use current</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter your delivery address"
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          if (e.target.value) {
                            setUseCurrentLocation(false);
                          }
                        }}
                        className={`w-full bg-transparent pt-2 pb-1.5 text-base font-bold outline-none border-b-2 transition-colors ${
                          isDarkMode ? "text-slate-100" : "text-gray-900"
                        } ${address ? "border-primary" : "border-gray-200 focus:border-primary"}`}
                      />
                    </div>
                    {useCurrentLocation && address && (
                      <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-2.5 text-xs text-green-700">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium">Location detected from your device</span>
                          <p className="text-green-600 mt-1">You can edit the address above if it's not accurate.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3 border-t border-orange-100/50 pt-5">
                <Button
                  variant="ghost"
                  onClick={resetForm}
                  disabled={loading}
                  className={`h-12 flex-1 rounded-2xl text-sm font-bold transition-colors ${
                    isDarkMode 
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700" 
                      : "bg-[#f2efe9] text-gray-700 hover:bg-[#eae6de]"
                  }`}
                >
                  Cancel
                </Button>
                <Button
                  className="h-12 flex-1 rounded-2xl bg-primary text-sm font-bold text-white shadow-md transition-colors hover:bg-primary/95"
                  onClick={handleOrderSubmit}
                  disabled={!isFormValid() || loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    "Place order"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}