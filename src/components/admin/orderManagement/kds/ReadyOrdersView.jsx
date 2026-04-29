import React, { useMemo, useState, useEffect } from "react";
import KitchenDisplayCard from "./KitchenDisplayCard";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

const ITEMS_PER_PAGE = 4;

const ReadyOrdersView = ({ 
  orders, 
  isDarkMode, 
  updateOrder, 
  onDismiss,
  isLoading 
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting: Oldest Ready First
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    });
  }, [orders]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / ITEMS_PER_PAGE));

  // Clamp page if orders decrease
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedOrders, currentPage]);

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <span className="text-sm font-bold text-blue-500 uppercase tracking-widest">Loading Ready Orders...</span>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center opacity-20">
          <Inbox size={80} strokeWidth={1} />
          <span className="text-xl font-black uppercase tracking-tighter">No Ready Orders</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">
          {paginatedOrders.map((order) => (
            <KitchenDisplayCard
              key={order._id || order.id}
              order={order}
              isDarkMode={isDarkMode}
              updateOrder={updateOrder}
              onDismiss={onDismiss}
            />
          ))}
          {/* Fill empty slots to maintain grid if needed */}
          {paginatedOrders.length < ITEMS_PER_PAGE && 
            Array.from({ length: ITEMS_PER_PAGE - paginatedOrders.length }).map((_, i) => (
              <div key={`empty-${i}`} className="hidden lg:block h-0 opacity-0" />
            ))
          }
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="shrink-0 p-3 flex items-center justify-between border-t bg-white">
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
            Ready: {orders.length}
          </span>
          <span className="text-[10px] font-black uppercase text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-4 py-2 bg-slate-100 rounded-lg text-[11px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-slate-200"
          >
            <ChevronLeft size={16} strokeWidth={3} /> PREV
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-slate-800"
          >
            NEXT <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadyOrdersView;