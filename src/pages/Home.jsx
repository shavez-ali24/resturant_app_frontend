"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import {
  useGetRestaurantQuery,
  useGetMenuQuery,
} from "../redux/clientRedux/clientAPI";
import Header from "@/components/Client/Header";
import Category from "@/components/Client/Category";
import FoodListing from "@/components/Client/FoodListing";
import loader from "@/assets/loader.gif";
import Filter from "@/components/Client/Filter";

export default function Home() {
  const outletContext = useOutletContext() || {};
  const isDarkMode = Boolean(outletContext?.isDarkMode);
  const toggleDarkMode = outletContext?.toggleDarkMode || (() => {});

  const {
    data: menuData,
    isLoading: menuLoading,
    error: menuError,
  } = useGetMenuQuery();
  const {
    data: restaurantData,
    isLoading: restaurantLoading,
    error: restaurantError,
  } = useGetRestaurantQuery();

  const [filters, setFilters] = useState({ veg: false, nonVeg: false, mixed: false, combo: false });
  const [search, setSearch] = useState("");
  const [, setTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  const normalizeCategoryValue = (value) =>
    String(value || "")
      .replace(/-+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

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
      }, 2000);
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

  if (showLoader)
    return (
      <div className={`relative flex min-h-screen max-h-screen items-center justify-center overflow-hidden ${isDarkMode ? "bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#020617]" : "bg-gradient-to-b from-[#fffdf9] via-[#fff8ef] to-[#fff2e6]"}`}>
        <div className={`pointer-events-none absolute inset-0 ${isDarkMode ? "bg-[radial-gradient(circle_at_18%_22%,rgba(249,115,22,0.22),transparent_44%),radial-gradient(circle_at_82%_76%,rgba(251,146,60,0.14),transparent_42%)]" : "bg-[radial-gradient(circle_at_18%_22%,rgba(249,115,22,0.12),transparent_44%),radial-gradient(circle_at_82%_76%,rgba(251,146,60,0.1),transparent_42%)]"}`} />
        <img
          src={loader}
          alt="Loading..."
          className="relative h-60 w-auto drop-shadow-[0_14px_30px_rgba(249,115,22,0.22)]"
        />
      </div>
    );

  if (error) {
    return (
      <p>
        Error: {error?.data?.message || error?.message || "An error occurred"}
      </p>
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

    if (filters.veg && !filters.nonVeg && !filters.mixed && item.type !== "veg") return false;
    if (filters.nonVeg && !filters.veg && !filters.mixed && item.type !== "non-veg") return false;
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
    setFilters({ veg: false, nonVeg: false, mixed: false, combo: false });
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
                  ? `Reopens at ${
                      restaurant?.reopenAt || restaurantData?.restaurant?.reopenAt
                    }`
                  : "We'll be back soon"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`shrink-0 z-20 border-b shadow-[0_8px_20px_rgba(249,115,22,0.1)] ${isDarkMode ? "border-slate-700/70 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-800/80" : "border-orange-200/60 bg-gradient-to-b from-orange-50/95 via-orange-50/80 to-orange-50/45"}`}>
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
          categories={orderedCategories.length ? orderedCategories : menu}
          onCategoryClick={handleCategoryClick}
          activeCategory={activeCategory}
          categoryImages={categoryImages}
          hasActiveFilter={filters.veg || filters.nonVeg || filters.mixed || filters.combo}
        />
        <Filter filters={filters} onChange={handleFilterChange} isDarkMode={isDarkMode} />
      </div>

      <div className={`flex-1 overflow-y-auto overscroll-contain ios-scroll-container ${isDarkMode ? "bg-slate-950/60" : "bg-white"}`}>
        {filteredMenu.length === 0 && (search.trim() || filters.veg || filters.nonVeg || filters.mixed || filters.combo || activeCategory) ? (
          <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${isDarkMode ? "text-slate-300" : "text-gray-500"}`}>
            <p className={`mb-1 text-base sm:text-lg font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-700"}`}>
              {filters.combo ? "No combo items available" :
               filters.veg ? "No veg items available" :
               filters.nonVeg ? "No non-veg items available" : 
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
