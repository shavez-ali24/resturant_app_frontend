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
    loginSuperAdmin: builder.mutation({
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

    // ✅ New Endpoints
     getAdmins: builder.query({
      query: () => ({
        url: "/auth/admins",
        method: "GET",
      }),
      providesTags: ["Admins"],
    }),

    // 🔵 Update admin by ID
   updateAdmin: builder.mutation({
      query: ({ adminId, updateData }) => ({
        url: `/auth/${adminId}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: ["Admins"],
    }),
  }),
});

export const {
  useLoginSuperAdminMutation,
  useRegisterUserMutation,
  useGetAdminsQuery,
  useUpdateAdminMutation,
} = superAdminApi;
