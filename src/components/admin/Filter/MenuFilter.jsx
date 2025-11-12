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
  { value: "veg", label: "🌱 Veg" },
  { value: "non-veg", label: "🍗 Non-Veg" },
];

const availabilityOptions = [
  { value: "all", label: "Any Status" },
  { value: "true", label: "Available" },
  { value: "false", label: "Unavailable" },
];

// Dropdown
function FilterDropdown({ label, options, selectedValue, onSelect, isOpen, onToggle }) {
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
    <div className="relative flex-shrink-0 w-full md:w-auto overflow-visible" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-2 text-base text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <span className="mr-2">
          {label}: <span className="font-semibold text-gray-900">{displayLabel}</span>
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full min-w-[200px] origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-2">
            {options.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onSelect(option.value)}
                className={`block w-full px-5 py-2.5 text-left text-base ${
                  String(option.value) === String(selectedValue)
                    ? "font-semibold bg-orange-50 text-orange-600"
                    : "text-gray-700 hover:bg-gray-100"
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
      className="fixed inset-0 z-40 flex items-start justify-center bg-black bg-opacity-50 transition-opacity md:hidden pt-16"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto rounded-b-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Filters</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-black">
            <XIcon className="h-6 w-6" />
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
}) {
  return (
    <>
      <div className="relative flex-grow md:min-w-[250px]">
        <label htmlFor="search" className="sr-only">Search</label>
        <input
          type="search"
          name="search"
          id="search"
          value={filters.search}
          onChange={handleSearchChange}
          className="h-12 w-full border border-gray-300 rounded-xl py-2 px-4 pl-10 text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
          placeholder="Search by name or category..."
        />
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
      </div>

      <FilterDropdown
        label="Category"
        options={categoryOptions}
        selectedValue={filters.category}
        isOpen={openDropdown === "category"}
        onToggle={() => handleToggleDropdown("category")}
        onSelect={(value) => handleSelectFilter("category", value)}
      />

      <FilterDropdown
        label="Food Type"
        options={typeOptions}
        selectedValue={filters.type}
        isOpen={openDropdown === "type"}
        onToggle={() => handleToggleDropdown("type")}
        onSelect={(value) => handleSelectFilter("type", value)}
      />

      <FilterDropdown
        label="Status"
        options={availabilityOptions}
        selectedValue={filters.available}
        isOpen={openDropdown === "available"}
        onToggle={() => handleToggleDropdown("available")}
        onSelect={(value) => handleSelectFilter("available", String(value))}
      />

      <button
        type="button"
        onClick={handleResetFilters}
        className="h-12 w-full md:w-auto flex-shrink-0 rounded-xl border border-transparent px-4 py-2 text-base font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900"
      >
        Reset Filters
      </button>
    </>
  );
}

// Main
export default function MenuFilter({ onFilterChange, categories, value }) {
  const isControlled = value != null && typeof onFilterChange === "function";

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

  useEffect(() => {
    if (!isControlled && onFilterChange) onFilterChange(filters);
  }, [filters, isControlled, onFilterChange]);

  const update = useCallback((partial) => setFilters({ ...filters, ...partial }), [filters, setFilters]);

  const handleToggleDropdown = useCallback((name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }, []);

  const handleSelectFilter = useCallback(
    (name, value) => {
      const normalized = name === "available" ? String(value) : value;
      update({ [name]: normalized });
      setOpenDropdown(null);
      setIsModalOpen(false);
    },
    [update]
  );

  const handleSearchChange = useCallback((e) => update({ search: e.target.value }), [update]);

  const handleResetFilters = useCallback(() => {
    update(initialFilters);
    setOpenDropdown(null);
    setIsModalOpen(false);
  }, [update]);

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...(categories || []).map((cat) => ({ value: cat, label: cat })),
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-200">
      <div className="hidden md:flex flex-wrap items-center gap-4">
        <FilterControls
          filters={filters}
          openDropdown={openDropdown}
          handleSearchChange={handleSearchChange}
          handleToggleDropdown={handleToggleDropdown}
          handleSelectFilter={handleSelectFilter}
          handleResetFilters={handleResetFilters}
          categoryOptions={categoryOptions}
        />
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
        >
          <FilterIcon className="h-5 w-5" />
          Filters
        </button>
      </div>

      <FilterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-col gap-4">
          <FilterControls
            filters={filters}
            openDropdown={openDropdown}
            handleSearchChange={handleSearchChange}
            handleToggleDropdown={handleToggleDropdown}
            handleSelectFilter={handleSelectFilter}
            handleResetFilters={handleResetFilters}
            categoryOptions={categoryOptions}
          />
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-orange-600"
          >
            Apply Filters
          </button>
        </div>
      </FilterModal>
    </div>
  );
}