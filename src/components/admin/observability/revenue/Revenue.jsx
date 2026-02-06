/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
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
  Receipt,
  Percent,
} from "lucide-react"
import { useGetAnalyticsQuery } from "@/redux/adminRedux/adminAPI"
import Heading from "../../common/Heading"

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
  const dropdownRef = useRef(null)
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 to-amber-50/20 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-row lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <Heading title="Revenue Analytics" />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 border border-orange-300 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4 mb-6">
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
                <SelectTrigger className="w-full sm:w-[180px] bg-orange-100 border-orange-600 text-orange-700 ">
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent className="bg-orange-50 border-orange-300">
                  <SelectItem value="1d" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 24 Hours</SelectItem>
                  <SelectItem value="7d" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 7 Days</SelectItem>
                  <SelectItem value="15d" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 15 Days</SelectItem>
                  <SelectItem value="30d" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 30 Days</SelectItem>
                  <SelectItem value="6m" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 6 Months</SelectItem>
                  <SelectItem value="1y" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 1 Year</SelectItem>
                  <SelectItem value="all" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">All Time</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date Range Button - Always Visible */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 w-full sm:w-auto justify-center font-medium
                    ${showDatePicker
                      ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-inner' 
                      : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 hover:border-orange-400'}`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Custom Range</span>
                </button>
                
                {showDatePicker && (
                  <div className="absolute right-0 top-12 z-50 w-full sm:w-80 bg-white rounded-xl border border-orange-300 shadow-xl p-4">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 text-center border-b border-orange-100 pb-2">Select Date Range</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">From Date</label>
                          <input 
                            type="date" 
                            className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            value={fromDate} 
                            onChange={e => setFromDate(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">To Date</label>
                          <input 
                            type="date" 
                            className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            value={toDate} 
                            onChange={e => setToDate(e.target.value)} 
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-orange-100">
                        <button 
                          onClick={handleResetDate}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Reset
                        </button>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowDatePicker(false)} 
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleCustomApply} 
                            disabled={!fromDate || !toDate}
                            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
        <Card className="border border-orange-200 shadow-sm bg-gradient-to-br from-orange-50 to-white">
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
        <Card className="border border-orange-200 shadow-sm bg-gradient-to-br from-amber-50 to-white">
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
        <Card className="border border-orange-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b border-orange-200 p-4">
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
                <TabsList className="bg-orange-100 p-1 rounded-xl">
                  <TabsTrigger 
                    value="chart" 
                    className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm px-4 py-2 rounded-lg font-medium"
                  >
                    <BarChartIcon className="w-4 h-4 mr-2" />
                    Chart
                  </TabsTrigger>
                  <TabsTrigger 
                    value="table" 
                    className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm px-4 py-2 rounded-lg font-medium"
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
                <div className="h-[350px] flex flex-col items-center justify-center bg-gradient-to-br from-orange-50/50 to-amber-50/30 rounded-xl border-2 border-dashed border-orange-300">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading revenue data...</p>
                  <p className="text-gray-500 text-sm mt-1">Please wait</p>
                </div>
              ) : error ? (
                <div className="h-[350px] flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border-2 border-dashed border-red-300 p-6">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-gray-800 font-bold text-lg mb-2">Failed to Load Data</p>
                  <p className="text-gray-600 text-center mb-6">
                    {error.message || "Unable to fetch revenue analytics."}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Try Again
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
                <div className="h-[350px] flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-dashed border-orange-300 p-6">
                  <div className="text-5xl mb-4">📊</div>
                  <p className="text-gray-800 font-bold text-lg mb-2">No Revenue Data</p>
                  <p className="text-gray-600 text-center mb-4">
                    {timeRange === "custom" && fromDate && toDate
                      ? `No completed orders found between ${new Date(fromDate).toLocaleDateString()} and ${new Date(toDate).toLocaleDateString()}`
                      : "No completed orders found for the selected time period."
                    }
                  </p>
                  <button
                    onClick={() => setTimeRange("all")}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium"
                  >
                    View All Time
                  </button>
                </div>
              )}
            </TabsContent>

            {/* Table Tab */}
            <TabsContent value="table" className="mt-0">
              <div className="rounded-xl border border-orange-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-orange-50">
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
                              <p className="text-gray-600 font-medium">Loading table data...</p>
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
                              <div className="text-4xl mb-3">📋</div>
                              <p className="text-gray-700 font-bold mb-2">No Data Available</p>
                              <p className="text-gray-600">
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
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 border-t border-orange-200">
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
                <div className="h-[350px] flex flex-col items-center justify-center bg-gradient-to-br from-orange-50/50 to-amber-50/30 rounded-xl border-2 border-dashed border-orange-300">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading breakdown data...</p>
                  <p className="text-gray-500 text-sm mt-1">Please wait</p>
                </div>
              ) : error ? (
                <div className="h-[350px] flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border-2 border-dashed border-red-300 p-6">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-gray-800 font-bold text-lg mb-2">Failed to Load Breakdown</p>
                  <p className="text-gray-600 text-center mb-6">
                    {error.message || "Unable to fetch revenue breakdown."}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Try Again
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