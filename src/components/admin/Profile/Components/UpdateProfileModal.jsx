import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useUpdateProfileForm } from '../Hooks/useUpdateProfileForm';
import { modalOverlayVariant, modalContentVariant } from '../Lib/motionVariants';
import NotificationModal from './ui/NotificationModal';
import UpdateCoreProfileForm from './UpdateCoreProfileForm';
import UpdateCategoriesForm from './UpdateCategoriesForm';
import UpdateOrderModeForm from './UpdateOrderModeForm';
import UpdateFinancialsForm from './UpdateFinancialsForm';
import UpdateBrandingForm from './UpdateBrandingForm';
import UpdateFormActions from './UpdateFormActions';


export const UpdateProfileModal = ({ initialData, token, onClose, onUpdateSuccess }) => {

    const {
        formData, categories, currentCategoryInput, setCurrentCategoryInput,
        file, fileError, isSubmitting, notification, categorySuggestions,
        activeModesCount, atLeastOneModeActive, handleChange, handleGstToggle,
        handleOrderModeToggle, handleFileChange, handleCategoryKeyDown,
        handleRemoveCategory, handleSubmit, closeNotification
    } = useUpdateProfileForm(initialData, token, onUpdateSuccess);

    return (
        <motion.div
            variants={modalOverlayVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* 1. Notification Popup */}
            <AnimatePresence>
                {notification.show && (
                    <NotificationModal
                        type={notification.type}
                        message={notification.message}
                        onClose={closeNotification}
                    />
                )}
            </AnimatePresence>

            {/* 2. Main Form Modal */}
            <motion.div
                variants={modalContentVariant}
                // Use bg-gray-50 to match your old cards
                className="relative mt-10 bg-gray-50 rounded-xl shadow-2xl w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full p-4 md:p-8 space-y-6">
                    <motion.form onSubmit={handleSubmit} className="space-y-6">

                        {/* 3. All your form sections, now as components */}
                        <UpdateCoreProfileForm
                            formData={formData}
                            handleChange={handleChange}
                        />

                        <UpdateCategoriesForm
                            categories={categories}
                            currentCategoryInput={currentCategoryInput}
                            setCurrentCategoryInput={setCurrentCategoryInput}
                            handleCategoryKeyDown={handleCategoryKeyDown}
                            handleRemoveCategory={handleRemoveCategory}
                            categorySuggestions={categorySuggestions}
                        />

                        <UpdateOrderModeForm
                            formData={formData}
                            handleOrderModeToggle={handleOrderModeToggle}
                            activeModesCount={activeModesCount}
                            atLeastOneModeActive={atLeastOneModeActive}
                        />

                        <UpdateFinancialsForm
                            formData={formData}
                            handleChange={handleChange}
                            handleGstToggle={handleGstToggle}
                        />

                        <UpdateBrandingForm
                            file={file}
                            fileError={fileError}
                            handleFileChange={handleFileChange}
                        />

                        {/* 4. The form buttons */}
                        <UpdateFormActions
                            isSubmitting={isSubmitting}
                            fileError={fileError}
                            onClose={onClose}
                        />

                    </motion.form>
                </div>
            </motion.div>
        </motion.div>
    );
};
