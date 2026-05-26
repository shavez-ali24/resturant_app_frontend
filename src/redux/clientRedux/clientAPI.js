import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from '../../config';

export const clientApi = createApi({
  reducerPath: 'clientApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: config.BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Restaurant', 'Menu', 'Order'],
  endpoints: (builder) => ({
    getRestaurant: builder.query({
      query: () => '/api/restaurant/public',
      providesTags: ['Restaurant'],
    }),
    getMenu: builder.query({
      query: () => '/api/menu/public',
      providesTags: ['Menu'],
    }),
    createOrder: builder.mutation({
      query: (orderData) => {
        // 🔧 FIX: Backend reads unitId from query param (req.query.unitId), not from body
        // Extract source.unitId → query param, don't send source in body
        const { source, ...cleanBody } = orderData;
        const params = {};
        if (source?.unitId) {
          params.unitId = source.unitId;
        }
        return {
          url: '/api/order',
          method: 'POST',
          params,
          body: cleanBody,
        };
      },
      invalidatesTags: ['Order'],
    }),
    getOrdersByFingerprint: builder.query({
      query: ({ fingerPrint }) => ({
        url: '/api/order/fingerprint',
        params: { fingerPrint },
      }),
      providesTags: ['Order'],
    }),
  }),
});

export const {
  useGetRestaurantQuery,
  useGetMenuQuery,
  useCreateOrderMutation,
  useGetOrdersByFingerprintQuery,
} = clientApi;