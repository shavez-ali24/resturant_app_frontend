import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { modalOverlayVariant, modalContentVariant } from "../Lib/constants";
import ModalHeader from "./EditItemModal/components/ModalHeader";
import ErrorDisplay from "./EditItemModal/components/ErrorDisplay";
import FormInput from "./EditItemModal/components/FormInput";
import PricingTypeSelector from "./EditItemModal/components/PricingTypeSelector";
import SinglePriceSection from "./EditItemModal/components/SinglePriceSection";
import VariantPriceSection from "./EditItemModal/components/VariantPriceSection";
import ComboPriceSection from "./EditItemModal/components/ComboPriceSection";
import CategoryTypeSelectors from "./EditItemModal/components/CategoryTypeSelectors";
import ImageUpload from "./EditItemModal/components/ImageUpload";
import AvailabilityToggle from "./EditItemModal/components/AvailabilityToggle";
import SubmitButton from "./EditItemModal/components/SubmitButton";
import DescriptionField from "./EditItemModal/components/DescriptionField";

import { validateEditForm } from "./EditItemModal/utils/validators";
import {
  handleEditFormChange,
  handleEditFileChange,
  setEditPricingType,
  handleEditSubmit
} from "./EditItemModal/utils/formHandlers";

const defaultDiscount = { type: "flat", value: "", active: false };

const extractTextCandidate = (value, priorityKeys = []) => {
  if (value === undefined || value === null) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = extractTextCandidate(entry, priorityKeys);
      if (resolved) return resolved;
    }
    return "";
  }

  if (typeof value === "object") {
    for (const key of priorityKeys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const resolved = extractTextCandidate(value[key], priorityKeys);
        if (resolved) return resolved;
      }
    }

    for (const nestedValue of Object.values(value)) {
      const resolved = extractTextCandidate(nestedValue, priorityKeys);
      if (resolved) return resolved;
    }
  }

  return "";
};

