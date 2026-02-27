import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; 
import { getStatusBadge } from "../commonOrderFile/utils";
import { ClipboardCheck, Hourglass, X } from "lucide-react";

const StatusDropdown = ({ order, updateOrder }) => {
  const handleStatusChange = (value) => {
    // Only send status change, don't send items (items validation fails for existing orders)
    updateOrder(order._id, {
      status: value,
    });
  };

  return (
    <Select value={order.status} onValueChange={handleStatusChange}>
      <SelectTrigger
        className={`h-10 md:h-9 w-full md:w-[130px] rounded-xl border-0 px-3 text-xs font-bold uppercase shadow-sm ring-1 ring-black/5 transition-all hover:brightness-95 focus:ring-2 focus:ring-orange-200 focus:ring-offset-1 ${getStatusBadge(
          order.status
        )}`}
      >
        <span className="mx-auto">
          <SelectValue />
        </span>
      </SelectTrigger>

      <SelectContent className="min-w-[140px] rounded-xl border border-orange-200 bg-white p-1 shadow-xl">
        <SelectGroup>
          {/* Item: Pending */}
          <SelectItem
            value="pending"
            className="cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-yellow-100 hover:text-yellow-800 focus:bg-yellow-100 focus:text-yellow-800 data-[highlighted]:bg-yellow-200 data-[highlighted]:text-yellow-800"
          >
            <div className="flex items-center gap-2">
              <span><Hourglass size={16} /></span> Pending
            </div>
          </SelectItem>

          {/* Item: Completed */}
          <SelectItem
            value="completed"
            className="cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800 data-[highlighted]:bg-green-200 data-[highlighted]:text-green-800"
          >
            <div className="flex items-center gap-2">
              <span><ClipboardCheck size={16} /></span> Completed
            </div>
          </SelectItem>

          {/* Item: Cancelled */}
          <SelectItem
            value="cancelled"
            className="cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-red-100 hover:text-red-800 focus:bg-red-100 focus:text-red-800 data-[highlighted]:bg-red-200 data-[highlighted]:text-red-800"
          >
            <div className="flex items-center gap-2">
              <span><X size={16} /></span> Cancelled
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default StatusDropdown;
