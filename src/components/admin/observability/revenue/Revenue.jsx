/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TableIcon, 
  BarChartIcon, 
  IndianRupee, 
  ShoppingBag, 
  TrendingUp, 
  Clock,
  RefreshCw,
  CalendarDays,
  AlertCircle,
  Receipt,
  Percent,
} from "lucide-react"
import { useGetAnalyticsQuery } from "@/redux/adminRedux/adminAPI"
import Heading from "../../common/Heading"
import { useNotify } from "../../common/NotificationModal"

// --- Helpers ---
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)

const formatCompactNumber = (number) => {
  if (number >= 10000000) return `₹${(number / 10000000).toFixed(2)}Cr`
  if (number >= 100000) return `₹${(number / 100000).toFixed(1)}L`
  if (number >= 1000) return `₹${(number / 1000).toFixed(1)}k`
  return `₹${number}`
}

const analyticsTabsListClass =
  "h-12 rounded-2xl border border-orange-200/90 bg-slate-100 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_-18px_rgba(15,23,42,0.45)] dark:border-slate-600 dark:bg-slate-900 dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.2),0_10px_24px_-18px_rgba(2,6,23,0.9)]"
const analyticsTabsTriggerClass =
  "rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-white hover:text-slate-900 data-[state=active]:!bg-orange-500 data-[state=active]:!text-white data-[state=active]:shadow-[0_8px_16px_rgba(15,23,42,0.28)] dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:data-[state=active]:!bg-orange-500 dark:data-[state=active]:!text-white dark:data-[state=active]:ring-1 dark:data-[state=active]:ring-orange-300/60 dark:data-[state=active]:shadow-[0_10px_20px_-12px_rgba(249,115,22,0.55)] [&_svg]:text-current"

// Format date for chart X-axis
const formatChartDate = (dateString, range) => {
  try {
    const date = new Date(dateString.replace(' ', 'T') + 'Z')
    
    // For custom range, always show full date
    if (range === "custom") {
      return date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
      })
    }
    
    if (range === "all" || range === "1y" || range === "6m") {
      return date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        year: range === "all" ? "numeric" : undefined,
      })
    }
    
    if (range === "7d" || range === "15d" || range === "30d") {
      return date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
      })
    }
    
    if (range === "1d") {
      return date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }
    
    return dateString
  } catch (error) {
    return dateString
  }
}

// Format date for table
const formatTableDate = (dateString, range) => {
  try {
    const date = new Date(dateString.replace(' ', 'T') + 'Z')
    
    if (range === "1d") {
      return date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }
    
    return date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: range === "custom" || range === "all" ? "numeric" : undefined,
    })
  } catch (error) {
    return dateString
  }
}

// Group data by date for long ranges
const groupChartDataByDate = (data, range) => {
  if (!data.length) return []
  
  // Always group by date for better visualization
  const grouped = {}
  
  data.forEach(item => {
    const date = new Date(item.date.replace(' ', 'T') + 'Z')
    const dateKey = date.toISOString().split('T')[0]
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        date: dateKey,
        revenue: 0,
        orders: 0,
      }
    }
    grouped[dateKey].revenue += item.revenue || 0
    grouped[dateKey].orders += 1
  })
  
  return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date))
}

