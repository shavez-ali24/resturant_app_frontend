// src/hooks/useTableLayout.js
// This hook was previously used to fetch table layout from a dedicated API endpoint.
// Since that endpoint does not exist, table/section data is now derived inline
// from the restaurant profile (useGetRestaurantProfileQuery) combined with active orders.
// See PendingOrders.jsx → layoutSections useMemo for the derivation logic.
export {};