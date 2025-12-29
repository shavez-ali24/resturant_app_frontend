/* CancelledOrders.jsx */

import React, { useState } from "react";
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

  const pageNumbers = (() => {
    const pages = [];

    if (currentPage > 3) {
      pages.push(1);
      pages.push("ellipsis-1");
    }

    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, currentPage + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis-2");
      pages.push(totalPages);
    }

    return pages;
  })();

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-r from-orange-50/30 to-orange-100/40">
      <div className="mb-4 flex justify-between items-center">
        <Heading title="Cancelled Orders" />

        <Select value={dateRange} onValueChange={handleDateRangeChange}>
          <SelectTrigger className="h-9 w-[160px] rounded-lg bg-orange-100 border-orange-600 px-3 text-xs font-bold text-orange-700 uppercase shadow-sm">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent className="bg-orange-50 border-orange-300 shadow-xl rounded-xl p-1 min-w-[160px]">
            <SelectGroup>
              <SelectItem value="2d" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 2 Days</SelectItem>
              <SelectItem value="7d" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 7 Days</SelectItem>
              <SelectItem value="15d" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 15 Days</SelectItem>
              <SelectItem value="30d" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 30 Days</SelectItem>
              <SelectItem value="6m" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 6 Months</SelectItem>
              <SelectItem value="1y" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">Last 1 Year</SelectItem>
              <SelectItem value="all" className="data-[highlighted]:bg-orange-200 cursor-pointer text-orange-700">All Time</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <OrdersTable
        orders={orders}
        loading={isLoading}
        error={isError}
        tableType="cancelled"
      />

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center cursor-pointer">
          <Pagination>
            <PaginationContent>

              {/* Prev */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e) => currentPage > 1 && setCurrentPage(currentPage - 1)}
                />
              </PaginationItem>

              {/* Page Button Logic */}
              {pageNumbers.map((page, idx) => (
                <PaginationItem key={idx}>
                  {typeof page === "string" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      isActive={currentPage === page}
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
                />
              </PaginationItem>

            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default CancelledOrders;
