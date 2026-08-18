"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import {
  useGetPublicRestaurantQuery,
  useGetMenuQuery,
} from "../redux/clientRedux/clientAPI";
import Header from "@/components/Client/Header";
import Category from "@/components/Client/Category";
import FoodListing from "@/components/Client/FoodListing";
import loader from "@/assets/loader.gif";
import Filter from "@/components/Client/Filter";
import { getFriendlyErrorMessage } from "@/utils/errorHelpers";

// ── Utility: normalize category string (moved outside component to avoid recreation) ──
const normalizeCategoryValue = (value) =>
  String(value || "")
    .replace(/-+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// ── Static config ──
const LOADER_MIN_DURATION = 100;

export default function Home() {
  const outletContext = useOutletContext() || {};
  const isDarkMode = Boolean(outletContext?.isDarkMode);
  const toggleDarkMode = outletContext?.toggleDarkMode || (() => { });

  const {
    data: menuData,
    isLoading: menuLoading,
    error: menuError,
  } = useGetMenuQuery();
  const {
    data: restaurantData,
    isLoading: restaurantLoading,
    error: restaurantError,
  } = useGetPublicRestaurantQuery();

  const [filters, setFilters] = useState({ veg: false, nonVeg: false, egg: false, mixed: false, combo: false });
  const [search, setSearch] = useState("");
  const [, setTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  // Combine both loading states
  const loading = menuLoading || restaurantLoading;
  const error = menuError || restaurantError;

  useEffect(() => {
    let timer;
    if (loading) {
      setShowLoader(true);
    } else {
      timer = setTimeout(() => {
        setShowLoader(false);
      }, LOADER_MIN_DURATION);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const restaurant = restaurantData?.restaurant || restaurantData || {};
  const menu =
    menuData?.menu ||
    menuData?.data?.menu ||
    (Array.isArray(menuData) ? menuData : []);

  const isRestaurantOpen =
    restaurant?.isOpen === undefined ? true : Boolean(restaurant.isOpen);

  const rawCategories =
    Array.isArray(restaurant?.categories) && restaurant.categories.length
      ? restaurant.categories
      : Array.isArray(restaurantData?.restaurant?.categories) &&
        restaurantData.restaurant.categories.length
        ? restaurantData.restaurant.categories
        : [];

  const orderedCategories = Array.isArray(rawCategories)
    ? rawCategories
      .map((category, index) => ({ category, index }))
      .sort((a, b) => {
        const aOrder = Number(a.category?.displayOrder);
        const bOrder = Number(b.category?.displayOrder);
        const aValid = Number.isFinite(aOrder);
        const bValid = Number.isFinite(bOrder);
        if (aValid && bValid && aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        if (aValid && !bValid) return -1;
        if (!aValid && bValid) return 1;
        return a.index - b.index;
      })
      .map(({ category }) => category)
    : [];

  const categoryImages = useMemo(() => {
    const imageMap = {};
    const list = Array.isArray(menu) ? menu : [];
    list.forEach((item) => {
      const key = normalizeCategoryValue(item?.category);
      if (!key || imageMap[key]) return;
      const candidate =
        item?.image?.url ||
        item?.image?.secure_url ||
        item?.image ||
        item?.thumbnail?.url ||
        item?.thumbnail;
      if (candidate) {
        imageMap[key] = candidate;
      }
    });
    return imageMap;
  }, [menu, normalizeCategoryValue]);

  const clientVisibleCategories = useMemo(() => {
    const list = orderedCategories.length ? orderedCategories : menu;
    const activeMenuCategories = new Set(
      menu.map((item) => normalizeCategoryValue(item?.category))
    );
    return list.filter((cat) => {
      const label = typeof cat === "object" && cat !== null ? cat.name || cat.category : cat;
      return activeMenuCategories.has(normalizeCategoryValue(label));
    });
  }, [orderedCategories, menu]);

  const hasCombo = useMemo(() => {
    return Array.isArray(menu) && menu.some((item) => item?.pricingType === "combo");
  }, [menu]);

  const showVegNonVegFilters = useMemo(() => {
    if (!Array.isArray(menu)) return false;
    const hasVeg = menu.some((item) => item?.type === "veg");
    const hasNonVeg = menu.some((item) => item?.type === "non-veg");
    return hasVeg && hasNonVeg;
  }, [menu]);

  if (showLoader)
    return (
      <div className={`relative flex min-h-screen max-h-screen items-center justify-center overflow-hidden ${isDarkMode
          ? "bg-gradient-to-b from-[#0f172a] to-[#020617]"
          : "bg-gradient-to-b from-[#fffdf7] to-[#fef2d8]"
        }`}>
        <img
          src="/loader.gif"
          alt="Loading..."
          width="240"
          height="240"
          className="relative h-60 w-auto"
        />
      </div>
    );

  if (error) {
    const friendlyMsg = getFriendlyErrorMessage(error, "We couldn't load the menu right now. Please check your internet connection.");
    return (
      <div className={`flex min-h-[60vh] flex-col items-center justify-center p-6 text-center ${isDarkMode ? "text-slate-200" : "text-gray-800"}`}>
        <div className={`max-w-md rounded-2xl border p-8 shadow-lg ${isDarkMode ? "border-slate-800 bg-slate-900/50" : "border-orange-100 bg-white"}`}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-500">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold">Unable to Load Menu</h2>
          <p className={`text-sm mb-6 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>{friendlyMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition-all shadow-md"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const normalizedActiveCategory = normalizeCategoryValue(activeCategory);

  const filteredMenu = menu.filter((item) => {
    const itemName = item?.name?.toLowerCase() || "";
    const itemDesc = item?.description?.toLowerCase() || "";
    const searchText = search?.toLowerCase() || "";

    const matchesSearch =
      itemName.includes(searchText) || itemDesc.includes(searchText);

    if (!matchesSearch) return false;

    if (filters.veg && !filters.nonVeg && !filters.egg && !filters.mixed && item.type !== "veg") return false;
    if (filters.nonVeg && !filters.veg && !filters.egg && !filters.mixed && item.type !== "non-veg") return false;
    if (filters.egg && !filters.veg && !filters.nonVeg && !filters.mixed && item.type !== "egg") return false;
    if (filters.mixed && item.type !== "mixed") return false;
    if (filters.combo && item.pricingType !== "combo") return false;
    if (
      normalizedActiveCategory &&
      normalizeCategoryValue(item.category) !== normalizedActiveCategory
    ) {
      return false;
    }

    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Koi bhi type filter ON hone par active category reset karo
    if (value === true) {
      setActiveCategory(null);
    }
  };

  const handleCategoryClick = (category) => {
    const normalizedNext = normalizeCategoryValue(category);
    setActiveCategory((prev) => {
      const normalizedPrev = normalizeCategoryValue(prev);
      return normalizedPrev === normalizedNext ? null : category;
    });
    // Category select hone par saare type filters reset karo
    setFilters({ veg: false, nonVeg: false, egg: false, mixed: false, combo: false });
  };

  return (
    <div className={`h-[100dvh] flex flex-col overflow-hidden ${isDarkMode ? "text-slate-100" : ""}`}>
      {/* Orders Closed Banner */}
      {!isRestaurantOpen && !isSidebarOpen && (
        <div className={`z-30 shrink-0 border-b px-3 py-2.5 shadow-[0_8px_18px_rgba(239,68,68,0.14)] ${isDarkMode ? "border-orange-500/30 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" : "border-orange-300/70 bg-gradient-to-r from-orange-100 via-red-50 to-orange-100"}`}>
          <div className={`mx-auto flex max-w-[520px] items-center justify-center gap-3 rounded-lg border px-3.5 py-2 ${isDarkMode ? "border-orange-500/40 bg-slate-900/85 text-orange-100" : "border-orange-300/70 bg-white/85 text-orange-900"}`}>
            <Clock className="h-5 w-5 flex-shrink-0 text-orange-700" />
            <div className="text-left leading-tight">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-red-600 sm:text-base">
                Restaurant Closed
              </p>
              <p className="text-[13px] font-semibold text-orange-800 sm:text-sm">
                {restaurant?.reopenAt || restaurantData?.restaurant?.reopenAt
                  ? `Reopens at ${restaurant?.reopenAt || restaurantData?.restaurant?.reopenAt
                  }`
                  : "We'll be back soon"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`shrink-0 z-20 border-b shadow-[0_8px_20px_rgba(239,159,39,0.1)] ${isDarkMode ? "border-slate-700/70 bg-slate-900" : "border-orange-200/50 bg-[#fffcf9]"}`}>
        <Header
          logo={restaurant?.logo?.url || restaurantData?.restaurant?.logo?.url}
          siteName={
            restaurant?.restaurantName ||
            restaurantData?.restaurant?.restaurantName
          }
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
          hasActiveFilter={filters.veg || filters.nonVeg || filters.egg || filters.mixed || filters.combo}
          hideAllButton={false}
        />
        <Filter
          filters={filters}
          onChange={handleFilterChange}
          isDarkMode={isDarkMode}
          hasCombo={hasCombo}
          showVegNonVegFilters={showVegNonVegFilters}
        />
      </div>

      <div className={`flex-1 overflow-y-auto overscroll-contain ios-scroll-container ${isDarkMode ? "bg-slate-950/60" : "bg-[#fffcf9]"}`}>
        {filteredMenu.length === 0 && (search.trim() || filters.veg || filters.nonVeg || filters.egg || filters.mixed || filters.combo || activeCategory) ? (
          <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${isDarkMode ? "text-slate-300" : "text-gray-500"}`}>
            <p className={`mb-1 text-base sm:text-lg font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-700"}`}>
              {filters.combo ? "No combo items available" :
                filters.veg ? "No veg items available" :
                  filters.nonVeg ? "No non-veg items available" :
                    filters.egg ? "No egg items available" :
                      filters.mixed ? "No mixed items available" :
                      activeCategory ? `No items in ${activeCategory}` :
                        search.trim() ? "No items found" : "No items available"}
            </p>
            <p className="text-xs sm:text-sm max-w-xs">
              {search.trim() ? "Try adjusting your search to find the food you're craving." : "Check back later or try different filters."}
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