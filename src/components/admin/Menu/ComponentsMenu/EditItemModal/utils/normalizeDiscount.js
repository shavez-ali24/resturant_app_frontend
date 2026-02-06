// utils/normalizeDiscount.js
function normalizeDiscount(discount) {
  if (!discount) return null;

  // Accept object or FormData-style keys
  const rawType = discount.type ?? discount["type"] ?? null;
  const rawValue = discount.value ?? discount["value"];
  const rawActive = discount.active ?? discount["active"];

  const type = rawType || null;

  // Coerce numeric value safely
  const value = rawValue === "" || rawValue === null || rawValue === undefined
    ? NaN
    : Number(rawValue);

  // Coerce active boolean from common representations
  const active =
    rawActive === true ||
    rawActive === "true" ||
    rawActive === "1" ||
    rawActive === 1;

  // Not active => treat as no discount
  if (!active) return null;

  // Active but invalid or negative => treat as no discount
  if (isNaN(value) || value < 0) return null;

  return {
    type: type || "flat",
    value,
    active: true,
  };
}

// ES module default export for frontend usage
export default normalizeDiscount;

// CommonJS fallback for easy copy-paste into Node backend
if (typeof module !== "undefined" && module.exports) {
  module.exports = normalizeDiscount;
}