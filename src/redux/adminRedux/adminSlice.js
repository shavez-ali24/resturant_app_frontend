import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  adminInfo: localStorage.getItem('adminInfo') 
    ? JSON.parse(localStorage.getItem('adminInfo')) 
    : null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, ...adminInfo } = action.payload;
      state.adminInfo = adminInfo;
      state.token = token;
      localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
      localStorage.setItem('token', token);
    },
    logout: (state) => {
      state.adminInfo = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('adminInfo');
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('restaurantName');
      localStorage.removeItem('qrCode');
      localStorage.removeItem('userPassword');
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
  },
});

export const {
  setCredentials,
  logout,
  setLoading,
  setError,
  clearError,
} = adminSlice.actions;

export default adminSlice.reducer;