import { motion } from "framer-motion";

export default function Filter({ filters, onChange }) {
  const currentMode =
    filters.veg && !filters.nonVeg && !filters.mixed
      ? "veg"
      : filters.nonVeg && !filters.veg && !filters.mixed
      ? "nonVeg"
      : filters.mixed
      ? "mixed"
      : "all";

  const setMode = (mode) => {
    if (mode === "veg") {
      onChange("veg", true);
      onChange("nonVeg", false);
      onChange("mixed", false);
    } else if (mode === "nonVeg") {
      onChange("veg", false);
      onChange("nonVeg", true);
      onChange("mixed", false);
    } else if (mode === "mixed") {
      onChange("veg", false);
      onChange("nonVeg", false);
      onChange("mixed", true);
    } else {
      onChange("veg", false);
      onChange("nonVeg", false);
      onChange("mixed", false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full flex items-center py-2 justify-between backdrop-blur-xl border-gray-200 px-2 pt-2"
    >
      {/* Veg / Non-Veg / Mixed Toggle - Left */}
      <div className="flex items-center text-gray-800 text-xs sm:text-sm md:text-base">
        <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setMode("all")}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
              currentMode === "all"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setMode("veg")}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
              currentMode === "veg"
                ? "bg-green-500 text-white shadow"
                : "text-green-700 hover:bg-green-50"
            }`}
          >
            Veg
          </button>
          <button
            type="button"
            onClick={() => setMode("nonVeg")}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
              currentMode === "nonVeg"
                ? "bg-red-500 text-white shadow"
                : "text-red-700 hover:bg-red-50"
            }`}
          >
            Non-Veg
          </button>
          <button
            type="button"
            onClick={() => setMode("mixed")}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
              currentMode === "mixed"
                ? "bg-orange-500 text-white shadow"
                : "text-orange-700 hover:bg-orange-50"
            }`}
          >
            Mixed
          </button>
        </div>
      </div>

      {/* Combo Toggle - Right */}
      <button
        type="button"
        onClick={() => onChange("combo", !filters.combo)}
        className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition ${
          filters.combo
            ? "bg-orange-600 text-white shadow-md"
            : "bg-white text-orange-600 border-2 border-orange-500 hover:bg-orange-50"
        }`}
      >
        Combo
      </button>
    </motion.div>
  );
}
