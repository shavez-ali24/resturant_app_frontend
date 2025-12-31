"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { addToCart, removeFromCart } from "../../redux/clientRedux/clientSlice";
import { Dot, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "../ui/button";

const groupByCategory = (items) => {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
};

export default function FoodListing({ menu, onQuantityChange, isRestaurantOpen = true }) {
  const groupedMenu = groupByCategory(menu || []);
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.client.cart.items || {});
  const [descModal, setDescModal] = useState({ open: false, item: null });
  const [selectedVariants, setSelectedVariants] = useState({});
  const [openVariantMenu, setOpenVariantMenu] = useState(null);

  useEffect(() => {
    if (!menu) return;
    setSelectedVariants((prev) => {
      let changed = false;
      const next = { ...prev };

      menu.forEach((item) => {
        if (item?.pricingType === "variant") {
          const variantRates = item?.variantRates || {};
          const validVariants = Object.entries(variantRates)
            .filter(([key, price]) => price != null && price !== undefined)
            .map(([key]) => key);
          if (validVariants.length > 0 && !next[item._id]) {
            next[item._id] = validVariants[0];
            changed = true;
          }
        }
      });

      return changed ? next : prev;
    });
  }, [menu]);

  // Close open variant dropdown on any outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenVariantMenu(null);
    };

    if (openVariantMenu) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openVariantMenu]);

  useEffect(() => {
    if (onQuantityChange) {
      const total = Object.values(cartItems).reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      onQuantityChange(total);
    }
  }, [cartItems, onQuantityChange]);

  const formatVariantLabel = (key) =>
    key
      ? key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
      : "";

  const openDescription = (item) => {
    if (!item) return;
    setDescModal({ open: true, item });
  };

  const closeDescription = () => {
    setDescModal({ open: false, item: null });
  };

  const descriptionText =
    descModal.open && descModal.item?.description
      ? descModal.item.description
      : "";
  const isLongDescription =
    descriptionText.split(/\s+/).filter(Boolean).length > 60;

  return (
    <div className="bg-white flex flex-col pb-20 px-2 sm:px-3 pt-6">
      {Object.keys(groupedMenu).map((category) => {
        const itemsInCategory = groupedMenu[category] || [];
        const layoutMode =
          itemsInCategory.length === 1
            ? "single"
            : itemsInCategory.length === 2
            ? "double"
            : "multi";

        const containerClass =
          layoutMode === "multi"
            ? "flex gap-3 sm:gap-4 overflow-x-auto overflow-y-visible scroll-hidden -mx-2 sm:-mx-3 px-2 sm:px-3 py-3"
            : `grid gap-4 ${
                layoutMode === "single" ? "grid-cols-1 py-3" : "grid-cols-2 py-3"
              }`;

        return (
          <div key={category} id={`category-${category}`} className="">
            {/* ✅ Category Header */}
            <div className="flex items-center gap-2">
              <Dot className="text-primary" size={14} strokeWidth={24} />
              <h2 className="text-base font-semibold text-gray-800 tracking-wide">
                {category}
              </h2>
            </div>

            {/* ✅ Food Cards - Responsive Layout */}
            <div className={containerClass} style={{ position: "relative" }}>
              {itemsInCategory.map((item) => {
                const isMenuOpen = openVariantMenu === item._id;
                const variantRates = item.variantRates || {};
                const selectedVariant =
                  item.pricingType === "variant"
                    ? selectedVariants[item._id]
                    : null;
                const variantPrice =
                  item.pricingType === "variant" && selectedVariant
                    ? variantRates?.[selectedVariant]
                    : null;
                const cartKey =
                  item.pricingType === "variant"
                    ? selectedVariant
                      ? `${item._id}-${selectedVariant}`
                      : `${item._id}-unselected`
                    : item._id;
                const quantity =
                  item.pricingType === "variant" && !selectedVariant
                    ? 0
                    : cartItems[cartKey]?.quantity || 0;
                const displayPrice =
                  item.pricingType === "variant"
                    ? variantPrice ?? item.price
                    : item.price;
                const canAdd =
                  (item.pricingType !== "variant" ||
                  (selectedVariant && variantPrice !== undefined)) && isRestaurantOpen;
                const isUnavailable = !item.available || !isRestaurantOpen;
                // Description preview length set to 40 characters

                return (
                  <div
                    key={item._id}
                    className={`relative bg-white rounded-2xl border border-gray-100 shadow-md ${
                      isUnavailable ? "opacity-60 grayscale" : "opacity-100"
                    } ${
                      layoutMode === "multi"
                        ? "flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]"
                        : "w-full"
                    } ${isMenuOpen ? "z-10" : ""}`}
                  >
                    {/* ✅ Image Section */}
                    <div
                      className={`relative w-full overflow-hidden rounded-t-2xl ${
                        layoutMode === "single"
                          ? "h-40 sm:h-52"
                          : layoutMode === "double"
                          ? "h-32 sm:h-40"
                          : "h-32 sm:h-36 md:h-40"
                      }`}
                    >
                      <img
                        src={item.image?.url}
                        alt={item.name}
                        className="w-full h-full object-cover object-center"
                      />
                      {/* Veg / Non-Veg dot badge over image */}
                      <div className="absolute top-2 left-2 backdrop-blur-sm bg-white/80 p-1 rounded-full shadow-sm border border-white/70">
                        {item.type === "veg" ? (
                          <Dot
                            size={12}
                            strokeWidth={12}
                            className="border-2 border-green-700 text-green-700"
                          />
                        ) : (
                          <Dot
                            size={12}
                            strokeWidth={12}
                            className="border-2 border-red-600 text-red-600"
                          />
                        )}
                      </div>
                      {isUnavailable && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">
                          {!item.available ? "Not Available" : "Orders Closed"}
                        </div>
                      )}
                    </div>

                    {/* ✅ Details Section */}
                    <div className="p-2 flex flex-col gap-1">
                      {/* Item Name */}
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
                        {item.name}
                      </h3>

                      {/* Description with "more" link + Price Dropdown */}
                      {(item.description || "").length > 0 && (
                        <div className="flex items-center justify-between gap-1 flex-shrink-0 h-4 py-3">
                          {/* Price Section (moved here) */}
                          <div className="flex-1 min-w-0">
                            {item.pricingType === "variant" &&
                            Object.keys(variantRates).length > 0 ? (
                              <div className="relative z-10">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenVariantMenu((prev) =>
                                      prev === item._id ? null : item._id
                                    );
                                  }}
                                  className="text-primary text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1"
                                >
                                  <span className="truncate">
                                    {selectedVariant &&
                                    variantPrice != null &&
                                    variantPrice !== undefined
                                      ? formatVariantLabel(selectedVariant)
                                      : "Select size"}
                                  </span>
                                  <ChevronsUpDown className="h-3 w-3 flex-shrink-0" />
                                </button>

                                {isMenuOpen && (
                                  <div
                                    className="absolute -left-2 bottom-0 w-[150px] rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden z-10"
                                    onClick={(event) =>
                                      event.stopPropagation()
                                    }
                                  >
                                    {Object.entries(variantRates)
                                      .filter(
                                        ([key, price]) =>
                                          price != null && price !== undefined
                                      )
                                      .map(([key, price]) => {
                                        const isActive =
                                          selectedVariant === key;
                                        return (
                                          <button
                                            key={key}
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              setSelectedVariants((prev) => ({
                                                ...prev,
                                                [item._id]: key,
                                              }));
                                              setOpenVariantMenu(null);
                                            }}
                                            className={`w-full px-4 py-2 text-left flex items-center justify-between text-sm transition ${
                                              isActive
                                                ? "bg-gray-100 text-orange-700 font-semibold"
                                                : "text-gray-700 hover:bg-orange-50"
                                            }`}
                                          >
                                            <span>
                                              {formatVariantLabel(key)}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              ₹{price}
                                            </span>
                                          </button>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-primary text-xs sm:text-sm font-semibold">
                                ₹
                                {Number(
                                  displayPrice ?? item.price ?? 0
                                ).toFixed(2)}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => openDescription(item)}
                            className="text-xs text-gray-500 hover:text-primary text-left w-fit"
                          >
                            View details
                          </button>
                        </div>
                      )}

                      {/* Price and Add Button Row */}
                      <div className="flex flex-col justify-between mt-auto">
                        {/* Add/Quantity Controls */}
                        {!item.available ? null : (
                          <div className="flex items-center justify-between gap-1 flex-shrink-0">
                            {/* Selected price shown next to Add button */}
                            <span className="text-lg sm:text-sm font-semibold text-gray-800 mr-1">
                              ₹{Number(displayPrice ?? item.price ?? 0)}
                            </span>

                            {quantity > 0 ? (
                              <>
                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      dispatch(removeFromCart(cartKey))
                                    }
                                    disabled={!isRestaurantOpen}
                                    className="rounded-lg h-7 w-7 sm:h-8 sm:w-8 p-0 text-sm sm:text-base font-bold border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    -
                                  </Button>
                                  <span className="text-xs sm:text-sm font-medium min-w-[16px] sm:min-w-[20px] text-center">
                                    {quantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      dispatch(
                                        addToCart({
                                          id: cartKey,
                                          item: {
                                            ...item,
                                            price: displayPrice,
                                            variantKey: selectedVariant,
                                            variantLabel:
                                              selectedVariant &&
                                              variantPrice != null &&
                                              variantPrice !== undefined
                                                ? formatVariantLabel(
                                                    selectedVariant
                                                  )
                                                : null,
                                          },
                                          price: displayPrice,
                                        })
                                      )
                                    }
                                    disabled={!isRestaurantOpen}
                                    className="rounded-lg h-7 w-7 sm:h-8 sm:w-8 p-0 text-sm sm:text-base font-bold bg-primary text-white hover:bg-primary/90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    +
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (!canAdd || !isRestaurantOpen) return;
                                  dispatch(
                                    addToCart({
                                      id: cartKey,
                                      item: {
                                        ...item,
                                        price: displayPrice,
                                        variantKey: selectedVariant,
                                        variantLabel:
                                          selectedVariant &&
                                          variantPrice != null &&
                                          variantPrice !== undefined
                                            ? formatVariantLabel(
                                                selectedVariant
                                              )
                                            : null,
                                      },
                                      price: displayPrice,
                                    })
                                  );
                                }}
                                className="rounded-lg h-7 w-7 sm:h-8 sm:w-8 p-0 bg-primary hover:bg-primary/90 text-white shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!canAdd || !isRestaurantOpen}
                              >
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                        {!isRestaurantOpen && item.available && (
                          <p className="text-xs text-red-600 font-medium mt-1">
                            Orders closed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Description Modal (tooltip-like) */}
      {descModal.open && descModal.item && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8"
          onClick={closeDescription}
        >
          <div
            className="relative max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDescription}
              className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full bg-white shadow-md text-gray-500 hover:text-red-500 hover:shadow-lg transition"
              aria-label="Close description"
            >
              ×
            </button>

            <div className="relative h-56 w-full overflow-hidden">
              <img
                src={descModal.item.image?.url}
                alt={descModal.item.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                {descModal.item.type && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      descModal.item.type === "veg"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {descModal.item.type}
                  </span>
                )}
                {descModal.item.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-800">
                    {descModal.item.category}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold text-gray-900 leading-snug">
                  {descModal.item.name}
                </h3>
                <div
                  className={
                    isLongDescription
                      ? "max-h-40 overflow-y-auto pr-1"
                      : ""
                  }
                >
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {descModal.item.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-700 text-sm font-semibold border border-orange-200">
                  ₹
                  {descModal.item.pricingType === "variant"
                    ? (() => {
                        const variantRates = descModal.item.variantRates || {};
                        const firstVariant = Object.entries(variantRates)[0];
                        return firstVariant
                          ? Number(firstVariant[1]).toFixed(2)
                          : Number(descModal.item.price || 0).toFixed(2);
                      })()
                    : Number(descModal.item.price || 0).toFixed(2)}
                </span>
                {descModal.item.pricingType === "variant" && (
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    Multiple portions available
                  </span>
                )}
                {!descModal.item.available && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    Currently unavailable
                  </span>
                )}
              </div>

              {descModal.item.ingredients?.length ? (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Key Ingredients
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {descModal.item.ingredients.map((ingredient, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-600"
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-end">
                <Button
                  size="sm"
                  className="rounded-full px-6 bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    closeDescription();
                  }}
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
