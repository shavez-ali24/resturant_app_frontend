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
    <div className="flex flex-col pl-2">
      {/* <div className="flex items-center gap-2">
        <div className="bg-gray-100 p-2 rounded-xl shadow-sm">
          <Layers className="text-gray-700" size={20} strokeWidth={2.2} />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
          {title}
        </h2>
      </div> */}

      <div className="overflow-x-scroll scroll-hidden py-2 mr-2">
        <div className="flex items-center gap-2 font-light">
          {/* ✅ All Button - Fixed height */}
          <div
            onClick={() => onCategoryClick?.(null)}
            className={`flex items-center justify-center border h-14 w-14 p-4 shadow-md rounded-full cursor-pointer hover:shadow-lg transition flex-shrink-0 ${
              activeCategory === null
                ? "bg-primary text-white"
                : "bg-white text-black"
            }`}
          >
            <span className="text-sm font-medium">All</span>
          </div>

          {/* ✅ Category Buttons - Fixed height and consistent layout */}
          {uniqueCategories.map((item, index) => (
            <div
              key={index}
              onClick={() => onCategoryClick?.(item.category)}
              className={`flex items-center border px-3 py-2 shadow-md rounded-3xl cursor-pointer hover:shadow-lg transition flex-shrink-0 h-14  ${
                activeCategory === item.category
                  ? "bg-primary text-white"
                  : "bg-white text-black"
              }`}
            >
              <div className="w-10 h-10 overflow-hidden rounded-full mr-3 flex-shrink-0 ">
                <img
                  className="w-full h-full object-cover object-center"
                  src={item?.image?.url}
                  alt={item?.category}
                />
              </div>
              <span className="text-sm font-medium whitespace-nowrap">
                {item?.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
