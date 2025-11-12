// src/redux/clientRedux/clientSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  restaurant: null,
  menu: [],
  orders: [],
  loading: false,
  error: null,
  cart: {
    items: {},
    totalAmount: 0,
    totalItems: 0,
  }
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    setRestaurant: (state, action) => {
      state.restaurant = action.payload;
    },
    setMenu: (state, action) => {
      state.menu = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Cart reducers
    addToCart: (state, action) => {
      const { id, item, price } = action.payload;
      const resolvedPrice = price ?? item?.price ?? 0;

      if (state.cart.items[id]) {
        state.cart.items[id].quantity += 1;
      } else {
        state.cart.items[id] = {
          ...item,
          price: resolvedPrice,
          quantity: 1,
        };
      }

      state.cart.totalItems = Object.values(state.cart.items).reduce(
        (total, cartItem) => total + cartItem.quantity,
        0
      );
      state.cart.totalAmount = Object.values(state.cart.items).reduce(
        (total, cartItem) => total + cartItem.price * cartItem.quantity,
        0
      );
    },

    removeFromCart: (state, action) => {
      const id = action.payload;

      if (state.cart.items[id]) {
        if (state.cart.items[id].quantity > 1) {
          state.cart.items[id].quantity -= 1;
        } else {
          delete state.cart.items[id];
        }

        state.cart.totalItems = Object.values(state.cart.items).reduce(
          (total, item) => total + item.quantity, 0
        );
        state.cart.totalAmount = Object.values(state.cart.items).reduce(
          (total, item) => total + (item.price * item.quantity), 0
        );
      }
    },

    incrementQuantity: (state, action) => {
      const id = action.payload;

      if (state.cart.items[id]) {
        state.cart.items[id].quantity += 1;

        state.cart.totalItems = Object.values(state.cart.items).reduce(
          (total, item) => total + item.quantity, 0
        );
        state.cart.totalAmount = Object.values(state.cart.items).reduce(
          (total, item) => total + (item.price * item.quantity), 0
        );
      }
    },

    clearCart: (state) => {
      state.cart = {
        items: {},
        totalAmount: 0,
        totalItems: 0,
      };
    },
  },
});

export const {
  setRestaurant,
  setMenu,
  setLoading,
  setError,
  clearError,
  addToCart,
  removeFromCart,
  incrementQuantity,
  clearCart,
} = clientSlice.actions;

export default clientSlice.reducer;