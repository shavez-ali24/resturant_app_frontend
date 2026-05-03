// src/components/analytics/TopSellingAnalytics.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Package, 
  Tag, 
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  RefreshCw,
  CalendarDays,
  Clock,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { 
  useGetTopSellingProductsQuery,
  useGetTopSellingCategoriesQuery 
} from "@/redux/adminRedux/adminAPI";
import Heading from "../../common/Heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotify } from "../../common/NotificationModal";
import { useAdminTour } from "../../../../hooks/useAdminTour";
import { TOUR_KEYS, getSalesSteps } from "../../../../utils/adminTour";

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

const formatDate = (dateString) => {
  try {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateString;
  }
};

const formatFullDate = (dateString) => {
  try {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return dateString;
  }
};

const renderDistributionLabel = (
  { cx, cy, midAngle, outerRadius, percent, name },
  minPercent = 0.05
) => {
  if (percent < minPercent) return null;

  const radian = Math.PI / 180;
  const radius = outerRadius + 12;
  const x = cx + radius * Math.cos(-midAngle * radian);
  const y = cy + radius * Math.sin(-midAngle * radian);
  const textAnchor = x > cx ? "start" : "end";
  const labelText = `${name}: ${Math.round(percent * 100)}%`;

  return (
    <text
      x={x}
      y={y}
      fill="#fb923c"
      textAnchor={textAnchor}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {labelText}
    </text>
  );
};

const timeRangeOptions = [
  { value: "1d", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "15d", label: "Last 15 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "6m", label: "Last 6 Months" },
  { value: "1y", label: "Last 1 Year" },
  { value: "all", label: "All Time" },
];

// Orange theme colors
const ORANGE_COLORS = [
  '#f97316', '#fb923c', '#fdba74', '#fed7aa',
  '#fbbf24', '#f59e0b', '#d97706', '#b45309',
  '#92400e', '#78350f', '#451a03', '#7c2d12'
];

const analyticsTabsListClass =
  "h-12 rounded-2xl border border-orange-200/90 bg-slate-100 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_-18px_rgba(15,23,42,0.45)] dark:border-slate-600 dark:bg-slate-900 dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.2),0_10px_24px_-18px_rgba(2,6,23,0.9)]";
const analyticsTabsTriggerClass =
  "rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-white hover:text-slate-900 data-[state=active]:!bg-orange-500 data-[state=active]:!text-white data-[state=active]:shadow-[0_8px_16px_rgba(15,23,42,0.28)] dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:data-[state=active]:!bg-orange-500 dark:data-[state=active]:!text-white dark:data-[state=active]:ring-1 dark:data-[state=active]:ring-orange-300/60 dark:data-[state=active]:shadow-[0_10px_20px_-12px_rgba(249,115,22,0.55)] [&_svg]:text-current";

export default function TopSellingAnalytics() {
  const isDarkMode = localStorage.getItem("admin-theme") === "dark";
  useAdminTour(TOUR_KEYS.sales, getSalesSteps, isDarkMode, 700);
  const [activeTab, setActiveTab] = useState("products");
  const [timeRange, setTimeRange] = useState("7d");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshQueued, setIsRefreshQueued] = useState(false);
  const notify = useNotify();
  
  const dropdownRef = useRef(null);
  const refreshDebounceRef = useRef(null);
  const isRefreshingRef = useRef(false);

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
  }, []);

  useEffect(() => {
    return () => {
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
      }
    };
  }, []);

  // Set default dates when opening date picker
  useEffect(() => {
    if (showDatePicker && (!fromDate || !toDate)) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      setFromDate(startDate.toISOString().split('T')[0]);
      setToDate(endDate.toISOString().split('T')[0]);
    }
  }, [showDatePicker, fromDate, toDate]);

  // Fetch data using RTK Query - pass custom dates when isCustomRange is true
  const appliedFrom = appliedFromDate || fromDate;
  const appliedTo = appliedToDate || toDate;

  const isProductsTab = activeTab === "products";
  const isCategoriesTab = activeTab === "categories";

  const { 
    data: productsResponse, 
    isLoading: productsLoading, 
    error: productsError,
    refetch: refetchProducts 
  } = useGetTopSellingProductsQuery({ 
    range: isCustomRange ? "custom" : timeRange,
    ...(isCustomRange && { from: appliedFrom, to: appliedTo })
  }, {
    skip: !isProductsTab
  });
  
  const { 
    data: categoriesResponse, 
    isLoading: categoriesLoading, 
    error: categoriesError,
    refetch: refetchCategories 
  } = useGetTopSellingCategoriesQuery({ 
    range: isCustomRange ? "custom" : timeRange,
    ...(isCustomRange && { from: appliedFrom, to: appliedTo })
  }, {
    skip: !isCategoriesTab
  });

  // Get time range label
  const getTimeRangeLabel = () => {
    if (isCustomRange && appliedFrom && appliedTo) {
      return `Custom (${formatFullDate(appliedFrom)} - ${formatFullDate(appliedTo)})`;
    }
    return timeRangeOptions.find(opt => opt.value === timeRange)?.label || timeRange;
  };

  // Handle custom date apply
  const handleCustomApply = () => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      if (from > to) {
        alert("From date cannot be after To date");
        return;
      }
      
      setAppliedFromDate(fromDate);
      setAppliedToDate(toDate);
      setIsCustomRange(true);
      setShowDatePicker(false);
      setTimeout(() => {
        if (isProductsTab) {
          refetchProducts();
        } else if (isCategoriesTab) {
          refetchCategories();
        }
      }, 0);
      // Don't reset timeRange dropdown - let it show the last selected preset
    }
  };

  // Handle preset time range selection
  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    setIsCustomRange(false);
    setAppliedFromDate("");
    setAppliedToDate("");
    setShowDatePicker(false);
  };

  // Reset date to default
  const handleResetDate = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setFromDate(startDate.toISOString().split('T')[0]);
    setToDate(endDate.toISOString().split('T')[0]);
  };

  // Clear custom range
  const handleClearCustomRange = () => {
    setIsCustomRange(false);
    setAppliedFromDate("");
    setAppliedToDate("");
    setTimeRange("7d"); // Reset to default
  };

  const getRefreshErrorMessage = (err) =>
    err?.data?.message || err?.error || err?.message || "Unable to refresh sales analytics.";

  const runRefresh = async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      const result = isProductsTab
        ? await refetchProducts()
        : await refetchCategories();

      if (result?.error) {
        notify(getRefreshErrorMessage(result?.error), "error");
        return;
      }

      notify("Sales analytics refreshed successfully.", "success");
    } catch (err) {
      notify(getRefreshErrorMessage(err), "error");
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (isRefreshingRef.current) return;
    if (refreshDebounceRef.current) {
      clearTimeout(refreshDebounceRef.current);
    }
    setIsRefreshQueued(true);
    refreshDebounceRef.current = setTimeout(() => {
      refreshDebounceRef.current = null;
      setIsRefreshQueued(false);
      runRefresh();
    }, 500);
  };

  const secondaryButtonClass =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-500 bg-orange-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-600 hover:border-orange-600 disabled:cursor-not-allowed disabled:opacity-60";
  const primaryButtonClass =
    "inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50";
  const selectTriggerClass =
    "h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition-all outline-none hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 sm:w-[190px] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-400/30";
  const selectContentClass = "z-[10050] rounded-xl border border-orange-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-950";
  const selectItemClass =
    "cursor-pointer rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:data-[highlighted]:bg-slate-800 dark:data-[highlighted]:text-orange-200";
  const inputClass =
    "h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm text-gray-700 shadow-sm transition-all outline-none hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-400/30";

  // Memoized data transformations
  const productsData = useMemo(() => {
    if (!productsResponse) return null;
    
    const data = productsResponse.data || productsResponse;
    
    return {
      from: data.from ? formatFullDate(data.from) : 'N/A',
      to: data.to ? formatFullDate(data.to) : 'N/A',
      totalDays: data.totalDays || 0,
      chartData: Array.isArray(data.chartData) ? data.chartData : [],
      error: data.error
    };
  }, [productsResponse]);

  const categoriesData = useMemo(() => {
    if (!categoriesResponse) return null;
    
    const data = categoriesResponse.data || categoriesResponse;
    
    return {
      from: data.from ? formatFullDate(data.from) : 'N/A',
      to: data.to ? formatFullDate(data.to) : 'N/A',
      totalDays: data.totalDays || 0,
      chartData: Array.isArray(data.chartData) ? data.chartData : [],
      error: data.error
    };
  }, [categoriesResponse]);

  // Get formatted chart data for products
  const getProductsChartData = useMemo(() => {
    if (!productsData?.chartData || productsData.chartData.length === 0) return [];
    
    return productsData.chartData.map(item => ({
      date: formatDate(item.date),
      fullDate: item.date,
      product: item.topProduct || "Unknown Product",
      quantity: item.totalQuantity || 0,
      revenue: item.totalSales || 0
    }));
  }, [productsData]);

  // Get formatted chart data for categories
  const getCategoriesChartData = useMemo(() => {
    if (!categoriesData?.chartData || categoriesData.chartData.length === 0) return [];
    
    return categoriesData.chartData.map(item => ({
      date: formatDate(item.date),
      fullDate: item.date,
      category: item.topCategory || "Unknown Category",
      quantity: item.totalQuantity || 0,
      revenue: item.totalSales || 0
    }));
  }, [categoriesData]);

  // Get aggregated products data for pie chart
  const getAggregatedProducts = useMemo(() => {
    if (getProductsChartData.length === 0) return [];
    
    const aggregated = {};
    getProductsChartData.forEach(item => {
      const productName = item.product;
      if (!aggregated[productName]) {
        aggregated[productName] = {
          name: productName,
          revenue: 0,
          quantity: 0,
          days: 0
        };
      }
      aggregated[productName].revenue += item.revenue;
      aggregated[productName].quantity += item.quantity;
      aggregated[productName].days += 1;
    });
    
    return Object.values(aggregated)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [getProductsChartData]);

  // Get aggregated categories data for pie chart
  const getAggregatedCategories = useMemo(() => {
    if (getCategoriesChartData.length === 0) return [];
    
    const aggregated = {};
    getCategoriesChartData.forEach(item => {
      const categoryName = item.category;
      if (!aggregated[categoryName]) {
        aggregated[categoryName] = {
          name: categoryName,
          revenue: 0,
          quantity: 0,
          days: 0
        };
      }
      aggregated[categoryName].revenue += item.revenue;
      aggregated[categoryName].quantity += item.quantity;
      aggregated[categoryName].days += 1;
    });
    
    return Object.values(aggregated)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [getCategoriesChartData]);

  // Get sorted products data for table (top-wise)
  const getSortedProductsTableData = useMemo(() => {
    if (getProductsChartData.length === 0) return [];
    
    return [...getProductsChartData]
      .sort((a, b) => b.revenue - a.revenue);
  }, [getProductsChartData]);

  // Get sorted categories data for table (top-wise)
  const getSortedCategoriesTableData = useMemo(() => {
    if (getCategoriesChartData.length === 0) return [];
    
    return [...getCategoriesChartData]
      .sort((a, b) => b.revenue - a.revenue);
  }, [getCategoriesChartData]);

  // Loading skeleton
  if (productsLoading || categoriesLoading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30 p-4 dark:bg-none dark:bg-slate-950 sm:p-6">
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

  // Error state
  const activeError = isProductsTab
    ? (productsError || productsData?.error)
    : (categoriesError || categoriesData?.error);
  const hasError = !!activeError;
  const errorMessage =
    activeError?.data?.message ||
    activeError?.error ||
    activeError?.message ||
    "Please try refreshing the page";

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30 p-4 dark:bg-none dark:bg-slate-950 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-none sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div data-tour="sales-heading">
              <Heading title="Top Selling Analytics" />
              <p className="text-gray-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
                Analyze your top selling products and categories
              </p>
            </div>
            
            <div data-tour="sales-date-filter" className="flex flex-col sm:flex-row gap-3">
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger className={selectTriggerClass}>
                  <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {timeRangeOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className={selectItemClass}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Date Picker Button */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 sm:w-auto
                    ${showDatePicker || isCustomRange
                      ? 'border-orange-300 bg-orange-100 text-orange-700 shadow-inner' 
                      : 'border-orange-200 bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Custom Range</span>
                  {isCustomRange && (
                    <span className="ml-1 text-xs bg-white text-orange-600 px-2 py-0.5 rounded-full">
                      ✓
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
                </button>
                
                {showDatePicker && (
                  <div className="absolute right-0 top-12 z-[10050] w-full rounded-2xl border border-orange-200 bg-white p-4 shadow-xl sm:w-80 dark:border-slate-700 dark:bg-slate-900">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 dark:text-slate-100 text-center border-b border-orange-100 dark:border-slate-700 pb-2">Select Custom Date Range</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">From Date</label>
                          <input 
                            type="date" 
                            className={inputClass}
                            value={fromDate} 
                            onChange={e => setFromDate(e.target.value)} 
                            max={toDate}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">To Date</label>
                          <input 
                            type="date" 
                            className={inputClass}
                            value={toDate} 
                            onChange={e => setToDate(e.target.value)} 
                            min={fromDate}
                          />
                        </div>
                      </div>
                      
                      {isCustomRange && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Custom Range Active</span>
                            <button 
                              onClick={handleClearCustomRange}
                              className="text-xs text-orange-600 hover:text-orange-800 underline dark:text-orange-400 dark:hover:text-orange-300"
                            >
                              Clear
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                            {formatFullDate(fromDate)} to {formatFullDate(toDate)}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-end items-center pt-3 border-t border-orange-100 dark:border-slate-700">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setShowDatePicker(false);
                              if (!isCustomRange) {
                                handleResetDate();
                              }
                            }} 
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>

                          <button 
                            onClick={handleCustomApply} 
                            disabled={!fromDate || !toDate}
                            className={primaryButtonClass}
                          >
                            Apply
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              <button
                data-tour="sales-refresh"
                onClick={handleRefresh}
                disabled={isRefreshing || isRefreshQueued}
                className={secondaryButtonClass}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {hasError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium mb-1">
                Error loading analytics data
              </p>
              <p className="text-red-600 text-sm">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Total Days Card */}
        <Card className="border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl">
                <CalendarDays className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {activeTab === "products" ? "Products Analysis Period" : "Categories Analysis Period"}
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {activeTab === "products" 
                    ? (productsData?.totalDays || 0) 
                    : (categoriesData?.totalDays || 0)} Days
                </p>
                <div className="mt-2 flex items-center text-xs text-orange-600">
                  <Clock className="w-3 h-3 mr-1" />
                  <span className="truncate">
                    {activeTab === "products" 
                      ? `${productsData?.from || 'N/A'} to ${productsData?.to || 'N/A'}`
                      : `${categoriesData?.from || 'N/A'} to ${categoriesData?.to || 'N/A'}`
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Range Card */}
        <Card className="border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Selected Time Range</p>
                <p className="text-2xl font-bold text-gray-800">
                  {getTimeRangeLabel()}
                </p>
                <div className="mt-2 flex items-center text-xs text-amber-600">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>
                    {activeTab === "products" 
                      ? `${getProductsChartData.length} data points`
                      : `${getCategoriesChartData.length} data points`
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <Card data-tour="sales-chart" className="border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
          <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50/70 to-white p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {activeTab === "products" ? "Daily Top Selling Products" : "Daily Top Selling Categories"}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {getTimeRangeLabel()}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <TabsList className={analyticsTabsListClass}>
                  <TabsTrigger 
                    value="products" 
                    className={analyticsTabsTriggerClass}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Products
                  </TabsTrigger>
                  <TabsTrigger 
                    value="categories" 
                    className={analyticsTabsTriggerClass}
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    Categories
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {/* Products Tab */}
            <TabsContent value="products" className="mt-0">
              {getProductsChartData.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Revenue Trend */}
      <Card className="border border-orange-100">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
      <BarChart3 className="w-4 h-4 text-orange-600" />
      Daily Top Product Sales
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={getProductsChartData.slice(0, 20)}
          margin={{ top: 60, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" strokeOpacity={0.5} />
          <XAxis 
            dataKey="date" 
            angle={-45}
            textAnchor="end"
            height={60}
            fontSize={11}
            tick={{ fill: '#92400e' }}
          />
          <YAxis 
            tickFormatter={(value) => value.toLocaleString()}
            fontSize={11}
            tick={{ fill: '#92400e' }}
            label={{ 
              // value: 'Sales', 
              angle: -90, 
              position: 'insideLeft',
              offset: 10,
              style: { fill: '#92400e', fontSize: 12 }
            }}
          />
          <Tooltip 
            formatter={(value) => value.toLocaleString()} // सिर्फ value return करें
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return `Product: ${payload[0].payload.product}`;
              }
              return label;
            }}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #fed7aa',
              borderRadius: '8px'
            }}
          />
          <Legend content={() => null} />
          <Bar 
            dataKey="quantity"
            name=""
            fill="#f97316"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>

                    {/* Top Products Distribution */}
                    <Card className="border border-orange-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-orange-600" />
                          Top Products Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 18, right: 40, left: 40, bottom: 18 }}>
                              <Pie
                                data={getAggregatedProducts}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(props) => renderDistributionLabel(props, 0.06)}
                                outerRadius={72}
                                fill="#f97316"
                                dataKey="revenue"
                              >
                                {getAggregatedProducts.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={ORANGE_COLORS[index % ORANGE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value) => [formatCurrency(value), 'Revenue']}
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid #fed7aa',
                                  borderRadius: '8px'
                                }}
                              />
                              {/* <Legend 
                                formatter={(value, entry, index) => {
                                  const item = getAggregatedProducts[index];
                                  return `${value} (${formatCurrency(item?.revenue || 0)})`;
                                }}
                              /> */}
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Daily Top Products Table - SORTED BY REVENUE */}
                  <Card className="border border-orange-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        Daily Top Selling Products (Sorted by Revenue)
                      </CardTitle>
                      <p className="text-xs text-gray-500">
                        Showing top products sorted by highest revenue
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-orange-50">
                            <tr>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-orange-200">
                                Rank
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-orange-200">
                                Date
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-orange-200">
                                Top Product
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-orange-200">
                                Quantity Sold
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Revenue
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-orange-100">
                            {getSortedProductsTableData.map((item, index) => (
                              <tr key={index} className="hover:bg-orange-50/30">
                                <td className="py-3 px-4 border-r border-orange-100">
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold
                                    ${index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300 dark:from-yellow-200 dark:to-yellow-300 dark:text-yellow-900 dark:border-yellow-400' :
                                      index === 1 ? 'bg-[linear-gradient(90deg,#f3f4f6,#e5e7eb)] text-[#374151] border border-[#d1d5db] dark:bg-[linear-gradient(90deg,#cbd5e1,#94a3b8)] dark:text-[#0f172a] dark:border-[#94a3b8]' :
                                      index === 2 ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-amber-800 border border-amber-300 dark:from-amber-200 dark:to-orange-200 dark:text-amber-900 dark:border-amber-400' :
                                      'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200'
                                    }`}>
                                    #{index + 1}
                                  </span>
                                </td>
                                <td className="py-3 px-4 border-r border-orange-100">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                                    <span className="font-medium text-gray-800">
                                      {item.date}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 border-r border-orange-100">
                                  <span className="font-medium text-gray-800">
                                    {item.product}
                                  </span>
                                </td>
                                <td className="py-3 px-4 border-r border-orange-100">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200">
                                    {item.quantity.toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-bold text-orange-700">
                                    {formatCurrency(item.revenue)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center rounded-xl border border-orange-200 bg-orange-50/40 p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <Package className="h-6 w-6" />
                  </div>
                  <p className="text-gray-800 font-bold text-lg mb-2">No Product Data Found</p>
                  <p className="text-gray-600 text-center mb-4">
                    No completed orders found for the selected time period.
                  </p>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isRefreshQueued}
                    className={secondaryButtonClass}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Refresh Data"}
                  </button>
                </div>
              )}
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="mt-0">
              {getCategoriesChartData.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Category Revenue */}
                    <Card className="border border-orange-100">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
      <BarChart3 className="w-4 h-4 text-orange-600" />
      Daily Top Category Performance
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={getCategoriesChartData.slice(0, 20)}
          margin={{  top: 60, right: 30, left: 10, bottom: 10  }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" strokeOpacity={0.5} />
          <XAxis 
            dataKey="date" 
            angle={-45}
            textAnchor="end"
            height={60}
            fontSize={11}
            tick={{ fill: '#92400e' }}
          />
          <YAxis 
            tickFormatter={formatNumber}
            fontSize={11}
            tick={{ fill: '#92400e' }}
          />
          <Tooltip 
            formatter={(value) => formatNumber(value)}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return `Category: ${payload[0].payload.category}`;
              }
              return label;
            }}
            labelStyle={{ color: '#92400e', fontWeight: 'bold' }}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #fed7aa',
              borderRadius: '8px'
            }}
          />
          {/* Legend को हटा दें अगर नहीं चाहिए */}
          <Bar 
            dataKey="quantity" // quantity दिखाएं
            fill="#f97316"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>

                    {/* Categories Distribution */}
                    <Card className="border border-orange-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-orange-600" />
                          Top Categories Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getAggregatedCategories}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(props) => renderDistributionLabel(props, 0.05)}
                                outerRadius={80}
                                fill="#f97316"
                                dataKey="revenue"
                              >
                                {getAggregatedCategories.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={ORANGE_COLORS[index % ORANGE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value) => [formatCurrency(value), 'Revenue']}
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid #fed7aa',
                                  borderRadius: '8px'
                                }}
                              />
                              {/* <Legend 
                                formatter={(value, entry, index) => {
                                  const item = getAggregatedCategories[index];
                                  return `${value} (${formatCurrency(item?.revenue || 0)})`;
                                }}
                              /> */}
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Daily Top Categories Table - SORTED BY REVENUE */}
                  <Card className="border border-orange-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        Daily Top Selling Categories (Sorted by Revenue)
                      </CardTitle>
                      <p className="text-xs text-gray-500">
                        Showing top categories sorted by highest revenue
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-orange-50">
                            <tr>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-orange-200">
                                Rank
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-orange-200">
                                Date
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-orange-200">
                                Top Category
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-orange-200">
                                Quantity Sold
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Revenue
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-orange-100">
                            {getSortedCategoriesTableData.map((item, index) => (
                              <tr key={index} className="hover:bg-orange-50/30">
                                <td className="py-3 px-4 border-r border-orange-100">
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold
                                    ${index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300 dark:from-yellow-200 dark:to-yellow-300 dark:text-yellow-900 dark:border-yellow-400' :
                                      index === 1 ? 'bg-[linear-gradient(90deg,#f3f4f6,#e5e7eb)] text-[#374151] border border-[#d1d5db] dark:bg-[linear-gradient(90deg,#cbd5e1,#94a3b8)] dark:text-[#0f172a] dark:border-[#94a3b8]' :
                                      index === 2 ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-amber-800 border border-amber-300 dark:from-amber-200 dark:to-orange-200 dark:text-amber-900 dark:border-amber-400' :
                                      'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200'
                                    }`}>
                                    #{index + 1}
                                  </span>
                                </td>
                                <td className="py-3 px-4 border-r border-orange-100">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                                    <span className="font-medium text-gray-800">
                                      {item.date}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 border-r border-orange-100">
                                  <span className="font-medium text-gray-800">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="py-3 px-4 border-r border-orange-100">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200">
                                    {item.quantity.toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-bold text-orange-700">
                                    {formatCurrency(item.revenue)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center rounded-xl border border-orange-200 bg-orange-50/40 p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <Tag className="h-6 w-6" />
                  </div>
                  <p className="text-gray-800 font-bold text-lg mb-2">No Category Data Found</p>
                  <p className="text-gray-600 text-center mb-4">
                    No completed orders found for the selected time period.
                  </p>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isRefreshQueued}
                    className={secondaryButtonClass}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Refresh Data"}
                  </button>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
