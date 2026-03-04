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
import { Link } from "react-router-dom";
import { getCurrentAddress } from "@/service/deliveryService";
import { AnimatePresence, motion } from "framer-motion";

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
  totalAmount = 0
}) {
  const [selectedOrderType, setSelectedOrderType] = useState(orderType);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const orderModes = restaurantData?.restaurant?.orderModes;

  // ✅ Get delivery charges from restaurant data (only for display)
  const deliveryCharges = Number(restaurantData?.restaurant?.deliveryCharges || 0);

  // Get cart items array
  const cartItemsArray = Object.values(cartItems);

  const orderTypeOptions = useMemo(() => {
    const baseOptions = [
      {
        value: "Eat Here",
        label: "Eat Here",
        description: "Dine in at our restaurant",
        icon: Utensils,
        color: "bg-green-500",
        modeKey: "eathere",
      },
      {
        value: "Take Away",
        label: "Take Away",
        description: "Pick up your order",
        icon: Home,
        color: "bg-blue-500",
        modeKey: "takeaway",
      },
      {
        value: "Delivery",
        label: "Delivery",
        description: "Get it delivered to you",
        icon: Truck,
        color: "bg-orange-500",
        modeKey: "delivery",
      },
    ];

    if (!orderModes || typeof orderModes !== "object") {
      return baseOptions;
    }

    return baseOptions.filter((option) => Boolean(orderModes?.[option.modeKey]));
  }, [orderModes]);

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
    if (!customerName || !customerPhone || customerPhone.length !== 10) {
      return false;
    }

    switch (orderType) {
      case "Eat Here":
        return !!tableId;
      case "Take Away":
        return true;
      case "Delivery":
        return !!address;
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
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-orange-100/90 bg-gradient-to-b from-white via-orange-50 to-orange-50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="sticky top-0 rounded-t-2xl border-b border-orange-100/80 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between gap-3">
              {/* Home Button - Only show when no order type is selected */}
              {!orderType && (
                <Link 
                  to="/"
                  onClick={() => setShowModal(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-primary transition-colors duration-200 hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </Link>
              )}
              
              {/* Back Button - Only show when order type is selected */}
              {orderType && (
                <button
                  onClick={() => {
                    setOrderType("");
                    setSelectedOrderType("");
                  }}
                  className="flex items-center gap-2 text-sm font-semibold text-primary transition-colors duration-200 hover:underline"
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
              <h3 className="text-base font-semibold text-gray-800 sm:text-lg">Choose Order Type</h3>
              {orderTypeOptions.length > 0 ? (
                orderTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOrderTypeSelect(option.value)}
                    className={`w-full rounded-xl border-2 p-3.5 transition-all duration-300 hover:scale-[1.01] ${
                      selectedOrderType === option.value
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-orange-200/80 bg-white shadow-sm hover:border-orange-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${option.color} flex h-11 w-11 items-center justify-center rounded-lg`}>
                        <option.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-800">{option.label}</div>
                        <div className="text-xs text-gray-600 sm:text-sm">{option.description}</div>
                        {/* Delivery charges info only for Delivery option */}
                        {option.value === "Delivery" && deliveryCharges > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-orange-600">
                            <IndianRupee className="w-3 h-3" />
                            <span>Delivery charges: ₹{deliveryCharges}</span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full border-2 ${
                          selectedOrderType === option.value ? "bg-primary border-primary" : "border-orange-300/80"
                        }`}
                      />
                    </div>
                  </button>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 p-4 text-sm text-gray-500">
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
                    if (e.target.value.length <= 15)
                      setCustomerName(e.target.value);
                  }}
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
                  className="w-full rounded-xl border border-orange-200 bg-white p-3.5 text-sm text-gray-800 shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary"
                />
                <p className="mt-2 text-xs text-gray-500">
                  10-digit phone number required
                </p>
              </div>

              {/* Conditional Fields Based on Order Type */}
              <div className="space-y-4">
                {/* Table Selection - Only for Eat Here */}
                {orderType === "Eat Here" && (
                  <div className="animate-fade-in">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Select Table *
                    </label>
                    <Select value={tableId} onValueChange={setTableId}>
                      <SelectTrigger
                        className="h-11 w-full rounded-xl border border-primary bg-white p-3.5 font-medium text-gray-800 shadow-sm transition-all duration-200 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary"
                      >
                        <SelectValue placeholder="Choose your table" className="text-gray-400" />
                      </SelectTrigger>

                      <SelectContent className="max-h-60 rounded-xl border border-primary bg-white shadow-xl">
                        <SelectGroup>
                          {Array.from(
                            { length: restaurantData?.restaurant?.tableNumbers || 0 }, 
                            (_, i) => (
                              <SelectItem
                                key={i + 1}
                                value={`T${i + 1}`}
                                className="cursor-pointer border-b border-orange-100 px-4 py-3 font-medium text-gray-700 transition-colors duration-150 last:border-b-0 hover:bg-primary hover:text-white focus:bg-primary focus:text-white"
                              >
                                <span className="flex items-center gap-2">
                                  Table {i + 1}
                                </span>
                              </SelectItem>
                            )
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
