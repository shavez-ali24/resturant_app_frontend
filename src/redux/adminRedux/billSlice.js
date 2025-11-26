import { createSlice } from "@reduxjs/toolkit";

const billSlice = createSlice({
  name: "bill",
  initialState: {
    open: false,
    selectedOrder: null,
    restaurantDetails: null, // GLOBAL RESTAURANT INFO
  },
  reducers: {
    showBill(state, action) {
      state.selectedOrder = action.payload;
      state.open = true;
    },
    hideBill(state) {
      state.selectedOrder = null;
      state.open = false;
    },
    setRestaurantDetails(state, action) {
      state.restaurantDetails = action.payload; // SAVE GLOBAL RESTRO DATA
    }
  }
});

export const { showBill, hideBill, setRestaurantDetails } = billSlice.actions;
export default billSlice.reducer;
