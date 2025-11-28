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
        className="fixed bottom-40 right-6 z-20 bg-primary text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl hover:scale-105 active:scale-95 transition-transform duration-200"
      >
        <Search size={20} />
      </button>

      {/* 🔽 Animated Search Bar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Background Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
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
              className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl px-4 pt-4 pb-6 z-50 rounded-t-3xl"
            >
              <div className="max-w-md mx-auto space-y-3">
                {/* Header text */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">
                    Find your favourite <span className="text-primary">food</span>
                  </p>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition"
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
                      className="w-full rounded-full pl-9 pr-4 py-1 bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 shadow-sm outline-none focus:bg-white focus:border-primary focus:ring-0 transition-all duration-200"
                    />
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-150"
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
