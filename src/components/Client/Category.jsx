import { Layers } from "lucide-react";
import { motion } from "framer-motion";

export default function Category({
  categories = [],
  title = "Category",
  onCategoryClick,
  activeCategory,
  categoryImages = {},
  hasActiveFilter = false,
}) {
  const normalizeCategoryValue = (value) =>
    String(value || "")
      .replace(/-+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normalizeCategoryItem = (item) => {
    if (item === undefined || item === null) return null;
    if (typeof item === "string" || typeof item === "number") {
      const category = normalizeCategoryValue(item);
      if (!category) return null;
      return { category };
    }
    if (typeof item === "object") {
      const label =
        item.category ||
        item.name ||
        item.title ||
        item.label ||
        item.value;
      const category = normalizeCategoryValue(label);
      if (!category) return null;
      return { ...item, category };
    }
    return null;
  };

  const normalizedCategories = categories
    .map(normalizeCategoryItem)
    .filter(Boolean);

  const uniqueCategories = Array.from(
    new Map(
      normalizedCategories.map((item) => [
        item.category.toLowerCase(),
        item,
      ])
    ).values()
  );
  const normalizedActiveCategory = normalizeCategoryValue(activeCategory).toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: "easeOut" }}
      className="mx-2 mt-1 flex flex-col px-2 py-1.5"
    >
      {/* Header */}
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5 shadow-sm">
            <Layers className="text-primary" size={18} strokeWidth={2.4} />
          </div>
          <h2 className="truncate text-sm font-semibold tracking-wide text-gray-800 sm:text-base">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onCategoryClick?.(null)}
          className={`h-7 flex-shrink-0 rounded-full px-3 text-xs font-semibold transition-all ${
            activeCategory === null && !hasActiveFilter
              ? "client-add-button text-white"
              : "client-add-button-outline"
          }`}
        >
          All
        </button>
      </div>

      {/* Categories scroller */}
      <div className="client-category-scroll overflow-x-auto scroll-hidden">
        <div className="client-category-track inline-flex items-center gap-2 py-1.5 pr-2">
            {/* Category chips */}
            {uniqueCategories.map((item, index) => {
              const isActive =
                normalizedActiveCategory &&
                normalizeCategoryValue(item.category).toLowerCase() ===
                  normalizedActiveCategory;
              const normalizedKey = normalizeCategoryValue(item.category).toLowerCase();
              const fallbackImage = categoryImages?.[normalizedKey];
              const resolvedImage =
                item?.image?.url ||
                item?.image?.secure_url ||
                (typeof item?.image === "string" ? item.image : "") ||
                fallbackImage;
              return (
                <button
                  key={`cat-${item.category || index}`}
                  type="button"
                  onClick={() => onCategoryClick?.(item.category)}
                  className={`client-category-chip relative h-[54px] w-[116px] min-w-[116px] flex-shrink-0 overflow-hidden rounded-2xl border border-orange-200/80 transition-all duration-200 shadow-sm hover:shadow-md ${
                    isActive
                      ? "border-primary ring-2 ring-primary/30 shadow-[0_10px_20px_rgba(249,115,22,0.24)]"
                      : ""
                  }`}
                >
                  {resolvedImage ? (
                    <>
                      <img
                        className="client-category-image"
                        src={resolvedImage}
                        alt={item?.category}
                        loading="lazy"
                        decoding="async"
                      />
                      <div
                        className={`absolute inset-0 ${
                          isActive
                            ? "bg-gradient-to-t from-primary/70 via-primary/25 to-transparent"
                            : "bg-gradient-to-t from-black/55 via-black/20 to-transparent"
                        }`}
                      />
                      <span
                        className={`absolute bottom-1.5 left-2 inline-flex max-w-[calc(100%-16px)] items-center rounded-md px-2 py-0.5 text-[12px] font-semibold leading-tight backdrop-blur-[3px] shadow-[0_4px_10px_rgba(0,0,0,0.22)] ${
                          isActive
                            ? "bg-white/26 text-white"
                            : "bg-black/24 text-orange-50"
                        }`}
                      >
                        <span className="truncate">{item?.category}</span>
                      </span>
                    </>
                  ) : (
                    <span
                      className={`inline-flex h-full w-full items-center justify-center px-2 text-[12px] font-semibold leading-tight text-center ${
                        isActive ? "bg-primary text-white" : "bg-white text-gray-700"
                      }`}
                    >
                      <span className="w-full truncate">{item?.category}</span>
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </motion.div>
  );
}
