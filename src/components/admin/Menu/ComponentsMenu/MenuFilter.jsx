import React, { useState, useEffect, useRef, useCallback } from "react";

// Icons
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

// Shared options
const initialFilters = {
  search: "",
  category: "all",
  type: "all",
  available: "all", // "all" | "true" | "false"
};

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "veg", label: "Veg" },
  { value: "non-veg", label: "Non-Veg" },
];

const availabilityOptions = [
  { value: "all", label: "Any Status" },
  { value: "true", label: "Available" },
  { value: "false", label: "Unavailable" },
];

// Dropdown
function FilterDropdown({ label, options, selectedValue, onSelect, isOpen, onToggle, isInModal = false }) {
  const ref = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (isOpen && ref.current && !ref.current.contains(event.target)) {
        onToggle();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onToggle]);

  const selectedOption = options.find((opt) => String(opt.value) === String(selectedValue));
  const displayLabel = selectedOption ? selectedOption.label : options[0]?.label || "All";

  return (
    <div className={`relative w-full flex-shrink-0 overflow-visible ${isInModal ? "" : "md:w-auto"}`} ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:border-orange-300 hover:bg-orange-50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
      >
        <span className="mr-2">
          {label}: <span className="font-semibold text-gray-900">{displayLabel}</span>
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-gray-500 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-60 w-full min-w-[200px] origin-top-right overflow-y-auto rounded-xl border border-orange-200 bg-white p-1 shadow-xl focus:outline-none">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onSelect(option.value)}
                className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm ${
                  String(option.value) === String(selectedValue)
                    ? "bg-orange-100 font-semibold text-orange-700"
                    : "text-gray-700 hover:bg-orange-50"
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

// Mobile modal
function FilterModal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/45 pt-16 backdrop-blur-[2px] md:hidden"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="relative mx-4 max-h-[82vh] w-full max-w-md overflow-y-auto rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)]"
        onClick={(e) => e.stopPropagation()} // Stop propagation to prevent modal from closing when clicking inside
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-orange-100 hover:text-orange-700"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Filter controls row
function FilterControls({
  filters,
  openDropdown,
  handleSearchChange,
  handleToggleDropdown,
  handleSelectFilter,
  handleResetFilters,
  categoryOptions,
  isInModal = false,
  showSearch = true
}) {
  return (
    <>
      {showSearch && (
        <div className="relative flex-grow rounded-xl border border-orange-200 bg-white shadow-sm md:min-w-[250px]">
          <label htmlFor="search" className="sr-only">Search</label>
          <input
            type="search"
            name="search"
            id="search"
            value={filters.search}
            onChange={handleSearchChange}
            className="h-11 w-full rounded-xl border border-orange-200 bg-white px-4 py-2 pl-10 text-sm outline-none hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
            placeholder="Search by name or category..."
          />
          <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
        label="Food Type"
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
        className="h-11 w-full flex-shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-orange-600 md:w-auto"
      >
        Reset Filters
      </button>
    </>
  );
}

// Main
export default function MenuFilter({
  onFilterChange,
  categories,
  value,
  onResetNotify,
  layout = "auto",
  showSearch = true,
}) {
  const isControlled = value != null && typeof onFilterChange === "function";
  const isPanelLayout = layout === "panel";

  const [uncontrolledFilters, setUncontrolledFilters] = useState(initialFilters);
  const filters = isControlled ? value : uncontrolledFilters;

  const setFilters = useCallback(
    (next) => {
      if (isControlled) onFilterChange(next);
      else setUncontrolledFilters(next);
    },
    [isControlled, onFilterChange]
  );

  const [openDropdown, setOpenDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState(null);

  useEffect(() => {
    if (!isControlled && onFilterChange) onFilterChange(filters);
  }, [filters, isControlled, onFilterChange]);

  const update = useCallback((partial) => setFilters({ ...filters, ...partial }), [filters, setFilters]);

  const handleToggleDropdown = useCallback((name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }, []);

  const handleMobileToggleDropdown = useCallback((name) => {
    setMobileOpenDropdown((prev) => (prev === name ? null : name));
  }, []);

  const handleSelectFilter = useCallback(
    (name, value) => {
      const normalized = name === "available" ? String(value) : value;
      update({ [name]: normalized });
      setOpenDropdown(null);
      setMobileOpenDropdown(null);
      // Don't close modal when selecting filter in mobile
    },
    [update]
  );

  const handleSearchChange = useCallback((e) => update({ search: e.target.value }), [update]);

  const handleResetFilters = useCallback(() => {
    update(initialFilters);
    setOpenDropdown(null);
    setMobileOpenDropdown(null);
    setIsModalOpen(false);
    if (typeof onResetNotify === "function") {
      onResetNotify();
    }
  }, [onResetNotify, update]);

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...(categories || []).map((cat) => ({ value: cat, label: cat })),
  ];

  if (isPanelLayout) {
    return (
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
        <FilterControls
          filters={filters}
          openDropdown={openDropdown}
          handleSearchChange={handleSearchChange}
          handleToggleDropdown={handleToggleDropdown}
          handleSelectFilter={handleSelectFilter}
          handleResetFilters={handleResetFilters}
          categoryOptions={categoryOptions}
          showSearch={showSearch}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="hidden md:flex flex-wrap items-center gap-4 ">
        <FilterControls
          filters={filters}
          openDropdown={openDropdown}
          handleSearchChange={handleSearchChange}
          handleToggleDropdown={handleToggleDropdown}
          handleSelectFilter={handleSelectFilter}
          handleResetFilters={handleResetFilters}
          categoryOptions={categoryOptions}
          showSearch={showSearch}
        />
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:border-orange-300 hover:bg-orange-50"
        >
          <FilterIcon className="h-4 w-4" />
          Filters
        </button>
      </div>

      <FilterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-col gap-4">
          <FilterControls
            filters={filters}
            openDropdown={mobileOpenDropdown}
            handleSearchChange={handleSearchChange}
            handleToggleDropdown={handleMobileToggleDropdown}
            handleSelectFilter={handleSelectFilter}
            handleResetFilters={handleResetFilters}
            categoryOptions={categoryOptions}
            isInModal={true}
            showSearch={showSearch}
          />
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-orange-600"
          >
            Apply Filters
          </button>
        </div>
      </FilterModal>
    </div>
  );
}
