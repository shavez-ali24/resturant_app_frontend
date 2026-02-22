import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { modalOverlayVariant, modalContentVariant } from "../Lib/constants";
import ModalHeader from "./EditItemModal/components/ModalHeader";
import ErrorDisplay from "./EditItemModal/components/ErrorDisplay";
import FormInput from "./EditItemModal/components/FormInput";
import PricingTypeSelector from "./EditItemModal/components/PricingTypeSelector";
import SinglePriceSection from "./EditItemModal/components/SinglePriceSection";
import VariantPriceSection from "./EditItemModal/components/VariantPriceSection";
import ComboPriceSection from "./EditItemModal/components/ComboPriceSection";
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
}) => {
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

  const CategoryTypeSelectors = ({ category, type, errors }) => {
    const getCategoryDisplayName = () => {
      if (!category) return "";
      const found = restaurantCategories.find(cat => {
        const id = typeof cat === "object" ? cat._id : cat;
        const name = typeof cat === "object" ? cat.name : cat;
        return id === category || name === category;
      });
      return found ? (typeof found === "object" ? found.name : found) : category;
    };

    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Category *
          </label>
          <Select
            value={category || ""}
            onValueChange={(val) =>
              setEditFormData(prev => ({ ...prev, category: val }))
            }
          >
            <SelectTrigger className={`h-11 w-full rounded-xl border px-3 text-sm shadow-sm transition-colors ${errors.category ? "border-red-500 bg-red-50" : "border-orange-200 bg-white hover:border-orange-300"} focus:border-orange-400 focus:ring-2 focus:ring-orange-200`}>
              <SelectValue placeholder="Select a Category">
                {getCategoryDisplayName() || "Select a Category"}
              </SelectValue>
            </SelectTrigger>

            <SelectContent className="max-h-60 overflow-y-auto rounded-xl border border-orange-200 bg-white p-1 shadow-xl">
              <SelectGroup>
                {restaurantCategories.map(cat => {
                  const id = typeof cat === "object" ? cat._id : cat;
                  const name = typeof cat === "object" ? cat.name : cat;
                  return (
                    <SelectItem
                      key={id}
                      value={id}
                      className="cursor-pointer rounded-lg data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800"
                    >
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>

          {errors.category && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <ExclamationCircleIcon className="w-4 h-4" />
              {errors.category}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Food Type *
          </label>

          <Select
            value={type || ""}
            onValueChange={(val) =>
              setEditFormData(prev => ({ ...prev, type: val }))
            }
          >
            <SelectTrigger className={`h-11 w-full rounded-xl border px-3 text-sm shadow-sm transition-colors ${errors.type ? "border-red-500 bg-red-50" : "border-orange-200 bg-white hover:border-orange-300"} focus:border-orange-400 focus:ring-2 focus:ring-orange-200`}>
              <SelectValue placeholder="Select Food Type">
                {type === "veg" && "Veg"}
                {type === "non-veg" && "Non-Veg"}
                {type === "mixed" && "Mixed"}
                {!type && "Select Food Type"}
              </SelectValue>
            </SelectTrigger>

            <SelectContent className="rounded-xl border border-orange-200 bg-white p-1 shadow-xl">
              <SelectGroup>
                <SelectItem value="veg" className="cursor-pointer rounded-lg data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Veg</SelectItem>
                <SelectItem value="non-veg" className="cursor-pointer rounded-lg data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Non-Veg</SelectItem>
                <SelectItem value="mixed" className="cursor-pointer rounded-lg data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">Mixed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {errors.type && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <ExclamationCircleIcon className="w-4 h-4" />
              {errors.type}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={modalOverlayVariant}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-2 backdrop-blur-[2px] sm:p-4"
        onClick={onClose}
      >
        <motion.div
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
                  errors={formErrors}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditItemModal;
