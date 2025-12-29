import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Tag,
  Info,
  IndianRupee,
} from "lucide-react";

const MenuItemViewModal = ({ item, isOpen, onClose }) => {
  if (!isOpen || !item) return null;

  const isVariantPricing = item.pricingType === "variant";

  // Handle backdrop click to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop – click anywhere to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleBackdropClick}
          />

          {/* Modal Wrapper - Also clickable to close */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border-2 border-orange-100"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              {/* Close Button – fixed position */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white shadow-lg hover:bg-orange-50 transition-colors border border-orange-200"
              >
                <X size={20} className="text-orange-600" />
              </button>

              {/* LEFT – IMAGE (FIXED SIZE) */}
              <div className="w-full md:w-2/5 h-[300px] md:h-[500px] bg-orange-50">
                <img
                  src={
                    item.image?.url ||
                    "https://via.placeholder.com/600x400?text=No+Image"
                  }
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/600x400?text=No+Image";
                  }}
                />
                {/* Orange overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent"></div>
              </div>

              {/* RIGHT – DETAILS */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto relative">
                {/* Title with better spacing */}
                <div className="mb-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {item.name}
                  </h2>
                  
                  {/* Category and badges in one row */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-orange-500" />
                      <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium border border-orange-200">
                        {item.category || "Uncategorized"}
                      </span>
                    </div>
                    
                    {/* Divider */}
                    <span className="text-orange-300">|</span>
                    
                    {/* Veg/Non-Veg */}
                    <div
                      className={`px-3 py-1 text-xs font-bold text-white rounded-full ${
                        item.type === "veg"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {item.type === "veg" ? "VEG" : "NON-VEG"}
                    </div>
                    
                    {/* Availability */}
                    <div
                      className={`px-3 py-1 text-xs font-bold text-white rounded-full ${
                        item.available
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                    >
                      {item.available ? "AVAILABLE" : "UNAVAILABLE"}
                    </div>
                  </div>
                </div>

                {/* Description with better styling */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-orange-500" />
                    <h3 className="font-semibold text-orange-700 text-sm uppercase tracking-wider">
                      Description
                    </h3>
                  </div>

                  <div
                    className="
                      bg-orange-50 
                      p-4 
                      rounded-lg 
                      border 
                      border-orange-100
                      h-32
                      overflow-y-scroll
                      scrollbar-thin
                      scrollbar-thumb-orange-400
                      scrollbar-track-orange-100
                    "
                  >
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {item.description || "No description available"}
                    </p>
                  </div>
                </div>

                {/* PRICE SECTION */}
                <div>
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-orange-800">
                      Price
                    </h3>
                  </div>
                  
                  {isVariantPricing ? (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {item.variantRates?.quarter && (
                          <PriceBox
                            label="Quarter"
                            price={item.variantRates.quarter}
                            size="sm"
                          />
                        )}
                        {item.variantRates?.half && (
                          <PriceBox
                            label="Half"
                            price={item.variantRates.half}
                            size="sm"
                          />
                        )}
                        {item.variantRates?.full && (
                          <PriceBox
                            label="Full"
                            price={item.variantRates.full}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <IndianRupee size={22} className="text-orange-600" />
                      <div className="text-xl font-bold text-orange-600">
                        {item.price}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

/* PriceBox component with orange theme */
const PriceBox = ({ label, price, size = "md" }) => (
  <div className="bg-white rounded-lg p-3 text-center border-2 border-orange-200 shadow-sm hover:shadow-md transition-all hover:border-orange-300">
    <div className="text-xs text-orange-600 font-medium mb-1 uppercase tracking-wider">
      {label}
    </div>
    <div className="flex items-center justify-center gap-1">
      <IndianRupee size={size === "sm" ? 16 : 20} className="text-orange-600" />
      <div className={`font-bold text-orange-600 ${size === "sm" ? "text-xl" : "text-2xl"}`}>
        {price}
      </div>
    </div>
  </div>
);

export default MenuItemViewModal;