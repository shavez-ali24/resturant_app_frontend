/**
 * adminTour.js
 * Central config for all admin page tours.
 * Each tour is a function returning a steps array.
 * Steps use data-tour="selector" attributes added to JSX elements.
 *
 * Icons: inline SVG from lucide-react (driver.js popover renders HTML)
 */

// ─── localStorage keys ────────────────────────────────────────────────────────
export const TOUR_KEYS = {
  dashboard:  "admin_tour_dashboard",
  orders:     "admin_tour_orders",
  completed:  "admin_tour_completed",
  cancelled:  "admin_tour_cancelled",
  sales:      "admin_tour_sales",
  revenue:    "admin_tour_revenue",
  staff:      "admin_tour_staff",
  menu:       "admin_tour_menu",
  orderPanel: "admin_tour_orderpanel",
  profile:    "admin_tour_profile",
};

export const hasTourSeen = (key) =>
  typeof window !== "undefined" && localStorage.getItem(key) === "done";

export const markTourSeen = (key) => {
  if (typeof window !== "undefined") localStorage.setItem(key, "done");
};

// ─── Shared driver.js config ──────────────────────────────────────────────────
export const getDriverConfig = (isDarkMode = false) => ({
  animate: true,
  smoothScroll: true,
  allowClose: true,
  overlayClickBehavior: () => {},
  stagePadding: 4,
  stageRadius: 12,
  overlayOpacity: isDarkMode ? 0.75 : 0.6,
  popoverClass: isDarkMode ? "admin-tour-dark" : "admin-tour-light",
  showProgress: true,
  progressText: "{{current}} of {{total}}",
  popoverOffset: 20,
});

// ─── Lucide SVG helpers (inline — no import needed) ──────────────────────────
const icon = (path, size = 16) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;color:#f97316">${path}</svg>`;

