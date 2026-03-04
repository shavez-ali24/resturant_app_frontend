import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!item || !isOpen) return;

    const categoryValue =
      item.category && typeof item.category === "object"
        ? item.category._id || item.category.name
        : item.category || "";

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
      type: item.type || "veg",
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
  }, [item, isOpen]);

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
      onClose
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
          <div className="max-h-[92dvh] overflow-y-auto rounded-[15px] border border-orange-100 bg-white/95 sm:max-h-[88vh]">
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
                    errors={formErrors.variantRates || {}}
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
