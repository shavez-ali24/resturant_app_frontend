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
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="mx-2 mb-2 flex w-auto items-center justify-between px-1.5 py-1.5"
    >
      {/* Veg / Non-Veg / Mixed Toggle - Left */}
      <div className="flex min-w-0 items-center text-xs text-gray-800 sm:text-sm md:text-base">
        <div className="inline-flex items-center gap-0.5 rounded-full bg-white p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setMode("all")}
            className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:text-sm ${
              currentMode === "all"
                ? "bg-orange-100 text-orange-800 shadow-sm"
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
                ? "bg-green-500 text-white shadow"
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
                ? "bg-red-500 text-white shadow"
                : "text-red-700 hover:bg-red-50/80"
            }`}
          >
            Non-Veg
          </button>
          <button
            type="button"
            onClick={() => setMode("mixed")}
            className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:text-sm ${
              currentMode === "mixed"
                ? "bg-orange-500 text-white shadow"
                : "text-orange-700 hover:bg-orange-50/90"
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
        className={`ml-1 rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
          filters.combo
            ? "bg-primary text-white shadow-md"
            : "bg-white text-orange-700 shadow-sm hover:bg-orange-50"
        }`}
      >
        Combo
      </button>
    </motion.div>
  );
}
