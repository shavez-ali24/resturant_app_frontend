import { memo } from "react";
import { motion } from "framer-motion";

const Filter = memo(function Filter({
  filters = { veg: false, nonVeg: false, egg: false, mixed: false, combo: false },
  onChange = () => {},
  isDarkMode = false,
  hasCombo = true,
  showVegNonVegFilters = true,
  showEggFilter = false,
}) {
  const currentMode =
    filters.veg && !filters.nonVeg && !filters.egg && !filters.mixed
      ? "veg"
      : filters.nonVeg && !filters.veg && !filters.egg && !filters.mixed
      ? "nonVeg"
      : filters.egg && !filters.veg && !filters.nonVeg && !filters.mixed
      ? "egg"
      : filters.mixed
      ? "mixed"
      : filters.combo
      ? "combo"
      : "all";

  const setMode = (mode) => {
    if (mode === "veg") {
      onChange("veg", true);
      onChange("nonVeg", false);
      onChange("egg", false);
      onChange("mixed", false);
    } else if (mode === "nonVeg") {
      onChange("veg", false);
      onChange("nonVeg", true);
      onChange("egg", false);
      onChange("mixed", false);
    } else if (mode === "egg") {
      onChange("veg", false);
      onChange("nonVeg", false);
      onChange("egg", true);
      onChange("mixed", false);
    } else if (mode === "mixed") {
      onChange("veg", false);
      onChange("nonVeg", false);
      onChange("egg", false);
      onChange("mixed", true);
    } else {
      onChange("veg", false);
      onChange("nonVeg", false);
      onChange("egg", false);
      onChange("mixed", false);
    }
  };

  if (!showVegNonVegFilters && !hasCombo) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`mx-2 mb-2 flex w-auto items-center px-1.5 py-1.5 ${
        showVegNonVegFilters ? "justify-between" : "justify-end"
      }`}
    >
      {/* Veg / Non-Veg / Mixed Toggle - Left */}
      {showVegNonVegFilters && (
        <div className={`flex min-w-0 items-center text-xs sm:text-sm md:text-base ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
          <div className={`inline-flex items-center gap-0.5 rounded-full p-0.5 shadow-sm ${isDarkMode ? "bg-slate-900/90 border border-slate-600" : "bg-white"}`}>
            <button
              type="button"
              onClick={() => {
                setMode("all");
                onChange("combo", false);
              }}
              className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:text-sm ${
                currentMode === "all"
                  ? isDarkMode
                    ? "bg-orange-500/20 text-orange-200 shadow-sm"
                    : "bg-orange-100 text-orange-800 shadow-sm"
                  : isDarkMode
                  ? "text-orange-300 hover:bg-slate-800 hover:text-orange-200"
                  : "text-orange-500 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setMode("veg")}
              className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:text-sm ${
                currentMode === "veg"
                  ? isDarkMode
                    ? "bg-green-600 text-white shadow"
                    : "bg-green-500 text-white shadow"
                  : isDarkMode
                  ? "text-green-300 hover:bg-slate-800"
                  : "text-green-700 hover:bg-green-50/80"
              }`}
            >
              Veg
            </button>
            <button
              type="button"
              onClick={() => setMode("nonVeg")}
              className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:text-sm ${
                currentMode === "nonVeg"
                  ? isDarkMode
                    ? "bg-red-600 text-white shadow"
                    : "bg-red-500 text-white shadow"
                  : isDarkMode
                  ? "text-red-300 hover:bg-slate-800"
                  : "text-red-700 hover:bg-red-50/80"
              }`}
            >
              Non-Veg
            </button>
            {showEggFilter && (
              <button
                type="button"
                onClick={() => setMode("egg")}
                className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:text-sm ${
                  currentMode === "egg"
                    ? "bg-yellow-500 text-slate-900 shadow"
                    : isDarkMode
                    ? "text-yellow-300 hover:bg-slate-800"
                    : "text-yellow-700 hover:bg-yellow-50/80"
                }`}
              >
                Egg
              </button>
            )}
          </div>
        </div>
      )}

      {/* Combo Toggle - Right */}
      {hasCombo && (
        <button
          type="button"
          onClick={() => onChange("combo", !filters.combo)}
          className={`ml-1 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
            filters.combo
              ? "client-add-button text-white"
              : "client-add-button-outline"
          }`}
        >
          Combo
        </button>
      )}
    </motion.div>
  );
});

export default Filter;