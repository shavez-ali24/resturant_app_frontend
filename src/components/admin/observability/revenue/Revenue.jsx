/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
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
  Calendar,
  ChevronDown,
  AlertCircle,
} from "lucide-react"
import { useGetAnalyticsQuery } from "@/redux/adminRedux/adminAPI"
import { ADMIN_COLORS } from "@/redux/adminRedux/adminSlice"
import Heading from "../../common/Heading"
import { useNotify } from "../../common/NotificationModal"
import { useAdminTour } from "../../../../hooks/useAdminTour"
import { TOUR_KEYS, getRevenueSteps } from "../../../../utils/adminTour"

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

const getBackendDateParts = (value) => {
  const raw = String(value || "").trim()
  if (!raw) return { raw: "", date: "", time: "" }
  const [datePart, timePart] = raw.split(" ")
  return {
    raw,
    date: datePart || raw,
    time: timePart || "",
  }
}



// Format date for chart X-axis
const formatChartDate = (dateString, range) => {
  const { raw, date, time } = getBackendDateParts(dateString)
  if (!raw) return ""
  if (range === "1d") return time || raw
  return date || raw
}

// Format date for table
const formatTableDate = (dateString, range) => {
  return getBackendDateParts(dateString).raw
}

// Group data by date for long ranges
const groupChartDataByDate = (data, range) => {
  if (!data.length) return []
  
  // Always group by date for better visualization
  const grouped = {}
  
  data.forEach(item => {
    const dateKey = getBackendDateParts(item.date).date
    if (!dateKey) return
    
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
  const colors = useSelector((state) => state.admin.theme.colors)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false
    const root = document.documentElement
    return root.classList.contains("admin-dark") || root.classList.contains("dark")
  })

  useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    const update = () =>
      setIsDarkMode(root.classList.contains("admin-dark") || root.classList.contains("dark"))
    update()
    const obs = new MutationObserver(update)
    obs.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  useAdminTour(TOUR_KEYS.revenue, getRevenueSteps, isDarkMode, 700)
  // --- State ---
  const [timeRange, setTimeRange] = useState("7d")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [activeTab, setActiveTab] = useState("chart")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const isCustomRange = timeRange === "custom"
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

  const handleClearCustomRange = () => {
    handleResetDate()
  }

  const formatFullDate = (dateStr) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
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
        displayDate: formatTableDate(item.date, timeRange)
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
    `inline-flex h-10 items-center justify-center gap-2 rounded-xl border transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 px-4 text-sm font-bold`
  const primaryButtonClass =
    `inline-flex h-10 items-center justify-center gap-2 rounded-xl border transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 px-4 text-sm font-semibold`
  const inputClass =
    `h-10 w-full rounded-xl border px-3 text-sm transition-all outline-none focus:ring-2`
  const selectTriggerClass =
    `h-10 w-full rounded-xl border px-3 text-sm font-semibold transition-all outline-none focus:ring-2 sm:w-[190px]`
  const selectContentClass =
    `z-[10050] rounded-xl border p-1 shadow-xl ${
      isDarkMode
        ? "border-slate-700 bg-slate-900"
        : "border-[#ede8e3] bg-white"
    }`
  const selectItemClass =
    `cursor-pointer rounded-lg py-2 text-sm font-medium transition-colors ${
      isDarkMode
        ? "text-slate-200 data-[highlighted]:bg-slate-700 data-[highlighted]:text-slate-100"
        : "text-[#1c1917] data-[highlighted]:bg-[#f7f3ef] data-[highlighted]:text-[#1c1917]"
    }`

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

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>
      {/* Header */}
      <div className="mb-6">
        <div className={`mb-4 rounded-2xl border p-4 sm:p-5 ${
          isDarkMode
            ? "border-slate-700 bg-[#1e293b]"
            : "border-[#ede8e3] bg-white shadow-sm"
        }`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div data-tour="revenue-heading">
              <Heading title="Revenue Analytics" />
              <p className={`mt-1 text-xs sm:text-sm ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>
                Track your business earnings and growth
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div data-tour="revenue-date-filter" className="flex flex-col sm:flex-row gap-3">
              {/* Time Range Selector */}
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger className={selectTriggerClass} style={selectTriggerStyle}>
                  <Calendar className="w-4 h-4 mr-2 shrink-0" style={{ color: colors.primary }} />
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

              {/* Custom Date Range Button */}
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
                  {isCustomRange && (
                    <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">✓</span>
                  )}
                  <ChevronDown className={`w-4 h-4 shrink-0 text-current transition-transform ${showDatePicker ? "rotate-180" : ""}`} />
                </button>

                {showDatePicker && (
                  <div className={`absolute right-0 top-12 z-[10050] w-full rounded-2xl border p-4 shadow-xl sm:w-80 ${
                    isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white"
                  }`}>
                    <div className="space-y-4">
                      <h4 className={`font-semibold text-center border-b pb-2 ${
                        isDarkMode ? "text-slate-100 border-slate-700" : "text-[#1c1917] border-[#ede8e3]"
                      }`}>Select Custom Date Range</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>From Date</label>
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
                          <label className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>To Date</label>
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
                          <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>
                            {formatFullDate(fromDate)} to {formatFullDate(toDate)}
                          </p>
                        </div>
                      )}

                      <div className={`flex justify-end gap-2 pt-3 border-t ${isDarkMode ? "border-slate-700" : "border-[#ede8e3]"}`}>
                        <button onClick={() => setShowDatePicker(false)} className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors ${
                          isDarkMode ? "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700" : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"
                        }`}>Cancel</button>
                        <button onClick={handleCustomApply} disabled={!fromDate || !toDate} className={primaryButtonClass} style={primaryBtnStyle}>Apply Range</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

              <button
                data-tour="revenue-refresh"
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

      {/* Stats Cards */}
      <div data-tour="revenue-cards" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Total Revenue Card */}
        <div className={`rounded-2xl border p-4 ${isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white shadow-sm"}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl border"
                 style={{
                   backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                   borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                   color: isDarkMode ? colors.primary : colors.primaryText,
                 }}
            >
              <IndianRupee className="w-5 h-5 text-current" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>Total Revenue</p>
              <p className={`text-2xl font-bold ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>
                {formatCurrency(totalRevenue)}
              </p>
              <div className="mt-2 flex items-center text-xs font-semibold" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>
                <TrendingUp className="w-3 h-3 mr-1" style={{ color: colors.primary }} />
                <span>From {totalOrders} orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className={`rounded-2xl border p-4 ${isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white shadow-sm"}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl border"
                 style={{
                   backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                   borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                   color: isDarkMode ? colors.primary : colors.primaryText,
                 }}
            >
              <ShoppingBag className="w-5 h-5 text-current" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>Total Orders</p>
              <p className={`text-2xl font-bold ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>
                {totalOrders.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center text-xs font-semibold" style={{ color: isDarkMode ? colors.primary : colors.primaryText }}>
                <Clock className="w-3 h-3 mr-1" style={{ color: colors.primary }} />
                <span>{timeRangeLabels[timeRange]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart/Table Section */}
      <Tabs defaultValue="chart" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <div className={`rounded-2xl border ${isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white shadow-sm"}`}>
          <div className={`border-b p-4 ${isDarkMode ? "border-slate-700" : "border-[#ede8e3]"}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>
                  {timeRange === "1d" ? "Hourly Revenue" : "Revenue Trend"}
                </h3>
                <p className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>
                  {getDisplayRangeText()}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`flex h-10 items-center gap-1 rounded-xl border p-1 ${isDarkMode ? "border-slate-600 bg-slate-800" : "border-[#ede8e3] bg-[#f7f3ef]"}`}>
                  {["chart", "table"].map((tab) => (
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
                      {tab === "chart" ? <BarChartIcon className="w-4 h-4 shrink-0" /> : <TableIcon className="w-4 h-4 shrink-0" />}
                      {tab === "chart" ? "Chart" : "Table"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Chart Tab */}
            <TabsContent value="chart" className="mt-0">
              {isLoading ? (
                <div className={`h-[350px] flex flex-col items-center justify-center rounded-xl border ${isDarkMode ? "border-slate-700 bg-slate-800/40" : "border-[#ede8e3] bg-[#f7f3ef]"}`}>
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 mb-4" style={{ borderBottomColor: colors.primary }}></div>
                  <p className={`font-medium ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>Loading revenue data...</p>
                </div>
              ) : error ? (
                <div className={`h-[350px] flex flex-col items-center justify-center rounded-xl border p-6 ${isDarkMode ? "border-red-500/30 bg-red-500/10" : "border-red-200 bg-red-50"}`}>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <p className={`font-bold text-lg mb-2 ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>Failed to Load Data</p>
                  <p className={`text-center mb-6 ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>{error.message || "Unable to fetch revenue analytics."}</p>
                  <button onClick={handleRefresh} disabled={isRefreshing} className={primaryButtonClass} style={primaryBtnStyle}>
                    <RefreshCw className={`w-4 h-4 shrink-0 text-current ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Try Again"}
                  </button>
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={colors.primary} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#ede8e3"} />
                      <XAxis dataKey="date" tickFormatter={(tick) => formatChartDate(tick, timeRange)} axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? "#94a3b8" : "#78716c", fontSize: 11 }} minTickGap={20} />
                      <YAxis tickFormatter={formatCompactNumber} axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? "#94a3b8" : "#78716c", fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload
                            return (
                              <div className={`p-3 border rounded-xl shadow-lg min-w-[180px] ${isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white"}`}>
                                <p className={`text-sm font-semibold mb-2 border-b pb-2 ${isDarkMode ? "text-slate-100 border-slate-700" : "text-[#1c1917] border-[#ede8e3]"}`}>{formatTableDate(label, timeRange)}</p>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center gap-4">
                                    <span className={`text-xs flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: colors.primary }}></span>Revenue</span>
                                    <span className="text-sm font-bold" style={{ color: colors.primary }}>{formatCurrency(d.revenue)}</span>
                                  </div>
                                  {d.orders && (
                                    <div className="flex justify-between items-center gap-4">
                                      <span className={`text-xs flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>Orders</span>
                                      <span className={`text-sm font-medium ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>{d.orders}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                        cursor={{ stroke: colors.primary, strokeWidth: 1.5 }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke={colors.primary} strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ r: 3, fill: colors.primary, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5, fill: colors.primary, stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={`h-[350px] flex flex-col items-center justify-center rounded-xl border p-6 ${isDarkMode ? "border-slate-700 bg-slate-800/40" : "border-[#ede8e3] bg-[#f7f3ef]"}`}>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20">
                    <BarChartIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <p className={`font-bold text-lg mb-2 ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>No Revenue Data</p>
                  <p className={`text-center mb-4 text-sm ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>
                    {timeRange === "custom" && fromDate && toDate
                      ? `No completed orders found between ${new Date(fromDate).toLocaleDateString()} and ${new Date(toDate).toLocaleDateString()}`
                      : "No completed orders found for the selected time period."}
                  </p>
                  <button onClick={() => setTimeRange("all")} className={secondaryButtonClass} style={secondaryBtnStyle}>View All Time</button>
                </div>
              )}
            </TabsContent>

            {/* Table Tab */}
            <TabsContent value="table" className="mt-0">
              <div className={`overflow-hidden rounded-xl border ${isDarkMode ? "border-slate-700" : "border-[#ede8e3]"}`}>
                <Table containerClassName="max-h-[540px] overflow-x-auto overflow-y-auto">
                  <TableHeader className={`sticky top-0 z-10 ${isDarkMode ? "bg-slate-800" : "bg-[#f7f3ef]"}`}>
                    <TableRow>
                      <TableHead className={`font-semibold ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>Date</TableHead>
                      <TableHead className={`font-semibold text-right ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>Orders</TableHead>
                      <TableHead className={`font-semibold text-right ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mb-3" style={{ borderBottomColor: colors.primary }}></div>
                              <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>Loading table data...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : tableData.length > 0 ? (
                        tableData.map((row, index) => (
                          <TableRow key={row.displayDate || row._id || index} className={`border-b transition-colors ${isDarkMode ? "border-slate-700 hover:bg-slate-800/60" : "border-[#f0ebe5] hover:bg-[#faf7f4]"}`}>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors.primary }}></div>
                                <span className={`font-medium ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>{row.displayDate}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-3">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                                    style={{
                                      backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                                      borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                                      color: isDarkMode ? colors.primary : colors.primaryText,
                                    }}
                              >
                                {row.orders}
                              </span>
                            </TableCell>
                            <TableCell className="text-right py-3">
                              <span className="font-bold" style={{ color: colors.primary }}>{formatCurrency(row.revenue)}</span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                                   style={{
                                     backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                                   }}
                              >
                                <TableIcon className="h-5 w-5" style={{ color: colors.primary }} />
                              </div>
                              <p className={`mb-2 font-bold ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>No Data Available</p>
                              <p className={`max-w-md text-sm ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>
                                {timeRange === "custom" && fromDate && toDate
                                  ? `No revenue records found between ${new Date(fromDate).toLocaleDateString()} and ${new Date(toDate).toLocaleDateString()}`
                                  : "No revenue records found for the selected time period"}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
                
                {/* Table Footer */}
                {tableData.length > 0 && (
                  <div className={`border-t px-4 py-3 ${isDarkMode ? "border-slate-700 bg-slate-800/60" : "border-[#ede8e3] bg-[#f7f3ef]"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className={`text-sm ${isDarkMode ? "text-slate-400" : "text-[#78716c]"}`}>
                        Showing <span className="font-bold" style={{ color: colors.primary }}>{tableData.length}</span> records
                        {timeRange === "custom" && fromDate && toDate && (
                          <span className="ml-2 text-xs">
                            ({new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>Total Revenue:</span>
                        <span className="text-lg font-bold" style={{ color: colors.primary }}>
                          {formatCurrency(tableData.reduce((sum, row) => sum + row.revenue, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
