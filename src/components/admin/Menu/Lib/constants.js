export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
];
export const MAX_IMAGE_KB = 300;

export const defaultAddFormState = {
  name: "",
  description: "",
  pricingType: "single",
  price: "",
  variantRates: {
    quarter: "",
    half: "",
    full: "",
  },
  category: "",
  type: "",
  available: true,
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
