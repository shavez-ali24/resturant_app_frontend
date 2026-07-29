export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Backward compatibility alias
export const ALLOWED_IMAGE_TYPES = ALLOWED_FILE_TYPES;
export const MAX_IMAGE_KB = 300;

export const defaultAddFormState = {
  name: "",
  description: "",
  pricingType: "single",
  price: "",
  variantRates: {
    quarter: { price: "", discount: { type: "flat", value: "", active: false } },
    half: { price: "", discount: { type: "flat", value: "", active: false } },
    full: { price: "", discount: { type: "flat", value: "", active: false } },
  },
  category: "",
  type: "",
  available: true,
  visibility: "PUBLIC",
  discount: { type: "flat", value: "", active: false },
};

export const modalOverlayVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
export const modalContentVariant = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};
export const addItemModalVariant = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
};
