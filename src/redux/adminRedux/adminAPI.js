import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "../../config";
import { logout } from "./adminSlice";

const addAdminModifiedOrderId = (id) => {
  if (!id) return;
  try {
    const data = JSON.parse(sessionStorage.getItem("adminModifiedOrderIds") || "{}");
    let record = {};
    if (data && typeof data === "object" && !Array.isArray(data)) {
      record = { ...data };
    } else if (Array.isArray(data)) {
      data.forEach((oldId) => {
        record[String(oldId)] = Date.now();
      });
    }
    record[String(id)] = Date.now();
    const now = Date.now();
    const pruned = {};
    Object.entries(record).forEach(([key, val]) => {
      if (now - Number(val) < 30000) {
        pruned[key] = val;
      }
    });
    sessionStorage.setItem("adminModifiedOrderIds", JSON.stringify(pruned));
  } catch (_) {}
};

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
  if (normalized.restaurantName && typeof normalized.restaurantName !== "string") {
    normalized.restaurantName = normalizeTextValue(normalized.restaurantName);
  }
  return normalized;
};

const normalizeMenuItem = (it) => {
  if (!it || typeof it !== "object") return it;
  const copy = { ...it };
  if (copy.discount) {
    if (copy.discount.active === false || copy.discount.value === 0 || copy.discount.value === null || copy.discount.value === "") {
      copy.discount = null;
    }
  }
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
    const token = localStorage.getItem("admin_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");
    return headers;
  },
});

