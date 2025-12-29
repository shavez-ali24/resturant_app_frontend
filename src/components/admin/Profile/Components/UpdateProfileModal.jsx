import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUpdateProfileForm } from '../Hooks/useUpdateProfileForm';
import { modalOverlayVariant, modalContentVariant } from '../Lib/motionVariants';
import UpdateCoreProfileForm from './UpdateCoreProfileForm';
import UpdateCategoriesForm from './UpdateCategoriesForm';
import UpdateOrderModeForm from './UpdateOrderModeForm';
import UpdateFinancialsForm from './UpdateFinancialsForm';
import UpdateBrandingForm from './UpdateBrandingForm';
import UpdateFormActions from './UpdateFormActions';

export const UpdateProfileModal = ({ initialData, token, onClose, onUpdateSuccess }) => {
    // Add ESC key handler
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscKey);
        
        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleEscKey);
        };
    }, [onClose]);

    const {
        formData, categories, currentCategoryInput, setCurrentCategoryInput,
        file, fileError, isSubmitting, notification, categorySuggestions,
        activeModesCount, atLeastOneModeActive, handleChange, handleGstToggle,
        handleOrderModeToggle, handleFileChange, handleCategoryKeyDown,
        handleRemoveCategory, handleSubmit, closeNotification
    } = useUpdateProfileForm(initialData, token, onUpdateSuccess, onClose);

    return (
        <AnimatePresence>
            <motion.div
                variants={modalOverlayVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Main Form Modal */}
                <motion.div
                    variants={modalContentVariant}
                    className="relative mt-10 bg-gray-50 rounded-xl shadow-2xl w-full max-w-3xl mx-auto max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full p-4 md:p-8 space-y-6">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Update Restaurant Profile
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200"
                                aria-label="Close modal"
                            >
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-6 w-6" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M6 18L18 6M6 6l12 12" 
                                    />
                                </svg>
                            </button>
                        </div>

                        <motion.form onSubmit={handleSubmit} className="space-y-6">
                            {/* Form sections */}
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

                            {/* Form buttons */}
                            <UpdateFormActions
                                isSubmitting={isSubmitting}
                                fileError={fileError}
                                onClose={onClose}
                            />
                        </motion.form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};