import { useState, useEffect, useRef, useCallback } from "react";
import { useNotify } from "../../../common/NotificationModal";
import {
  useGetTopSellingProductsQuery,
  useGetTopSellingCategoriesQuery,
} from "@/redux/adminRedux/adminAPI";
import { formatDateInput } from "../utils/formatters";

export const useAnalyticsData = () => {
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

  const refreshDebounceRef = useRef(null);
  const isRefreshingRef = useRef(false);

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

  const isProductsTab = activeTab === "products";
  const isCategoriesTab = activeTab === "categories";

  const {
    data: productsResponse,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useGetTopSellingProductsQuery(
    {
      range: isCustomRange ? "custom" : timeRange,
      ...(isCustomRange && { from: appliedFrom, to: appliedTo }),
    },
    {
      skip: !isProductsTab,
    }
  );

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useGetTopSellingCategoriesQuery(
    {
      range: isCustomRange ? "custom" : timeRange,
      ...(isCustomRange && { from: appliedFrom, to: appliedTo }),
    },
    {
      skip: !isCategoriesTab,
    }
  );

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
      setIsCustomRange(true);
      setShowDatePicker(false);
    }
  }, [fromDate, toDate]);

  const handleTimeRangeChange = useCallback((value) => {
    setTimeRange(value);
    setIsCustomRange(false);
    setAppliedFromDate("");
    setAppliedToDate("");
    setShowDatePicker(false);
  }, []);

  const handleResetDate = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    setFromDate(formatDateInput(startDate));
    setToDate(formatDateInput(endDate));
  }, []);

  const handleClearCustomRange = useCallback(() => {
    setIsCustomRange(false);
    setAppliedFromDate("");
    setAppliedToDate("");
    setTimeRange("1d");
  }, []);

  const runRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      const result = isProductsTab
        ? await refetchProducts()
        : await refetchCategories();

      if (result?.error) {
        const err = result.error;
        const msg = err?.data?.message || err?.error || err?.message || "Unable to refresh sales analytics.";
        notify(msg, "error");
        return;
      }

      notify("Sales analytics refreshed successfully.", "success");
    } catch (err) {
      const msg = err?.data?.message || err?.error || err?.message || "Unable to refresh sales analytics.";
      notify(msg, "error");
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [isProductsTab, refetchProducts, refetchCategories, notify]);

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

  const activeLoading = isProductsTab ? productsLoading : categoriesLoading;
  const activeError = isProductsTab
    ? (productsError || productsResponse?.error)
    : (categoriesError || categoriesResponse?.error);

  const activeData = isProductsTab ? productsResponse : categoriesResponse;

  return {
    activeTab,
    setActiveTab,
    timeRange,
    setTimeRange,
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
    isCategoriesTab,
  };
};