const baseQueryWithAuthRedirect = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  const status = result.error?.status || result.error?.originalStatus;
  const url = typeof args === "string" ? args : args?.url || "";
  const isLoginRequest = url.includes("/auth/login");

  if (typeof window !== "undefined" && !isLoginRequest && (status === 401 || status === 403)) {
    api.dispatch(logout());
    window.location.replace("/login");
  }
  return result;
};

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: baseQueryWithAuthRedirect,
  tagTypes: ["Admin", "Restaurant", "Order", "Analytics", "Menu", "Profile", "TopSelling", "Staff", "Units"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({ url: "/auth/login", method: "POST", body: credentials }),
      invalidatesTags: ["Admin"],
    }),
    getRestaurant: builder.query({
      query: () => "/restaurant/private",
      transformResponse: (response) => {
        if (response?.data) return { restaurant: normalizeRestaurantProfile(response.data) };
        if (response?.restaurant) return { ...response, restaurant: normalizeRestaurantProfile(response.restaurant) };
        if (response && response._id) return { restaurant: normalizeRestaurantProfile(response) };
        return { restaurant: null };
      },
      providesTags: ["Restaurant"],
    }),
    updateRestaurant: builder.mutation({
      query: (formData) => ({ url: "/restaurant/", method: "PUT", body: formData }),
      invalidatesTags: ["Restaurant"],
    }),
    reorderCategories: builder.mutation({
      query: (orderedCategoryNames) => ({ url: "/restaurant/categories/reorder", method: "POST", body: { orderedCategoryNames } }),
      invalidatesTags: ["Restaurant"],
    }),
    updateRestaurantGST: builder.mutation({
      query: (gstData) => ({ url: "/restaurant/gst", method: "PATCH", body: gstData }),
      invalidatesTags: ["Restaurant"],
    }),
    createCategories: builder.mutation({
      query: (categoryData) => ({ url: "/restaurant/categories", method: "POST", body: categoryData }),
      invalidatesTags: ["Restaurant"],
    }),
    updateCategory: builder.mutation({
      query: ({ categoryId, newName }) => ({ url: `/restaurant/categories/${categoryId}`, method: "PATCH", body: { newName } }),
      invalidatesTags: ["Restaurant", "Menu"],
    }),
    deleteCategory: builder.mutation({
      query: (categoryId) => ({ url: `/restaurant/categories/${categoryId}`, method: "DELETE" }),
      invalidatesTags: ["Restaurant", "Menu"],
    }),
    updateRestaurantStatus: builder.mutation({
      query: ({ isOpen }) => ({ url: "/restaurant/status", method: "PATCH", body: { isOpen } }),
      invalidatesTags: ["Restaurant"],
    }),
    createOrderByAdmin: builder.mutation({
      query: (orderData) => ({ url: "/order/protected", method: "POST", body: orderData }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const orderId = data?.order?._id || data?._id;
          if (orderId) addAdminModifiedOrderId(orderId);
        } catch (_) {}
      },
      invalidatesTags: [{ type: "Order", id: "LIST" }],
    }),
    getOrders: builder.query({
      query: ({ status = "pending", range = "all", page = 1, limit = 10 }) => ({
        url: "/order", params: { status, range, page, limit },
      }),
      transformResponse: (response) => {
        if (Array.isArray(response)) return { orders: response, totalOrders: response.length, totalPages: Math.ceil(response.length / 10), currentPage: 1 };
        if (response && typeof response === "object") {
          if (Array.isArray(response.orders)) return { orders: response.orders, totalOrders: response.totalOrders || response.orders.length, totalPages: response.totalPages || Math.ceil(response.orders.length / 10), currentPage: response.currentPage || 1 };
          if (Array.isArray(response.data)) return { orders: response.data, totalOrders: response.total || response.data.length, totalPages: response.pages || Math.ceil(response.data.length / 10), currentPage: response.page || 1 };
          const ordersArray = Object.values(response).filter((item) => item && typeof item === "object" && item._id);
          if (ordersArray.length > 0) return { orders: ordersArray, totalOrders: ordersArray.length, totalPages: Math.ceil(ordersArray.length / 10), currentPage: 1 };
        }
        return { orders: [], totalOrders: 0, totalPages: 0, currentPage: 1 };
      },
      providesTags: (result) => {
        if (!result?.orders || result.orders.length === 0) return [{ type: "Order", id: "LIST" }];
        return [{ type: "Order", id: "LIST" }, ...result.orders.map((order) => ({ type: "Order", id: order._id }))];
      },
    }),
    updateOrder: builder.mutation({
      query: ({ orderId, updatedData }) => ({ url: `/order/${orderId}`, method: "PUT", body: updatedData }),
      async onQueryStarted({ orderId }, { queryFulfilled }) {
        addAdminModifiedOrderId(orderId);
        try { await queryFulfilled; } catch (_) {}
      },
      invalidatesTags: (result, error, { orderId }) => [{ type: "Order", id: orderId }, { type: "Order", id: "LIST" }, { type: "Order", id: "ACTIVE_LIST" }],
    }),
    toggleItemReady: builder.mutation({
      query: ({ orderId, itemId }) => ({ url: `/order/${orderId}/items/${itemId}/toggle-ready`, method: "PATCH" }),
      async onQueryStarted({ orderId }, { queryFulfilled }) {
        addAdminModifiedOrderId(orderId);
        try { await queryFulfilled; } catch (_) {}
      },
      invalidatesTags: (result, error, { orderId }) => [{ type: "Order", id: orderId }, { type: "Order", id: "LIST" }, { type: "Order", id: "ACTIVE_LIST" }],
    }),
    cancelOrder: builder.mutation({
      query: (orderId) => ({ url: `/order/${orderId}`, method: "DELETE" }),
      invalidatesTags: ["Order"],
    }),
    cancelRoomBooking: builder.mutation({
      query: (orderId) => ({ url: `/order/${orderId}/cancel-booking`, method: "POST" }),
      invalidatesTags: ["Order"],
    }),
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
    getMenu: builder.query({
      query: () => "/menu",
      transformResponse: (response) => {
        const arr = Array.isArray(response) ? response : response?.menu ?? [];
        return Array.isArray(arr) ? arr.map(normalizeMenuItem) : [];
      },
      providesTags: ["Menu"],
    }),
    createMenuItem: builder.mutation({
      query: (formData) => ({ url: "/menu/", method: "POST", body: formData }),
      transformResponse: (response) => normalizeMenuItem(response?.item || response),
      invalidatesTags: ["Menu"],
    }),
    updateMenuItem: builder.mutation({
      query: ({ itemId, updatedData }) => ({ url: `/menu/${itemId}`, method: "PUT", body: updatedData }),
      transformResponse: (response) => normalizeMenuItem(response?.item || response),
      invalidatesTags: ["Menu"],
    }),
    deleteMenuItem: builder.mutation({
      query: (itemId) => ({ url: `/menu/${itemId}`, method: "DELETE" }),
      invalidatesTags: ["Menu"],
    }),
    reorderMenuItems: builder.mutation({
      query: (orderedMenuItemIds) => ({ url: "/menu/reorder-menuitems", method: "POST", body: { orderedMenuItemIds } }),
      invalidatesTags: ["Menu"],
    }),
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
    getStaff: builder.query({
      query: () => "/auth/staff/mine",
      transformResponse: (response) => {
        if (response?.staff && Array.isArray(response.staff)) return response.staff;
        if (response?.data && Array.isArray(response.data)) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      },
      providesTags: ["Staff"],
    }),
    createStaff: builder.mutation({
      query: (staffData) => ({ url: "/auth/register/staff", method: "POST", body: { ...staffData, role: "staff" } }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: builder.mutation({
      query: ({ staffId, updatedData }) => ({ url: `/auth/${staffId}`, method: "PUT", body: updatedData }),
      invalidatesTags: ["Staff"],
    }),
    deleteStaff: builder.mutation({
      query: (staffId) => ({ url: `/auth/${staffId}`, method: "DELETE" }),
      invalidatesTags: ["Staff"],
    }),
    createSectionsAndUnits: builder.mutation({
      query: (body) => ({ url: "/restaurant/sections", method: "POST", body }),
      invalidatesTags: ["Restaurant", "Units"],
    }),
    updateSections: builder.mutation({
      query: (body) => ({ url: "/restaurant/sections", method: "PATCH", body }),
      invalidatesTags: ["Restaurant", "Units"],
    }),
    deleteSection: builder.mutation({
      query: (sectionId) => ({ url: `/restaurant/sections/${sectionId}`, method: "DELETE" }),
      invalidatesTags: ["Restaurant", "Units"],
    }),
    deleteUnit: builder.mutation({
      query: (unitId) => ({ url: `/restaurant/sections/units/${unitId}`, method: "DELETE" }),
      invalidatesTags: ["Restaurant", "Units"],
    }),
    toggleUnitActive: builder.mutation({
      query: ({ unitId, isActive }) => ({
        url: "/restaurant/sections",
        method: "PATCH",
        body: {
          unitUpdates: [{ unitId, isActive }]
        },
      }),
      invalidatesTags: ["Restaurant", "Units"],
    }),
    getLiveOccupancy: builder.query({
      query: () => "/restaurant/units/live-status",
      providesTags: ["Units", "Restaurant"],
    }),
    createRoomBooking: builder.mutation({
      query: (payload) => ({ url: "/restaurant/room-booking", method: "POST", body: payload }),
      async onQueryStarted(payload, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const orderId = data?.order?._id || data?._id;
          if (orderId) addAdminModifiedOrderId(orderId);
        } catch (_) {}
      },
      invalidatesTags: ["Units", "Restaurant", "Order"],
    }),
    checkoutOrder: builder.mutation({
      query: (orderId) => ({ url: `/order/${orderId}/bill`, method: "POST" }),
      async onQueryStarted(orderId, { queryFulfilled }) {
        addAdminModifiedOrderId(orderId);
        try { await queryFulfilled; } catch (_) {}
      },
      invalidatesTags: (result, error, orderId) => [{ type: "Order", id: orderId }, { type: "Order", id: "LIST" }, "Units", "Restaurant"],
    }),
    billOrder: builder.mutation({
      query: (orderId) => ({ url: `/order/${orderId}/bill`, method: "POST" }),
      async onQueryStarted(orderId, { queryFulfilled }) {
        addAdminModifiedOrderId(orderId);
        try { await queryFulfilled; } catch (_) {}
      },
      invalidatesTags: (result, error, orderId) => [{ type: "Order", id: orderId }, { type: "Order", id: "LIST" }, "Units", "Restaurant"],
    }),
    payOrder: builder.mutation({
      query: ({ orderId, paymentMethod, paymentMethods, settlementAmount, totalAmount }) => {
        const finalSettlement = settlementAmount !== undefined ? settlementAmount : totalAmount;
        const body = { settlementAmount };
        if (paymentMethods) {
          body.paymentMethods = paymentMethods;
        } else {
          body.paymentMethods = [{ method: paymentMethod, amount: finalSettlement }];
        }
        return {
          url: `/order/${orderId}/pay`,
          method: "POST",
          body,
        };
      },
      async onQueryStarted({ orderId }, { queryFulfilled }) {
        addAdminModifiedOrderId(orderId);
        try { await queryFulfilled; } catch (_) {}
      },
      invalidatesTags: (result, error, { orderId }) => [{ type: "Order", id: orderId }, { type: "Order", id: "LIST" }, "Units", "Restaurant"],
    }),
    moveOrder: builder.mutation({
      query: ({ orderId, unitId }) => ({ url: `/order/${orderId}/move`, method: "POST", body: { unitId } }),
      async onQueryStarted({ orderId }, { queryFulfilled }) {
        addAdminModifiedOrderId(orderId);
        try { await queryFulfilled; } catch (_) {}
      },
      invalidatesTags: ["Order", "Units", "Restaurant"],
    }),
    getOrderById: builder.query({
      query: (orderId) => `/order/${orderId}`,
      transformResponse: (response) => response?.order || response,
    }),
  }),
});

export const {
  useLoginMutation,
  useGetRestaurantQuery,
  useUpdateRestaurantMutation,
  useReorderCategoriesMutation,
  useUpdateRestaurantGSTMutation,
  useCreateCategoriesMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateOrderByAdminMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
  useToggleItemReadyMutation,
  useCancelOrderMutation,
  useCancelRoomBookingMutation,
  useGetAnalyticsQuery,
  useGetMenuQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useReorderMenuItemsMutation,
  useUpdateRestaurantStatusMutation,
  useGetTopSellingProductsQuery,
  useGetTopSellingCategoriesQuery,
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useCreateSectionsAndUnitsMutation,
  useUpdateSectionsMutation,
  useDeleteSectionMutation,
  useDeleteUnitMutation,
  useToggleUnitActiveMutation,
  useGetLiveOccupancyQuery,
  useCreateRoomBookingMutation,
  useCheckoutOrderMutation,
  useBillOrderMutation,
  usePayOrderMutation,
  useMoveOrderMutation,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
} = adminApi;
