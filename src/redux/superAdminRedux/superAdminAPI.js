import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "@/config";

export const superAdminApi = createApi({
  reducerPath: "superAdminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${config.BASE_URL}/api`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Admins"],
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response) => {
        if (response.user.role !== "superadmin") {
          throw new Error("Access denied. Superadmin privileges required.");
        }
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("userRole", response.user.role);
        localStorage.setItem("userName", response.user.name);
        localStorage.setItem("userEmail", response.user.email);
        return response;
      },
    }),

    registerUser: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),

    getAdmins: builder.query({
      query: () => ({
        url: "/auth/admins",
        method: "GET",
      }),
      transformResponse: (response) => {
        // Handle both array and object responses
        if (Array.isArray(response)) {
          return { admins: response };
        }
        if (response && Array.isArray(response.admins)) {
          return response;
        }
        if (response && Array.isArray(response.data)) {
          return { admins: response.data };
        }
        return { admins: [] };
      },
      providesTags: ["Admins"],
    }),

    // ✅ Flexible updateUser: accept { userId, ...rest } and send rest as body
    updateUser: builder.mutation({
      query: ({ userId, ...rest }) => ({
        url: `/auth/${userId}`,
        method: "PUT",
        body: rest,
      }),
      invalidatesTags: ["Admins"],
    }),

    // Delete user (soft delete)
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/auth/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Admins"],
    }),

    // Get all staff (superadmin only)
    getStaff: builder.query({
      query: () => ({
        url: "/auth/staff",
        method: "GET",
      }),
      transformResponse: (response) => {
        if (Array.isArray(response)) {
          return { staff: response };
        }
        if (response && Array.isArray(response.staff)) {
          return response;
        }
        return { staff: [] };
      },
      providesTags: ["Staff"],
    }),

    // Register new admin (superadmin only)
    registerAdmin: builder.mutation({
      query: (adminData) => ({
        url: "/auth/register/admin",
        method: "POST",
        body: adminData,
      }),
      invalidatesTags: ["Admins"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useRegisterUserMutation,
  useGetAdminsQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetStaffQuery,
  useRegisterAdminMutation,
} = superAdminApi;