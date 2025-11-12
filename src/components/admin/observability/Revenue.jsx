
import React, { useState, useEffect, useRef, useCallback } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import config from "../../../config"
import Heading from "../ui/Heading"

const chartConfig = {
  revenue: { label: "Revenue", color: "#f97316" },
}

// Helper function to format currency
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)

// Helper function to format Y-axis (e.g., 10000 -> ₹10k)
const formatYAxis = (value) => {
  if (value >= 1000) {
    return `₹${value / 1000}k`
  }
  return `₹${value}`
}

export default function RevenueWithDatePicker() {
  const [allChartData, setAllChartData] = useState([])
  const [filteredChartData, setFilteredChartData] = useState([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [filteredOrders, setFilteredOrders] = useState(0)
  const [filteredRevenue, setFilteredRevenue] = useState(0)
  const [timeRange, setTimeRange] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [domain, setDomain] = useState("")
  const [currentFilter, setCurrentFilter] = useState("all")
  const [xAxisFormat, setXAxisFormat] = useState("day") // 'hour', 'day', 'month'

  const [chartDomain, setChartDomain] = useState(['auto', 'auto'])

  const dropdownRef = useRef(null)

  useEffect(() => {
    const userDomain = localStorage.getItem("userDomain")
    setDomain(userDomain || "restaurant")
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const createDemoData = () => {
    const demoData = []
    const now = new Date()
    let totalRev = 0
    let totalOrd = 0

    // Create 30 days of demo data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const revenue = Math.floor(Math.random() * 2000) + 500
      demoData.push({
        date: date, // Pass the raw Date object
        revenue: revenue,
      })
      totalRev += revenue
      totalOrd += Math.floor(Math.random() * 3) + 1
    }

    setAllChartData(demoData)
    setTotalOrders(totalOrd)
    setTotalRevenue(totalRev)

    // Apply default filter (which will be 'all' initially)
    filterData("all", "", "", demoData, totalOrd, totalRev)
    setCurrentFilter("demo")
  }

  const filterData = (
    range,
    customFrom = "",
    customTo = "",
    dataToFilter = allChartData, // Allow passing in fresh data
    allOrders = totalOrders,      // Allow passing in fresh totals
    allRevenue = totalRevenue     // Allow passing in fresh totals
  ) => {
    if (!dataToFilter.length && range !== "all") { // Keep 'all' to set empty domain
      setFilteredChartData([]);
      setFilteredOrders(0);
      setFilteredRevenue(0);
      setCurrentFilter("nodata");
      return;
    }

    const now = new Date()
    let startDate, endDate
    let filterType = "all"
    let daysInRange = 9999

    if (customFrom && customTo) {
      startDate = new Date(customFrom)
      startDate.setHours(0, 0, 0, 0) // Start of day
      endDate = new Date(customTo)
      endDate.setHours(23, 59, 59, 999) // End of day
      filterType = "custom"
    } else {
      endDate = new Date(now)
      switch (range) {
        case "1d":
          startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
          break
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "15d":
          startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
          break
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case "6m":
          startDate = new Date(now)
          startDate.setMonth(now.getMonth() - 6)
          break
        case "1y":
          startDate = new Date(now)
          startDate.setFullYear(now.getFullYear() - 1)
          break
        default: // 'all'
          startDate = new Date(0) // The beginning of time
          endDate = new Date(8640000000000000) // The end of time
      }
      filterType = range === "all" ? "all" : "timeRange"
    }

    if (filterType !== "all") {
      daysInRange = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    }

    // --- Smart Axis Logic ---
    if (daysInRange <= 2) {
      setXAxisFormat("hour")
    } else if (daysInRange <= 60) {
      setXAxisFormat("day")
    } else {
      setXAxisFormat("month")
    }
    // --- End Smart Axis Logic ---

    const filtered = dataToFilter.filter((item) => {
      const itemTime = item.date.getTime()
      return itemTime >= startDate.getTime() && itemTime <= endDate.getTime()
    })

    // --- Set Domain ---
    if (filterType === "all") {
      if (filtered.length > 0) {
        // Use the full range of the available data
        const firstDate = filtered[0].date.getTime();
        const lastDate = filtered[filtered.length - 1].date.getTime();
        setChartDomain([firstDate, lastDate]);
      } else {
        setChartDomain(['auto', 'auto']); // Fallback
      }
    } else {
      // Force the domain to the selected filter range
      setChartDomain([startDate.getTime(), endDate.getTime()]);
    }
    // --- End Set Domain ---

    if (filterType === "all") {
      setFilteredRevenue(allRevenue)
      setFilteredOrders(allOrders)
    } else {
      const totalRev = filtered.reduce((sum, item) => sum + item.revenue, 0)
      const totalOrd = filtered.length // This might be inaccurate if data isn't 1-to-1 with orders
      setFilteredRevenue(totalRev)
      setFilteredOrders(totalOrd)
    }

    setFilteredChartData(filtered) // Pass the raw filtered data
    setCurrentFilter(filtered.length === 0 ? "nodata" : filterType)
  }

  const fetchAllData = useCallback(async (currentRange) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const userDomain = localStorage.getItem("userDomain") || "restaurant"

      if (!token) {
        createDemoData()
        return
      }

      const params = new URLSearchParams({
        domain: userDomain,
        range: currentRange, // Pass the selected range to the API
      })
      const url = `${config.BASE_URL}/api/analytics/insights?${params.toString()}`
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        createDemoData()
        return
      }

      const data = await response.json()

      if (data && data.chartData && Array.isArray(data.chartData) && data.chartData.length > 0) {

        // ✅✅✅ THIS IS THE FIX ✅✅✅
        // Robust date parsing to ensure UTC time is handled correctly
        const transformedData = data.chartData.map((item) => {
          let dateString = item.date;

          if (typeof dateString === 'string') {
            // 1. Replace any space with 'T'
            dateString = dateString.replace(' ', 'T');

            // 2. Add 'Z' if it's a T-string and has no timezone info
            if (dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-')) {
              dateString += 'Z';
            }
          }

          return {
            date: new Date(dateString), // This will now parse correctly as UTC
            revenue: item.revenue || 0,
          };
        });
        // ✅✅✅ END OF FIX ✅✅✅

        setAllChartData(transformedData)

        const totalRev =
          data.totalRevenue !== undefined
            ? data.totalRevenue
            : transformedData.reduce((sum, item) => sum + item.revenue, 0)
        const totalOrd = data.totalOrders !== undefined ? data.totalOrders : transformedData.length

        setTotalOrders(totalOrd)
        setTotalRevenue(totalRev)

        // Apply filter
        filterData(currentRange, "", "", transformedData, totalOrd, totalRev)
      } else {
        // Handle case where API returns empty data
        setAllChartData([])
        setTotalOrders(data.totalOrders || 0)
        setTotalRevenue(data.totalRevenue || 0)
        filterData(currentRange, "", "", [], data.totalOrders || 0, data.totalRevenue || 0)
      }
    } catch (error) {
      createDemoData()
    } finally {
      setLoading(false)
    }
  }, []) // No dependencies, will be called with range


  useEffect(() => {
    // Fetch data on initial load
    fetchAllData(timeRange)
  }, [fetchAllData]) // only depends on fetchAllData

  const handleTimeRangeChange = (value) => {
    setTimeRange(value)
    setFromDate("")
    setToDate("")

    // If data is hourly, we *must* refetch from the API
    if (value === "1d" || value === "7d") {
      fetchAllData(value)
    } else {
      // Otherwise, we can just filter the existing data
      filterData(value)
    }
  }

  const handleApply = () => {
    if (fromDate && toDate) {
      // Custom range *always* filters existing data
      filterData("", fromDate, toDate)
      setShowDatePicker(false)
      setTimeRange("custom") // Set a custom value for the dropdown
    }
  }

  const handleClear = () => {
    setFromDate("")
    setToDate("")
    setTimeRange("all")
    filterData("all")
  }

  const getFilterDescription = () => {
    const rangeLabels = {
      "1d": "Last 1 day",
      "7d": "Last 7 days",
      "15d": "Last 15 days",
      "30d": "Last 30 days",
      "6m": "Last 6 months",
      "1y": "Last 1 year",
    }
    if (currentFilter === "timeRange") {
      return rangeLabels[timeRange] || `Last ${timeRange}`
    } else if (currentFilter === "custom") {
      return `Custom range: ${fromDate} to ${toDate}`
    } else if (currentFilter === "demo") {
      return "Demo data (API unavailable)"
    } else if (currentFilter === "nodata") {
      return "No data for selected range"
    }
    return "All time data"
  }

  const getDisplayOrders = () => (currentFilter === "all" ? totalOrders : filteredOrders)
  const getDisplayRevenue = () => (currentFilter === "all" ? totalRevenue : filteredRevenue)

  // Formatter function for the X-axis component
  const formatXAxisTick = (tick) => {
    try {
      const date = new Date(tick) // 'tick' will be a timestamp
      if (xAxisFormat === "hour") {
        return date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }) // e.g., "6 PM"
      }
      if (xAxisFormat === "month") {
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      }
      // Default to 'day'
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } catch (e) {
      return tick // Fallback
    }
  }

  return (
    <Card className="rounder-none border-0 shadow-none">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:gap-4 border-b py-5">
    
        <div className="flex-1 grid gap-3 ">
          <Heading title={"Revenue Analytics"} />
          
          <div className="mt-2 text-sm">
            <CardDescription>
            {domain && `Domain: ${domain} | `}
            {loading ? "Loading..." : getFilterDescription()}
          </CardDescription>
            <span className="font-semibold text-orange-600">
              {currentFilter === "all" ? "Total Orders:" : "Orders:"}
            </span>{" "}
            {getDisplayOrders()} |{" "}
            <span className="font-semibold text-orange-600">
              {currentFilter === "all" ? "Total Revenue:" : "Revenue:"}
            </span>{" "}
            {formatCurrency(getDisplayRevenue())}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-full sm:w-[160px] rounded-lg" aria-label="Select a value">
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">All Time</SelectItem>
              <SelectItem value="1d" className="rounded-lg">Last 1 day</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
              <SelectItem value="15d" className="rounded-lg">Last 15 days</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="6m" className="rounded-lg">Last 6 months</SelectItem>
              <SelectItem value="1y" className="rounded-lg">Last 1 year</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 mt-2 sm:mt-0 w-full sm:w-auto transition-colors"
            >
              Custom Range
            </button>

            {showDatePicker && (
              <div className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-64 bg-white border border-gray-200 shadow-xl rounded-lg z-10 p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <input
                      type="date"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <input
                      type="date"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleApply}
                    disabled={!fromDate || !toDate}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleClear}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="aspect-auto h-[250px] w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <div className="text-gray-500">Loading chart data...</div>
            </div>
          </div>
        ) : filteredChartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={filteredChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="date"
                type="number" // Use 'number' for timestamps
                scale="time"   // Tell recharts it's a time scale
                domain={chartDomain} // Force the domain
                allowDataOverflow={true} // Ensure domain is respected
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatXAxisTick} // Formatter handles timestamps
                minTickGap={20} // Prevent labels from overlapping
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatYAxis} // Use 'k' formatter
                domain={[0, "auto"]} // Start Y-axis at 0
              />
              <ChartTooltip
                cursor={{ stroke: "#f97316", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(label, payload) => {
                      try {
                        // payload[0].payload.date is the Date object
                        const date = new Date(payload[0].payload.date)
                        if (xAxisFormat === "hour") {
                          return date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            hour12: true
                          })
                        }
                        return date.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })
                      } catch (e) {
                        return label
                      }
                    }}
                    formatter={(value) => [formatCurrency(value), "Revenue"]}
                  />
                }
              />
              <Area
                dataKey="revenue"
                type="monotone"
                fill="url(#fillRevenue)"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2, fill: "#f97316" }}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="aspect-auto h-[250px] w-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-2">No data available for selected range</div>
              <div className="text-gray-400 text-sm">Try selecting a different time range</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}