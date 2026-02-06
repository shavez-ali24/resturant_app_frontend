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
        className={`h-8 w-[130px] rounded-lg border-0 px-3 text-xs font-bold uppercase shadow-sm ring-1 ring-black/5 transition-all hover:brightness-95 focus:ring-2 focus:ring-offset-1 ${getStatusBadge(
          order.status
        )}`}
      >
        <span className="mx-auto">
          <SelectValue />
        </span>
      </SelectTrigger>

      <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl p-1 min-w-[140px]">
        <SelectGroup>
          {/* Item: Pending */}
          <SelectItem
            value="pending"
            className="cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 focus:bg-yellow-50 focus:text-yellow-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span><Hourglass size={16} /></span> Pending
            </div>
          </SelectItem>

          {/* Item: Completed */}
          <SelectItem
            value="completed"
            className="cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 focus:bg-green-50 focus:text-green-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span><ClipboardCheck size={16} /></span> Completed
            </div>
          </SelectItem>

          {/* Item: Cancelled */}
          <SelectItem
            value="cancelled"
            className="cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 transition-colors"
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