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
  if (!orderId) {
    throw new Error("Order ID is required");
  }

  const token = localStorage.getItem("admin_token");

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${BASE_URL}/admin/orders/${encodeURIComponent(orderId)}/print-kot`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to print KOT (${response.status})`
    );
  }

  return { success: true };
}