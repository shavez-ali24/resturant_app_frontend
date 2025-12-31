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
      query: (orderData) => ({
        url: '/api/order',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Order'],
    }),
    getOrdersByFingerprint: builder.query({
      query: ({ fingerPrint, page = 1 }) => ({
        url: '/api/order/fingerprint',
        params: { fingerPrint, page },
      }),
      providesTags: ['Order'],
    }),
  }),
});

export const { 
  useGetRestaurantQuery, 
  useGetMenuQuery, 
  useCreateOrderMutation,
  useGetOrdersByFingerprintQuery
} = clientApi;