import React, { useState, useEffect } from "react";
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
}) => {
  const [addFormData, setAddFormData] = useState(defaultAddFormState);
  const [addFile, setAddFile] = useState(null);
  const [addFileError, setAddFileError] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [comboItems, setComboItems] = useState([]);

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
      onClose
    );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlayVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4"
          onClick={onClose}
        >
          <motion.div
            variants={addItemModalVariant}
            className="w-full max-w-3xl rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[92dvh] overflow-y-auto rounded-[14px] bg-white sm:max-h-[88vh]">
              <motion.form onSubmit={onSubmitHandler} className="p-4 sm:p-6">
                <ModalHeader onClose={onClose} />
                {backendError && <ErrorDisplay error={backendError} />}

                <div className="space-y-6 mt-6">
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
                      errors={
                        typeof formErrors.variantRates === "object"
                          ? formErrors.variantRates
                          : {}
                      }
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
              </motion.form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddItemModal;
