"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { addToCart, removeFromCart } from "../../redux/clientRedux/clientSlice";
import { Dot, ChevronsUpDown } from "lucide-react";
import { Button } from "../ui/button";

const groupByCategory = (items) => {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
};

export default function FoodListing({ menu, onQuantityChange }) {
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
          const variantKeys = item?.variantRates ? Object.keys(item.variantRates) : [];
          if (variantKeys.length > 0 && !next[item._id]) {
            next[item._id] = variantKeys[0];
            changed = true;
          }
        }
      });

      return changed ? next : prev;
    });
  }, [menu]);

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
    key ? key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "";

  const openDescription = (item) => {
    if (!item) return;
    setDescModal({ open: true, item });
  };

  const closeDescription = () => {
    setDescModal({ open: false, item: null });
  };

  return (
    <div className="bg-gray-50 flex flex-col pb-20 px-3 pt-6">
      {Object.keys(groupedMenu).map((category) => (
        <div key={category} id={`category-${category}`} className="mb-10">
          {/* ✅ Category Header */}
          <div className="flex items-center gap-2 mb-4">
            <Dot className="text-primary" size={14} strokeWidth={24} />
            <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
              {category}
            </h2>
          </div>

          {/* ✅ Food Cards */}
          <div className="flex flex-col gap-5">
            {groupedMenu[category].map((item) => {
              const isMenuOpen = openVariantMenu === item._id;
              const variantRates = item.variantRates || {};
              const selectedVariant = item.pricingType === "variant" ? selectedVariants[item._id] : null;
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
                item.pricingType !== "variant" ||
                (selectedVariant && variantPrice !== undefined);
              const isUnavailable = !item.available;
              // Description preview length set to 40 characters

              return (
                <div
                  key={item._id}
                  className={`relative flex items-start bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ring-1 ring-transparent hover:ring-primary/20 ${
                    isUnavailable ? "opacity-60 grayscale" : "opacity-100"
                  } ${isMenuOpen ? "z-50" : "z-auto"}`}
                >
                  {/* ✅ Image Section */}
                  <div className="relative w-40 h-32 flex-shrink-0 overflow-hidden rounded-l-2xl">
                    <img
                      src={item.image?.url}
                      alt={item.name}
                      className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-110"
                    />
                    {/* Veg / Non-Veg dot badge over image */}
                    <div className="absolute top-2 left-2 backdrop-blur-sm bg-white/80 p-1 rounded-full shadow-sm border border-white/70">
                      {item.type === "veg" ? (
                        <Dot size={14} strokeWidth={12} className="border-2 border-green-700 text-green-700" />
                      ) : (
                        <Dot size={14} strokeWidth={12} className="border-2 border-red-600 text-red-600" />
                      )}
                    </div>
                    {isUnavailable && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-semibold">
                        Not Available
                      </div>
                    )}
                  </div>

                    {/* ✅ Details Section */}
                  <div className="flex flex-col justify-between p-2 flex-1 min-h-32">
                    {/* Top Info */}
                    <div className="mb-1">
                      <h3 className="text-base font-semibold text-gray-900 leading-snug">
                        {item.name}
                      </h3>

                      {/* ✅ Description with preview and modal on Read more */}
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {(item.description || "").slice(0, 45)}
                        {(item.description || "").length > 45 && "…"}
                        {(item.description || "").length > 45 && (
                          <button
                            onClick={() => openDescription(item)}
                            className="ml-1 text-primary font-medium hover:underline"
                          >
                            Read more
                          </button>
                        )}
                      </p>
                    </div>

                    {/* Bottom Info */}
                      <div className="flex justify-between items-end">
                        {item.pricingType === "variant" && Object.keys(variantRates).length > 0 ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenVariantMenu((prev) => (prev === item._id ? null : item._id));
                              }}
                              className="inline-flex items-center gap-1 p-1 rounded-full bg-orange-50 text-orange-700 text-[13px] font-semibold border border-orange-200"
                            >
                              <span>
                                ₹{Number(displayPrice ?? item.price ?? 0).toFixed(2)}
                                {selectedVariant ? ` • ${formatVariantLabel(selectedVariant)}` : ""}
                              </span>
                              <ChevronsUpDown className="h-3 w-3" />
                            </button>

                            {isMenuOpen && (
                              <div
                                className="absolute left-0 top-full mt-2 min-w-[200px] rounded-2xl border border-orange-100 bg-white shadow-xl z-[60] overflow-hidden"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {Object.entries(variantRates).map(([key, price]) => {
                                  const isActive = selectedVariant === key;
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
                                          ? "bg-orange-50 text-orange-700 font-semibold"
                                          : "text-gray-700 hover:bg-orange-50"
                                      }`}
                                    >
                                      <span>{formatVariantLabel(key)}</span>
                                      <span className="text-xs text-gray-500">₹{price}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-[13px] font-semibold border border-orange-200">
                            ₹{Number(displayPrice ?? item.price ?? 0).toFixed(2)}
                          </span>
                        )}

                      {!isUnavailable && (
                        <div className="flex items-center gap-1">
                          {quantity > 0 ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => dispatch(removeFromCart(cartKey))}
                                className="rounded-full h-7 w-7 p-0 text-lg font-bold border-gray-300 hover:border-gray-400"
                              >
                                -
                              </Button>
                              <span className="text-sm font-medium min-w-[24px] text-center">
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
                                        variantLabel: formatVariantLabel(selectedVariant),
                                      },
                                      price: displayPrice,
                                    })
                                  )
                                }
                                className="rounded-full h-7 w-7 p-0 text-lg font-bold bg-primary text-white hover:bg-primary/90 shadow-sm"
                              >
                                +
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                if (!canAdd) return;
                                dispatch(
                                  addToCart({
                                    id: cartKey,
                                    item: {
                                      ...item,
                                      price: displayPrice,
                                      variantKey: selectedVariant,
                                      variantLabel: formatVariantLabel(selectedVariant),
                                    },
                                    price: displayPrice,
                                  })
                                );
                              }}
                              className="rounded-full px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm"
                                disabled={!canAdd}
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
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
                <p className="text-gray-600 text-sm leading-relaxed">
                  {descModal.item.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-700 text-sm font-semibold border border-orange-200">
                  ₹
                  {descModal.item.pricingType === "variant"
                    ? (() => {
                        const variantRates = descModal.item.variantRates || {};
                        const firstVariant = Object.entries(variantRates)[0];
                        return firstVariant ? Number(firstVariant[1]).toFixed(2) : Number(descModal.item.price || 0).toFixed(2);
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
