export const getCompactPageNumbers = (currentPage, totalPages, maxVisiblePages = 5) => {
  const safeTotalPages = Math.max(0, Number(totalPages) || 0);

  if (safeTotalPages <= 1) {
    return [1];
  }

  const safeCurrentPage = Math.min(
    Math.max(1, Number(currentPage) || 1),
    safeTotalPages
  );

  // Keep compact behavior from page-count 5 onward, so controls do not stretch.
  if (safeTotalPages <= Math.max(4, maxVisiblePages - 1)) {
    return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
  }

  if (safeCurrentPage <= 2) {
    return [1, 2, "ellipsis-right", safeTotalPages];
  }

  if (safeCurrentPage >= safeTotalPages - 1) {
    return [1, "ellipsis-left", safeTotalPages - 1, safeTotalPages];
  }

  return [1, "ellipsis-left", safeCurrentPage, "ellipsis-right", safeTotalPages];
};
