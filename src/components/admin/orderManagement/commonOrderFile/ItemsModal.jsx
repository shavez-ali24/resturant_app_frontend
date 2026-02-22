import React from "react";
import BillPage from "../bill/BillPage";

const ItemsModal = ({ order, restaurantDetails, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <BillPage 
        order={order} 
        restaurantDetails={restaurantDetails} 
        onClose={onClose} 
      />
    </div>
  );
};

export default ItemsModal;
