import React from "react";
import { Pizza, X } from "lucide-react";

const ModalHeader = ({ onClose }) => {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-[#ede8e3] pb-4 dark:border-slate-700">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500">
        <Pizza size={18} className="text-white" />
      </div>
      <div>
        <h2 className="text-base font-bold text-[#1c1917] dark:text-slate-100">Add New Item</h2>
        <p className="text-xs text-[#a8a29e] dark:text-slate-500">Fill in the details below.</p>
      </div>
    </div>
  );
};

export default ModalHeader;
