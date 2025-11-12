import React from 'react'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Button } from '../../../ui/button';

export default function UpdateFormActions({ onClose, isSubmitting, fileError }) {
    return (
        <div>
            <motion.div
                className="flex justify-end gap-4"
                variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: (i) => ({
                        opacity: 1,
                        y: 0,
                        transition: {
                            delay: i * 0.05,
                            duration: 0.4,
                            ease: "easeOut",
                        },
                    }),
                }}
                initial="hidden"
                animate="visible"
                custom={4}
            >
                <Button
                    type="button"
                    className="py-2.5 px-6 h-full rounded-xl text-base font-semibold" // CHANGED: Smaller padding/text
                    variant="outline"
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <motion.button
                    type="submit"
                    disabled={isSubmitting || !!fileError}
                    whileTap={{ scale: 0.95 }}
                    className="bg-orange-500 text-white py-2.5 px-6 rounded-xl text-base font-semibold shadow-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[180px]" // CHANGED: Smaller padding/text/min-width
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Updating...
                        </>
                    ) : (
                        <>
                            <span>💾</span>
                            Update
                        </>
                    )}
                </motion.button>
            </motion.div>
        </div>
    )
}
