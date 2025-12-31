"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import {
  useGetRestaurantQuery,
  useGetMenuQuery,
} from "../redux/clientRedux/clientAPI";
import Header from "@/components/Client/Header";
import Category from "@/components/Client/Category";
import FoodListing from "@/components/Client/FoodListing";
import loader from "@/assets/loader.gif";
import Filter from "@/components/Client/Filter";
import RestaurantClosed from "@/components/Client/RestaurantClosed";
import fingerprintService from "@/service/fingerprintService";

export default function Home() {
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

  const [showLoader, setShowLoader] = useState(true);
  const [filters, setFilters] = useState({ veg: false, nonVeg: false });
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);

  // Combine both loading states
  const loading = menuLoading || restaurantLoading;
  const error = menuError || restaurantError;

  // Get fingerprint on component mount
  useEffect(() => {
    fingerprintService.getFingerprint();
  }, []);

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

  if (showLoader)
    return (
      <div className="flex justify-center items-center max-h-screen min-h-screen bg-white">
        <img src={loader} alt="Loading..." className="h-60" />
      </div>
    );

  const restaurant = restaurantData?.restaurant || restaurantData || {};
  const menu = Array.isArray(menuData)
    ? menuData
    : Array.isArray(menuData?.menu)
    ? menuData.menu
    : [];
  const isRestaurantOpen =
    restaurant?.isOpen === undefined ? true : Boolean(restaurant.isOpen);

  if (error) {
    return (
      <p>
        Error: {error?.data?.message || error?.message || "An error occurred"}
      </p>
    );
  }

  // Apply filters (search + veg/non-veg + category)
  const filteredMenu = menu.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filters.veg && !filters.nonVeg && item.type !== "veg") return false;
    if (filters.nonVeg && !filters.veg && item.type !== "non-veg") return false;
    if (activeCategory && item.category !== activeCategory) return false;

    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategoryClick = (category) => {
    setActiveCategory((prev) => (prev === category ? null : category));
  };

  return (
    <>
      {/* Orders Closed Banner */}
      {!isRestaurantOpen && (
        <div className="sticky top-0 z-30 bg-red-600 text-white px-4 py-3 shadow-lg h-14 flex items-center">
          <div className="flex items-center justify-center gap-2 w-full">
            <Clock className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm sm:text-base font-semibold text-center">
              Orders are currently closed
              {restaurant?.reopenAt || restaurantData?.restaurant?.reopenAt
                ? ` - Reopening at ${restaurant?.reopenAt || restaurantData?.restaurant?.reopenAt}`
                : " - We'll be back soon"}
            </p>
          </div>
        </div>
      )}

      <div className={`sticky bg-white z-20 ${!isRestaurantOpen ? 'top-14' : 'top-0'}`}>
        <Header
          logo={restaurant?.logo?.url || restaurantData?.restaurant?.logo?.url}
          siteName={
            restaurant?.restaurantName ||
            restaurantData?.restaurant?.restaurantName
          }
          search={search}
          onSearch={setSearch}
          isRestaurantOpen={isRestaurantOpen}
        />

        <Category
          title="Choose Your Favourite Food"
          categories={menu}
          onCategoryClick={handleCategoryClick}
          activeCategory={activeCategory}
        />
        <Filter filters={filters} onChange={handleFilterChange} />
      </div>

      {filteredMenu.length === 0 && (search || "").trim() ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-gray-500">
          <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1">
            No items found
          </p>
          <p className="text-xs sm:text-sm max-w-xs">
            Try adjusting your search or filters to find the food you're craving.
          </p>
        </div>
      ) : (
        <FoodListing menu={filteredMenu} onQuantityChange={setTotal} isRestaurantOpen={isRestaurantOpen} />
      )}
    </>
  );
}
