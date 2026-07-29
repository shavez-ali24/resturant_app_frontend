/**
 * StyledSelect.jsx
 * ----------------------------------------------------------------------------
 * Custom dropdown select that opens upward (used near the bottom of the
 * panel to avoid clipping). Supports dark mode, shows 4 rows before
 * scrolling. Used primarily for table/room selection.
 */

import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
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
  disabled = false,
}) {
  const colors = useSelector((state) => state.admin.theme.colors);
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
        disabled={disabled}
        onClick={() => { if (!disabled) setIsOpen((p) => !p); }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 outline-none"
        style={disabled ? {} : {
          backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
          borderColor: isOpen
            ? colors.primary
            : (isDarkMode ? "#475569" : "#ede8e3"),
          color: isDarkMode ? "#cbd5e1" : "#1c1917"
        }}
      >
        <span className={selectedOption ? "" : isDarkMode ? "text-slate-500" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder || "Select..."}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: isOpen ? colors.primary : (isDarkMode ? "#64748b" : "#a8a29e") }}
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
                  className="w-full text-left px-3 text-sm font-medium transition-all duration-150 flex items-center justify-between gap-2"
                  style={{
                    height: SELECT_ITEM_HEIGHT,
                    backgroundColor: value === opt.value
                      ? (isDarkMode ? `${colors.primary}25` : `${colors.primary}10`)
                      : "transparent",
                    color: value === opt.value
                      ? (isDarkMode ? "#ffffff" : colors.primary)
                      : (isDarkMode ? "#cbd5e1" : "#1c1917")
                  }}
                  onMouseEnter={(e) => {
                    if (value !== opt.value) {
                      e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(71, 85, 105, 0.4)" : "#f7f3ef";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== opt.value) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0 transition-colors"
                      style={{ backgroundColor: value === opt.value ? colors.primary : isDarkMode ? "#475569" : "#e2e8f0" }}
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