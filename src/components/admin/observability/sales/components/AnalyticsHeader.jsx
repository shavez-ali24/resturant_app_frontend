import React, { useRef, useEffect } from "react";
import { Calendar, CalendarDays, ChevronDown, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Heading from "../../../common/Heading";
import { formatFullDate } from "../utils/formatters";

export const AnalyticsHeader = ({
  timeRange,
  handleTimeRangeChange,
  showDatePicker,
  setShowDatePicker,
  isCustomRange,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  appliedFrom,
  appliedTo,
  handleClearCustomRange,
  handleResetDate,
  handleCustomApply,
  isRefreshing,
  isRefreshQueued,
  handleRefresh,
  colors,
  isDarkMode,
  timeRangeOptions = [],
}) => {
  const dropdownRef = useRef(null);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowDatePicker]);

  const card = isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white shadow-sm";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-[#78716c]";
  const divider = isDarkMode ? "border-slate-700" : "border-[#ede8e3]";

  const secondaryButtonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[var(--hover-bg)]";
  const primaryButtonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50";
  const selectTriggerClass =
    "h-10 w-full rounded-xl border px-3 text-sm font-semibold transition-all outline-none focus:ring-2 sm:w-[190px]";
  const selectContentClass =
    `z-[10050] rounded-xl border p-1 shadow-xl ${
      isDarkMode ? "border-slate-700 bg-slate-900" : "border-[#ede8e3] bg-white"
    }`;
  const selectItemClass =
    `cursor-pointer rounded-lg py-2 text-sm font-medium transition-colors ${
      isDarkMode
        ? "text-slate-200 data-[highlighted]:bg-slate-700 data-[highlighted]:text-slate-100"
        : "text-[#1c1917] data-[highlighted]:bg-[#f7f3ef] data-[highlighted]:text-[#1c1917]"
    }`;
  const inputClass =
    "h-10 w-full rounded-xl border px-3 text-sm transition-all outline-none focus:ring-2";

  const primaryBtnStyle = {
    backgroundColor: colors.primary,
    color: "#ffffff",
    borderColor: "transparent",
  };
  const secondaryBtnStyle = {
    "--hover-bg": isDarkMode ? `${colors.primary}30` : `${colors.primary}22`,
    borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
    backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
    color: isDarkMode ? colors.primary : colors.primaryText,
  };
  const selectTriggerStyle = {
    borderColor: isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3",
    backgroundColor: isDarkMode ? "rgb(30, 41, 59)" : "#ffffff",
    color: isDarkMode ? "#f1f5f9" : "#1c1917",
  };
  const inputStyle = {
    borderColor: isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3",
    backgroundColor: isDarkMode ? "rgb(30, 41, 59)" : "#ffffff",
    color: isDarkMode ? "#f1f5f9" : "#1c1917",
  };

  const getTimeRangeLabel = () => {
    if (isCustomRange && appliedFrom && appliedTo) {
      return `Custom (${formatFullDate(appliedFrom)} - ${formatFullDate(appliedTo)})`;
    }
    return timeRangeOptions.find((opt) => opt.value === timeRange)?.label || timeRange;
  };

  return (
    <div className="mb-6">
      <div className={`rounded-2xl border p-4 sm:p-5 ${card}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div data-tour="sales-heading">
            <Heading title="Top Selling Analytics" />
            <p className={`mt-1 text-xs sm:text-sm ${textSecondary}`}>
              Analyze your top selling products and categories
            </p>
          </div>

          <div data-tour="sales-date-filter" className="flex flex-col sm:flex-row gap-3">
            {/* Time Range Presets */}
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className={selectTriggerClass} style={selectTriggerStyle} aria-label="Select Time Range">
                <Calendar className="w-4 h-4 mr-2 shrink-0" style={{ color: colors.primary }} />
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                {timeRangeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className={selectItemClass}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Date Picker */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all sm:w-auto ${
                  showDatePicker || isCustomRange
                    ? ""
                    : isDarkMode
                      ? "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                      : "border-[#ede8e3] bg-white text-[#1c1917] hover:bg-[#f7f3ef] hover:border-[#d6cfc8]"
                }`}
                style={
                  showDatePicker || isCustomRange
                    ? {
                        borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                        backgroundColor: isDarkMode ? `${colors.primary}30` : colors.primaryLight,
                        color: isDarkMode ? colors.primary : colors.primaryText,
                        fontWeight: "bold",
                      }
                    : {}
                }
              >
                <CalendarDays className="w-4 h-4 shrink-0" style={{ color: colors.primary }} />
                <span>Custom Range</span>
                {isCustomRange && <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">✓</span>}
                <ChevronDown className={`w-4 h-4 shrink-0 text-current transition-transform ${showDatePicker ? "rotate-180" : ""}`} />
              </button>

              {showDatePicker && (
                <div className={`absolute right-0 top-12 z-[10050] w-full rounded-2xl border p-4 shadow-xl sm:w-80 ${
                  isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white"
                }`}>
                  <div className="space-y-4">
                    <h4 className={`font-semibold text-center border-b pb-2 ${isDarkMode ? `${textPrimary} ${divider}` : `${textPrimary} border-[#ede8e3]`}`}>
                      Select Custom Date Range
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${textSecondary}`}>From Date</label>
                        <input
                          type="date"
                          className={inputClass}
                          style={inputStyle}
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          max={toDate}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${textSecondary}`}>To Date</label>
                        <input
                          type="date"
                          className={inputClass}
                          style={inputStyle}
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          min={fromDate}
                        />
                      </div>
                    </div>
                    {isCustomRange && (
                      <div className="p-3 rounded-lg border"
                           style={{
                             backgroundColor: isDarkMode ? `${colors.primary}15` : colors.primaryLight,
                             borderColor: isDarkMode ? `${colors.primary}30` : `${colors.primary}25`,
                           }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>Custom Range Active</span>
                          <button onClick={handleClearCustomRange} className="text-xs underline" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>Clear</button>
                        </div>
                        <p className={`text-xs mt-1 ${textSecondary}`}>{formatFullDate(fromDate)} to {formatFullDate(toDate)}</p>
                      </div>
                    )}
                    <div className={`flex justify-end gap-2 pt-3 border-t ${divider}`}>
                      <button
                        onClick={() => {
                          setShowDatePicker(false);
                          if (!isCustomRange) handleResetDate();
                        }}
                        className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors ${
                          isDarkMode
                            ? "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                            : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCustomApply}
                        disabled={!fromDate || !toDate}
                        className={primaryButtonClass}
                        style={primaryBtnStyle}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              data-tour="sales-refresh"
              onClick={handleRefresh}
              disabled={isRefreshing || isRefreshQueued}
              className={secondaryButtonClass}
              style={secondaryBtnStyle}
            >
              <RefreshCw className={`w-4 h-4 shrink-0 text-current ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
