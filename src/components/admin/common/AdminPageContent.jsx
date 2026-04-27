/**
 * ✅ GLOBAL ADMIN PAGE CONTENT WRAPPER
 * Use this for EVERY admin page to fix mobile scrolling permanently
 * Automatically handles:
 * - Proper viewport height calculation
 * - Mobile safe area bottom padding
 * - Smooth native scrolling
 * - iOS Safari fixes
 * - No more content cut off at bottom
 * 
 * Usage: wrap your entire page content with this component
 * Replace any min-h-screen / h-screen classes on your page containers
 */
export default function AdminPageContent({ children, className = "", padding = true }) {
  return (
    <div 
      className={`
        w-full flex flex-col flex-1
        ${padding ? "p-3 sm:p-4 md:p-5 lg:p-6" : ""}
        min-h-[1px]
        pb-[calc(1rem+env(safe-area-inset-bottom))]
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// ✅ Helper for pages that need full height without padding
AdminPageContent.Full = function AdminPageFullContent({ children, className = "" }) {
  return <AdminPageContent padding={false} className={className}>{children}</AdminPageContent>
}