/**
 * Maps raw backend validation/error messages to highly user-friendly and clear statements.
 *
 * @param {string|object} error - The backend error message string or object.
 * @param {string} defaultMessage - The fallback message if no match is found.
 * @returns {string} The formatted user-friendly error message.
 */
export const getFriendlyErrorMessage = (error, defaultMessage = "Something went wrong. Please try again.") => {
  const backendMessage = typeof error === "string" 
    ? error 
    : error?.message || error?.data?.message || "";

  const msg = String(backendMessage || "").trim().toLowerCase();

  // General Cart/Item errors
  if (msg.includes("items required") || msg.includes("cart is empty")) {
    return "Your cart is empty! Please add some delicious items from the menu before placing an order.";
  }
  if (msg.includes("one or more items are not available") || msg.includes("item not found")) {
    return "Some items in your cart are temporarily sold out or unavailable. Please review your cart and try again.";
  }

  // Dine-in / QR / Table / Room errors
  if (msg.includes("qr unitid is required") || msg.includes("unitid required") || msg.includes("table id required")) {
    return "Dine-in orders require scanning the QR code on your table. Please scan the QR code and try again.";
  }
  if (msg.includes("unit not found") || msg.includes("table not found")) {
    return "We couldn't recognize this table or room. Please make sure you are scanning the correct QR code.";
  }
  if (msg.includes("room is not booked") || msg.includes("stay not enabled")) {
    return "This room booking is not currently active. Please make sure the check-in is complete at the reception before ordering food.";
  }
  if (msg.includes("already occupied") || msg.includes("already booked") || msg.includes("occupied by another customer")) {
    return "This table is already active. If you are sitting with friends, please place your order using the same phone/device that placed the first order.";
  }

  // Order Lifecycle
  if (msg.includes("order already completed") || msg.includes("already billed")) {
    return "This order has already been finalized and billed. If you wish to order more, please start a new order.";
  }
  if (msg.includes("cannot modify items of a completed/cancelled order")) {
    return "This order has already been finalized or cancelled, so it cannot be modified.";
  }
  if (msg.includes("order not found")) {
    return "We couldn't find your order details. Please refresh the page.";
  }

  // Restaurant details
  if (msg.includes("restaurant not found") || msg.includes("tenant not found")) {
    return "The restaurant details could not be loaded. Please try again in a few moments.";
  }

  // Authentication & session
  if (msg.includes("unauthorized") || msg.includes("invalid token") || msg.includes("credentials")) {
    return "Your session has expired. Please refresh the page to restore your connection.";
  }
  if (msg.includes("fingerprint required")) {
    return "We couldn't identify your order session. Please refresh the page and try again.";
  }

  // Network or general database failures
  if (msg.includes("server error") || msg.includes("database error") || msg.includes("mongo")) {
    return "We're experiencing minor server issues right now. Please wait a few seconds and try again.";
  }

  return backendMessage || defaultMessage;
};

/**
 * Maps admin-side success and error notification messages to cleaner, more professional variants.
 *
 * @param {string} message - The original technical message string.
 * @param {string} type - Notification type ('success', 'error', 'info').
 * @returns {string} The simplified, user-friendly message.
 */
export const getFriendlyAdminMessage = (message, type = "success") => {
  if (typeof message !== "string") return message;

  const msg = message.trim().toLowerCase();

  // Success messages
  if (type === "success") {
    if (msg.includes("menu item added")) return "Success! The menu item has been added to your catalog.";
    if (msg.includes("menu item updated")) return "Success! The menu item details have been saved.";
    if (msg.includes("menu item deleted")) return "Success! The menu item was removed.";
    if (msg.includes("category") && msg.includes("added")) return "Success! New category created.";
    if (msg.includes("category renamed")) return "Success! Category has been renamed.";
    if (msg.includes("category") && msg.includes("deleted")) return "Success! Category deleted successfully.";
    if (msg.includes("room details updated")) return "Success! Room stay and pricing details updated.";
    if (msg.includes("section renamed")) return "Success! Layout section renamed.";
    if (msg.includes("staff created")) return "Success! New staff member registered successfully.";
    if (msg.includes("staff updated")) return "Success! Staff profile updated.";
    if (msg.includes("staff deleted")) return "Success! Staff member removed.";
    if (msg.includes("order billed")) return "Success! Invoice generated and order billed.";
    if (msg.includes("filters reset")) return "Filters cleared.";
    
    return message;
  }

  // Error/Info messages
  if (msg.includes("tenant not found") || msg.includes("restaurant not found")) {
    return "Error: Restaurant details could not be found. Please check setup.";
  }
  if (msg.includes("domain already exists")) {
    return "This custom domain name is already taken. Please try another one.";
  }
  if (msg.includes("only superadmin can edit admin")) {
    return "Access Denied: Only system administrators can modify admin accounts.";
  }
  if (msg.includes("only superadmin can delete admin")) {
    return "Access Denied: Only system administrators can delete admin accounts.";
  }
  if (msg.includes("you cannot delete your own account")) {
    return "Action Denied: You cannot delete your own logged-in account.";
  }
  if (msg.includes("cannot modify items of a completed/cancelled order")) {
    return "Action Denied: Items cannot be changed for completed or cancelled orders.";
  }
  if (msg.includes("invalid credentials") || msg.includes("unauthorized")) {
    return "Access Denied: Invalid email or password. Please try again.";
  }
  if (msg.includes("email already exists")) {
    return "This email address is already registered to another user.";
  }
  if (msg.includes("from date cannot be after to date")) {
    return "Invalid Range: The starting date cannot be after the ending date.";
  }
  if (msg.includes("billed order not found")) {
    return "We couldn't retrieve the billed invoice. Please try refreshing the screen.";
  }
  if (msg.includes("failed to place order")) {
    return "We couldn't place the order. Please check item details and try again.";
  }
  if (msg.includes("name, email, password, and role are required")) {
    return "Validation Error: Please fill in all required profile fields.";
  }

  return message;
};
