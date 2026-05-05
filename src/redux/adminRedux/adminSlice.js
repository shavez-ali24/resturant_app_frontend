import { createSlice } from '@reduxjs/toolkit';

// ─── Admin Theme Tokens ───────────────────────────────────────────────────────
// Single source of truth for all admin UI colors.
// Import these in any component: import { ADMIN_COLORS } from '@/redux/adminRedux/adminSlice'
export const ADMIN_COLORS = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary:        '#f97316',   // orange-500  — buttons, active states, accents
  primaryHover:   '#ea580c',   // orange-600  — button hover
  primaryLight:   '#fff7ed',   // orange-50   — light bg tint
  primaryMid:     '#fed7aa',   // orange-200  — borders, dividers
  primaryText:    '#9a3412',   // orange-800  — text on light bg

  // ── Page background ────────────────────────────────────────────────────────
  pageBg:         '#f7f3ef',   // warm cream  — main content area
  cardBg:         '#ffffff',   // white       — cards, table rows
  sidebarBg:      '#ffffff',   // white       — sidebar
  headerBg:       '#ffffff',   // white       — top header

  // ── Borders ────────────────────────────────────────────────────────────────
  border:         '#ede8e3',   // warm gray   — card/table borders
  borderStrong:   '#d6cfc8',   // warm gray   — stronger borders

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary:    '#1c1917',   // stone-900   — headings
  textSecondary:  '#78716c',   // stone-500   — labels, meta
  textMuted:      '#a8a29e',   // stone-400   — placeholders

  // ── Status badges ──────────────────────────────────────────────────────────
  pending:        { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  preparing:      { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  ready:          { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  completed:      { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  cancelled:      { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },

  // ── Dark mode overrides ────────────────────────────────────────────────────
  dark: {
    pageBg:       '#0f172a',   // slate-900
    cardBg:       '#1e293b',   // slate-800
    sidebarBg:    '#0f172a',   // slate-900
    headerBg:     '#0f172a',   // slate-900
    border:       '#334155',   // slate-700
    textPrimary:  '#f1f5f9',   // slate-100
    textSecondary:'#94a3b8',   // slate-400
  },
};

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