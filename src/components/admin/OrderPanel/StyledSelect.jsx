/**
 * StyledSelect.jsx
 * ----------------------------------------------------------------------------
 * Custom dropdown select that opens upward (used near the bottom of the
 * panel to avoid clipping). Supports dark mode, shows 4 rows before
 * scrolling. Used primarily for table/room selection.
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SELECT_ITEM_HEIGHT, SELECT_VISIBLE_ROWS } from "./AdminOrderPanel.constants";

/**
 * StyledSelect
 * @param {Object} props
 * @param {string} props.value – Currently selected value.
 * @param {(v: string) => void} props.onChange
 * @param {Array<{ value: string, label: string }>} props.options
 * @param {string} [props.placeholder]
 * @param {boolean} props.isDarkMode
 * @param {string} [props.className]
 */
const StyledSelect = React.memo(function StyledSelect({
  value,
  onChange,
  options,
  placeholder,
  isDarkMode,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const dropdownHeight = Math.min(
    options.length * SELECT_ITEM_HEIGHT,
    SELECT_VISIBLE_ROWS * SELECT_ITEM_HEIGHT
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 outline-none ${
          isDarkMode
            ? `bg-slate-800 text-slate-200 ${isOpen ? "border-orange-500 ring-2 ring-orange-500/20" : "border-slate-600 hover:border-orange-400"}`
            : `bg-white text-[#1c1917] ${isOpen ? "border-orange-400 ring-2 ring-orange-100" : "border-[#ede8e3] hover:border-orange-300"}`
        }`}
      >
        <span className={selectedOption ? "" : isDarkMode ? "text-slate-500" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder || "Select..."}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-[200] w-full rounded-lg border shadow-lg overflow-hidden ${
              isDarkMode
                ? "bg-[#1e293b] border-slate-600 shadow-black/70"
                : "bg-white border-[#ede8e3] shadow-md"
            }`}
            style={{
              bottom: "calc(100% + 6px)",
              top: "auto",
              maxHeight: dropdownHeight,
              overflowY: options.length > SELECT_VISIBLE_ROWS ? "auto" : "hidden",
            }}
          >
            {options.map((opt) => {
              const isDisabled = Boolean(opt.disabled);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { if (!isDisabled) { onChange(opt.value); setIsOpen(false); } }}
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  style={{ height: SELECT_ITEM_HEIGHT }}
                  className={`w-full text-left px-3 text-sm font-medium transition-all duration-150 flex items-center justify-between gap-2 ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : value === opt.value
                        ? isDarkMode ? "bg-orange-500/25 text-orange-300" : "bg-[#f7f3ef] text-orange-500"
                        : isDarkMode ? "text-slate-200 hover:bg-slate-700" : "text-[#1c1917] hover:bg-[#f7f3ef]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0 transition-colors"
                      style={{ backgroundColor: value === opt.value ? "#f97316" : isDarkMode ? "#475569" : "#e2e8f0" }}
                    />
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isDisabled && (
                    <span className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Occupied</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default StyledSelect;