const normalizeFoodType = (value = "") => {
  const rawValue = extractTextCandidate(value, [
    "type",
    "foodType",
    "food_type",
    "foodtype",
    "name",
    "label",
    "value",
  ]);

  const normalized = String(rawValue || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (normalized === "veg" || normalized === "vegetarian") return "veg";
  if (normalized === "nonveg" || normalized === "non-veg") return "non-veg";
  if (normalized === "mixed") return "mixed";
  return "";
};

const pickCategoryTextFromObject = (rawCategory = {}) => {
  if (!rawCategory || typeof rawCategory !== "object") return "";

  const fallback = extractTextCandidate(rawCategory, [
    "name",
    "categoryName",
    "categoryLabel",
    "category_label",
    "category_name",
    "label",
    "title",
    "value",
    "slug",
    "category",
    "categoryId",
    "category_id",
    "id",
    "_id",
  ]);

  return fallback && !/^[a-f0-9]{24}$/i.test(fallback) ? fallback : "";
};

const resolveCategoryValue = (rawCategory, restaurantCategories = []) => {
  const categories = Array.isArray(restaurantCategories)
    ? restaurantCategories
      .map((category) => String(category || "").trim())
      .filter(Boolean)
    : [];

  const categoryFromObject =
    rawCategory && typeof rawCategory === "object"
      ? pickCategoryTextFromObject(rawCategory)
      : rawCategory;

  const candidate = String(categoryFromObject || "").trim();
  if (!candidate) return "";

  const matchedCategory = categories.find(
    (category) => category.toLowerCase() === candidate.toLowerCase()
  );
  if (matchedCategory) return matchedCategory;

  // Do not keep object ids in UI field when no matching category label exists.
  if (/^[a-f0-9]{24}$/i.test(candidate)) return "";

  return candidate;
};

const EditItemModal = ({
  isOpen,
  item,
  onClose,
  onSubmit,
  restaurantCategories,
  menuItems = [],
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const MotionDiv = motion.div;
  const [editFormData, setEditFormData] = useState({});
  const [newImageFile, setNewImageFile] = useState(null);
  const [imageError, setImageError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [comboItems, setComboItems] = useState([]);
  const modalContentRef = useRef(null);

  useEffect(() => {
    if (!item || !isOpen) return;

    const categoryValue = resolveCategoryValue(
      {
        categoryName:
          item.categoryName ||
          item.categoryLabel ||
          item.category_label ||
          item.category_name ||
          "",
        category:
          item.category ||
          item.menuCategory ||
          item.productCategory ||
          item.details?.category ||
          item.meta?.category ||
          "",
        categoryId: item.categoryId || item.category_id || "",
      },
      restaurantCategories
    );
    const normalizedType = normalizeFoodType(
      item.type || item.foodType || item.food_type || item.foodtype || ""
    );

    const defaultVariantRates = {
      quarter: { price: "", discount: { ...defaultDiscount } },
      half: { price: "", discount: { ...defaultDiscount } },
      full: { price: "", discount: { ...defaultDiscount } },
    };

    // Normalize single discount: preserve 0 as valid value
    const incomingDiscount = item.discount || { ...defaultDiscount };
    const normalizedDiscount = {
      type: incomingDiscount.type || "flat",
      value: incomingDiscount.value !== undefined && incomingDiscount.value !== null ? String(incomingDiscount.value) : "",
      active: !!incomingDiscount.active,
    };

    // Normalize variant rates discounts - preserve 0 as valid value
    const incomingVariantRates = item.variantRates || {};
    const normalizedVariantRates = {
      quarter: { price: "", discount: { ...defaultDiscount } },
      half: { price: "", discount: { ...defaultDiscount } },
      full: { price: "", discount: { ...defaultDiscount } },
    };

    Object.entries(normalizedVariantRates).forEach(([key]) => {
      const src = incomingVariantRates?.[key] || {};
      const srcDiscount = src.discount || { ...defaultDiscount };

      normalizedVariantRates[key] = {
        price: src.price || "",
        discount: {
          type: srcDiscount.type || "flat",
          value: srcDiscount.value !== undefined && srcDiscount.value !== null ? String(srcDiscount.value) : "",
          active: !!srcDiscount.active,
        },
      };
    });

    setEditFormData({
      ...item,
      name: item.name || "",
      description: item.description || "",
      type: normalizedType || "veg",
      category: categoryValue,
      available: item.available ?? true,
      pricingType: item.pricingType || "single",
      price: item.price || "",
      discount: normalizedDiscount,
      variantRates: Object.keys(incomingVariantRates).length ? normalizedVariantRates : defaultVariantRates,
      comboPrice: item.comboPrice || "",
    });

    const formattedComboItems = (item.comboItems || []).map((ci) => ({
      menuItemId:
        typeof ci.menuItemId === "object"
          ? ci.menuItemId?._id
          : ci.menuItemId || "",
      variant: ci.variant || "",
      quantity: ci.quantity || 1,
      name: ci.name || "",
    }));

    setComboItems(formattedComboItems);
    setNewImageFile(null);
    setImageError("");
    setFormErrors({});
    setBackendError("");
  }, [item, isOpen, restaurantCategories]);

  const handleChange = (e) =>
    handleEditFormChange(
      e,
      editFormData,
      setEditFormData,
      formErrors,
      setFormErrors,
      backendError,
      setBackendError
    );

  const handleFileChange = (e) =>
    handleEditFileChange(e, setNewImageFile, setImageError);

  const handlePricingTypeChange = (type) =>
    setEditPricingType(type, setFormErrors, setEditFormData, setComboItems);

  const scrollToFirstError = (errors = {}) => {
    if (typeof document === "undefined") return;

    const fieldOrder = [
      "name",
      "category",
      "type",
      "price",
      "variantRates",
      "comboPrice",
      "comboItems",
      "discount",
      "description",
    ];

    const firstErrorField = fieldOrder.find((field) => {
      const value = errors[field];
      if (value === undefined || value === null || value === "") return false;
      if (typeof value === "object") return Object.keys(value).length > 0;
      return true;
    });

    if (!firstErrorField) return;

    const selectorMap = {
      name: 'input[name="name"]',
      category: '[data-field="category"]',
      type: '[data-field="type"]',
      price: 'input[name="price"]',
      variantRates:
        '[data-field="variantRates"], input[name="quarter.price"], input[name="half.price"], input[name="full.price"]',
      comboPrice: 'input[name="comboPrice"]',
      description: 'textarea[name="description"], input[name="description"]',
    };

    const target =
      modalContentRef.current?.querySelector(
        selectorMap[firstErrorField] || `[name="${firstErrorField}"]`
      ) || null;

    if (!target) return;

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }
    });
  };

  const onSubmitHandler = async (e) =>
    handleEditSubmit(
      e,
      editFormData,
      newImageFile,
      imageError,
      comboItems,
      menuItems,
      validateEditForm,
      setFormErrors,
      setImageError,
      setBackendError,
      setIsUpdating,
      onSubmit,
      onClose,
      scrollToFirstError
    );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <MotionDiv
        variants={modalOverlayVariant}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-2 backdrop-blur-[2px] sm:p-4"
        onClick={onClose}
      >
        <MotionDiv
          variants={modalContentVariant}
          className="w-full max-w-3xl rounded-2xl bg-gradient-to-br from-orange-100/60 via-orange-50/80 to-white p-[1px] shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div ref={modalContentRef} className="max-h-[92dvh] overflow-y-auto rounded-[15px] border border-orange-100 bg-white/95 sm:max-h-[88vh]">
            <form onSubmit={onSubmitHandler} className="p-4 sm:p-6 md:p-7">
              <ModalHeader itemName={item?.name || ""} onClose={onClose} />
              {backendError && <ErrorDisplay error={backendError} />}

              <div className="mt-5 space-y-5">
                <FormInput
                  label="Product Name"
                  name="name"
                  value={editFormData.name || ""}
                  onChange={handleChange}
                  error={formErrors.name}
                  required
                />

                <PricingTypeSelector
                  pricingType={editFormData.pricingType || "single"}
                  setPricingType={handlePricingTypeChange}
                />

                <CategoryTypeSelectors
                  category={editFormData.category}
                  type={editFormData.type}
                  restaurantCategories={restaurantCategories}
                  errors={formErrors}
                  setFormData={setEditFormData}
                  setFormErrors={setFormErrors}
                  onAddCategory={onAddCategory}
                  onRenameCategory={onRenameCategory}
                  onDeleteCategory={onDeleteCategory}
                />

                {editFormData.pricingType === "single" && (
                  <SinglePriceSection
                    price={editFormData.price}
                    discount={editFormData.discount}
                    errors={formErrors}
                    handleChange={handleChange}
                    setFormData={setEditFormData}
                  />
                )}

                {editFormData.pricingType === "variant" && (
                  <VariantPriceSection
                    variantRates={editFormData.variantRates}
                    errors={formErrors.variantRates}
                    handleChange={handleChange}
                    setFormData={setEditFormData}
                  />
                )}

                {editFormData.pricingType === "combo" && (
                  <ComboPriceSection
                    comboPrice={editFormData.comboPrice}
                    comboItems={comboItems}
                    menuItems={menuItems}
                    errors={formErrors}
                    handleChange={handleChange}
                    setComboItems={setComboItems}
                    setFormData={setEditFormData}
                    foodType={editFormData.type}
                    discount={editFormData.discount}
                  />
                )}

                <DescriptionField
                  value={editFormData.description || ""}
                  onChange={handleChange}
                />

                <ImageUpload
                  imageFile={newImageFile}
                  currentImage={editFormData.image?.url}
                  imageError={imageError}
                  handleFileChange={handleFileChange}
                  isEditMode
                />

                <AvailabilityToggle
                  available={editFormData.available}
                  handleChange={handleChange}
                />

                <SubmitButton
                  isSubmitting={isUpdating}
                  onClose={onClose}
                  submitText="Save Changes"
                />
              </div>
            </form>
          </div>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
};

export default EditItemModal;
