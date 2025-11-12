import { createSlice } from "@reduxjs/toolkit";

const superAdminSlice = createSlice({
  name: "superAdmin",
  initialState: {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
    selectedAdmin: null,
    isUpdateModalOpen: false,
  },
  reducers: {
    logoutSuperAdmin: (state) => {
      state.user = null;
      state.token = null;
      localStorage.clear();
    },
    setSuperAdminData: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);
    },
    openUpdateModal: (state, action) => {
      state.isUpdateModalOpen = true;
      state.selectedAdmin = action.payload;
    },
    closeUpdateModal: (state) => {
      state.isUpdateModalOpen = false;
      state.selectedAdmin = null;
    },
  },
});

export const {
  logoutSuperAdmin,
  setSuperAdminData,
  openUpdateModal,
  closeUpdateModal,
} = superAdminSlice.actions;

export default superAdminSlice.reducer;
