import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "../../config";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${config.BASE_URL}/api`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Accept", "application/json");
      return headers;
    },
  }),

  tagTypes: [
    "Admin",
    "Restaurant",
    "Order",
    "Analytics",
    "Menu",
    "Profile",
    "TopSelling",
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
      transformResponse: (response) =>
        Array.isArray(response) ? response : response?.menu ?? [],
      providesTags: ["Menu"],
    }),

    // done 
    createMenuItem: builder.mutation({
      query: (formData) => ({
        url: "/menu/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Menu"],
    }),

    // done 
    updateMenuItem: builder.mutation({
      query: ({ itemId, updatedData }) => ({
        url: `/menu/${itemId}`,
        method: "PUT",
        body: updatedData,
      }),
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

    // PROFILE ---------------------------------------------------------
    // getProfile: builder.query({
    //   query: () => "/profile",
    //   providesTags: ["Profile"],
    // }),

    // PUBLIC RESTAURANT -----------------------------------------------
    // getPublicRestaurant: builder.query({
    //   query: () => "/restaurant/public",
    // }),

    // getRestaurantUI: builder.query({
    //   query: () => "/restaurant/public",
    //   transformResponse: (response) => response?.restaurant || response,
    //   providesTags: ["Restaurant"],
    // }),

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
  }),
});

export const {
  useLoginMutation,
  useGetRestaurantProfileQuery,
  useUpdateRestaurantProfileMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useGetAnalyticsQuery,
  useGetMenuQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useToggleRestaurantMutation,
  // useGetPublicRestaurantQuery,
  // useGetRestaurantUIQuery,
  useGetTopSellingProductsQuery,
  useGetTopSellingCategoriesQuery,
} = adminApi;