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
  const getStatusItemClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-transparent text-yellow-700 hover:bg-yellow-100 hover:text-yellow-900 data-[highlighted]:bg-yellow-100 data-[highlighted]:text-yellow-900 data-[state=checked]:bg-yellow-200 data-[state=checked]:text-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-500/25 dark:hover:text-yellow-100 dark:data-[highlighted]:bg-yellow-500/30 dark:data-[highlighted]:text-yellow-50 dark:data-[state=checked]:bg-yellow-500/35 dark:data-[state=checked]:text-yellow-50";
      case "completed":
        return "bg-transparent text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 data-[highlighted]:bg-emerald-100 data-[highlighted]:text-emerald-900 data-[state=checked]:bg-emerald-200 data-[state=checked]:text-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-500/25 dark:hover:text-emerald-100 dark:data-[highlighted]:bg-emerald-500/30 dark:data-[highlighted]:text-emerald-50 dark:data-[state=checked]:bg-emerald-500/35 dark:data-[state=checked]:text-emerald-50";
      case "cancelled":
        return "bg-transparent text-rose-700 hover:bg-rose-100 hover:text-rose-900 data-[highlighted]:bg-rose-100 data-[highlighted]:text-rose-900 data-[state=checked]:bg-rose-200 data-[state=checked]:text-rose-900 dark:text-rose-300 dark:hover:bg-rose-500/25 dark:hover:text-rose-100 dark:data-[highlighted]:bg-rose-500/30 dark:data-[highlighted]:text-rose-50 dark:data-[state=checked]:bg-rose-500/35 dark:data-[state=checked]:text-rose-50";
      default:
        return "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 data-[state=checked]:bg-slate-200 data-[state=checked]:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100 dark:data-[highlighted]:bg-slate-700/80 dark:data-[highlighted]:text-slate-100 dark:data-[state=checked]:bg-slate-700/90 dark:data-[state=checked]:text-slate-100";
    }
  };

  const handleStatusChange = (value) => {
    // Only send status change, don't send items (items validation fails for existing orders)
    updateOrder(order._id, {
      status: value,
    });
  };

  return (
    <Select value={order.status} onValueChange={handleStatusChange}>
      <SelectTrigger
        className={`h-10 w-full rounded-xl border border-transparent px-3 text-xs font-bold uppercase shadow-sm ring-1 ring-black/5 transition-all hover:brightness-95 focus:ring-2 focus:ring-orange-200 focus:ring-offset-1 md:h-9 md:w-[130px] ${getStatusBadge(
          order.status
        )}`}
      >
        <span className="mx-auto">
          <SelectValue />
        </span>
      </SelectTrigger>

      <SelectContent className="min-w-[140px] rounded-xl border border-orange-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-950">
        <SelectGroup>
          {/* Item: Pending */}
          <SelectItem
            value="pending"
            className={`cursor-pointer rounded-lg py-2 text-xs font-medium transition-colors ${getStatusItemClass("pending")}`}
          >
            <div className="flex items-center gap-2">
              <span><Hourglass size={16} /></span> Pending
            </div>
          </SelectItem>

          {/* Item: Completed */}
          <SelectItem
            value="completed"
            className={`cursor-pointer rounded-lg py-2 text-xs font-medium transition-colors ${getStatusItemClass("completed")}`}
          >
            <div className="flex items-center gap-2">
              <span><ClipboardCheck size={16} /></span> Completed
            </div>
          </SelectItem>

          {/* Item: Cancelled */}
          <SelectItem
            value="cancelled"
            className={`cursor-pointer rounded-lg py-2 text-xs font-medium transition-colors ${getStatusItemClass("cancelled")}`}
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
