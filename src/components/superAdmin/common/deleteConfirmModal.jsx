import { motion, AnimatePresence } from "framer-motion"

export function DeleteConfirmModal({ 
  show, 
  onCancel, 
  onConfirm, 
  loading 
}) {
  const MotionDiv = motion.div;
  const MotionButton = motion.button;
  if (!show) return null

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
        onClick={onCancel}
      >
        <MotionDiv
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300 
          }}
          className="relative mx-auto w-full max-w-md rounded-2xl border border-orange-100 bg-white/95 p-6 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            {/* Warning Icon */}
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-red-200 bg-red-100 text-red-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              Confirm Deletion
            </h3>

            {/* Warning Message */}
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-red-800 font-semibold text-lg">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-red-700 mt-2">
                All your restaurant data, menu items, and settings will be permanently deleted.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <MotionButton
                onClick={onCancel}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className="h-11 flex-1 rounded-xl border border-orange-200 bg-white font-semibold text-gray-700 transition-colors hover:bg-orange-50"
              >
                Cancel
              </MotionButton>
              
              <MotionButton
                onClick={onConfirm}
                disabled={loading}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-600 bg-gradient-to-r from-red-500 to-red-600 font-semibold text-white transition-colors hover:from-red-600 hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    Yes, Delete
                  </>
                )}
              </MotionButton>
            </div>
          </div>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  )
}
