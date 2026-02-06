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

// Helper function to get correct price based on pricing type
const getCartItemPrice = (cartItem) => {
  if (cartItem.pricingType === "combo") {
    return Number(cartItem.comboPrice) || 0;
  }
  if (cartItem.variantKey && cartItem.variantRates && cartItem.variantRates[cartItem.variantKey]) {
    return Number(cartItem.variantRates[cartItem.variantKey].price) || 0;
  }
  return Number(cartItem.price) || 0;
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

    addToCart: (state, action) => {
      const { id, item, price, quantity = 1 } = action.payload;
      
      // Extract price from multiple possible locations with priority
      let resolvedPrice = 0;
      
      // Priority 1: Explicit price parameter
      if (price !== undefined && price !== null) {
        resolvedPrice = Number(price);
      }
      // Priority 2: Price from item object
      else if (item?.price !== undefined && item?.price !== null) {
        resolvedPrice = Number(item.price);
      }
      // Priority 3: Combo price for combo items
      else if (item?.pricingType === "combo" && item?.comboPrice !== undefined) {
        resolvedPrice = Number(item.comboPrice);
      }
      // Priority 4: Variant price
      else if (item?.variantKey && item?.variantRates?.[item.variantKey]?.price) {
        resolvedPrice = Number(item.variantRates[item.variantKey].price);
      }
      // Priority 5: Original price
      else if (item?.originalPrice !== undefined) {
        resolvedPrice = Number(item.originalPrice);
      }
      
      // Ensure it's a valid number
      if (isNaN(resolvedPrice)) resolvedPrice = 0;

      if (state.cart.items[id]) {
        // Item already exists - increment quantity
        state.cart.items[id].quantity += quantity;
        // Update price if provided (for price changes)
        if (resolvedPrice > 0) {
          state.cart.items[id].price = resolvedPrice;
        }
        // Preserve existing customizations
        if (item.customizations !== undefined) {
          const newCustomization = typeof item.customizations === 'string' 
            ? item.customizations.trim() 
            : item.customizations;
          if (newCustomization !== "") {
            state.cart.items[id].customizations = newCustomization;
          }
        }
      } else {
        // New item - add to cart
        state.cart.items[id] = {
          ...item,
          price: resolvedPrice, // Store the resolved price
          quantity: quantity,
          customizations: item.customizations || "",
        };
      }

      // Update totals with proper price calculation
      state.cart.totalItems = Object.values(state.cart.items).reduce(
        (total, cartItem) => total + cartItem.quantity,
        0
      );
      state.cart.totalAmount = Object.values(state.cart.items).reduce(
        (total, cartItem) => total + (getCartItemPrice(cartItem) * cartItem.quantity),
        0
      );
    },

    removeFromCart: (state, action) => {
      const id = action.payload;

      if (state.cart.items[id]) {
        if (state.cart.items[id].quantity > 1) {
          // Decrement by 1
          state.cart.items[id].quantity -= 1;
        } else {
          // Remove item completely when quantity is 1
          delete state.cart.items[id];
        }

        state.cart.totalItems = Object.values(state.cart.items).reduce(
          (total, item) => total + item.quantity, 0
        );
        state.cart.totalAmount = Object.values(state.cart.items).reduce(
          (total, item) => total + (getCartItemPrice(item) * item.quantity), 0
        );
      }
    },

    updateCartItem: (state, action) => {
      const { id, updates } = action.payload;
      if (state.cart.items[id]) {
        state.cart.items[id] = {
          ...state.cart.items[id],
          ...updates,
        };
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
  updateCartItem,
  clearCart,
} = clientSlice.actions;

export default clientSlice.reducer;
