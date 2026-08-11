import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "@/config";
import { logoutSuperAdmin } from "./superAdminSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: `${config.BASE_URL}/api`,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("sa_token");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

const baseQueryWithAuthRedirect = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  const status = result.error?.status || result.error?.originalStatus;
  const url = typeof args === "string" ? args : args?.url || "";
  const isLoginRequest = url.includes("/auth/login");

  if (typeof window !== "undefined" && !isLoginRequest && (status === 401 || status === 403)) {
    api.dispatch(logoutSuperAdmin());
    window.location.replace("/super-login");
  }

  return result;
};

export const superAdminApi = createApi({
  reducerPath: "superAdminApi",
  baseQuery: baseQueryWithAuthRedirect,
  tagTypes: ["Admins"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response) => {
        if (response.user.role !== "superadmin") {
          throw new Error("Access denied. Superadmin privileges required.");
        }
        localStorage.setItem("sa_token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("userRole", response.user.role);
        localStorage.setItem("userName", response.user.name);
        localStorage.setItem("userEmail", response.user.email);
        return response;
      },
    }),

    registerUser: builder.mutation({
      query: (userData) => {
        // Use role-specific endpoint for admin and staff
        let url = "/auth/register";
        if (userData.role === "admin") {
          url = "/auth/register/admin";
        } else if (userData.role === "staff") {
          url = "/auth/register/staff";
        }
        return {
          url,
          method: "POST",
          body: userData,
        };
      },
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
  useLoginMutation,
  useRegisterUserMutation,
  useGetAdminsQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetStaffQuery,
  useRegisterAdminMutation,
} = superAdminApi;