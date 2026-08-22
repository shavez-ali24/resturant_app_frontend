import React, { useMemo, Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import {
  TrendingUp,
  Package,
  Tag,
  CalendarDays,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Subcomponents, hooks & utils
import { useDarkMode } from "./hooks/useDarkMode";
import { useAnalyticsData } from "./hooks/useAnalyticsData";
import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { AnalyticsTable } from "./components/AnalyticsTable";
import { EmptyAnalyticsState } from "./components/EmptyAnalyticsState";
import { formatFullDate } from "./utils/formatters";
import { getChartData, getAggregatedData, getSortedTableData } from "./utils/analyticsTransformers";

const AnalyticsCharts = lazy(() =>
  import("./components/AnalyticsCharts").then((module) => ({ default: module.AnalyticsCharts }))
);

const timeRangeOptions = [
  { value: "1d", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "15d", label: "Last 15 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "6m", label: "Last 6 Months" },
  { value: "1y", label: "Last 1 Year" },
  { value: "all", label: "All Time" },
];

export default function TopSellingAnalytics() {
  const colors = useSelector((state) => state.admin?.theme?.colors) || {
    primary: "#EF9F27",
    primaryText: "#7c2d12",
    primaryLight: "#fff8f5"
  };
  
  const isDarkMode = useDarkMode();
  
  const {
    activeTab,
    setActiveTab,
    timeRange,
    showDatePicker,
    setShowDatePicker,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    isCustomRange,
    appliedFrom,
    appliedTo,
    isRefreshing,
    isRefreshQueued,
    handleCustomApply,
    handleTimeRangeChange,
    handleResetDate,
    handleClearCustomRange,
    handleRefresh,
    activeLoading,
    activeError,
    activeData,
    isProductsTab,
  } = useAnalyticsData();

  // Orange theme colors list for charts
  const themeColorsList = useMemo(() => {
    return [
      colors.primary,
      `${colors.primary}dd`,
      `${colors.primary}bb`,
      `${colors.primary}99`,
      `${colors.primary}77`,
      `${colors.primary}55`,
      `${colors.primary}33`,
      '#f59e0b', '#d97706', '#b45309',
    ];
  }, [colors.primary]);

  // Formatted chart and table data
  const chartData = useMemo(() => {
    return getChartData(activeData, isProductsTab);
  }, [activeData, isProductsTab]);

  const aggregatedData = useMemo(() => {
    return getAggregatedData(chartData);
  }, [chartData]);

  const sortedTableData = useMemo(() => {
    return getSortedTableData(chartData);
  }, [chartData]);

  const formattedPeriod = useMemo(() => {
    if (!activeData) return { from: "N/A", to: "N/A", totalDays: 0 };
    const data = activeData.data || activeData;
    return {
      from: data.from ? formatFullDate(data.from) : "N/A",
      to: data.to ? formatFullDate(data.to) : "N/A",
      totalDays: data.totalDays || 0,
    };
  }, [activeData]);

  // Get active time range label
  const getTimeRangeLabel = () => {
    if (isCustomRange && appliedFrom && appliedTo) {
      return `Custom (${formatFullDate(appliedFrom)} - ${formatFullDate(appliedTo)})`;
    }
    return timeRangeOptions.find((opt) => opt.value === timeRange)?.label || timeRange;
  };

  // Loading skeleton state
  if (activeLoading) {
    return (
      <div className={`min-h-full p-4 sm:p-6 ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-12 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Error messaging and alert component
  const hasError = !!activeError;
  const errorMessage =
    activeError?.data?.message ||
    activeError?.error ||
    activeError?.message ||
    "Please try refreshing the page";

  const card = isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white shadow-sm";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-[#78716c]";
  const divider = isDarkMode ? "border-slate-700" : "border-[#ede8e3]";

  return (
    <div className={`min-h-full p-4 sm:p-6 ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
      {/* ── Header & Range Picker ── */}
      <AnalyticsHeader
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
        timeRangeOptions={timeRangeOptions}
      />

      {/* ── Error Banner ── */}
      {hasError && (
        <div className={`mb-6 rounded-xl border p-4 ${isDarkMode ? "border-red-500/30 bg-red-500/10" : "border-red-200 bg-red-50"}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className={`font-medium mb-1 ${isDarkMode ? "text-red-400" : "text-red-700"}`}>Error loading analytics data</p>
              <p className={`text-sm ${isDarkMode ? "text-red-400/80" : "text-red-600"}`}>{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Period & Range Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
              <CalendarDays className="w-5 h-5 text-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium mb-1 ${textSecondary}`}>
                {isProductsTab ? "Products Analysis Period" : "Categories Analysis Period"}
              </p>
              <p className={`text-2xl font-bold ${textPrimary}`}>{formattedPeriod.totalDays} Days</p>
              <div className="mt-2 flex items-center text-xs font-semibold" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>
                <Clock className="w-3 h-3 mr-1" style={{ color: colors.primary }} />
                <span className="truncate">
                  {formattedPeriod.from} to {formattedPeriod.to}
                </span>
              </div>
            </div>
          </div>
        </div>

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
              <TrendingUp className="w-5 h-5 text-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium mb-1 ${textSecondary}`}>Selected Time Range</p>
              <p className={`text-2xl font-bold ${textPrimary}`}>{getTimeRangeLabel()}</p>
              <div className="mt-2 flex items-center text-xs font-semibold" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>
                <Package className="w-3 h-3 mr-1" style={{ color: colors.primary }} />
                <span>{chartData.length} data points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Data View Cards ── */}
      <div data-tour="sales-chart" className={`rounded-2xl border mb-6 ${card}`}>
        <div className={`border-b p-4 ${divider}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary}`}>
                {isProductsTab ? "Daily Top Selling Products" : "Daily Top Selling Categories"}
              </h3>
              <p className={`text-sm mt-1 ${textSecondary}`}>{getTimeRangeLabel()}</p>
            </div>
            <div className={`flex h-10 items-center gap-1 rounded-xl border p-1 ${
              isDarkMode ? "border-slate-600 bg-slate-800" : "border-[#ede8e3] bg-[#f7f3ef]"
            }`}>
              {["products", "categories"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? "shadow-sm"
                      : isDarkMode
                        ? "text-slate-300 hover:text-slate-100"
                        : "text-[#57534e] hover:text-[#1c1917]"
                  }`}
                  style={
                    activeTab === tab
                      ? {
                          backgroundColor: isDarkMode ? `${colors.primary}25` : colors.primaryLight,
                          borderColor: isDarkMode ? `${colors.primary}60` : `${colors.primary}33`,
                          color: isDarkMode ? colors.primary : colors.primaryText,
                          borderWidth: "1px",
                        }
                      : {}
                  }
                >
                  {tab === "products" ? (
                    <>
                      <Package className="w-4 h-4 shrink-0" />
                      <span>Products</span>
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4 shrink-0" />
                      <span>Categories</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          {chartData.length > 0 ? (
            <div className="space-y-6">
              {/* Reusable Charts Component */}
              <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <AnalyticsCharts
                  chartData={chartData}
                  aggregatedData={aggregatedData}
                  type={activeTab}
                  colors={colors}
                  themeColorsList={themeColorsList}
                  isDarkMode={isDarkMode}
                />
              </Suspense>

              {/* Reusable Ranking List Table Component */}
              <AnalyticsTable
                title={isProductsTab ? "Daily Top Selling Products" : "Daily Top Selling Categories"}
                subtitle={
                  isProductsTab
                    ? "Showing top products sorted by quantity sold"
                    : "Showing top categories sorted by quantity sold"
                }
                nameHeader={isProductsTab ? "Top Product" : "Top Category"}
                data={sortedTableData}
                colors={colors}
                isDarkMode={isDarkMode}
              />
            </div>
          ) : (
            /* Reusable Empty State Component */
            <EmptyAnalyticsState
              title={isProductsTab ? "No Product Data Found" : "No Category Data Found"}
              icon={isProductsTab ? Package : Tag}
              colors={colors}
              isDarkMode={isDarkMode}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
}
