import React from "react";
import age from "../bill/BillPage";

const ItemsModal = ({ order, restaurantDetails, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <age 
        order={order} 
        restaurantDetails={restaurantDetails} 
        onClose={onClose} 
      />
    </div>
  );
};

export default ItemsModal;
