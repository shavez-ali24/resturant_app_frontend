import { useState, useEffect, useRef, useCallback } from "react";
import { useNotify } from "../../../common/NotificationModal";
import { useGetAnalyticsQuery } from "@/redux/adminRedux/adminAPI";
import { formatDateInput, getBackendDateParts } from "../utils/formatters";

export const useRevenueData = () => {
  const [timeRange, setTimeRange] = useState("1d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [activeTab, setActiveTab] = useState("chart");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshQueued, setIsRefreshQueued] = useState(false);
  const notify = useNotify();

  const refreshDebounceRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Get domain
  const domain = localStorage.getItem("userDomain") || "restaurant";

  const isCustomRange = timeRange === "custom";

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

      setFromDate(formatDateInput(startDate));
      setToDate(formatDateInput(endDate));
    }
  }, [showDatePicker, fromDate, toDate]);

  const appliedFrom = appliedFromDate || fromDate;
  const appliedTo = appliedToDate || toDate;

  // RTK Query for analytics
  const { data: analyticsData, isLoading, error, refetch } = useGetAnalyticsQuery(
    {
      domain: domain,
      range: timeRange === "custom" ? "all" : timeRange,
      from: timeRange === "custom" && appliedFrom ? appliedFrom : undefined,
      to: timeRange === "custom" && appliedTo ? appliedTo : undefined,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  // Filter data for custom range client-side
  const filterDataForCustomRange = useCallback((data) => {
    if (!appliedFrom || !appliedTo || !data) return [];

    const start = new Date(appliedFrom);
    start.setHours(0, 0, 0, 0);

    const end = new Date(appliedTo);
    end.setHours(23, 59, 59, 999);

    return data.filter((item) => {
      const itemDate = new Date(item.date.replace(" ", "T") + "Z");
      return itemDate >= start && itemDate <= end;
    });
  }, [appliedFrom, appliedTo]);

  // Group data by date for long ranges
  const groupChartDataByDate = useCallback((data) => {
    if (!data.length) return [];

    const grouped = {};

    data.forEach((item) => {
      const dateKey = getBackendDateParts(item.date).date;
      if (!dateKey) return;

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          revenue: 0,
          orders: 0,
        };
      }
      grouped[dateKey].revenue += item.revenue || 0;
      grouped[dateKey].orders += 1;
    });

    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, []);

  const handleCustomApply = useCallback(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      if (from > to) {
        alert("From date cannot be after To date");
        return;
      }

      setAppliedFromDate(fromDate);
      setAppliedToDate(toDate);
      setTimeRange("custom");
      setShowDatePicker(false);
    }
  }, [fromDate, toDate]);

  const handleTimeRangeChange = useCallback((value) => {
    setTimeRange(value);
    if (value !== "custom") {
      setFromDate("");
      setToDate("");
      setAppliedFromDate("");
      setAppliedToDate("");
      setShowDatePicker(false);
    }
  }, []);

  const handleResetDate = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    setFromDate(formatDateInput(startDate));
    setToDate(formatDateInput(endDate));
    setAppliedFromDate("");
    setAppliedToDate("");
    setTimeRange("1d");
    setShowDatePicker(false);
  }, []);

  const handleClearCustomRange = useCallback(() => {
    handleResetDate();
  }, [handleResetDate]);

  const runRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      const result = await refetch();
      if (result?.error) {
        const err = result.error;
        const msg = err?.data?.message || err?.error || err?.message || "Unable to refresh revenue analytics.";
        notify(msg, "error");
        return;
      }
      notify("Revenue analytics refreshed successfully.", "success");
    } catch (err) {
      const msg = err?.data?.message || err?.error || err?.message || "Unable to refresh revenue analytics.";
      notify(msg, "error");
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [refetch, notify]);

  const handleRefresh = useCallback(() => {
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
  }, [runRefresh]);

  return {
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
  };
};
