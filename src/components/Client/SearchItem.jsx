import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchItem({ search, onSearch }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 🔍 Floating Search Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-[0_10px_22px_rgba(249,115,22,0.4)] transition-transform duration-200 hover:scale-105 hover:shadow-[0_14px_26px_rgba(249,115,22,0.45)] active:scale-95 sm:h-12 sm:w-12"
      >
        <Search size={18} />
      </button>

      {/* 🔽 Animated Search Bar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Background Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            {/* Search Bar Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 15,
                duration: 0.25,
              }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-orange-100/80 bg-gradient-to-b from-white via-orange-50 to-orange-50 px-4 pb-6 pt-4 shadow-2xl"
            >
              <div className="mx-auto max-w-md space-y-3">
                {/* Header text */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    Find your favourite <span className="text-primary">food</span>
                  </p>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-gray-500 transition hover:bg-orange-100 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Search input row */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      type="text"
                      placeholder="Search for dishes..."
                      value={search}
                      onChange={(e) => onSearch(e.target.value)}
                      className="w-full rounded-full border border-orange-100 bg-white py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-primary focus:bg-white focus:ring-0"
                    />
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all duration-150 hover:bg-primary/90 hover:shadow-lg active:scale-95 sm:h-11 sm:w-11"
                    title="Search"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
