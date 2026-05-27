import React, { useState, useEffect, useRef, useCallback } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
const SearchIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);
const FilterIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);
const XIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Options ───────────────────────────────────────────────────────────────────
const initialFilters = { search: "", category: "all", type: "all", available: "all" };

const typeOptions = [
  { value: "all",     label: "All Types" },
  { value: "veg",     label: "Veg" },
  { value: "non-veg", label: "Non-Veg" },
];

const availabilityOptions = [
  { value: "all",   label: "Any Status" },
  { value: "true",  label: "Available" },
  { value: "false", label: "Unavailable" },
];

// ── FilterDropdown ────────────────────────────────────────────────────────────
function FilterDropdown({ label, options, selectedValue, onSelect, isOpen, onToggle, isInModal = false }) {
  const ref = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (isOpen && ref.current && !ref.current.contains(event.target)) onToggle();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onToggle]);

  const selectedOption = options.find((opt) => String(opt.value) === String(selectedValue));
  const displayLabel = selectedOption ? selectedOption.label : options[0]?.label || "All";
  const isActive = selectedValue !== "all" && selectedValue !== "";

  return (
    <div className={`relative w-full flex-shrink-0 overflow-visible ${isInModal ? "" : "md:w-auto"}`} ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-lg border px-3 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-orange-200 ${
          isActive
            ? "border-orange-400 bg-orange-50 text-orange-600 dark:border-orange-500/60 dark:bg-orange-500/10 dark:text-orange-300"
            : "border-[#ede8e3] bg-white text-[#44403c] hover:border-[#d6cfc8] hover:bg-[#f7f3ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
        }`}
      >
        <span className="truncate">
          {label}: <span className="font-bold">{displayLabel}</span>
        </span>
        <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""} text-[#a8a29e] dark:text-slate-500`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[160px] overflow-hidden rounded-lg border border-[#ede8e3] bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="max-h-[160px] overflow-y-auto">
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onSelect(option.value)}
              className={`block w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                String(option.value) === String(selectedValue)
                  ? "bg-[#f7f3ef] font-semibold text-orange-500 dark:bg-slate-800 dark:text-orange-300"
                  : "text-[#44403c] hover:bg-[#f7f3ef] dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {option.label}
            </button>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── FilterModal (mobile) ──────────────────────────────────────────────────────
function FilterModal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/45 pt-16 backdrop-blur-[2px] md:hidden"
      onClick={(e) => { if (modalRef.current && !modalRef.current.contains(e.target)) onClose(); }}
    >
      <div
        ref={modalRef}
        className="relative mx-4 max-h-[82vh] w-full max-w-md overflow-y-auto rounded-xl border border-[#ede8e3] bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-[#1e293b]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#1c1917] dark:text-slate-100">Filters</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a8a29e] hover:bg-[#f7f3ef] hover:text-[#1c1917] dark:hover:bg-slate-700 dark:hover:text-slate-100"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── FilterControls ────────────────────────────────────────────────────────────
function FilterControls({
  filters, openDropdown, handleSearchChange, handleToggleDropdown,
  handleSelectFilter, handleResetFilters, categoryOptions,
  isInModal = false, showSearch = true,
}) {
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  return (
    <>
      {showSearch && (
        <div className="relative flex-grow md:min-w-[220px]">
          <label htmlFor="search" className="sr-only">Search</label>
          <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a8a29e]" />
          <input
            type="search"
            name="search"
            id="search"
            value={filters.search}
            onChange={handleSearchChange}
            className="h-9 w-full rounded-lg border border-[#ede8e3] bg-white pl-9 pr-3 text-xs text-[#1c1917] outline-none transition hover:border-[#d6cfc8] focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-orange-500"
            placeholder="Search by name or category..."
          />
        </div>
      )}

      <FilterDropdown
        label="Category"
        options={categoryOptions}
        selectedValue={filters.category}
        isOpen={openDropdown === "category"}
        onToggle={() => handleToggleDropdown("category")}
        onSelect={(value) => handleSelectFilter("category", value)}
        isInModal={isInModal}
      />

      <FilterDropdown
        label="Type"
        options={typeOptions}
        selectedValue={filters.type}
        isOpen={openDropdown === "type"}
        onToggle={() => handleToggleDropdown("type")}
        onSelect={(value) => handleSelectFilter("type", value)}
        isInModal={isInModal}
      />

      <FilterDropdown
        label="Status"
        options={availabilityOptions}
        selectedValue={filters.available}
        isOpen={openDropdown === "available"}
        onToggle={() => handleToggleDropdown("available")}
        onSelect={(value) => handleSelectFilter("available", String(value))}
        isInModal={isInModal}
      />

      <button
        type="button"
        onClick={handleResetFilters}
        className={`h-9 w-full flex-shrink-0 rounded-lg px-3 text-xs font-extrabold transition-all border md:w-auto ${
          isDarkMode
            ? "border-orange-500/35 bg-orange-950/20 text-orange-400 hover:bg-orange-950/40"
            : "border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300"
        }`}
      >
        Reset
      </button>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function MenuFilter({
  onFilterChange, categories, value, onResetNotify, layout = "auto", showSearch = true,
}) {
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));
  const isControlled = value != null && typeof onFilterChange === "function";
  const isPanelLayout = layout === "panel";

  const [uncontrolledFilters, setUncontrolledFilters] = useState(initialFilters);
  const filters = isControlled ? value : uncontrolledFilters;

  const setFilters = useCallback(
    (next) => { if (isControlled) onFilterChange(next); else setUncontrolledFilters(next); },
    [isControlled, onFilterChange]
  );

  const [openDropdown, setOpenDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState(null);

  useEffect(() => {
    if (!isControlled && onFilterChange) onFilterChange(filters);
  }, [filters, isControlled, onFilterChange]);

  const update = useCallback((partial) => setFilters({ ...filters, ...partial }), [filters, setFilters]);
  const handleToggleDropdown = useCallback((name) => setOpenDropdown((prev) => (prev === name ? null : name)), []);
  const handleMobileToggleDropdown = useCallback((name) => setMobileOpenDropdown((prev) => (prev === name ? null : name)), []);
  const handleSelectFilter = useCallback((name, value) => {
    update({ [name]: name === "available" ? String(value) : value });
    setOpenDropdown(null);
    setMobileOpenDropdown(null);
  }, [update]);
  const handleSearchChange = useCallback((e) => update({ search: e.target.value }), [update]);
  const handleResetFilters = useCallback(() => {
    update(initialFilters);
    setOpenDropdown(null);
    setMobileOpenDropdown(null);
    setIsModalOpen(false);
    if (typeof onResetNotify === "function") onResetNotify();
  }, [onResetNotify, update]);

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...(categories || []).map((cat) => ({ value: cat, label: cat })),
  ];

  if (isPanelLayout) {
    return (
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3">
        <FilterControls
          filters={filters} openDropdown={openDropdown}
          handleSearchChange={handleSearchChange} handleToggleDropdown={handleToggleDropdown}
          handleSelectFilter={handleSelectFilter} handleResetFilters={handleResetFilters}
          categoryOptions={categoryOptions} showSearch={showSearch}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Desktop */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        <FilterControls
          filters={filters} openDropdown={openDropdown}
          handleSearchChange={handleSearchChange} handleToggleDropdown={handleToggleDropdown}
          handleSelectFilter={handleSelectFilter} handleResetFilters={handleResetFilters}
          categoryOptions={categoryOptions} showSearch={showSearch}
        />
      </div>

      {/* Mobile trigger */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#ede8e3] bg-white px-3 text-xs font-semibold text-[#78716c] hover:bg-[#f7f3ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <FilterIcon className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Mobile modal */}
      <FilterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-col gap-3">
          <FilterControls
            filters={filters} openDropdown={mobileOpenDropdown}
            handleSearchChange={handleSearchChange} handleToggleDropdown={handleMobileToggleDropdown}
            handleSelectFilter={handleSelectFilter} handleResetFilters={handleResetFilters}
            categoryOptions={categoryOptions} isInModal={true} showSearch={showSearch}
          />
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className={`mt-1 h-9 w-full rounded-lg border text-xs font-extrabold transition-all ${
              isDarkMode
                ? "border-orange-500/35 bg-orange-950/20 text-orange-400 hover:bg-orange-950/40"
                : "border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300"
            }`}
          >
            Apply Filters
          </button>
        </div>
      </FilterModal>
    </div>
  );
}
