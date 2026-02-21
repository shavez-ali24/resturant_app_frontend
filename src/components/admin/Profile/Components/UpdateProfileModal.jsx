import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUpdateProfileForm } from '../Hooks/useUpdateProfileForm';
import { modalOverlayVariant, modalContentVariant, chipVariant } from '../Lib/motionVariants';
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
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-2 sm:p-4"
                onClick={onClose}
            >
                {/* Main Form Modal */}
                <motion.div
                    variants={modalContentVariant}
                    className="relative bg-white rounded-2xl shadow-2xl border border-orange-100 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full p-3 md:p-5 space-y-4 overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-4 border-b border-orange-200">
                            <h2 className="text-1xl sm:text-2xl font-bold text-orange-700">
                                Update Restaurant Profile
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-orange-400 hover:text-orange-700 transition-colors p-1 rounded-full hover:bg-orange-100"
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
                                chipVariant={chipVariant}
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