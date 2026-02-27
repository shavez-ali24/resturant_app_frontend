/* CancelledOrders.jsx */

import React, { useMemo, useState } from "react";
import Heading from "../../common/Heading";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGetOrdersQuery } from "@/redux/adminRedux/adminAPI";

import OrdersTable from "../pendingOrders/OrdersTable";

import {
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationContent,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { getCompactPageNumbers } from "@/lib/pagination";

const CancelledOrders = () => {
  const [dateRange, setDateRange] = useState("7d");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const { data: ordersResponse = {}, isLoading, isError } = useGetOrdersQuery({
    status: "cancelled",
    range: dateRange,
    page: currentPage,
    limit: ordersPerPage,
  });

  const orders = Array.isArray(ordersResponse?.orders) ? ordersResponse.orders : [];
  const totalPages = ordersResponse?.totalPages || 1;

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    setCurrentPage(1);
  };

  const pageNumbers = useMemo(
    () => getCompactPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30 sm:px-2 lg:px-2">
      <div className="mx-2 mb-2 mt-2 flex flex-shrink-0 flex-row items-center justify-between gap-2 rounded-2xl border border-orange-100 bg-white/95 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:mx-4">
        <Heading title="Cancelled Orders" />

        <Select value={dateRange} onValueChange={handleDateRangeChange}>
          <SelectTrigger className="h-10 w-[145px] rounded-xl border border-orange-200 bg-white px-3 text-xs font-semibold uppercase text-gray-700 shadow-sm transition-all outline-none hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent className="min-w-[160px] rounded-xl border border-orange-200 bg-white p-1 shadow-xl">
            <SelectGroup>
              <SelectItem value="2d" className="cursor-pointer rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-100 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Last 2 Days</SelectItem>
              <SelectItem value="7d" className="cursor-pointer rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-100 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Last 7 Days</SelectItem>
              <SelectItem value="15d" className="cursor-pointer rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-100 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Last 15 Days</SelectItem>
              <SelectItem value="30d" className="cursor-pointer rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-100 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Last 30 Days</SelectItem>
              <SelectItem value="6m" className="cursor-pointer rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-100 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Last 6 Months</SelectItem>
              <SelectItem value="1y" className="cursor-pointer rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-100 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Last 1 Year</SelectItem>
              <SelectItem value="all" className="cursor-pointer rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-100 data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">All Time</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="mx-2 mt-2 flex-1 overflow-auto rounded-2xl border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:mx-4">
        <OrdersTable
          orders={orders}
          loading={isLoading}
          error={isError}
          tableType="cancelled"
        />
      </div>

      {totalPages > 1 && (
        <div className="flex-shrink-0 flex justify-center px-2 py-2">
          <div className="w-full max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Pagination className="min-w-max">
              <PaginationContent className="w-max min-w-max gap-1 rounded-xl border border-orange-200 bg-white/95 px-1.5 py-1 shadow-sm sm:px-2">

              {/* Prev */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  className={`h-7 rounded-md border border-orange-200 bg-white px-1.5 text-xs hover:bg-orange-50 cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:h-9 sm:rounded-lg sm:px-3 sm:text-sm sm:[&>span]:inline sm:[&_svg]:h-4 sm:[&_svg]:w-4 ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`}
                />
              </PaginationItem>

              {/* Page Button Logic */}
              {pageNumbers.map((page, idx) => (
                <PaginationItem key={idx}>
                  {typeof page === "string" ? (
                    <PaginationEllipsis className="h-7 w-7 cursor-pointer sm:h-9 sm:w-9" />
                  ) : (
                    <PaginationLink
                      isActive={currentPage === page}
                      className={`h-7 w-7 rounded-md border border-orange-200 p-0 text-[11px] cursor-pointer sm:h-9 sm:w-9 sm:rounded-lg sm:text-sm ${
                        currentPage === page
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 hover:from-orange-600 hover:to-orange-600"
                          : "bg-white text-gray-700 hover:bg-orange-50"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              {/* Next */}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    currentPage < totalPages && setCurrentPage(currentPage + 1)
                  }
                  className={`h-7 rounded-md border border-orange-200 bg-white px-1.5 text-xs hover:bg-orange-50 cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:h-9 sm:rounded-lg sm:px-3 sm:text-sm sm:[&>span]:inline sm:[&_svg]:h-4 sm:[&_svg]:w-4 ${
                    currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                  }`}
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
