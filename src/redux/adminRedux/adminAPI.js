import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "../../config";

const normalizeIndexedText = (value) => {
  if (!value || typeof value !== "object") return "";
  const numericKeys = Object.keys(value).filter((key) => /^\d+$/.test(key));
  if (!numericKeys.length) return "";
  numericKeys.sort((a, b) => Number(a) - Number(b));
  const chars = numericKeys
    .map((key) => value[key])
    .filter((char) => char !== undefined && char !== null)
    .map((char) => String(char));
  const text = chars.join("").trim();
  return text || "";
};

const normalizeTextValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value !== "object") return String(value).trim();

  const candidate =
    value.name ||
    value.category ||
    value.categoryName ||
    value.label ||
    value.title ||
    value.value ||
    value.displayName;

  if (candidate) return String(candidate).trim();

  const indexed = normalizeIndexedText(value);
  if (indexed) return indexed;

  if (typeof value.toString === "function") {
    const text = String(value).trim();
    if (text && text !== "[object Object]") return text;
  }

  return "";
};

const normalizeRestaurantProfile = (restaurant) => {
  if (!restaurant || typeof restaurant !== "object") return restaurant;

  const normalized = { ...restaurant };

  if (normalized.name && typeof normalized.name !== "string") {
    normalized.name = normalizeTextValue(normalized.name);
  }

  if (
    normalized.restaurantName &&
    typeof normalized.restaurantName !== "string"
  ) {
    normalized.restaurantName = normalizeTextValue(normalized.restaurantName);
  }

  return normalized;
};

const normalizeMenuItem = (it) => {
  if (!it || typeof it !== "object") return it;
  const copy = { ...it };

  // Handle main discount - only set to null if it's truly invalid
  if (copy.discount) {
    if (copy.discount.active === false || copy.discount.value === 0 || copy.discount.value === null || copy.discount.value === "") {
      copy.discount = null;
    }
  }

  // Handle variant rates - only set to null if discount is truly invalid
  if (copy.variantRates) {
    const vr = { ...copy.variantRates };
    ["quarter", "half", "full"].forEach((k) => {
      if (vr[k] && vr[k].discount) {
        if (vr[k].discount.active === false || vr[k].discount.value === 0 || vr[k].discount.value === null || vr[k].discount.value === "") {
          vr[k] = { ...vr[k], discount: null };
        }
      }
    });
    copy.variantRates = vr;
  }

  return copy;
};

const baseQuery = fetchBaseQuery({
  baseUrl: `${config.BASE_URL}/api`,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");
    return headers;
  },
});