export default function RevenueAnalytics() {
  // --- State ---
  const [timeRange, setTimeRange] = useState("7d")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [activeTab, setActiveTab] = useState("chart")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRefreshQueued, setIsRefreshQueued] = useState(false)
  const dropdownRef = useRef(null)
  const refreshDebounceRef = useRef(null)
  const isRefreshingRef = useRef(false)
  const notify = useNotify()
  
  // Get domain
  const domain = localStorage.getItem("userDomain") || "restaurant"

  // RTK Query for analytics - FIXED: Always pass from/to for custom range
  const { data: analyticsData, isLoading, error, refetch } = useGetAnalyticsQuery({
    domain: domain,
    range: timeRange === "custom" ? "all" : timeRange, // Pass "all" for custom to get all data, then filter client-side
    from: timeRange === "custom" && fromDate ? fromDate : undefined,
    to: timeRange === "custom" && toDate ? toDate : undefined,
  }, {
    refetchOnMountOrArgChange: true,
  })

  // Filter data for custom range client-side
  const filterDataForCustomRange = (data) => {
    if (!fromDate || !toDate || !data) return []
    
    const start = new Date(fromDate)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(toDate)
    end.setHours(23, 59, 59, 999)
    
    return data.filter(item => {
      const itemDate = new Date(item.date.replace(' ', 'T') + 'Z')
      return itemDate >= start && itemDate <= end
    })
  }

  // Handle custom date range
  const handleCustomApply = () => {
    if (fromDate && toDate) {
      setTimeRange("custom")
      setShowDatePicker(false)
      // Force refetch with custom dates
      refetch()
    }
  }

  // Reset custom date
  const handleResetDate = () => {
    setFromDate("")
    setToDate("")
    setTimeRange("7d")
    setShowDatePicker(false)
  }

  // Handle select change - reset custom dates if not custom range
  const handleTimeRangeChange = (value) => {
    setTimeRange(value)
    if (value !== "custom") {
      setFromDate("")
      setToDate("")
      setShowDatePicker(false)
    }
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current)
      }
    }
  }, [])

  // Calculate metrics
  const totalRevenue = analyticsData?.totalRevenue || 0
  const totalOrders = analyticsData?.totalOrders || 0
  const rawChartData = analyticsData?.chartData || []
  
  // Debug: Log the analytics data to check structure
  // console.log("📊 Analytics Data:", analyticsData)
  // console.log("📈 Total Revenue:", totalRevenue)
  // console.log("📦 Total Orders:", totalOrders)
  // console.log("📊 Chart Data Sample:", rawChartData.slice(0, 3))
  
  // Check if we have detailed order data for discount verification
  const hasDetailedData = analyticsData?.detailedOrders || analyticsData?.orderBreakdown
  // console.log("🔍 Has Detailed Data:", hasDetailedData)
  
  // Process data based on range
  let processedChartData = rawChartData
  if (timeRange === "custom" && fromDate && toDate) {
    processedChartData = filterDataForCustomRange(rawChartData)
  }
  
  // Process chart data for display
  const chartData = groupChartDataByDate(processedChartData, timeRange)
  
  // Prepare table data
  const tableData = React.useMemo(() => {
    if (!chartData.length) return []
    
    return chartData
      .map(item => ({
        ...item,
        displayDate: formatTableDate(item.date + " 12:00", timeRange)
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [chartData, timeRange])

  // Time range labels
  const timeRangeLabels = {
    "1d": "Last 24 Hours",
    "7d": "Last 7 Days",
    "15d": "Last 15 Days",
    "30d": "Last 30 Days",
    "6m": "Last 6 Months",
    "1y": "Last 1 Year",
    "all": "All Time",
    "custom": "Custom Range"
  }

  // Get display range text
  const getDisplayRangeText = () => {
    if (timeRange === "custom" && fromDate && toDate) {
      return `${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`
    }
    return timeRangeLabels[timeRange]
  }

  const getRefreshErrorMessage = (err) =>
    err?.data?.message || err?.error || err?.message || "Unable to refresh revenue analytics."

  const runRefresh = async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true
    setIsRefreshing(true)
    try {
      const result = await refetch()
      if (result?.error) {
        notify(getRefreshErrorMessage(result.error), "error")
        return
      }
      notify("Revenue analytics refreshed successfully.", "success")
    } catch (err) {
      notify(getRefreshErrorMessage(err), "error")
    } finally {
      isRefreshingRef.current = false
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    if (isRefreshingRef.current) return
    if (refreshDebounceRef.current) {
      clearTimeout(refreshDebounceRef.current)
    }
    setIsRefreshQueued(true)
    refreshDebounceRef.current = setTimeout(() => {
      refreshDebounceRef.current = null
      setIsRefreshQueued(false)
      runRefresh()
    }, 500)
  }

  const secondaryButtonClass =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50"
  const primaryButtonClass =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
  const inputClass =
    "h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm text-gray-700 shadow-sm transition-all outline-none hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
  const selectTriggerClass =
    "h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition-all outline-none hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 sm:w-[190px]"
  const selectContentClass =
    "z-[10050] rounded-xl border border-orange-200 bg-white p-1 shadow-xl"
  const selectItemClass =
    "cursor-pointer rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-orange-100 hover:text-orange-800 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800"

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-row lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <Heading title="Revenue Analytics" />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isRefreshQueued}
              className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-700">Time Range:</span>
              <span className="text-orange-600 font-semibold">
                {getDisplayRangeText()}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Time Range Selector */}
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="1d" className={selectItemClass}>Last 24 Hours</SelectItem>
                  <SelectItem value="7d" className={selectItemClass}>Last 7 Days</SelectItem>
                  <SelectItem value="15d" className={selectItemClass}>Last 15 Days</SelectItem>
                  <SelectItem value="30d" className={selectItemClass}>Last 30 Days</SelectItem>
                  <SelectItem value="6m" className={selectItemClass}>Last 6 Months</SelectItem>
                  <SelectItem value="1y" className={selectItemClass}>Last 1 Year</SelectItem>
                  <SelectItem value="all" className={selectItemClass}>All Time</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date Range Button - Always Visible */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 sm:w-auto
                    ${showDatePicker
                      ? 'border-orange-300 bg-orange-100 text-orange-700 shadow-inner' 
                      : 'border-orange-200 bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300'}`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Custom Range</span>
                </button>
                
                {showDatePicker && (
                  <div className="absolute right-0 top-12 z-50 w-full rounded-2xl border border-orange-200 bg-white p-4 shadow-xl sm:w-80">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 text-center border-b border-orange-100 pb-2">Select Date Range</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">From Date</label>
                          <input 
                            type="date" 
                            className={inputClass}
                            value={fromDate} 
                            onChange={e => setFromDate(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">To Date</label>
                          <input 
                            type="date" 
                            className={inputClass}
                            value={toDate} 
                            onChange={e => setToDate(e.target.value)} 
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-orange-100 pt-3">
                        <button 
                          onClick={handleResetDate}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-50"
                        >
                          Reset
                        </button>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowDatePicker(false)} 
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleCustomApply} 
                            disabled={!fromDate || !toDate}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Apply Dates
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - 2 Cards Only (Removed Avg Order Value) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Total Revenue Card */}
        <Card className="border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl">
                <IndianRupee className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(totalRevenue)}
                </p>
                <div className="mt-2 flex items-center text-xs text-orange-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>From {totalOrders} orders</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders Card */}
        <Card className="border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">
                  {totalOrders.toLocaleString()}
                </p>
                <div className="mt-2 flex items-center text-xs text-amber-600">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{timeRangeLabels[timeRange]}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart/Table Section */}
      <Tabs defaultValue="chart" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <Card className="border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
          <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50/70 to-white p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {timeRange === "1d" ? "Hourly Revenue" : "Revenue Trend"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {getDisplayRangeText()}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <TabsList className={analyticsTabsListClass}>
                  <TabsTrigger 
                    value="chart" 
                    className={analyticsTabsTriggerClass}
                  >
                    <BarChartIcon className="w-4 h-4 mr-2" />
                    Chart
                  </TabsTrigger>
                  <TabsTrigger 
                    value="table" 
                    className={analyticsTabsTriggerClass}
                  >
                    <TableIcon className="w-4 h-4 mr-2" />
                    Table
                  </TabsTrigger>
                  {/* <TabsTrigger 
                    value="breakdown" 
                    className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm px-4 py-2 rounded-lg font-medium"
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Breakdown
                  </TabsTrigger> */}
                </TabsList>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {/* Chart Tab */}
            <TabsContent value="chart" className="mt-0">
              {isLoading ? (
                <div className="h-[350px] flex flex-col items-center justify-center rounded-xl border border-orange-200 bg-orange-50/40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading revenue data...</p>
                  <p className="text-gray-500 text-sm mt-1">Please wait</p>
                </div>
              ) : error ? (
                <div className="h-[350px] flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <p className="text-gray-800 font-bold text-lg mb-2">Failed to Load Data</p>
                  <p className="text-gray-600 text-center mb-6">
                    {error.message || "Unable to fetch revenue analytics."}
                  </p>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isRefreshQueued}
                    className={primaryButtonClass}
                  >
                    <RefreshCw className={`w-4 h-4 inline mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Try Again"}
                  </button>
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={chartData} 
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke="#fed7aa" 
                        strokeOpacity={0.5}
                      />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(tick) => formatChartDate(tick, timeRange)}
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#92400e', fontSize: 11 }}
                        minTickGap={20}
                      />
                      <YAxis 
                        tickFormatter={formatCompactNumber}
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#92400e', fontSize: 11 }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 border border-orange-200 shadow-lg rounded-lg min-w-[180px]">
                                <p className="text-sm font-semibold text-gray-900 mb-2 border-b border-orange-100 pb-2">
                                  {formatTableDate(label, timeRange)}
                                </p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                      <span className="text-xs text-gray-600">Revenue:</span>
                                    </div>
                                    <span className="text-sm font-bold text-orange-600">
                                      {formatCurrency(data.revenue)}
                                    </span>
                                  </div>
                                  {data.orders && (
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-xs text-gray-600">Orders:</span>
                                      </div>
                                      <span className="text-sm font-medium text-gray-800">
                                        {data.orders}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                        cursor={{ stroke: '#f97316', strokeWidth: 2 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#f97316" 
                        strokeWidth={3}
                        fill="url(#revenueGradient)" 
                        dot={{ r: 4, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex flex-col items-center justify-center rounded-xl border border-orange-200 bg-orange-50/40 p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <BarChartIcon className="h-6 w-6" />
                  </div>
                  <p className="text-gray-800 font-bold text-lg mb-2">No Revenue Data</p>
                  <p className="text-gray-600 text-center mb-4">
                    {timeRange === "custom" && fromDate && toDate
                      ? `No completed orders found between ${new Date(fromDate).toLocaleDateString()} and ${new Date(toDate).toLocaleDateString()}`
                      : "No completed orders found for the selected time period."
                    }
                  </p>
                  <button
                    onClick={() => setTimeRange("all")}
                    className={secondaryButtonClass}
                  >
                    View All Time
                  </button>
                </div>
              )}
            </TabsContent>

            {/* Table Tab */}
            <TabsContent value="table" className="mt-0">
              <div className="overflow-hidden rounded-xl border border-orange-200">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-orange-50/70">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700 border-r border-orange-200">
                          Date
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right border-r border-orange-200">
                          Orders
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">
                          Revenue
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3"></div>
                              <p className="text-sm font-medium text-gray-600">Loading table data...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : tableData.length > 0 ? (
                        tableData.map((row, index) => (
                          <TableRow 
                            key={index} 
                            className="hover:bg-orange-50/30 border-b border-orange-100"
                          >
                            <TableCell className="py-3 border-r border-orange-100">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                                <span className="font-medium text-gray-800">
                                  {row.displayDate}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-3 border-r border-orange-100">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200">
                                {row.orders}
                              </span>
                            </TableCell>
                            <TableCell className="text-right py-3">
                              <span className="font-bold text-orange-700">
                                {formatCurrency(row.revenue)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                                <TableIcon className="h-5 w-5" />
                              </div>
                              <p className="mb-2 font-bold text-gray-700">No Data Available</p>
                              <p className="max-w-md text-sm text-gray-600">
                                {timeRange === "custom" && fromDate && toDate
                                  ? `No revenue records found between ${new Date(fromDate).toLocaleDateString()} and ${new Date(toDate).toLocaleDateString()}`
                                  : "No revenue records found for the selected time period"
                                }
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Table Footer */}
                {tableData.length > 0 && (
                  <div className="border-t border-orange-200 bg-gradient-to-r from-orange-50/70 to-amber-50/70 px-4 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-sm text-gray-600">
                        Showing <span className="font-bold text-orange-700">{tableData.length}</span> records
                        {timeRange === "custom" && fromDate && toDate && (
                          <span className="ml-2 text-xs">
                            ({new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-gray-700">
                          Total Revenue:
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-700">
                            {formatCurrency(tableData.reduce((sum, row) => sum + row.revenue, 0))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Breakdown Tab */}
            <TabsContent value="breakdown" className="mt-0">
              {isLoading ? (
                <div className="h-[350px] flex flex-col items-center justify-center rounded-xl border border-orange-200 bg-orange-50/40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading breakdown data...</p>
                  <p className="text-gray-500 text-sm mt-1">Please wait</p>
                </div>
              ) : error ? (
                <div className="h-[350px] flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <p className="text-gray-800 font-bold text-lg mb-2">Failed to Load Breakdown</p>
                  <p className="text-gray-600 text-center mb-6">
                    {error.message || "Unable to fetch revenue breakdown."}
                  </p>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isRefreshQueued}
                    className={primaryButtonClass}
                  >
                    <RefreshCw className={`w-4 h-4 inline mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Try Again"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border border-orange-200 shadow-sm bg-gradient-to-br from-green-50 to-white">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
                            <IndianRupee className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-xl font-bold text-gray-800">
                              {formatCurrency(totalRevenue)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-orange-200 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl">
                            <Percent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Discounts</p>
                            <p className="text-xl font-bold text-gray-800">
                              {formatCurrency(analyticsData?.totalDiscounts || 0)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-orange-200 shadow-sm bg-gradient-to-br from-purple-50 to-white">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl">
                            <ShoppingBag className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">Net Revenue</p>
                            <p className="text-xl font-bold text-gray-800">
                              {formatCurrency((analyticsData?.totalRevenue || 0) - (analyticsData?.totalDiscounts || 0))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div> */}

                 
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
