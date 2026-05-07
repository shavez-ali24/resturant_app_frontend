import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  defaultAddFormState,
  modalOverlayVariant,
  addItemModalVariant,
} from "../Lib/constants";

import ModalHeader from "./AddItemModal/components/ModalHeader";
import ErrorDisplay from "./AddItemModal/components/ErrorDisplay";
import FormInput from "./AddItemModal/components/FormInput";
import PricingTypeSelector from "./AddItemModal/components/PricingTypeSelector";
import SinglePriceSection from "./AddItemModal/components/SinglePriceSection";
import VariantPriceSection from "./AddItemModal/components/VariantPriceSection";
import ComboPriceSection from "./AddItemModal/components/ComboPriceSection";
import CategoryTypeSelectors from "./AddItemModal/components/CategoryTypeSelectors";
import ImageUpload from "./AddItemModal/components/ImageUpload";
import AvailabilityToggle from "./AddItemModal/components/AvailabilityToggle";
import SubmitButton from "./AddItemModal/components/SubmitButton";
import DescriptionField from "./AddItemModal/components/DescriptionField";

import { validateForm } from "./AddItemModal/utils/validators";
import {
  handleAddFormChange,
  handleAddFormFileChange,
  setPricingType,
  handleSubmit,
} from "./AddItemModal/utils/formHandlers";

import { useGetMenuQuery } from "../../../../redux/adminRedux/adminAPI";

const AddItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  restaurantCategories = [],
  menuItems = [],
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  fullPage = false,
}) => {
  const MotionDiv = motion.div;
  const MotionForm = motion.form;
  const [addFormData, setAddFormData] = useState(defaultAddFormState);
  const [addFile, setAddFile] = useState(null);
  const [addFileError, setAddFileError] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [comboItems, setComboItems] = useState([]);
  const modalContentRef = useRef(null);

  const {
    data: apiResponse = {},
    isLoading: isLoadingMenuItems,
    refetch: refetchMenuItems,
  } = useGetMenuQuery(undefined, { skip: !isOpen });

  const extractMenuItems = () => {
    if (!apiResponse) return [];
    if (Array.isArray(apiResponse)) return apiResponse;
    if (Array.isArray(apiResponse.menu)) return apiResponse.menu;
    if (Array.isArray(apiResponse.data)) return apiResponse.data;
    return [];
  };

  const apiMenuItems = extractMenuItems();
  const allMenuItems = menuItems.length ? menuItems : apiMenuItems;

  useEffect(() => {
    if (!isOpen) {
      setAddFormData(defaultAddFormState);
      setAddFile(null);
      setAddFileError("");
      setIsAddingItem(false);
      setFormErrors({});
      setBackendError("");
      setComboItems([]);
    } else {
      refetchMenuItems();
    }
  }, [isOpen, refetchMenuItems]);

  const handleChange = (e) =>
    handleAddFormChange(
      e,
      addFormData,
      setAddFormData,
      formErrors,
      setFormErrors,
      backendError,
      setBackendError
    );

  const handleFileChange = (e) =>
    handleAddFormFileChange(e, setAddFile, setAddFileError);

  const handlePricingTypeChange = (type) =>
    setPricingType(type, setFormErrors, setAddFormData, setComboItems);

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
    handleSubmit(
      e,
      addFormData,
      addFile,
      addFileError,
      comboItems,
      validateForm,
      setFormErrors,
      setBackendError,
      setIsAddingItem,
      onSubmit,
      onClose,
      scrollToFirstError
    );

  // ── Shared form content ──────────────────────────────────────────────────
  const formContent = (
    <MotionForm onSubmit={onSubmitHandler} className="p-4 sm:p-6 md:p-7">
      <ModalHeader onClose={onClose} />
      {backendError && <ErrorDisplay error={backendError} />}
      <div className="mt-5 space-y-5">
        <FormInput
          label="Product Name"
          name="name"
          value={addFormData.name}
          onChange={handleChange}
          error={formErrors.name}
          required
        />
        <PricingTypeSelector
          pricingType={addFormData.pricingType}
          setPricingType={handlePricingTypeChange}
        />
        <CategoryTypeSelectors
          category={addFormData.category}
          type={addFormData.type}
          restaurantCategories={restaurantCategories}
          errors={formErrors}
          setFormData={setAddFormData}
          setFormErrors={setFormErrors}
          onAddCategory={onAddCategory}
          onRenameCategory={onRenameCategory}
          onDeleteCategory={onDeleteCategory}
        />
        {addFormData.pricingType === "single" && (
          <SinglePriceSection
            price={addFormData.price}
            discount={addFormData.discount}
            errors={formErrors}
            handleChange={handleChange}
            setFormData={setAddFormData}
          />
        )}
        {addFormData.pricingType === "variant" && (
          <VariantPriceSection
            variantRates={addFormData.variantRates}
            errors={formErrors.variantRates}
            handleChange={handleChange}
            setFormData={setAddFormData}
          />
        )}
        {addFormData.pricingType === "combo" && (
          <ComboPriceSection
            comboPrice={addFormData.comboPrice}
            comboItems={comboItems}
            menuItems={allMenuItems}
            errors={formErrors}
            handleChange={handleChange}
            setComboItems={setComboItems}
            setFormData={setAddFormData}
            foodType={addFormData.type}
            discount={addFormData.discount}
            isLoadingMenu={isLoadingMenuItems}
          />
        )}
        <ImageUpload
          addFile={addFile}
          addFileError={addFileError}
          handleFileChange={handleFileChange}
        />
        <DescriptionField
          value={addFormData.description}
          onChange={handleChange}
          error={formErrors.description}
        />
        <AvailabilityToggle
          available={addFormData.available}
          handleChange={handleChange}
        />
        <SubmitButton
          isAddingItem={isAddingItem}
          onClose={onClose}
          submitText="Add Product"
        />
      </div>
    </MotionForm>
  );

  // ── Full-page mode — renders inside the admin layout (no overlay) ─────────
  if (fullPage) {
    return (
      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="h-full overflow-y-auto bg-[#f7f3ef] dark:bg-[#0f172a]"
          >
            <div className="mx-auto max-w-2xl px-4 py-6">
              <div
                ref={modalContentRef}
                className="rounded-xl border border-[#ede8e3] bg-white shadow-sm dark:border-slate-700/60 dark:bg-[#1e293b]"
              >
                {formContent}
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    );
  }

  // ── Modal overlay mode (default) ──────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <MotionDiv
          variants={modalOverlayVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-2 backdrop-blur-[2px] sm:p-4"
          onClick={onClose}
        >
          <MotionDiv
            variants={addItemModalVariant}
            className="w-full max-w-3xl rounded-2xl bg-gradient-to-br from-orange-100/60 via-orange-50/80 to-white p-[1px] shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={modalContentRef} className="max-h-[92dvh] overflow-y-auto rounded-[15px] border border-orange-100 bg-white/95 sm:max-h-[88vh]">
              {formContent}
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default AddItemModal;
