import React, { memo, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatusBadge } from "../commonOrderFile/utils";
import {
  ClipboardCheck,
  Hourglass,
  Timer,
  X,
  CheckCircle,
} from "lucide-react";

const StatusDropdown = memo(({ order, updateOrder }) => {
  // Safe Redux theme selection with reliable default fallbacks
  const colors = useSelector((state) => state.admin.theme?.colors || {
    primary: "#f97316",
    primaryHover: "#ea580c",
    primaryLight: "#fff7ed",
    primaryText: "#ea580c",
  });

  const normalizedStatus = String(order?.status || "").toLowerCase();
  const isCompleted = normalizedStatus === "completed";

  const handleStatusChange = useCallback(
    (value) => {
      // Safety check
      if (!order?._id || !value) return;

      // Completed/Billed orders cannot be changed from here
      if (value === "completed") return;

      // Prevent unnecessary API request
      if (value === normalizedStatus) return;

      updateOrder(order._id, {
        status: value,
      });
    },
    [order?._id, normalizedStatus, updateOrder]
  );

  if (isCompleted) {
    return (
      <div
        data-tour="orders-status-dropdown"
        aria-label="Order status completed"
        className={`inline-flex h-9 w-full min-w-[130px] items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset md:h-8 md:w-[140px] ${getStatusBadge(
          normalizedStatus
        )}`}
      >
        <ClipboardCheck size={16} />
        <span>Billed</span>
      </div>
    );
  }

  return (
    <Select
      value={normalizedStatus}
      onValueChange={handleStatusChange}
    >
      <SelectTrigger
        data-tour="orders-status-dropdown"
        aria-label={`Change order status — currently ${normalizedStatus}`}
        className={`h-9 w-full min-w-[130px] rounded-lg border px-3 text-xs font-semibold uppercase tracking-wide transition-all hover:brightness-95 focus:ring-2 focus:ring-offset-1 md:h-8 md:w-[140px] ${getStatusBadge(
          normalizedStatus
        )}`}
        style={{
          "--tw-ring-color": colors.primary,
        }}
      >
        <span className="mx-auto">
          <SelectValue />
        </span>
      </SelectTrigger>

      <SelectContent className="min-w-[130px] rounded-lg border border-[#ede8e3] bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <SelectGroup>
          {/* Item: Pending */}
          <SelectItem
            value="pending"
            className="cursor-pointer rounded-lg py-2 text-xs font-medium transition-colors bg-transparent text-yellow-700 hover:bg-yellow-100 hover:text-yellow-900 data-[highlighted]:bg-yellow-100 data-[highlighted]:text-yellow-900 data-[state=checked]:bg-yellow-200 data-[state=checked]:text-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-500/25 dark:hover:text-yellow-100 dark:data-[highlighted]:bg-yellow-500/30 dark:data-[highlighted]:text-yellow-50 dark:data-[state=checked]:bg-yellow-500/35 dark:data-[state=checked]:text-yellow-50"
          >
            <div className="flex items-center gap-2">
              <Hourglass size={16} />
              <span>Pending</span>
            </div>
          </SelectItem>

          {/* Item: Preparing */}
          <SelectItem
            value="preparing"
            className="cursor-pointer rounded-lg py-2 text-xs font-medium transition-colors bg-transparent text-teal-700 hover:bg-teal-100 hover:text-teal-900 data-[highlighted]:bg-teal-100 data-[highlighted]:text-teal-900 data-[state=checked]:bg-teal-200 data-[state=checked]:text-teal-900 dark:text-teal-300 dark:hover:bg-teal-500/25 dark:hover:text-teal-100 dark:data-[highlighted]:bg-teal-500/30 dark:data-[highlighted]:text-yellow-50 dark:data-[state=checked]:bg-teal-500/35 dark:data-[state=checked]:text-yellow-50"
          >
            <div className="flex items-center gap-2">
              <Timer size={16} />
              <span>Preparing</span>
            </div>
          </SelectItem>

          {/* Item: Ready */}
          <SelectItem
            value="ready"
            className="cursor-pointer rounded-lg py-2 text-xs font-medium transition-colors bg-transparent text-blue-700 hover:bg-blue-100 hover:text-blue-900 data-[highlighted]:bg-blue-100 data-[highlighted]:text-blue-900 data-[state=checked]:bg-blue-200 data-[state=checked]:text-blue-900 dark:text-blue-300 dark:hover:bg-blue-500/25 dark:hover:text-blue-100 dark:data-[highlighted]:bg-blue-500/30 dark:data-[highlighted]:text-blue-50 dark:data-[state=checked]:bg-blue-500/35 dark:data-[state=checked]:text-blue-50"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>Ready</span>
            </div>
          </SelectItem>

          {/* Item: Cancelled */}
          <SelectItem
            value="cancelled"
            className="cursor-pointer rounded-lg py-2 text-xs font-medium transition-colors bg-transparent text-rose-700 hover:bg-rose-100 hover:text-rose-900 data-[highlighted]:bg-rose-100 data-[highlighted]:text-rose-900 data-[state=checked]:bg-rose-200 data-[state=checked]:text-rose-900 dark:text-rose-300 dark:hover:bg-rose-500/25 dark:hover:text-rose-100 dark:data-[highlighted]:bg-rose-500/30 dark:data-[highlighted]:text-yellow-50 dark:data-[state=checked]:bg-rose-500/35 dark:data-[state=checked]:text-yellow-50"
          >
            <div className="flex items-center gap-2">
              <X size={16} />
              <span>Cancelled</span>
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
});

StatusDropdown.displayName = "StatusDropdown";

export default StatusDropdown;
