import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { useOutletContext } from "react-router-dom";

import {
  useGetPublicRestaurantQuery,
  useGetMenuQuery,
} from "../redux/clientRedux/clientAPI";

import Header from "@/components/Client/Header";
import Category from "@/components/Client/Category";
import FoodListing from "@/components/Client/FoodListing";
import Filter from "@/components/Client/Filter";
import { getFriendlyErrorMessage } from "@/utils/errorHelpers";

const LOADER_MIN_DURATION = 100;

const EMPTY_FILTERS = {
  veg: false,
  nonVeg: false,
  egg: false,
  mixed: false,
  combo: false,
};

const normalizeCategoryValue = (value) => {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/-+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const getCategoryName = (category) => {
  if (!category) return "";

  if (typeof category === "object") {
    return category.name || category.category || "";
  }

  return category;
};

const getItemImage = (item) => {
  return (
    item?.image?.url ||
    item?.image?.secure_url ||
    (typeof item?.image === "string" ? item.image : "") ||
    item?.thumbnail?.url ||
    (typeof item?.thumbnail === "string" ? item.thumbnail : "")
  );
};

export default function Home() {
  const outletContext = useOutletContext() || {};

  const isDarkMode = Boolean(outletContext.isDarkMode);
  const toggleDarkMode =
    typeof outletContext.toggleDarkMode === "function"
      ? outletContext.toggleDarkMode
      : () => {};

  const {
    data: menuData,
    isLoading: menuLoading,
    isFetching: menuFetching,
    error: menuError,
    refetch: refetchMenu,
  } = useGetMenuQuery();

  const {
    data: restaurantData,
    isLoading: restaurantLoading,
    isFetching: restaurantFetching,
    error: restaurantError,
    refetch: refetchRestaurant,
  } = useGetPublicRestaurantQuery();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [, setTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  const initialLoading = menuLoading || restaurantLoading;
  const fetching = menuFetching || restaurantFetching;
  const error = menuError || restaurantError;

  /**
   * Keep the initial loader visible for a very short minimum duration.
   * This prevents a flash of loader/content on very fast requests.
   */
  useEffect(() => {
    if (initialLoading) {
      setShowLoader(true);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowLoader(false);
    }, LOADER_MIN_DURATION);

    return () => window.clearTimeout(timer);
  }, [initialLoading]);

  /**
   * Normalize restaurant response once.
   */
  const restaurant = useMemo(() => {
    if (restaurantData?.restaurant) {
      return restaurantData.restaurant;
    }

    if (restaurantData && typeof restaurantData === "object") {
      return restaurantData;
    }

    return {};
  }, [restaurantData]);

  /**
   * Normalize menu response once.
   */
  const menu = useMemo(() => {
    if (Array.isArray(menuData)) {
      return menuData;
    }

    if (Array.isArray(menuData?.menu)) {
      return menuData.menu;
    }

    if (Array.isArray(menuData?.data?.menu)) {
      return menuData.data.menu;
    }

    if (Array.isArray(menuData?.data)) {
      return menuData.data;
    }

    return [];
  }, [menuData]);

  /**
   * Restaurant open/closed state.
   */
  const isRestaurantOpen =
    restaurant.isOpen === undefined
      ? true
      : Boolean(restaurant.isOpen);

  /**
   * Sort categories according to backend displayOrder.
   */
  const orderedCategories = useMemo(() => {
    if (!Array.isArray(restaurant.categories)) {
      return [];
    }

    return restaurant.categories
      .map((category, index) => ({
        category,
        index,
        order: Number(category?.displayOrder),
      }))
      .sort((a, b) => {
        const aValid = Number.isFinite(a.order);
        const bValid = Number.isFinite(b.order);

        if (aValid && bValid && a.order !== b.order) {
          return a.order - b.order;
        }

        if (aValid && !bValid) return -1;
        if (!aValid && bValid) return 1;

        return a.index - b.index;
      })
      .map(({ category }) => category);
  }, [restaurant.categories]);

  /**
   * Create category -> image mapping.
   */
  const categoryImages = useMemo(() => {
    const imageMap = {};

    for (const item of menu) {
      const category = normalizeCategoryValue(item?.category);

      if (!category || imageMap[category]) {
        continue;
      }

      const image = getItemImage(item);

      if (image) {
        imageMap[category] = image;
      }
    }

    return imageMap;
  }, [menu]);

  /**
   * Only show categories that actually contain menu items.
   */
  const clientVisibleCategories = useMemo(() => {
    const menuCategories = new Set(
      menu
        .map((item) => normalizeCategoryValue(item?.category))
        .filter(Boolean)
    );

    const source = orderedCategories.length
      ? orderedCategories
      : menu;

    return source.filter((category) => {
      const categoryName = getCategoryName(category);

      return menuCategories.has(
        normalizeCategoryValue(categoryName)
      );
    });
  }, [orderedCategories, menu]);

  /**
   * Determine which filters should be displayed.
   */
  const hasCombo = useMemo(
    () => menu.some((item) => item?.pricingType === "combo"),
    [menu]
  );

  const showEggFilter = useMemo(
    () => menu.some((item) => item?.type === "egg"),
    [menu]
  );

  const showVegNonVegFilters = useMemo(() => {
    const types = new Set(
      menu
        .map((item) => item?.type)
        .filter(Boolean)
    );

    return types.size > 1;
  }, [menu]);

  /**
   * Filter menu.
   */
  const normalizedSearch = search.trim().toLowerCase();
  const normalizedActiveCategory =
    normalizeCategoryValue(activeCategory);

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const itemName = String(item?.name || "").toLowerCase();
      const itemDescription = String(
        item?.description || ""
      ).toLowerCase();

      /**
       * Search
       */
      if (
        normalizedSearch &&
        !itemName.includes(normalizedSearch) &&
        !itemDescription.includes(normalizedSearch)
      ) {
        return false;
      }

      /**
       * Food type filters.
       *
       * Preserve your existing behavior:
       * only one of veg/nonVeg/egg/mixed filters acts
       * as a type filter at a time.
       */
      const typeFilters = [
        filters.veg && item?.type === "veg",
        filters.nonVeg && item?.type === "non-veg",
        filters.egg && item?.type === "egg",
        filters.mixed && item?.type === "mixed",
      ];

      const hasTypeFilter =
        filters.veg ||
        filters.nonVeg ||
        filters.egg ||
        filters.mixed;

      if (
        hasTypeFilter &&
        !typeFilters.some(Boolean)
      ) {
        return false;
      }

      /**
       * Combo filter.
       */
      if (
        filters.combo &&
        item?.pricingType !== "combo"
      ) {
        return false;
      }

      /**
       * Category filter.
       */
      if (
        normalizedActiveCategory &&
        normalizeCategoryValue(item?.category) !==
          normalizedActiveCategory
      ) {
        return false;
      }

      return true;
    });
  }, [
    menu,
    filters,
    normalizedSearch,
    normalizedActiveCategory,
  ]);

  /**
   * Handle food filter.
   */
  const handleFilterChange = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));

    if (value === true) {
      setActiveCategory(null);
    }
  };

  /**
   * Handle category selection.
   */
  const handleCategoryClick = (category) => {
    const nextCategory = normalizeCategoryValue(category);

    setActiveCategory((previous) => {
      const previousCategory =
        normalizeCategoryValue(previous);

      return previousCategory === nextCategory
        ? null
        : category;
    });

    setFilters(EMPTY_FILTERS);
  };

  /**
   * Retry API requests without a complete browser reload.
   */
  const handleRetry = () => {
    refetchMenu();
    refetchRestaurant();
  };

  /**
   * Initial loading screen.
   */
  if (showLoader) {
    return (
      <div
        className={`relative flex min-h-screen max-h-screen items-center justify-center overflow-hidden ${
          isDarkMode
            ? "bg-gradient-to-b from-[#0f172a] to-[#020617]"
            : "bg-gradient-to-b from-[#fffdf7] to-[#fef2d8]"
        }`}
      >
        <img
          src="/loader.gif"
          alt="Loading restaurant menu"
          width="240"
          height="240"
          className="relative h-60 w-auto"
          loading="eager"
        />
      </div>
    );
  }

  /**
   * Error state.
   */
  if (error && menu.length === 0 && !restaurant?.name) {
    const friendlyMessage = getFriendlyErrorMessage(
      error,
      "We couldn't load the menu right now. Please check your internet connection."
    );

    return (
      <div
        className={`flex min-h-[60vh] flex-col items-center justify-center p-6 text-center ${
          isDarkMode
            ? "text-slate-200"
            : "text-gray-800"
        }`}
      >
        <div
          className={`max-w-md rounded-2xl border p-8 shadow-lg ${
            isDarkMode
              ? "border-slate-800 bg-slate-900/50"
              : "border-orange-100 bg-white"
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-500 dark:bg-orange-950/30">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="mb-2 text-lg font-bold">
            Unable to Load Menu
          </h2>

          <p
            className={`mb-6 text-sm ${
              isDarkMode
                ? "text-slate-400"
                : "text-gray-500"
            }`}
          >
            {friendlyMessage}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            disabled={fetching}
            className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {fetching ? "Retrying..." : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  const hasActiveFilter =
    filters.veg ||
    filters.nonVeg ||
    filters.egg ||
    filters.mixed ||
    filters.combo;

  const hasFiltering =
    Boolean(normalizedSearch) ||
    hasActiveFilter ||
    Boolean(activeCategory);

  const restaurantLogo =
    restaurant?.logo?.url || "";

  const restaurantName =
    restaurant?.restaurantName ||
    restaurant?.name ||
    "";

  const reopenAt =
    restaurant?.reopenAt || "";

  return (
    <div
      className={`flex h-[100dvh] flex-col overflow-hidden ${
        isDarkMode ? "text-slate-100" : ""
      }`}
    >
      {!isRestaurantOpen && !isSidebarOpen && (
        <div
          className={`z-30 shrink-0 border-b px-3 py-2.5 shadow-[0_8px_18px_rgba(239,68,68,0.14)] ${
            isDarkMode
              ? "border-orange-500/30 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"
              : "border-orange-300/70 bg-gradient-to-r from-orange-100 via-red-50 to-orange-100"
          }`}
        >
          <div
            className={`mx-auto flex max-w-[520px] items-center justify-center gap-3 rounded-lg border px-3.5 py-2 ${
              isDarkMode
                ? "border-orange-500/40 bg-slate-900/85 text-orange-100"
                : "border-orange-300/70 bg-white/85 text-orange-900"
            }`}
          >
            <Clock
              className="h-5 w-5 shrink-0 text-orange-700"
              aria-hidden="true"
            />

            <div className="text-left leading-tight">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-red-600 sm:text-base">
                Restaurant Closed
              </p>

              <p className="text-[13px] font-semibold text-orange-800 sm:text-sm">
                {reopenAt
                  ? `Reopens at ${reopenAt}`
                  : "We'll be back soon"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`z-20 shrink-0 border-b shadow-[0_8px_20px_rgba(239,159,39,0.1)] ${
          isDarkMode
            ? "border-slate-700/70 bg-slate-900"
            : "border-orange-200/50 bg-[#fffcf9]"
        }`}
      >
        <Header
          logo={restaurantLogo}
          siteName={restaurantName}
          search={search}
          onSearch={setSearch}
          isRestaurantOpen={isRestaurantOpen}
          onSidebarToggle={setIsSidebarOpen}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        <Category
          title="Choose Your Favourite Food"
          categories={clientVisibleCategories}
          onCategoryClick={handleCategoryClick}
          activeCategory={activeCategory}
          categoryImages={categoryImages}
          hasActiveFilter={hasActiveFilter}
          hideAllButton={false}
        />

        <Filter
          filters={filters}
          onChange={handleFilterChange}
          isDarkMode={isDarkMode}
          hasCombo={hasCombo}
          showVegNonVegFilters={showVegNonVegFilters}
          showEggFilter={showEggFilter}
        />
      </div>

      <div
        className={`flex-1 overflow-y-auto overscroll-contain ios-scroll-container ${
          isDarkMode
            ? "bg-slate-950/60"
            : "bg-[#fffcf9]"
        }`}
      >
        {filteredMenu.length === 0 && hasFiltering ? (
          <div
            className={`flex flex-col items-center justify-center px-4 py-16 text-center ${
              isDarkMode
                ? "text-slate-300"
                : "text-gray-500"
            }`}
          >
            <p
              className={`mb-1 text-base font-semibold sm:text-lg ${
                isDarkMode
                  ? "text-slate-100"
                  : "text-gray-700"
              }`}
            >
              {filters.combo
                ? "No combo items available"
                : filters.veg
                  ? "No veg items available"
                  : filters.nonVeg
                    ? "No non-veg items available"
                    : filters.egg
                      ? "No egg items available"
                      : filters.mixed
                        ? "No mixed items available"
                        : activeCategory
                          ? `No items in ${activeCategory}`
                          : "No items found"}
            </p>

            <p className="max-w-xs text-xs sm:text-sm">
              {normalizedSearch
                ? "Try adjusting your search to find the food you're craving."
                : "Check back later or try different filters."}
            </p>
          </div>
        ) : (
          <FoodListing
            menu={filteredMenu}
            onQuantityChange={setTotal}
            isRestaurantOpen={isRestaurantOpen}
            isDarkMode={isDarkMode}
            categoryOrder={orderedCategories}
          />
        )}
      </div>
    </div>
  );
}