const baseQueryWithAuthRedirect = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  const status = result.error?.status || result.error?.originalStatus;

  if (typeof window !== "undefined" && (status === 401 || status === 403)) {
    localStorage.removeItem("token");
    localStorage.removeItem("adminInfo");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("user");
    window.location.replace("/login");
  }

  return result;
};

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: baseQueryWithAuthRedirect,

  tagTypes: [
    "Admin",
    "Restaurant",
    "Order",
    "Analytics",
    "Menu",
    "Profile",
    "TopSelling",
    "Staff",
    "Units",
  ],

  endpoints: (builder) => ({
    // AUTH ------------------------------------------------------------- done
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Admin"],
    }),

    // RESTAURANT PROFILE ---------------------------------------------- done
    getRestaurantProfile: builder.query({
      query: () => "/restaurant/admin",
      transformResponse: (response) => {
        // Handle { success: true, data: ... } format
        if (response?.data) {
          return { restaurant: normalizeRestaurantProfile(response.data) };
        }
        // Handle { restaurant: ... } format
        if (response?.restaurant) {
          return {
            ...response,
            restaurant: normalizeRestaurantProfile(response.restaurant),
          };
        }
        // Handle raw restaurant object
        if (response && response._id) {
          return { restaurant: normalizeRestaurantProfile(response) };
        }
        return { restaurant: null };
      },
      providesTags: ["Restaurant"],
    }),
    

    // done 
    updateRestaurantProfile: builder.mutation({
      query: (formData) => ({
        url: "/restaurant/",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Restaurant"],
    }),

    reorderCategories: builder.mutation({
      query: (orderedCategoryNames) => ({
        url: "/restaurant/reorder-categories",
        method: "POST",
        body: { orderedCategoryNames },
      }),
      invalidatesTags: ["Restaurant"],
    }),

    // done 
    toggleRestaurant: builder.mutation({
      query: ({ isOpen }) => ({
        url: "/restaurant/status",
        method: "PATCH",
        body: { isOpen },
      }),
      invalidatesTags: ["Restaurant"],
    }),

    // ORDER MANAGEMENT ----------------------------------------------- done 

    // Create Order by Admin/Staff (protected endpoint)
    createOrderByAdmin: builder.mutation({
      query: (orderData) => ({
        url: "/order/protected",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: [{ type: "Order", id: "LIST" }],
    }),

    // ✅ getOrders API - FIXED VERSION
    getOrders: builder.query({
      query: ({ status = "pending", range = "all", page = 1, limit = 10 }) => ({
        url: "/order",
        params: { status, range, page, limit },
      }),

      transformResponse: (response) => {
        // Case 1: Response is array
        if (Array.isArray(response)) {
          return {
            orders: response,
            totalOrders: response.length,
            totalPages: Math.ceil(response.length / 10),
            currentPage: 1,
          };
        }

        // Case 2: Response is object
        if (response && typeof response === "object") {
          if (Array.isArray(response.orders)) {
            return {
              orders: response.orders,
              totalOrders: response.totalOrders || response.orders.length,
              totalPages:
                response.totalPages ||
                Math.ceil(response.orders.length / 10),
              currentPage: response.currentPage || 1,
            };
          }

          if (Array.isArray(response.data)) {
            return {
              orders: response.data,
              totalOrders: response.total || response.data.length,
              totalPages:
                response.pages || Math.ceil(response.data.length / 10),
              currentPage: response.page || 1,
            };
          }

          const ordersArray = Object.values(response).filter(
            (item) => item && typeof item === "object" && item._id
          );

          if (ordersArray.length > 0) {
            return {
              orders: ordersArray,
              totalOrders: ordersArray.length,
              totalPages: Math.ceil(ordersArray.length / 10),
              currentPage: 1,
            };
          }
        }

        return { orders: [], totalOrders: 0, totalPages: 0, currentPage: 1 };
      },

      // ✅ FIXED: Match the format of updateOrder
      providesTags: (result) => {
        // If no result, return LIST tag
        if (!result?.orders || result.orders.length === 0) {
          return [{ type: "Order", id: "LIST" }];
        }
        
        // Return LIST tag + individual order tags
        return [
          { type: "Order", id: "LIST" },
          ...result.orders.map((order) => ({ 
            type: "Order", 
            id: order._id 
          }))
        ];
      },
    }),

    // ✅ updateOrder API - ALREADY CORRECT
    updateOrder: builder.mutation({
      query: ({ orderId, updatedData }) => ({
        url: `/order/${orderId}`,
        method: "PUT",
        body: updatedData,
      }),
      // This is correct - it matches the format we use in getOrders
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Order", id: orderId },
        { type: "Order", id: "LIST" },
        { type: "Order", id: "ACTIVE_LIST" },
      ],
    }),

    toggleItemReady: builder.mutation({
      query: ({ orderId, itemId }) => ({
        url: `/order/${orderId}/items/${itemId}/toggle-ready`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Order", id: orderId },
        { type: "Order", id: "LIST" },
        { type: "Order", id: "ACTIVE_LIST" },
      ],
    }),

    // done 
    deleteOrder: builder.mutation({
      query: (orderId) => ({
        url: `/order/${orderId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Order"],
    }),

    // ANALYTICS ------------------------------------------------------ done 
    getAnalytics: builder.query({
      query: ({ domain, range, from, to }) => {
        const params = new URLSearchParams();
        if (domain) params.set("domain", domain);
        if (range) params.set("range", range);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        return { url: `/analytics/insights?${params.toString()}` };
      },
      providesTags: ["Analytics"],
    }),

    // MENU ------------------------------------------------------------ done
    getMenu: builder.query({
      query: () => "/menu",
      transformResponse: (response) => {
        const arr = Array.isArray(response) ? response : response?.menu ?? [];
        return Array.isArray(arr) ? arr.map(normalizeMenuItem) : [];
        
      },
      providesTags: ["Menu"],
    }),
    

    // done 
    createMenuItem: builder.mutation({
      query: (formData) => ({
        url: "/menu/",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response) => normalizeMenuItem(response?.item || response),
      invalidatesTags: ["Menu"],
    }),

    // done 
    updateMenuItem: builder.mutation({
      query: ({ itemId, updatedData }) => ({
        url: `/menu/${itemId}`,
        method: "PUT",
        body: updatedData,
      }),
      transformResponse: (response) => normalizeMenuItem(response?.item || response),
      invalidatesTags: ["Menu"],
    }),

    // done 
    deleteMenuItem: builder.mutation({
      query: (itemId) => ({
        url: `/menu/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Menu"],
    }),

    // done
    reorderMenuItems: builder.mutation({
      query: (orderedMenuItemIds) => ({
        url: "/menu/reorder-menuitems",
        method: "POST",
        body: { orderedMenuItemIds },
      }),
      invalidatesTags: ["Menu"],
    }),

    // done 
    getTopSellingProducts: builder.query({
      query: ({ range = "7d", from, to }) => {
        const params = new URLSearchParams();
        if (range) params.set("range", range);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        return `/analytics/top-products?${params.toString()}`;
      },
      providesTags: ["TopSelling"],
    }),

    // done 
    getTopSellingCategories: builder.query({
      query: ({ range = "7d", from, to }) => {
        const params = new URLSearchParams();
        if (range) params.set("range", range);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        return `/analytics/top-categories?${params.toString()}`;
      },
      providesTags: ["TopSelling"],
    }),

    // STAFF MANAGEMENT
    getStaff: builder.query({
      query: () => "/auth/staff/mine",
      transformResponse: (response) => {
        // Handle { staff: [...] } format
        if (response?.staff && Array.isArray(response.staff)) {
          return response.staff;
        }
        // Handle { data: [...] } format
        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }
        // Handle array directly
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      },
      providesTags: ["Staff"],
    }),

    createStaff: builder.mutation({
      query: (staffData) => ({
        url: "/auth/register/staff",
        method: "POST",
        body: { ...staffData, role: "staff" },
      }),
      invalidatesTags: ["Staff"],
    }),

    updateStaff: builder.mutation({
      query: ({ staffId, updatedData }) => ({
        url: `/auth/${staffId}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Staff"],
    }),

    deleteStaff: builder.mutation({
      query: (staffId) => ({
        url: `/auth/${staffId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staff"],
    }),

    // ============================================================
    // TABLE / ROOM MANAGEMENT
    // ============================================================
    addUnits: builder.mutation({
      query: (body) => ({
        url: "/restaurant/units",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Restaurant", "Units"],
    }),

    // NOTE: Removed duplicate/unused queries and mutations per prompt.

    // ============================================================
    // NEW EXACT APIs AS PER PROMPT (with automatic Bearer token)
    // ============================================================
    // Aligned with actual backend routes (restaurantRoutes.js)
    getLiveUnits: builder.query({
      query: () => "/restaurant/units/live-status",
      providesTags: ["Units", "Restaurant"],
    }),

    bookRoom: builder.mutation({
      query: (payload) => ({
        url: "/restaurant/book",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Units", "Restaurant", "Order"],
    }),

    // Unified checkout for both tables and rooms (uses /api/order/checkout/:orderId)
    checkoutOrder: builder.mutation({
      query: (orderId) => ({
        url: `/order/checkout/${orderId}`,
        method: "POST",
      }),
      invalidatesTags: ["Order", "Units", "Restaurant"],
    }),

    addUnits: builder.mutation({
      query: (payload) => ({
        url: "/restaurant/units",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Units", "Restaurant"],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetRestaurantProfileQuery,
  useUpdateRestaurantProfileMutation,
  useReorderCategoriesMutation,
  useCreateOrderByAdminMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
  useToggleItemReadyMutation,
  useDeleteOrderMutation,
  useGetAnalyticsQuery,
  useGetMenuQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useReorderMenuItemsMutation,
  useToggleRestaurantMutation,
  useGetTopSellingProductsQuery,
  useGetTopSellingCategoriesQuery,
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useAddUnitsMutation,
  useGetLiveUnitsQuery,
  useBookRoomMutation,
  useCheckoutOrderMutation,
  useAddUnitsNewMutation,
} = adminApi;