const icons = {
  layoutDashboard: icon('<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/>'),
  toggleRight:     icon('<rect width="20" height="12" x="2" y="6" rx="6"/><circle cx="16" cy="12" r="2"/>'),
  clipboardList:   icon('<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>'),
  plusCircle:      icon('<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>'),
  checkCircle:     icon('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>'),
  xCircle:         icon('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'),
  barChart:        icon('<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>'),
  trendingUp:      icon('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'),
  users:           icon('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  userPlus:        icon('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>'),
  utensils:        icon('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'),
  slidersHorizontal: icon('<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><circle cx="12" cy="4" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="20" r="2"/>'),
  gripVertical:    icon('<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>'),
  shoppingCart:    icon('<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>'),
  settings:        icon('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
  pencil:          icon('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'),
  image:           icon('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'),
  tag:             icon('<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>'),
  refreshCw:       icon('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'),
  arrowUpDown:     icon('<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>'),
};

// ─── Tour step definitions ────────────────────────────────────────────────────

export const getDashboardSteps = () => [
  {
    element: "[data-tour='dashboard-welcome']",
    popover: {
      title: `${icons.layoutDashboard} Welcome to your Dashboard`,
      description: "This is your command center. Get a quick overview of your restaurant's performance at a glance.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='header-restaurant-toggle']",
    popover: {
      title: `${icons.toggleRight} Restaurant Open / Close`,
      description: "Toggle your restaurant open or closed. When closed, new orders are paused. Customers will see a 'Closed' message.",
      side: "bottom", align: "center",
    },
  },
  {
    element: "[data-tour='dashboard-stats']",
    popover: {
      title: `${icons.barChart} Key Metrics`,
      description: "Track today's orders, revenue, and active tables in real time.",
      side: "bottom", align: "center",
    },
  },
  {
    element: "[data-tour='sidebar-orders']",
    popover: {
      title: `${icons.clipboardList} Live Orders`,
      description: "Jump to live orders anytime from the sidebar. New orders appear here instantly.",
      side: "right", align: "center",
    },
  },
];

export const getOrdersSteps = () => [
  {
    element: "[data-tour='header-restaurant-toggle']",
    popover: {
      title: `${icons.toggleRight} Restaurant Open / Close`,
      description: "Toggle your restaurant open or closed from here. When closed, new orders are paused instantly.",
      side: "bottom", align: "center",
    },
  },
  {
    element: "[data-tour='orders-heading']",
    popover: {
      title: `${icons.clipboardList} Live Orders`,
      description: "All incoming orders appear here in real time. The page auto-refreshes — no manual reload needed.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='orders-create-btn']",
    popover: {
      title: `${icons.plusCircle} Create Order`,
      description: "Place a manual order on behalf of a customer directly from here.",
      side: "bottom", align: "end",
    },
  },
  {
    element: "[data-tour='orders-table']",
    popover: {
      title: `${icons.clipboardList} Order List`,
      description: "Each row shows order ID, customer details, items, and current status. Scroll to see all orders.",
      side: "top", align: "center",
    },
  },
  {
    element: "[data-tour='orders-status-dropdown']",
    popover: {
      title: `${icons.arrowUpDown} Update Status`,
      description: "Change an order's status — Pending → Preparing → Ready → Completed. Kitchen gets notified instantly.",
      side: "left", align: "center",
    },
  },
  {
    element: "[data-tour='orders-mobile-status']",
    popover: {
      title: `${icons.arrowUpDown} Update Status`,
      description: "Change an order's status — Pending → Preparing → Ready → Completed. Kitchen gets notified instantly.",
      side: "top", align: "center",
    },
  },
];

export const getCompletedSteps = () => [
  {
    element: "[data-tour='completed-heading']",
    popover: {
      title: `${icons.checkCircle} Completed Orders`,
      description: "All successfully fulfilled orders are archived here for your records.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='completed-table']",
    popover: {
      title: `${icons.clipboardList} Order History`,
      description: "Browse past orders, view item details, and check totals. Use pagination to navigate older records.",
      side: "top", align: "center",
    },
  },
];

export const getCancelledSteps = () => [
  {
    element: "[data-tour='cancelled-heading']",
    popover: {
      title: `${icons.xCircle} Cancelled Orders`,
      description: "Orders that were cancelled by staff or customers appear here.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='cancelled-table']",
    popover: {
      title: `${icons.clipboardList} Cancellation Log`,
      description: "Review cancelled orders to identify patterns and reduce future cancellations.",
      side: "top", align: "center",
    },
  },
];

export const getSalesSteps = () => [
  {
    element: "[data-tour='sales-heading']",
    popover: {
      title: `${icons.barChart} Sales Analytics`,
      description: "Deep dive into your sales data — top items, revenue trends, and customer patterns.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='sales-date-filter']",
    popover: {
      title: `${icons.slidersHorizontal} Date Range Filter`,
      description: "Filter sales by today, this week, this month, or a custom date range.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='sales-refresh']",
    popover: {
      title: `${icons.refreshCw} Refresh Data`,
      description: "Pull the latest sales data from the server anytime.",
      side: "bottom", align: "end",
    },
  },
  {
    element: "[data-tour='sales-chart']",
    popover: {
      title: `${icons.trendingUp} Sales Chart`,
      description: "Visualize your top selling products and categories. Switch between Products and Categories tabs.",
      side: "top", align: "center",
    },
  },
];

export const getRevenueSteps = () => [
  {
    element: "[data-tour='revenue-heading']",
    popover: {
      title: `${icons.trendingUp} Revenue Overview`,
      description: "Track your restaurant's total earnings, GST collected, and net revenue.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='revenue-cards']",
    popover: {
      title: `${icons.barChart} Revenue Cards`,
      description: "Quick summary of total revenue, average order value, and order count for the selected period.",
      side: "bottom", align: "center",
    },
  },
  {
    element: "[data-tour='revenue-date-filter']",
    popover: {
      title: `${icons.slidersHorizontal} Time Period`,
      description: "Switch between daily, weekly, monthly, or custom date ranges to analyze trends.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='revenue-refresh']",
    popover: {
      title: `${icons.refreshCw} Refresh`,
      description: "Sync the latest revenue data from your backend.",
      side: "bottom", align: "end",
    },
  },
];

export const getStaffSteps = () => [
  {
    element: "[data-tour='staff-heading']",
    popover: {
      title: `${icons.users} Staff Management`,
      description: "Manage your team — add staff members, assign roles, and control access.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='staff-add-btn']",
    popover: {
      title: `${icons.userPlus} Add Staff`,
      description: "Create a new staff account. Staff can log in and manage orders but cannot access admin settings.",
      side: "bottom", align: "end",
    },
  },
  {
    element: "[data-tour='staff-list']",
    popover: {
      title: `${icons.users} Staff List`,
      description: "View all staff members, their roles, and account status. Edit or remove access anytime.",
      side: "top", align: "center",
    },
  },
];

export const getMenuSteps = () => [
  {
    element: "[data-tour='menu-heading']",
    popover: {
      title: `${icons.utensils} Menu Management`,
      description: "Build and manage your full menu — categories, items, pricing, and availability.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='menu-filters-btn']",
    popover: {
      title: `${icons.slidersHorizontal} Filters`,
      description: "Filter menu items by category, type (veg/non-veg), or availability status.",
      side: "bottom", align: "end",
    },
  },
  {
    element: "[data-tour='menu-categories']",
    popover: {
      title: `${icons.tag} Categories`,
      description: "Your menu categories are listed here. Click any category to view its items on the right.",
      side: "right", align: "start",
    },
  },
  {
    element: "[data-tour='menu-manage-btn']",
    popover: {
      title: `${icons.gripVertical} Manage & Reorder Categories`,
      description: "Click <strong>Manage</strong> to enter drag & drop mode. Each category will show a <strong>grip handle</strong> — hold it and drag up or down to reorder. Order is saved automatically.",
      side: "bottom", align: "end",
    },
  },
  {
    element: "[data-tour='menu-drag-category']",
    popover: {
      title: `${icons.arrowUpDown} Drag to Reorder`,
      description: "This is the drag handle. Hold and drag it to move this category up or down. Release to save the new order.",
      side: "right", align: "center",
    },
  },
  {
    element: "[data-tour='menu-add-item-btn']",
    popover: {
      title: `${icons.plusCircle} Add New Item`,
      description: "Add a new dish with name, price, image, and variants. It goes live immediately.",
      side: "bottom", align: "end",
    },
  },
  {
    element: "[data-tour='menu-item-list']",
    popover: {
      title: `${icons.utensils} Menu Items`,
      description: "Edit, delete, or toggle availability of any item. Unavailable items are hidden from customers.",
      side: "top", align: "center",
    },
  },
  {
    element: "[data-tour='menu-drag-item']",
    popover: {
      title: `${icons.arrowUpDown} Reorder Items`,
      description: "Hold and drag this grip handle to reorder items within a category. Order is saved automatically.",
      side: "left", align: "center",
    },
  },
];

export const getOrderPanelSteps = () => [
  {
    element: "[data-tour='orderpanel-categories']",
    popover: {
      title: `${icons.tag} Browse Categories`,
      description: "Select a category to browse menu items. Click any category to filter the item grid.",
      side: "right", align: "start",
    },
  },
  {
    element: "[data-tour='orderpanel-items']",
    popover: {
      title: `${icons.utensils} Menu Items`,
      description: "Click '+ Add' to add items to the order. Select variants if available.",
      side: "left", align: "center",
    },
  },
  {
    element: "[data-tour='orderpanel-summary']",
    popover: {
      title: `${icons.shoppingCart} Order Summary`,
      description: "Review cart items, select order type (Dine In / Delivery / Take Away), and enter customer details.",
      side: "left", align: "center",
    },
  },
];

export const getProfileSteps = () => [
  {
    element: "[data-tour='profile-heading']",
    popover: {
      title: `${icons.settings} Restaurant Profile`,
      description: "Manage your restaurant's public info, branding, and operational settings.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='profile-edit-btn']",
    popover: {
      title: `${icons.pencil} Edit Profile`,
      description: "Click here to update your restaurant name, logo, categories, GST settings, and more.",
      side: "bottom", align: "end",
    },
  },
  {
    element: "[data-tour='profile-branding']",
    popover: {
      title: `${icons.image} Branding`,
      description: "Update your restaurant name, logo, and banner image that customers see.",
      side: "bottom", align: "center",
    },
  },
  {
    element: "[data-tour='profile-categories']",
    popover: {
      title: `${icons.tag} Menu Categories`,
      description: "Add, remove, or reorder the categories shown on your menu.",
      side: "top", align: "center",
    },
  },
  {
    element: "[data-tour='profile-settings']",
    popover: {
      title: `${icons.settings} Settings`,
      description: "Configure GST, delivery charges, table count, and other operational settings.",
      side: "top", align: "center",
    },
  },
];
