// src/services/tableService.js
import config from "@/config";

const BASE_URL = `${config.BASE_URL}/api`;

/**
 * Print KOT (Kitchen Order Ticket) for a given order.
 * POST /api/admin/orders/:orderId/print-kot
 *
 * @param {string} orderId
 * @returns {Promise<{ success: boolean }>}
 */
export async function printKot(orderId) {
  const token = localStorage.getItem("admin_token");

  const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/print-kot`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.message ||
      errorBody?.error ||
      `Failed to print KOT (${response.status})`;
    throw new Error(message);
  }

  return { success: true };
}