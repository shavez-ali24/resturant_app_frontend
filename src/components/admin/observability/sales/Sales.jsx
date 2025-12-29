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
  } catch (error) {
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
  } catch (error) {
    return dateString;
  }
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

export default function TopSellingAnalytics() {
  const [activeTab, setActiveTab] = useState("products");
  const [timeRange, setTimeRange] = useState("7d");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isCustomRange, setIsCustomRange] = useState(false);
  
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
  const { 
    data: productsResponse, 
    isLoading: productsLoading, 
    error: productsError,
    refetch: refetchProducts 
  } = useGetTopSellingProductsQuery({ 
    range: isCustomRange ? "custom" : timeRange,
    ...(isCustomRange && { from: fromDate, to: toDate })
  });
  
  const { 
    data: categoriesResponse, 
    isLoading: categoriesLoading, 
    error: categoriesError,
    refetch: refetchCategories 
  } = useGetTopSellingCategoriesQuery({ 
    range: isCustomRange ? "custom" : timeRange,
    ...(isCustomRange && { from: fromDate, to: toDate })
  });

  // Get time range label
  const getTimeRangeLabel = () => {
    if (isCustomRange && fromDate && toDate) {
      return `Custom (${formatFullDate(fromDate)} - ${formatFullDate(toDate)})`;
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
      
      setIsCustomRange(true);
      setShowDatePicker(false);
      // Don't reset timeRange dropdown - let it show the last selected preset
    }
  };

  // Handle preset time range selection
  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    setIsCustomRange(false);
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
    setTimeRange("7d"); // Reset to default
  };

  const handleRefresh = () => {
    refetchProducts();
    refetchCategories();
  };

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
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 to-amber-50/20 p-4 sm:p-6">
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
  const hasError = productsError || categoriesError || 
                  productsData?.error || categoriesData?.error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 to-amber-50/20 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <Heading title="Top Selling Analytics" />
            <p className="text-gray-600 mt-2">
              Analyze your best performing products and categories
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Time Range Selector */}
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-full sm:w-[180px] bg-orange-100 border-orange-300 text-orange-700">
                <Calendar className="w-4 h-4 mr-2 text-orange-600" />
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent className="bg-orange-50 border-orange-200">
                {timeRangeOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700"
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
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 w-full sm:w-auto justify-center font-medium
                  ${showDatePicker || isCustomRange
                    ? 'bg-orange-100 text-orange-700 border-orange-600 shadow-inner' 
                    : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 hover:border-orange-400'}`}
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
                <div className="absolute right-0 top-12 z-20 w-full sm:w-80 bg-white rounded-xl border border-orange-300 shadow-xl p-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 text-center border-b border-orange-100 pb-2">Select Custom Date Range</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">From Date</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                          value={fromDate} 
                          onChange={e => setFromDate(e.target.value)} 
                          max={toDate}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">To Date</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                          value={toDate} 
                          onChange={e => setToDate(e.target.value)} 
                          min={fromDate}
                        />
                      </div>
                    </div>
                    
                    {isCustomRange && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-orange-700">Custom Range Active</span>
                          <button 
                            onClick={handleClearCustomRange}
                            className="text-xs text-orange-600 hover:text-orange-800 underline"
                          >
                            Clear
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatFullDate(fromDate)} to {formatFullDate(toDate)}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-end items-center pt-3 border-t border-orange-100">
                      {/* <button 
                        onClick={handleResetDate}
                        className="px-2.5 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-orange-100 rounded-md transition-colors"
                      >
                        Reset to 30 days
                      </button> */}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setShowDatePicker(false);
                            if (!isCustomRange) {
                              handleResetDate();
                            }
                          }} 
                          className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-orange-100 rounded-md transition-colors"
                        >
                          Cancel
                        </button>

                        <button 
                          onClick={handleCustomApply} 
                          disabled={!fromDate || !toDate}
                          className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 border border-orange-300 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {hasError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium mb-1">
                Error loading analytics data
              </p>
              <p className="text-red-600 text-sm">
                {productsError?.data?.message || 
                 categoriesError?.data?.message || 
                 productsData?.error || 
                 categoriesData?.error || 
                 "Please try refreshing the page"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Total Days Card */}
        <Card className="border border-orange-200 shadow-sm bg-gradient-to-br from-orange-50 to-white">
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
        <Card className="border border-amber-200 shadow-sm bg-gradient-to-br from-amber-50 to-white">
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
        <Card className="border border-orange-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b border-orange-200 p-4">
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
                <TabsList className="bg-orange-100 p-1 rounded-xl">
                  <TabsTrigger 
                    value="products" 
                    className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm px-4 py-2 rounded-lg font-medium"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Products
                  </TabsTrigger>
                  <TabsTrigger 
                    value="categories" 
                    className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm px-4 py-2 rounded-lg font-medium"
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
                            <PieChart>
                              <Pie
                                data={getAggregatedProducts}
                                cx="60%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => {
                                  if (percent < 0.05) return '';
                                  return `${name}: ${(percent * 100).toFixed(0)}%`;
                                }}
                                outerRadius={80}
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
                                    ${index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300' :
                                      index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300' :
                                      index === 2 ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-amber-800 border border-amber-300' :
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
                <div className="h-64 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-dashed border-orange-300 p-6">
                  <div className="text-5xl mb-4">📦</div>
                  <p className="text-gray-800 font-bold text-lg mb-2">No Product Data Found</p>
                  <p className="text-gray-600 text-center mb-4">
                    No completed orders found for the selected time period.
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 border border-orange-300 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Data
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
                                label={({ name, percent }) => {
                                  if (percent < 0.05) return '';
                                  return `${name}: ${(percent * 100).toFixed(0)}%`;
                                }}
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
                                    ${index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300' :
                                      index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300' :
                                      index === 2 ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-amber-800 border border-amber-300' :
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
                <div className="h-64 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-dashed border-orange-300 p-6">
                  <div className="text-5xl mb-4">🏷️</div>
                  <p className="text-gray-800 font-bold text-lg mb-2">No Category Data Found</p>
                  <p className="text-gray-600 text-center mb-4">
                    No completed orders found for the selected time period.
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 border border-orange-300 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Data
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