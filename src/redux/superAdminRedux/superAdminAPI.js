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
  }),
});

export const {
  useRegisterMutation,
  useRegisterUserMutation,
  useGetAdminsQuery,
  useUpdateUserMutation,
} = superAdminApi;