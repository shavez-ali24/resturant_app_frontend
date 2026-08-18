import React, { useMemo, useState } from "react";
import Heading from "../../common/Heading";
import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useGetOrdersQuery } from "@/redux/adminRedux/adminAPI";
import { useAdminTour } from "../../../../hooks/useAdminTour";
import { TOUR_KEYS, getCancelledSteps } from "../../../../utils/adminTour";
import OrdersTable from "../pendingOrders/OrdersTable";
import {
  Pagination, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
  PaginationContent, PaginationEllipsis,
} from "@/components/ui/pagination";
import { getCompactPageNumbers } from "@/lib/pagination";

const selectItemCls =
  "cursor-pointer rounded-lg text-sm font-medium text-[#44403c] hover:bg-[#f7f3ef] data-[highlighted]:bg-[#f0ebe5] data-[highlighted]:text-[#1c1917] dark:text-slate-200 dark:hover:bg-slate-800 dark:data-[highlighted]:bg-slate-800 dark:data-[highlighted]:text-slate-100";

const CancelledOrders = () => {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () =>
      setIsDarkMode(root.classList.contains("admin-dark") || root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useAdminTour(TOUR_KEYS.cancelled, getCancelledSteps, isDarkMode, 600);

  const [dateRange, setDateRange] = useState("7d");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);

  const resolvedRange = dateRange === "1d" ? "24h" : dateRange;

  const { data: ordersResponse = {}, isLoading, isError } = useGetOrdersQuery(
    { status: "cancelled", range: resolvedRange, page: currentPage, limit: ordersPerPage },
    { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true }
  );

  const orders = Array.isArray(ordersResponse?.orders) ? ordersResponse.orders : [];
  const totalPages = ordersResponse?.totalPages || 1;

  const handleDateRangeChange = (v) => { setDateRange(v); setCurrentPage(1); };
  const handlePageSizeChange = (v) => { setOrdersPerPage(Number(v)); setCurrentPage(1); };

  const pageNumbers = useMemo(
    () => getCompactPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const triggerCls = `h-9 w-full rounded-lg border px-3 text-xs font-semibold text-[#44403c] outline-none transition-all hover:border-[#d6cfc8] focus:ring-2 focus:ring-orange-200 ${isDarkMode
      ? "border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600 focus:ring-slate-600"
      : "border-[#ede8e3] bg-white"
    }`;

  const dropdownCls = `rounded-lg border p-1 shadow-lg ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-[#ede8e3] bg-white"
    }`;

  return (
    <div className={`flex h-screen flex-col overflow-hidden px-3 py-3 ${isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]"}`}>

      {/* ── Header ── */}
      <div
        data-tour="cancelled-heading"
        className="mb-2 flex flex-shrink-0 flex-col gap-2 px-1 py-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <Heading title="Cancelled Orders" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Date range */}
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className={`${triggerCls} sm:w-[145px]`}>
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent className={dropdownCls}>
              <SelectGroup>
                {[
                  ["24h", "Last 24 Hours"], ["2d", "Last 2 Days"], ["7d", "Last 7 Days"],
                  ["15d", "Last 15 Days"], ["30d", "Last 30 Days"],
                  ["6m", "Last 6 Months"], ["1y", "Last 1 Year"], ["all", "All Time"],
                ].map(([v, label]) => (
                  <SelectItem key={v} value={v} className={selectItemCls}>{label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Per page */}
          <Select value={String(ordersPerPage)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className={`${triggerCls} sm:w-[110px]`}>
              <SelectValue placeholder="Per Page" />
            </SelectTrigger>
            <SelectContent className={dropdownCls}>
              <SelectGroup>
                {[10, 20, 30, 40, 50].map((s) => (
                  <SelectItem key={s} value={String(s)} className={selectItemCls}>
                    {s} / Page
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Table card ── */}
      <div
        data-tour="cancelled-table"
        className={`min-h-0 flex-1 overflow-hidden rounded-xl border ${isDarkMode ? "border-slate-700/60 bg-[#1e293b]" : "border-[#ede8e3] bg-white"
          }`}
      >
        <OrdersTable
          orders={orders}
          loading={isLoading}
          error={isError}
          tableType="cancelled"
          containerVariant="plain"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex flex-shrink-0 justify-center pt-3 min-h-[44px]">
          <div className="w-full max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Pagination className="min-w-max">
              <PaginationContent className={`w-max min-w-max gap-1 rounded-lg border px-2 py-1 ${isDarkMode ? "border-slate-700/60 bg-[#1e293b]" : "border-[#ede8e3] bg-white"
                }`}>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                    className={`h-8 rounded-md border px-2 text-xs cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:px-3 sm:text-sm sm:[&>span]:inline ${currentPage === 1 ? "pointer-events-none opacity-40" : ""
                      } ${isDarkMode ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-[#ede8e3] bg-white text-gray-600 hover:bg-[#f7f3ef]"}`}
                  />
                </PaginationItem>
                {pageNumbers.map((page, idx) => (
                  <PaginationItem key={idx}>
                    {typeof page === "string" ? (
                      <PaginationEllipsis className="h-8 w-8" />
                    ) : (
                      <PaginationLink
                        isActive={currentPage === page}
                        className={`h-8 w-8 rounded-md border p-0 text-xs cursor-pointer sm:text-sm ${currentPage === page
                            ? "bg-orange-500 text-white border-orange-500"
                            : isDarkMode
                              ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                              : "border-[#ede8e3] bg-white text-gray-600 hover:bg-[#f7f3ef]"
                          }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                    className={`h-8 rounded-md border px-2 text-xs cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:px-3 sm:text-sm sm:[&>span]:inline ${currentPage === totalPages ? "pointer-events-none opacity-40" : ""
                      } ${isDarkMode ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-[#ede8e3] bg-white text-gray-600 hover:bg-[#f7f3ef]"}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelledOrders;
