import { Layers } from "lucide-react";

export default function Category({
  categories = [],
  title = "Category",
  onCategoryClick,
  activeCategory,
}) {
  // ✅ Remove duplicates by category name
  const uniqueCategories = categories.filter(
    (item, index, self) =>
      index === self.findIndex((cat) => cat.category === item.category)
  );

  return (
    <div className="flex flex-col px-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="bg-primary/10 p-1.5 rounded-lg shadow-sm">
          <Layers className="text-primary" size={18} strokeWidth={2.4} />
        </div>
        <h2 className="text-sm sm:text-base font-semibold text-gray-800 tracking-wide">
          {title}
        </h2>
      </div>

      {/* Categories scroller */}
      <div className="overflow-x-auto scroll-hidden">
        <div className="inline-flex items-center gap-2 py-2 pr-2">
          {/* All pill */}
          <button
            type="button"
            onClick={() => onCategoryClick?.(null)}
            className={`inline-flex items-center justify-center h-10 px-4 rounded-full text-xs sm:text-sm font-medium border transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0 ${
              activeCategory === null
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            All
          </button>

          {/* Category chips */}
          {uniqueCategories.map((item, index) => {
            const isActive = activeCategory === item.category;
            return (
              <button
                key={index}
                type="button"
                onClick={() => onCategoryClick?.(item.category)}
                className={`inline-flex items-center h-10 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-medium border transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0 ${
                  isActive
                    ? "bg-primary text-white border-primary scale-[1.02]"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {item?.image?.url && (
                  <div className="w-8 h-8 overflow-hidden rounded-full mr-2 flex-shrink-0 bg-gray-100">
                    <img
                      className="w-full h-full object-cover object-center"
                      src={item.image.url}
                      alt={item?.category}
                    />
                  </div>
                )}
                <span className="whitespace-nowrap">{item?.category}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
