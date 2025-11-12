// src/redux/adminRedux/adminAPI.js
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
  tagTypes: ["Admin", "Restaurant", "Order", "Analytics", "Menu", "Profile"],
  endpoints: (builder) => ({
    // AUTH
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Admin"],
    }),

    // RESTAURANT PROFILE
    getRestaurantProfile: builder.query({
      query: () => "/restaurant/admin",
      providesTags: ["Restaurant"],
    }),
    updateRestaurantProfile: builder.mutation({
      query: (formData) => ({
        url: "/restaurant/",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Restaurant"],
    }),

    // PATCH status - toggle open/close
    toggleRestaurant: builder.mutation({
      query: ({ isOpen }) => ({
        url: "/restaurant/status", // your API (or change to correct path)
        method: "PATCH",
        body: { isOpen },
      }),
      // We want restaurant data to be refetched after toggle
      invalidatesTags: ["Restaurant"],
    }),

    // ORDER MANAGEMENT
    getOrders: builder.query({
      query: () => "/order",
      providesTags: ["Order"],
    }),
    updateOrder: builder.mutation({
      query: ({ orderId, updatedData }) => ({
        url: `/order/${orderId}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Order"],
    }),
    deleteOrder: builder.mutation({
      query: (orderId) => ({
        url: `/order/${orderId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Order"],
    }),

    // ANALYTICS
    getAnalytics: builder.query({
      query: ({ domain, range }) => ({
        url: "/analytics/insights",
        params: { domain, range },
      }),
      providesTags: ["Analytics"],
    }),

    // MENU MANAGEMENT
    getMenu: builder.query({
      query: () => "/menu",
      transformResponse: (response) =>
        Array.isArray(response) ? response : response?.menu ?? [],
      providesTags: ["Menu"],
    }),
    createMenuItem: builder.mutation({
      query: (formData) => ({
        url: "/menu/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Menu"],
    }),
    updateMenuItem: builder.mutation({
      query: ({ itemId, updatedData }) => ({
        url: `/menu/${itemId}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Menu"],
    }),
    deleteMenuItem: builder.mutation({
      query: (itemId) => ({
        url: `/menu/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Menu"],
    }),

    // PROFILE
    getProfile: builder.query({
      query: () => "/profile",
      providesTags: ["Profile"],
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
  // NEW:
  useToggleRestaurantMutation,
} = adminApi;
