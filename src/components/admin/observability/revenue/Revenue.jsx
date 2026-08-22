import React, { useMemo, Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import {
  TableIcon,
  BarChartIcon,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Hooks, utils & subcomponents
import { useDarkMode } from "../sales/hooks/useDarkMode";
import { useRevenueData } from "./hooks/useRevenueData";
import { RevenueHeader } from "./components/RevenueHeader";
import { RevenueTable } from "./components/RevenueTable";
import { EmptyRevenueState } from "./components/EmptyRevenueState";
import { formatCurrency, formatFullDate, formatTableDate } from "./utils/formatters";

const RevenueChart = lazy(() =>
  import("./components/RevenueChart").then((module) => ({ default: module.RevenueChart }))
);

const timeRangeLabels = {
  "1d": "Last 24 Hours",
  "7d": "Last 7 Days",
  "15d": "Last 15 Days",
  "30d": "Last 30 Days",
  "6m": "Last 6 Months",
  "1y": "Last 1 Year",
  "all": "All Time",
  "custom": "Custom Range",
};

export default function RevenueAnalytics() {
  const colors = useSelector((state) => state.admin?.theme?.colors) || {
    primary: "#EF9F27",
    primaryText: "#7c2d12",
    primaryLight: "#fff8f5"
  };

  const isDarkMode = useDarkMode();

  const {
    timeRange,
    setTimeRange,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    appliedFrom,
    appliedTo,
    activeTab,
    setActiveTab,
    showDatePicker,
    setShowDatePicker,
    isRefreshing,
    isRefreshQueued,
    isCustomRange,
    analyticsData,
    isLoading,
    error,
    handleCustomApply,
    handleTimeRangeChange,
    handleResetDate,
    handleClearCustomRange,
    handleRefresh,
    filterDataForCustomRange,
    groupChartDataByDate,
  } = useRevenueData();

  // Process data from hook
  const totalRevenue = analyticsData?.totalRevenue || 0;
  const totalOrders = analyticsData?.totalOrders || 0;
  const rawChartData = analyticsData?.chartData || [];

  // Client-side date filter and grouping logic
  const processedChartData = useMemo(() => {
    if (timeRange === "custom" && fromDate && toDate) {
      return filterDataForCustomRange(rawChartData);
    }
    return rawChartData;
  }, [timeRange, fromDate, toDate, rawChartData, filterDataForCustomRange]);

  const chartData = useMemo(() => {
    return groupChartDataByDate(processedChartData);
  }, [processedChartData, groupChartDataByDate]);

  const tableData = useMemo(() => {
    if (!chartData.length) return [];

    return chartData
      .map((item) => ({
        ...item,
        displayDate: formatTableDate(item.date, timeRange),
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [chartData, timeRange]);

  // Display labels
  const getDisplayRangeText = () => {
    if (timeRange === "custom" && appliedFrom && appliedTo) {
      return `${new Date(appliedFrom).toLocaleDateString()} to ${new Date(appliedTo).toLocaleDateString()}`;
    }
    return timeRangeLabels[timeRange];
  };

  const card = isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white shadow-sm";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-[#78716c]";
  const divider = isDarkMode ? "border-slate-700" : "border-[#ede8e3]";

  const switcherBtnClass = (tab) =>
    `inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
      activeTab === tab
        ? "shadow-sm"
        : isDarkMode
          ? "text-slate-300 hover:text-slate-100"
          : "text-[#57534e] hover:text-[#1c1917]"
    }`;

  const switcherBtnStyle = (tab) => {
    if (activeTab === tab) {
      return {
        backgroundColor: isDarkMode ? `${colors.primary}25` : colors.primaryLight,
        borderColor: isDarkMode ? `${colors.primary}60` : `${colors.primary}33`,
        color: isDarkMode ? colors.primary : colors.primaryText,
        borderWidth: "1px",
      };
    }
    return {};
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
      {/* ── Header ── */}
      <RevenueHeader
        timeRange={timeRange}
        handleTimeRangeChange={handleTimeRangeChange}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        isCustomRange={isCustomRange}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        appliedFrom={appliedFrom}
        appliedTo={appliedTo}
        handleClearCustomRange={handleClearCustomRange}
        handleResetDate={handleResetDate}
        handleCustomApply={handleCustomApply}
        isRefreshing={isRefreshing}
        isRefreshQueued={isRefreshQueued}
        handleRefresh={handleRefresh}
        colors={colors}
        isDarkMode={isDarkMode}
      />

      {/* ── Stats Cards ── */}
      <div data-tour="revenue-cards" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Total Revenue Card */}
        <div className={`rounded-2xl border p-4 ${card}`}>
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-xl border"
              style={{
                backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                color: isDarkMode ? colors.primary : colors.primaryText,
              }}
            >
              <IndianRupee className="w-5 h-5 text-current" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${textSecondary}`}>Total Revenue</p>
              <p className={`text-2xl font-bold ${textPrimary}`}>{formatCurrency(totalRevenue)}</p>
              <div className="mt-2 flex items-center text-xs font-semibold" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>
                <TrendingUp className="w-3 h-3 mr-1" style={{ color: colors.primary }} />
                <span>From {totalOrders} orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className={`rounded-2xl border p-4 ${card}`}>
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-xl border"
              style={{
                backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                color: isDarkMode ? colors.primary : colors.primaryText,
              }}
            >
              <ShoppingBag className="w-5 h-5 text-current" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${textSecondary}`}>Total Orders</p>
              <p className={`text-2xl font-bold ${textPrimary}`}>{totalOrders.toLocaleString()}</p>
              <div className="mt-2 flex items-center text-xs font-semibold" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>
                <Clock className="w-3 h-3 mr-1" style={{ color: colors.primary }} />
                <span>{timeRangeLabels[timeRange]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Trend / Table Section ── */}
      <Tabs defaultValue="chart" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <div className={`rounded-2xl border ${card}`}>
          <div className={`border-b p-4 ${divider}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary}`}>
                  {timeRange === "1d" ? "Hourly Revenue" : "Revenue Trend"}
                </h3>
                <p className={`text-sm mt-1 ${textSecondary}`}>{getDisplayRangeText()}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className={`flex h-10 items-center gap-1 rounded-xl border p-1 ${
                  isDarkMode ? "border-slate-600 bg-slate-800" : "border-[#ede8e3] bg-[#f7f3ef]"
                }`}>
                  {["chart", "table"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={switcherBtnClass(tab)}
                      style={switcherBtnStyle(tab)}
                    >
                      {tab === "chart" ? (
                        <>
                          <BarChartIcon className="w-4 h-4 shrink-0" />
                          <span>Chart</span>
                        </>
                      ) : (
                        <>
                          <TableIcon className="w-4 h-4 shrink-0" />
                          <span>Table</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Chart View */}
            <TabsContent value="chart" className="mt-0">
              {isLoading ? (
                <div className={`h-[350px] flex flex-col items-center justify-center rounded-xl border ${
                  isDarkMode ? "border-slate-700 bg-slate-800/40" : "border-[#ede8e3] bg-[#f7f3ef]"
                }`}>
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 mb-4" style={{ borderBottomColor: colors.primary }}></div>
                  <p className={`font-medium ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>Loading revenue data...</p>
                </div>
              ) : error ? (
                <div className={`h-[350px] flex flex-col items-center justify-center rounded-xl border p-6 ${
                  isDarkMode ? "border-red-500/30 bg-red-500/10" : "border-red-200 bg-red-50"
                }`}>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <p className={`font-bold text-lg mb-2 ${textPrimary}`}>Failed to Load Data</p>
                  <p className={`text-center mb-6 ${textSecondary}`}>{error.message || "Unable to fetch revenue analytics."}</p>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all active:scale-[0.97]"
                    style={{ backgroundColor: colors.primary, color: "#ffffff", borderColor: "transparent" }}
                  >
                    <RefreshCw className={`w-4 h-4 shrink-0 text-current ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Try Again"}
                  </button>
                </div>
              ) : chartData.length > 0 ? (
                /* Lazy-loaded AreaChart */
                <Suspense fallback={<Skeleton className="h-[350px] w-full" />}>
                  <RevenueChart
                    chartData={chartData}
                    timeRange={timeRange}
                    colors={colors}
                    isDarkMode={isDarkMode}
                  />
                </Suspense>
              ) : (
                <EmptyRevenueState
                  timeRange={timeRange}
                  fromDate={fromDate}
                  toDate={toDate}
                  colors={colors}
                  isDarkMode={isDarkMode}
                  onViewAllTime={() => setTimeRange("all")}
                />
              )}
            </TabsContent>

            {/* Table View */}
            <TabsContent value="table" className="mt-0">
              <RevenueTable
                tableData={tableData}
                fromDate={fromDate}
                toDate={toDate}
                timeRange={timeRange}
                colors={colors}
                isDarkMode={isDarkMode}
                isLoading={isLoading}
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
