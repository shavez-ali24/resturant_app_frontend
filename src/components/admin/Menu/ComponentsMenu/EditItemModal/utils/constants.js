// You can add edit-specific constants here if needed
export const EDIT_FORM_INITIAL_STATE = {
  name: "",
  category: "",
  type: "",
  description: "",
  available: true,
  pricingType: "single",
  price: "",
  discount: { type: "flat", value: "", active: false },
  variantRates: {
    quarter: { price: "", discount: { type: "flat", value: "", active: false } },
    half: { price: "", discount: { type: "flat", value: "", active: false } },
    full: { price: "", discount: { type: "flat", value: "", active: false } },
  },
  comboPrice: "",
};