import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MoreVertical,
  Edit,
  Trash2,
  Tag,
  CheckCircle,
  XCircle,
} from "lucide-react";

const MenuItemCard = ({ item, onEdit, onDelete, onView }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const isVariantPricing = item.pricingType === "variant";

  const maxDescriptionLength = 80;
  const truncatedDescription = item.description
    ? item.description.length > maxDescriptionLength
      ? `${item.description.substring(0, maxDescriptionLength)}...`
      : item.description
    : "No description available";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row w-full border border-orange-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative w-full sm:w-32 h-48 sm:h-auto sm:min-h-[130px] overflow-hidden bg-gray-100">
        <img
          src={item.image?.url || "https://via.placeholder.com/300x300?text=No+Image"}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col min-w-0 relative">
        {/* Top Right */}
        <div className="absolute top-4 right-4 flex items-start gap-2">
          <div className="px-2 py-1 bg-black/70 rounded-md flex items-center gap-1">
            <Tag size={10} className="text-white" />
            <span className="text-xs text-white truncate max-w-[80px]">
              {item.category}
            </span>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border z-50"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-orange-50 flex items-center gap-3"
                >
                  <Edit size={16} /> Edit Item
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 border-t"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="pr-24">
          {/* Name + Veg/Non-Veg */}
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-5 h-5  flex items-center justify-center border ${
                item.type === "veg"
                  ? "bg-green-100 border-green-600"
                  : "bg-red-100 border-red-600"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  item.type === "veg" ? "bg-green-600" : "bg-red-600"
                }`}
              />
            </div>

            <h3 className="text-lg font-bold truncate">{item.name}</h3>
          </div>

          {/* Availability + Price */}
          <div className="flex items-center gap-3 text-sm mt-1 flex-wrap">
            {item.available ? (
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle size={14} />
                <span>Available</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 font-medium">
                <XCircle size={14} />
                <span>Unavailable</span>
              </div>
            )}

            {!isVariantPricing ? (
              <span className="font-bold text-green-700">₹{item.price}</span>
            ) : (
              <>
                {item.variantRates?.quarter && (
                  <span className="text-green-600 font-medium">
                    Q ₹{item.variantRates.quarter}
                  </span>
                )}
                {item.variantRates?.half && (
                  <span className="text-green-600 font-medium">
                    H ₹{item.variantRates.half}
                  </span>
                )}
                {item.variantRates?.full && (
                  <span className="text-green-600 font-medium">
                    F ₹{item.variantRates.full}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-1 mt-2">
            {truncatedDescription}
          </p>
        </div>

        {/* View Button */}
        <div className="flex items-center w-full mt-4">
          <div className="flex-1" />
          <button
            onClick={onView}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm whitespace-nowrap"
          >
            View
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuItemCard;
