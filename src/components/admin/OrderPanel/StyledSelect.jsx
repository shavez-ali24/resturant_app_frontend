/**
 * StyledSelect.jsx
 * ----------------------------------------------------------------------------
 * Lightweight production-ready custom select.
 *
 * Features:
 * - Opens upward
 * - Dark mode
 * - Disabled options
 * - Outside click
 * - Escape key support
 * - Keyboard navigation
 * - 4 visible rows before scrolling
 * - Accessible button/listbox semantics
 * - Stable event listeners
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { ChevronDown } from "lucide-react";
import {
  SELECT_ITEM_HEIGHT,
  SELECT_VISIBLE_ROWS,
} from "./AdminOrderPanel.constants";

const StyledSelect = React.memo(function StyledSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  isDarkMode,
  className = "",
  disabled = false,
}) {
  const colors = useSelector((state) => state.admin.theme.colors);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const listRef = useRef(null);
  const buttonRef = useRef(null);

  const listboxId = useId();

  /**
   * Keep options safe even if API temporarily returns invalid data.
   */
  const safeOptions = useMemo(
    () => (Array.isArray(options) ? options : []),
    [options]
  );

  const selectedIndex = useMemo(
    () => safeOptions.findIndex((option) => option?.value === value),
    [safeOptions, value]
  );

  const selectedOption =
    selectedIndex >= 0 ? safeOptions[selectedIndex] : null;

  const dropdownHeight = Math.min(
    safeOptions.length * SELECT_ITEM_HEIGHT,
    SELECT_VISIBLE_ROWS * SELECT_ITEM_HEIGHT
  );

  /**
   * Close dropdown when clicking outside.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  /**
   * Escape closes dropdown and returns focus to trigger.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  /**
   * Set initial highlighted option when opening.
   */
  useEffect(() => {
    if (!isOpen) return;

    if (selectedIndex >= 0 && !safeOptions[selectedIndex]?.disabled) {
      setHighlightedIndex(selectedIndex);
      return;
    }

    const firstEnabledIndex = safeOptions.findIndex(
      (option) => !option?.disabled
    );

    setHighlightedIndex(firstEnabledIndex);
  }, [isOpen, selectedIndex, safeOptions]);

  /**
   * Scroll highlighted option into view.
   */
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return;

    const list = listRef.current;
    const item = list?.children?.[highlightedIndex];

    item?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex, isOpen]);

  const selectOption = useCallback(
    (option) => {
      if (!option || option.disabled) return;

      onChange?.(option.value);
      setIsOpen(false);
      buttonRef.current?.focus();
    },
    [onChange]
  );

  const openDropdown = useCallback(() => {
    if (disabled || safeOptions.length === 0) return;

    setIsOpen((previous) => !previous);
  }, [disabled, safeOptions.length]);

  /**
   * Keyboard interaction.
   */
  const handleKeyDown = useCallback(
    (event) => {
      if (disabled) return;

      if (!isOpen) {
        if (
          event.key === "Enter" ||
          event.key === " " ||
          event.key === "ArrowDown" ||
          event.key === "ArrowUp"
        ) {
          event.preventDefault();
          setIsOpen(true);
        }

        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();

        const direction = event.key === "ArrowDown" ? 1 : -1;

        let nextIndex = highlightedIndex;

        for (let i = 0; i < safeOptions.length; i += 1) {
          nextIndex += direction;

          if (nextIndex < 0) {
            nextIndex = safeOptions.length - 1;
          }

          if (nextIndex >= safeOptions.length) {
            nextIndex = 0;
          }

          if (!safeOptions[nextIndex]?.disabled) {
            setHighlightedIndex(nextIndex);
            break;
          }
        }

        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();

        const option = safeOptions[highlightedIndex];

        if (option && !option.disabled) {
          selectOption(option);
        }

        return;
      }

      if (event.key === "Home") {
        event.preventDefault();

        const firstEnabled = safeOptions.findIndex(
          (option) => !option?.disabled
        );

        if (firstEnabled >= 0) {
          setHighlightedIndex(firstEnabled);
        }

        return;
      }

      if (event.key === "End") {
        event.preventDefault();

        for (let i = safeOptions.length - 1; i >= 0; i -= 1) {
          if (!safeOptions[i]?.disabled) {
            setHighlightedIndex(i);
            break;
          }
        }
      }
    },
    [
      disabled,
      highlightedIndex,
      isOpen,
      safeOptions,
      selectOption,
    ]
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Trigger */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        onClick={openDropdown}
        onKeyDown={handleKeyDown}
        className={`
          flex w-full items-center justify-between gap-2
          rounded-lg border px-3 py-2.5
          text-sm font-medium
          outline-none
          transition-colors duration-150
          focus-visible:ring-2
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        `}
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
          borderColor: isOpen
            ? colors.primary
            : isDarkMode
              ? "#475569"
              : "#ede8e3",
          color: isDarkMode ? "#cbd5e1" : "#1c1917",
          "--tw-ring-color": colors.primary,
        }}
      >
        <span
          className={`min-w-0 truncate ${
            selectedOption
              ? ""
              : isDarkMode
                ? "text-slate-500"
                : "text-slate-400"
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{
            color: isOpen
              ? colors.primary
              : isDarkMode
                ? "#64748b"
                : "#a8a29e",
          }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-label={placeholder}
          className={`
            absolute bottom-[calc(100%+6px)] left-0
            z-[200] w-full overflow-y-auto
            overscroll-contain rounded-lg border
            shadow-lg
            transition-all duration-150
            ${
              isDarkMode
                ? "border-slate-600 bg-[#1e293b] shadow-black/70"
                : "border-[#ede8e3] bg-white shadow-md"
            }
          `}
          style={{
            maxHeight: dropdownHeight,
          }}
        >
          {safeOptions.length === 0 ? (
            <div
              className={`px-3 py-3 text-sm ${
                isDarkMode
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              No options available
            </div>
          ) : (
            safeOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;
              const isOptionDisabled = Boolean(option.disabled);

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isOptionDisabled}
                  disabled={isOptionDisabled}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => {
                    if (!isOptionDisabled) {
                      setHighlightedIndex(index);
                    }
                  }}
                  className={`
                    flex w-full items-center
                    justify-between gap-2
                    px-3 text-left
                    text-sm font-medium
                    transition-colors duration-100
                    ${
                      isOptionDisabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }
                  `}
                  style={{
                    height: SELECT_ITEM_HEIGHT,
                    backgroundColor: isSelected
                      ? isDarkMode
                        ? `${colors.primary}25`
                        : `${colors.primary}10`
                      : isHighlighted
                        ? isDarkMode
                          ? "rgba(71,85,105,0.4)"
                          : "#f7f3ef"
                        : "transparent",
                    color: isSelected
                      ? isDarkMode
                        ? "#ffffff"
                        : colors.primary
                      : isDarkMode
                        ? "#cbd5e1"
                        : "#1c1917",
                  }}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDarkMode
                            ? "#475569"
                            : "#e2e8f0",
                      }}
                    />

                    <span className="truncate">
                      {option.label}
                    </span>
                  </span>

                  {isOptionDisabled && (
                    <span
                      className={`shrink-0 text-[11px] font-semibold ${
                        isDarkMode
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      Occupied
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
});

export default StyledSelect;