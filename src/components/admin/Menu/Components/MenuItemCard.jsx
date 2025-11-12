/* eslint-disable no-unused-vars */
import React from "react";
import { motion } from "framer-motion";

const MenuItemCard = ({ item, onEdit, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 flex flex-col relative overflow-hidden"
    >
      <img
        src={
          item.image?.url ||
          "https://via.placeholder.com/300x200?text=No+Image"
        }
        alt={item.name}
        className="w-full h-48 object-cover"
      />

      {(item.type === "veg" || item.type === "non-veg") && (
        <div
          className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold text-white ${item.type === "veg" ? "bg-green-600" : "bg-red-600"
            }`}
        >
          {item.type === "veg" ? "🥗 Veg" : "🍗 Non-Veg"}
        </div>
      )}

      <div
        className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white ${item.available ? "bg-green-600" : "bg-red-600"
          }`}
      >
        {item.available ? "Available" : "Unavailable"}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
        <p className="text-sm text-gray-500 mb-2">{item.category}</p>
        <p className="text-gray-600 text-sm line-clamp-2 flex-grow">
          {item.description}
        </p>

        <div className="mt-2 min-h-[2.25rem]">
          {item.pricingType === "variant" ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
              {item.variantRates?.quarter && (
                <span className="text-lg font-bold text-gray-700">
                  Q: <span className="text-green-600">₹{item.variantRates.quarter}</span>
                </span>
              )}
              {item.variantRates?.half && (
                <span className="text-lg font-bold text-gray-700">
                  H: <span className="text-green-600">₹{item.variantRates.half}</span>
                </span>
              )}
              {item.variantRates?.full && (
                <span className="text-lg font-bold text-gray-700">
                  F: <span className="text-green-600">₹{item.variantRates.full}</span>
                </span>
              )}
            </div>
          ) : (
            <p className="text-green-600 font-bold text-lg">₹{item.price}</p>
          )}
        </div>

        <div className="mt-auto flex gap-2 pt-3">
          <button
            onClick={onEdit}
            className="flex-1 border border-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-100 transition shadow-sm"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 border border-red-300 text-red-600 py-2 rounded-lg hover:bg-red-50 transition shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuItemCard;