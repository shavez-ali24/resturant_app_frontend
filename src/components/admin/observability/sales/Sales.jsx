import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
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
  ChevronDown,
} from "lucide-react";
import {
  useGetTopSellingProductsQuery,
  useGetTopSellingCategoriesQuery,
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
  minPercent = 0.05,
  labelColor = "#fb923c"
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
      fill={labelColor}
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
  const colors = useSelector((state) => state.admin.theme.colors);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () =>
      setIsDarkMode(root.classList.contains("admin-dark") || root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useAdminTour(TOUR_KEYS.sales, getSalesSteps, isDarkMode, 700);
  const [activeTab, setActiveTab] = useState("products");
  const [timeRange, setTimeRange] = useState("1d");
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
    setTimeRange("1d"); // Reset to default
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
    `inline-flex h-10 items-center justify-center gap-2 rounded-xl border transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 px-4 text-sm font-bold`;
  const primaryButtonClass =
    `inline-flex h-10 items-center justify-center gap-2 rounded-xl border transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 px-4 text-sm font-semibold`;
  const selectTriggerClass =
    `h-10 w-full rounded-xl border px-3 text-sm font-semibold transition-all outline-none focus:ring-2 sm:w-[190px]`;
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
    `h-10 w-full rounded-xl border px-3 text-sm transition-all outline-none focus:ring-2`;

  const primaryBtnStyle = {
    backgroundColor: colors.primary,
    color: "#ffffff",
    borderColor: "transparent",
  }
  const secondaryBtnStyle = {
    borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
    backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
    color: isDarkMode ? colors.primary : colors.primaryText,
  }
  const selectTriggerStyle = {
    borderColor: isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3",
    backgroundColor: isDarkMode ? "rgb(30, 41, 59)" : "#ffffff",
    color: isDarkMode ? "#f1f5f9" : "#1c1917",
  }
  const inputStyle = {
    borderColor: isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3",
    backgroundColor: isDarkMode ? "rgb(30, 41, 59)" : "#ffffff",
    color: isDarkMode ? "#f1f5f9" : "#1c1917",
  }

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
    ]
  }, [colors.primary]);

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


  // ── theme helpers ──────────────────────────────────────────────────────────
  const card = isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white shadow-sm";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-[#78716c]";
  const divider = isDarkMode ? "border-slate-700" : "border-[#ede8e3]";
  const chartGrid = isDarkMode ? "#334155" : "#ede8e3";
  const chartTick = isDarkMode ? "#94a3b8" : "#78716c";
  const tooltipStyle = {
    backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
    border: `1px solid ${isDarkMode ? "#334155" : "#ede8e3"}`,
    borderRadius: "12px",
    color: isDarkMode ? "#f1f5f9" : "#1c1917",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
  };
  const tooltipItemStyle = {
    color: isDarkMode ? "#f1f5f9" : "#1c1917",
  };
  const tooltipLabelStyle = {
    color: isDarkMode ? "#f1f5f9" : "#1c1917",
    fontWeight: 600,
  };
  const tableHeaderBg = isDarkMode ? "bg-slate-800" : "bg-[#f7f3ef]";
  const tableRowHover = isDarkMode ? "hover:bg-slate-800/60" : "hover:bg-[#faf7f4]";
  const tableRowBorder = isDarkMode ? "border-slate-700" : "border-[#f0ebe5]";

  return (
    <div className={`min-h-full p-4 sm:p-6 ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>

      {/* ── Header ── */}
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
              {/* Time Range */}
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger className={selectTriggerClass} style={selectTriggerStyle}>
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

              {/* Custom Range */}
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
                  style={(showDatePicker || isCustomRange) ? {
                    borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                    backgroundColor: isDarkMode ? `${colors.primary}30` : colors.primaryLight,
                    color: isDarkMode ? colors.primary : colors.primaryText,
                    fontWeight: "bold",
                  } : {}}
                >
                  <CalendarDays className="w-4 h-4 shrink-0" style={{ color: colors.primary }} />
                  <span>Custom Range</span>
                  {isCustomRange && <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">✓</span>}
                  <ChevronDown className={`w-4 h-4 shrink-0 text-current transition-transform ${showDatePicker ? "rotate-180" : ""}`} />
                </button>

                {showDatePicker && (
                  <div className={`absolute right-0 top-12 z-[10050] w-full rounded-2xl border p-4 shadow-xl sm:w-80 ${isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white"}`}>
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
                            onChange={e => setFromDate(e.target.value)}
                            max={toDate}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = colors.primary;
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3";
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${textSecondary}`}>To Date</label>
                          <input
                            type="date"
                            className={inputClass}
                            style={inputStyle}
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            min={fromDate}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = colors.primary;
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3";
                            }}
                          />
                        </div>
                      </div>
                      {isCustomRange && (
                        <div className={`p-3 rounded-lg border`}
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
                          onClick={() => { setShowDatePicker(false); if (!isCustomRange) handleResetDate(); }}
                          className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors ${isDarkMode ? "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700" : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"}`}
                        >Cancel</button>
                        <button onClick={handleCustomApply} disabled={!fromDate || !toDate} className={primaryButtonClass} style={primaryBtnStyle}>Apply</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Refresh */}
              <button
                data-tour="sales-refresh"
                onClick={handleRefresh}
                disabled={isRefreshing || isRefreshQueued}
                className={secondaryButtonClass}
                style={secondaryBtnStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}30` : `${colors.primary}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}20` : colors.primaryLight;
                }}
              >
                <RefreshCw className={`w-4 h-4 shrink-0 text-current ${isRefreshing ? "animate-spin" : ""}`} />
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
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

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className={`rounded-2xl border p-4 ${card}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl border"
                 style={{
                   backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                   borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                   color: isDarkMode ? colors.primary : colors.primaryText,
                 }}
            >
              <CalendarDays className="w-5 h-5 text-current" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${textSecondary}`}>
                {activeTab === "products" ? "Products Analysis Period" : "Categories Analysis Period"}
              </p>
              <p className={`text-2xl font-bold ${textPrimary}`}>
                {activeTab === "products" ? (productsData?.totalDays || 0) : (categoriesData?.totalDays || 0)} Days
              </p>
              <div className="mt-2 flex items-center text-xs font-semibold" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>
                <Clock className="w-3 h-3 mr-1" style={{ color: colors.primary }} />
                <span className="truncate">
                  {activeTab === "products"
                    ? `${productsData?.from || "N/A"} to ${productsData?.to || "N/A"}`
                    : `${categoriesData?.from || "N/A"} to ${categoriesData?.to || "N/A"}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${card}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl border"
                 style={{
                   backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                   borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                   color: isDarkMode ? colors.primary : colors.primaryText,
                 }}
            >
              <TrendingUp className="w-5 h-5 text-current" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${textSecondary}`}>Selected Time Range</p>
              <p className={`text-2xl font-bold ${textPrimary}`}>{getTimeRangeLabel()}</p>
              <div className="mt-2 flex items-center text-xs font-semibold" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>
                <Calendar className="w-3 h-3 mr-1" style={{ color: colors.primary }} />
                <span>
                  {activeTab === "products"
                    ? `${getProductsChartData.length} data points`
                    : `${getCategoriesChartData.length} data points`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div data-tour="sales-chart" className={`rounded-2xl border mb-6 ${card}`}>
        {/* Card Header with tab switcher */}
        <div className={`border-b p-4 ${divider}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary}`}>
                {activeTab === "products" ? "Daily Top Selling Products" : "Daily Top Selling Categories"}
              </h3>
              <p className={`text-sm mt-1 ${textSecondary}`}>{getTimeRangeLabel()}</p>
            </div>
            <div className={`flex h-10 items-center gap-1 rounded-xl border p-1 ${isDarkMode ? "border-slate-600 bg-slate-800" : "border-[#ede8e3] bg-[#f7f3ef]"}`}>
              {["products", "categories"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? "shadow-sm"
                      : isDarkMode
                        ? "text-slate-400 hover:text-slate-100"
                        : "text-[#78716c] hover:text-[#1c1917]"
                  }`}
                  style={activeTab === tab ? {
                    backgroundColor: isDarkMode ? `${colors.primary}25` : colors.primaryLight,
                    borderColor: isDarkMode ? `${colors.primary}60` : `${colors.primary}33`,
                    color: isDarkMode ? colors.primary : colors.primaryText,
                    borderWidth: "1px",
                  } : {}}
                >
                  {tab === "products"
                    ? <><Package className="w-4 h-4 shrink-0" /><span>Products</span></>
                    : <><Tag className="w-4 h-4 shrink-0" /><span>Categories</span></>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* ── Products Tab ── */}
          {activeTab === "products" && (
            getProductsChartData.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <div className={`rounded-xl border p-4 ${card}`}>
                    <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${textPrimary}`}>
                      <BarChart3 className="w-4 h-4" style={{ color: colors.primary }} />
                      Daily Top Product Sales
                    </h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getProductsChartData.slice(0, 20)} margin={{ top: 10, right: 20, left: 0, bottom: getProductsChartData.length > 5 ? 50 : 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} strokeOpacity={0.6} vertical={false} />
                          <XAxis
                            dataKey="date"
                            angle={getProductsChartData.length > 5 ? -45 : 0}
                            textAnchor={getProductsChartData.length > 5 ? "end" : "middle"}
                            height={getProductsChartData.length > 5 ? 60 : 35}
                            fontSize={11}
                            tick={{ fill: chartTick }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis tickFormatter={(v) => v.toLocaleString()} fontSize={11} tick={{ fill: chartTick }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            itemStyle={tooltipItemStyle}
                            labelStyle={tooltipLabelStyle}
                            formatter={(value) => [value.toLocaleString(), "Qty"]}
                            labelFormatter={(label, payload) => payload?.[0] ? `Product: ${payload[0].payload.product}` : label}
                          />
                          <Bar dataKey="quantity" fill={colors.primary} radius={[6, 6, 0, 0]} maxBarSize={48} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className={`rounded-xl border p-4 ${card}`}>
                    <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${textPrimary}`}>
                      <PieChartIcon className="w-4 h-4" style={{ color: colors.primary }} />
                      Top Products Distribution
                    </h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 18, right: 40, left: 40, bottom: 18 }}>
                          <Pie data={getAggregatedProducts} cx="50%" cy="50%" labelLine={false} label={(props) => renderDistributionLabel(props, 0.06, isDarkMode ? "#fbbf24" : colors.primaryText)} outerRadius={72} dataKey="revenue">
                            {getAggregatedProducts.map((_, i) => <Cell key={i} fill={themeColorsList[i % themeColorsList.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v) => [formatCurrency(v), "Revenue"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "border-slate-700" : "border-[#ede8e3]"}`}>
                  <div className={`px-4 py-3 border-b ${divider}`}>
                    <h4 className={`text-sm font-semibold ${textPrimary}`}>Daily Top Selling Products (Sorted by Revenue)</h4>
                    <p className={`text-xs mt-0.5 ${textSecondary}`}>Showing top products sorted by highest revenue</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={tableHeaderBg}>
                        <tr>
                          {["Rank", "Date", "Top Product", "Quantity Sold", "Revenue"].map((h) => (
                            <th key={h} className={`py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? "divide-slate-700" : "divide-[#f0ebe5]"}`}>
                        {getSortedProductsTableData.map((item, i) => (
                          <tr key={i} className={`transition-colors ${tableRowHover}`}>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border"
                                    style={
                                      i === 0 ? { backgroundColor: "#fef9c3", color: "#854d0e", borderColor: "#fde047" } :
                                      i === 1 ? { backgroundColor: "#f1f5f9", color: "#334155", borderColor: "#cbd5e1" } :
                                      i === 2 ? {
                                        backgroundColor: isDarkMode ? `${colors.primary}25` : colors.primaryLight,
                                        color: isDarkMode ? colors.primary : colors.primaryText,
                                        borderColor: isDarkMode ? `${colors.primary}60` : `${colors.primary}33`,
                                      } : {
                                        backgroundColor: isDarkMode ? "rgb(30, 41, 59)" : "rgb(250, 247, 244)",
                                        color: isDarkMode ? "rgb(148, 163, 184)" : "rgb(120, 113, 108)",
                                        borderColor: isDarkMode ? "rgb(51, 65, 85)" : "rgb(237, 232, 227)"
                                      }
                                    }
                              >#{i + 1}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors.primary }}></div>
                                <span className={`font-medium ${textPrimary}`}>{item.date}</span>
                              </div>
                            </td>
                            <td className={`py-3 px-4 font-medium ${textPrimary}`}>{item.product}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                                    style={{
                                      backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                                      borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                                      color: isDarkMode ? colors.primary : colors.primaryText,
                                    }}
                              >
                                {item.quantity.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold" style={{ color: colors.primary }}>{formatCurrency(item.revenue)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`h-64 flex flex-col items-center justify-center rounded-xl border p-6 ${isDarkMode ? "border-slate-700 bg-slate-800/40" : "border-[#ede8e3] bg-[#f7f3ef]"}`}>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                     style={{
                       backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                     }}
                >
                  <Package className="h-6 w-6" style={{ color: colors.primary }} />
                </div>
                <p className={`font-bold text-lg mb-2 ${textPrimary}`}>No Product Data Found</p>
                <p className={`text-center mb-4 text-sm ${textSecondary}`}>No completed orders found for the selected time period.</p>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={secondaryButtonClass}
                  style={secondaryBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}30` : `${colors.primary}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}20` : colors.primaryLight;
                  }}
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 text-current ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>
            )
          )}

          {/* ── Categories Tab ── */}
          {activeTab === "categories" && (
            getCategoriesChartData.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <div className={`rounded-xl border p-4 ${card}`}>
                    <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${textPrimary}`}>
                      <BarChart3 className="w-4 h-4" style={{ color: colors.primary }} />
                      Daily Top Category Performance
                    </h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getCategoriesChartData.slice(0, 20)} margin={{ top: 10, right: 20, left: 0, bottom: getCategoriesChartData.length > 5 ? 50 : 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} strokeOpacity={0.6} vertical={false} />
                          <XAxis
                            dataKey="date"
                            angle={getCategoriesChartData.length > 5 ? -45 : 0}
                            textAnchor={getCategoriesChartData.length > 5 ? "end" : "middle"}
                            height={getCategoriesChartData.length > 5 ? 60 : 35}
                            fontSize={11}
                            tick={{ fill: chartTick }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis tickFormatter={formatNumber} fontSize={11} tick={{ fill: chartTick }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            itemStyle={tooltipItemStyle}
                            labelStyle={tooltipLabelStyle}
                            formatter={(v) => [formatNumber(v), "Qty"]}
                            labelFormatter={(label, payload) => payload?.[0] ? `Category: ${payload[0].payload.category}` : label}
                          />
                          <Bar dataKey="quantity" fill={colors.primary} radius={[6, 6, 0, 0]} maxBarSize={48} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className={`rounded-xl border p-4 ${card}`}>
                    <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${textPrimary}`}>
                      <PieChartIcon className="w-4 h-4" style={{ color: colors.primary }} />
                      Top Categories Distribution
                    </h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={getAggregatedCategories} cx="50%" cy="50%" labelLine={false} label={(props) => renderDistributionLabel(props, 0.05, isDarkMode ? "#fbbf24" : colors.primaryText)} outerRadius={80} dataKey="revenue">
                            {getAggregatedCategories.map((_, i) => <Cell key={i} fill={themeColorsList[i % themeColorsList.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v) => [formatCurrency(v), "Revenue"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Categories Table */}
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "border-slate-700" : "border-[#ede8e3]"}`}>
                  <div className={`px-4 py-3 border-b ${divider}`}>
                    <h4 className={`text-sm font-semibold ${textPrimary}`}>Daily Top Selling Categories (Sorted by Revenue)</h4>
                    <p className={`text-xs mt-0.5 ${textSecondary}`}>Showing top categories sorted by highest revenue</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={tableHeaderBg}>
                        <tr>
                          {["Rank", "Date", "Top Category", "Quantity Sold", "Revenue"].map((h) => (
                            <th key={h} className={`py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? "divide-slate-700" : "divide-[#f0ebe5]"}`}>
                        {getSortedCategoriesTableData.map((item, i) => (
                          <tr key={i} className={`transition-colors ${tableRowHover}`}>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border"
                                    style={
                                      i === 0 ? { backgroundColor: "#fef9c3", color: "#854d0e", borderColor: "#fde047" } :
                                      i === 1 ? { backgroundColor: "#f1f5f9", color: "#334155", borderColor: "#cbd5e1" } :
                                      i === 2 ? {
                                        backgroundColor: isDarkMode ? `${colors.primary}25` : colors.primaryLight,
                                        color: isDarkMode ? colors.primary : colors.primaryText,
                                        borderColor: isDarkMode ? `${colors.primary}60` : `${colors.primary}33`,
                                      } : {
                                        backgroundColor: isDarkMode ? "rgb(30, 41, 59)" : "rgb(250, 247, 244)",
                                        color: isDarkMode ? "rgb(148, 163, 184)" : "rgb(120, 113, 108)",
                                        borderColor: isDarkMode ? "rgb(51, 65, 85)" : "rgb(237, 232, 227)"
                                      }
                                    }
                              >#{i + 1}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors.primary }}></div>
                                <span className={`font-medium ${textPrimary}`}>{item.date}</span>
                              </div>
                            </td>
                            <td className={`py-3 px-4 font-medium ${textPrimary}`}>{item.category}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                                    style={{
                                      backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                                      borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                                      color: isDarkMode ? colors.primary : colors.primaryText,
                                    }}
                              >
                                {item.quantity.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold" style={{ color: colors.primary }}>{formatCurrency(item.revenue)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`h-64 flex flex-col items-center justify-center rounded-xl border p-6 ${isDarkMode ? "border-slate-700 bg-slate-800/40" : "border-[#ede8e3] bg-[#f7f3ef]"}`}>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                     style={{
                       backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                     }}
                >
                  <Tag className="h-6 w-6" style={{ color: colors.primary }} />
                </div>
                <p className={`font-bold text-lg mb-2 ${textPrimary}`}>No Category Data Found</p>
                <p className={`text-center mb-4 text-sm ${textSecondary}`}>No completed orders found for the selected time period.</p>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={secondaryButtonClass}
                  style={secondaryBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}30` : `${colors.primary}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}20` : colors.primaryLight;
                  }}
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 text-current ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
