export const getCompactPageNumbers = (
  currentPage,
  totalPages,
  maxVisiblePages = 5
) => {
  const total = Math.max(0, Number(totalPages) || 0);

  if (total <= 1) {
    return [1];
  }

  const current = Math.min(
    Math.max(1, Number(currentPage) || 1),
    total
  );

  // Show every page when pagination is small
  if (total <= maxVisiblePages) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  // Beginning
  if (current <= 2) {
    return [1, 2, "ellipsis-right", total];
  }

  // End
  if (current >= total - 1) {
    return [1, "ellipsis-left", total - 1, total];
  }

  // Middle
  return [
    1,
    "ellipsis-left",
    current,
    "ellipsis-right",
    total,
  ];
};
