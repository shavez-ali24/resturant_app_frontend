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

  // Auto-select section when only one section exists and Eat Here is chosen
  useEffect(() => {
    if (orderType !== "Eat Here") return;
    const sections = restaurantData?.restaurant?.sections || {};
    const defs = [
      { key: "indoor",  count: sections.indoor?.tables  || restaurantData?.restaurant?.tableNumbers || 0 },
      { key: "outdoor", count: sections.outdoor?.tables || 0 },
      { key: "rooftop", count: sections.rooftop?.tables || 0 },
      { key: "rooms",   count: sections.rooms?.rooms    || 0 },
    ].filter(s => s.count > 0);

    if (defs.length === 1 && !tableId) {
      setTableId(`${defs[0].key}:1`);
    }
  }, [orderType, restaurantData, tableId, setTableId]);

  // Get cart items array
  const cartItemsArray = Object.values(cartItems);

  const orderTypeOptions = useMemo(() => {
    const baseOptions = [
      {
        value: "Eat Here",
        label: "Eat Here",
        description: "Dine in at our restaurant",
        icon: Utensils,
        color: isDarkMode ? "bg-green-600" : "bg-green-500",
        modeKey: "eathere",
      },
      {
        value: "Take Away",
        label: "Take Away",
        description: "Pick up your order",
        icon: Home,
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
    // Reset location-related states when changing order type
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
      // Show error message to user
      alert(error.message || "Unable to get your location. Please enter address manually.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const isFormValid = () => {
    const trimmedName = customerName.trim();
    const isNameValid = NAME_VALID_PATTERN.test(trimmedName);

    if (!isNameValid || !PHONE_VALID_PATTERN.test(customerPhone)) {
      return false;
    }

    switch (orderType) {
      case "Eat Here":
        return !!tableId;
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
            className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border shadow-2xl ${
              isDarkMode
                ? "border-slate-700 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800"
                : "border-orange-100/90 bg-gradient-to-b from-white via-orange-50 to-orange-50"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div
          className={`sticky top-0 rounded-t-2xl border-b px-4 py-3 ${
            isDarkMode
              ? "border-slate-700 bg-slate-900/95"
              : "border-orange-100/80 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between gap-3">
              {/* Close Button - Only show when no order type is selected */}
              {!orderType && (
                <button
                  onClick={() => setShowModal(false)}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors duration-200 hover:underline ${
                    isDarkMode ? "text-orange-300" : "text-primary"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              {/* Back Button - Only show when order type is selected */}
              {orderType && (
                <button
                  onClick={() => {
                    setOrderType("");
                    setSelectedOrderType("");
                  }}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors duration-200 hover:underline ${
                    isDarkMode ? "text-orange-300" : "text-primary"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Order Types
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Order Type Selection - Vertical Layout */}
          {!orderType ? (
            <div className="space-y-3">
              <h3 className={`text-base font-semibold sm:text-lg ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>Choose Order Type</h3>
              {orderTypeOptions.length > 0 ? (
                orderTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOrderTypeSelect(option.value)}
                    className={`w-full rounded-xl border-2 p-3.5 transition-all duration-300 hover:scale-[1.01] ${
                      selectedOrderType === option.value
                        ? isDarkMode
                          ? "border-orange-400 bg-orange-500/15 shadow-lg"
                          : "border-primary bg-primary/10 shadow-lg"
                        : isDarkMode
                        ? "border-slate-600 bg-slate-900/90 shadow-sm hover:border-slate-500 hover:shadow-md"
                        : "border-orange-200/80 bg-white shadow-sm hover:border-orange-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${option.color} flex h-11 w-11 items-center justify-center rounded-lg`}>
                        <option.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>{option.label}</div>
                        <div className={`text-xs sm:text-sm ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>{option.description}</div>
                        {/* Delivery charges info only for Delivery option */}
                        {option.value === "Delivery" && deliveryCharges > 0 && (
                          <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${isDarkMode ? "text-orange-300" : "text-orange-600"}`}>
                            <IndianRupee className="w-3 h-3" />
                            <span>Delivery charges: ₹{deliveryCharges}</span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full border-2 ${
                          selectedOrderType === option.value
                            ? isDarkMode
                              ? "bg-orange-400 border-orange-400"
                              : "bg-primary border-primary"
                            : isDarkMode
                            ? "border-slate-400"
                            : "border-orange-300/80"
                        }`}
                      />
                    </div>
                  </button>
                ))
              ) : (
                <p className={`rounded-xl border border-dashed p-4 text-sm ${
                  isDarkMode
                    ? "border-slate-600 bg-slate-900/70 text-slate-300"
                    : "border-orange-200 bg-orange-50/40 text-gray-500"
                }`}>
                  Ordering is currently unavailable. Please check back soon.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Order Summary Section - Show cart total */}
             

              {/* Customer Name */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Your Name *
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
                  className="w-full rounded-xl border border-orange-200 bg-white p-3.5 text-sm text-gray-800 shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Max 15 characters ({15 - customerName.length} left)
                </p>
              </div>

              {/* Phone Number */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone Number *
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
                  className="w-full rounded-xl border border-orange-200 bg-white p-3.5 text-sm text-gray-800 shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary"
                />
                <p className="mt-2 text-xs text-gray-500">
                  10-digit phone number required
                </p>
              </div>

              {/* Conditional Fields Based on Order Type */}
              <div className="space-y-4">
                {/* Table / Room Selection - Only for Eat Here */}
                {orderType === "Eat Here" && (() => {
                  const sections = restaurantData?.restaurant?.sections || {};
                  const indoorCount  = sections.indoor?.tables  || restaurantData?.restaurant?.tableNumbers || 0;
                  const outdoorCount = sections.outdoor?.tables || 0;
                  const rooftopCount = sections.rooftop?.tables || 0;
                  const roomsCount   = sections.rooms?.rooms    || 0;

                  const sectionDefs = [
                    { key: "indoor",  label: "Indoor",  count: indoorCount,  unit: "Table" },
                    { key: "outdoor", label: "Outdoor", count: outdoorCount, unit: "Table" },
                    { key: "rooftop", label: "Rooftop", count: rooftopCount, unit: "Table" },
                    { key: "rooms",   label: "Rooms",   count: roomsCount,   unit: "Room"  },
                  ].filter(s => s.count > 0);

                  // Parse selected: "indoor:3" → { section: "indoor", number: 3 }
                  const [selSection, selNum] = tableId ? tableId.split(":") : ["", ""];
                  const onlyOne = sectionDefs.length === 1;

                  return (
                    <div className="animate-fade-in space-y-3">
                      <label className={`block text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-gray-700"}`}>
                        {onlyOne ? "Select Table *" : "Select Section & Table *"}
                      </label>

                      {sectionDefs.length === 0 ? (
                        <p className={`rounded-xl border border-dashed p-3 text-sm text-center ${isDarkMode ? "border-slate-600 text-slate-400" : "border-orange-200 text-gray-500"}`}>
                          No tables configured yet.
                        </p>
                      ) : onlyOne ? (
                        // Single section — skip section button, show only number dropdown
                        <Select
                          value={tableId || `${sectionDefs[0].key}:1`}
                          onValueChange={(v) => setTableId(`${sectionDefs[0].key}:${v}`)}
                        >
                          <SelectTrigger className={`h-11 w-full rounded-xl border text-sm font-medium ${isDarkMode ? "border-orange-500 bg-slate-900 text-slate-100" : "border-primary bg-white text-gray-800"}`}>
                            <SelectValue placeholder={`Select ${sectionDefs[0].unit}`}>
                              {selNum ? `${sectionDefs[0].unit} ${selNum}` : `Select ${sectionDefs[0].unit}`}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className={`max-h-[180px] overflow-y-auto rounded-xl border shadow-xl ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-orange-200 bg-white"}`}>
                            <SelectGroup>
                              {Array.from({ length: sectionDefs[0].count }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}
                                  className={`cursor-pointer py-2 text-sm font-medium ${isDarkMode ? "text-slate-200 data-[highlighted]:bg-orange-500 data-[highlighted]:text-white" : "text-gray-700 data-[highlighted]:bg-orange-500 data-[highlighted]:text-white"}`}>
                                  {sectionDefs[0].unit} {i + 1}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      ) : (
                        // Multiple sections — show section cards + number dropdown
                        <div className="grid grid-cols-2 gap-2">
                          {sectionDefs.map(({ key, label, count, unit }) => {
                            const isSelected = selSection === key;
                            const spanFull = isSelected;
                            return (
                              <div key={key} className={`flex flex-col gap-1.5 ${spanFull ? "col-span-full" : ""}`}>
                                {/* Section button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) setTableId("");
                                    else setTableId(`${key}:1`);
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
                                    {count} {unit}{count > 1 ? "s" : ""}
                                  </span>
                                </button>

                                {/* Dropdown — full width when selected */}
                                {isSelected && (
                                  <Select
                                    value={selNum || "1"}
                                    onValueChange={(v) => setTableId(`${key}:${v}`)}
                                  >
                                    <SelectTrigger className={`h-9 w-full rounded-lg border text-sm font-medium ${
                                      isDarkMode
                                        ? "border-orange-500 bg-slate-900 text-slate-100"
                                        : "border-orange-400 bg-white text-gray-800"
                                    }`}>
                                      <SelectValue placeholder={`Select ${unit}`} />
                                    </SelectTrigger>
                                    <SelectContent className={`rounded-xl border shadow-xl max-h-[180px] overflow-y-auto ${
                                      isDarkMode ? "border-slate-700 bg-slate-900" : "border-orange-200 bg-white"
                                    }`}>
                                      <SelectGroup>
                                        {Array.from({ length: count }, (_, i) => (
                                          <SelectItem
                                            key={i + 1}
                                            value={String(i + 1)}
                                            className={`cursor-pointer py-2 text-sm font-medium ${
                                              isDarkMode
                                                ? "text-slate-200 data-[highlighted]:bg-orange-500 data-[highlighted]:text-white"
                                                : "text-gray-700 data-[highlighted]:bg-orange-500 data-[highlighted]:text-white"
                                            }`}
                                          >
                                            {unit} {i + 1}
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

                      {tableId && (
                        <p className={`text-xs font-medium ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>
                          ✓ {onlyOne
                            ? `${sectionDefs[0]?.unit} ${selNum} selected`
                            : `${selSection?.charAt(0).toUpperCase() + selSection?.slice(1)} — ${sectionDefs.find(s => s.key === selSection)?.unit} ${selNum} selected`
                          }
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Delivery Address - Only for Delivery */}
                {orderType === "Delivery" && (
                  <div className="animate-fade-in space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Delivery Address *
                      </label>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isGettingLocation}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                      >
                        {isGettingLocation ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Getting location...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4" />
                            <span>Use Current Location</span>
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
                        className="flex-1 rounded-xl border border-orange-200 bg-white p-3.5 text-sm text-gray-800 shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary"
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
              <div className="mt-8 flex gap-3 border-t border-orange-100 pt-4">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                  className="h-11 flex-1 rounded-xl border border-orange-200 bg-white text-sm font-semibold text-gray-700 hover:bg-orange-50"
                >
                  Cancel
                </Button>
                <Button
                  className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary/90"
                  onClick={handleOrderSubmit}
                  disabled={!isFormValid() || loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    "Place Order"
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
