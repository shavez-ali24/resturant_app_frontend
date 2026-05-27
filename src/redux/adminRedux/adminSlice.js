import { createSlice } from '@reduxjs/toolkit';

export const ADMIN_COLORS = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary: '#f97316',   // orange-500  — buttons, active states, accents
  primaryHover: '#ea580c',   // orange-600  — button hover
  primaryLight: '#fff7ed',   // orange-50   — light bg tint
  primaryMid: '#fed7aa',   // orange-200  — borders, dividers
  primaryText: '#9a3412',   // orange-800  — text on light bg

  // ── Page background ────────────────────────────────────────────────────────
  pageBg: '#fbfaf8',   // warm cream  — main content area
  cardBg: '#ffffff',   // white       — cards, table rows
  sidebarBg: '#ffffff',   // white       — sidebar
  headerBg: '#ffffff',   // white       — top header

  // ── Borders ────────────────────────────────────────────────────────────────
  border: '#ede8e3',   // warm gray   — card/table borders
  borderStrong: '#cbd5e1',   // warm gray   — stronger borders

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary: '#1c1917',   // stone-900   — headings
  textSecondary: '#57524e',   // stone-600   — labels, 
  textMuted: '#87807b',   // stone-400   — placeholders

  // ── Status badges ──────────────────────────────────────────────────────────
  pending: { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  preparing: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  ready: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  completed: { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  cancelled: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },

  // ── Dark mode overrides ────────────────────────────────────────────────────
  dark: {
    pageBg: '#0f172a',   // slate-900
    cardBg: '#1e293b',   // slate-800
    sidebarBg: '#0f172a',   // slate-900
    headerBg: '#0f172a',   // slate-900
    border: '#334155',   // slate-700
    textPrimary: '#f1f5f9',   // slate-100
    textSecondary: '#94a3b8',   // slate-400
  },

  // ── Accessible, Laptop-friendly Tailwind Classes ───────────────────────────
  classes: {
    // Accessible laptop-friendly buttons (bold, clear text, premium padding)
    btnPrimary: 'bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-5 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.97] text-base tracking-wide flex items-center justify-center gap-2 border border-transparent disabled:opacity-40 disabled:cursor-not-allowed',
    btnSecondary: 'bg-white border border-[#ede8e3] hover:border-orange-200 hover:bg-orange-50/50 text-[#57524e] hover:text-orange-700 font-extrabold px-5 py-3 rounded-xl transition-all duration-200 text-base tracking-wide flex items-center justify-center gap-2 shadow-sm',
    btnSuccess: 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.97] text-base tracking-wide flex items-center justify-center gap-2 disabled:opacity-40',
    btnDanger: 'bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2.5 rounded-lg transition-all duration-200 text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm',
    btnMuted: 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-1.5',

    // Large, accessible inputs & textareas
    input: 'w-full rounded-xl border border-[#ede8e3] bg-white hover:border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 px-4 py-3 text-base text-[#1c1917] outline-none transition-all duration-200 placeholder-slate-400 font-medium shadow-sm',

    // Structured modern panels & cards
    card: 'bg-white border border-[#ede8e3] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300',
    panelHeader: 'flex items-center justify-between border-b border-[#ede8e3] p-4 bg-[#fbfaf8]',

    // Accessible typographies
    title: 'text-2xl font-black text-[#1c1917] tracking-tight',
    subtitle: 'text-sm text-[#78716c] font-semibold',
  }
};

const initialState = {
  adminInfo: localStorage.getItem('adminInfo')
    ? JSON.parse(localStorage.getItem('adminInfo'))
    : null,
  token: localStorage.getItem('admin_token') || null,
  loading: false,
  error: null,
  theme: {
    colors: ADMIN_COLORS
  }
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
      localStorage.setItem('admin_token', token);
    },
    logout: (state) => {
      state.adminInfo = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('adminInfo');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('restaurantName');
      localStorage.removeItem('qrCode');
      localStorage.removeItem('serPassword');
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