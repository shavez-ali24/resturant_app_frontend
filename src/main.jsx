
import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import PrivateRoute from "./components/admin/adminLayout/PrivateRoute";
import DynamicFavicon from "./DynamicFavicon";
import { NotificationProvider as BellNotificationProvider } from "./components/admin/Bell/NotificationContext";
import CommonNotificationProvider from "./components/admin/common/NotificationModal";
import ErrorBoundary from "./components/common/ErrorBoundary";

const MainLayout = lazy(() => import("./layouts/MainLayout"));
const Home = lazy(() => import("./pages/Home"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const Menu = lazy(() => import("./components/admin/Menu/Menu.jsx"));
const Filter = lazy(() => import("./components/Client/Filter"));
const LoginPage = lazy(() => import("@/components/admin/adminLayout/LoginPage"));
const Orders = lazy(() => import("./components/admin/orderManagement/pendingOrders/PendingOrders"));
const CompletedOrders = lazy(() => import("./components/admin/orderManagement/completeOrder/CompletedOrders"));
const CancelledOrders = lazy(() => import("./components/admin/orderManagement/cancelOrder/CancelledOrders"));
const KitchenDisplaySystem = lazy(() => import("./components/admin/orderManagement/kds/KitchenDisplaySystem"));
const Adminprofile = lazy(() => import("./components/admin/Profile/Profile"));
const Revenue = lazy(() => import("./components/admin/observability/revenue/Revenue"));
const ComingSoon = lazy(() => import("./components/admin/common/ComingSoon"));
const ErrorPage = lazy(() => import("./components/admin/common/ErrorPage"));
const SuperLoginPage = lazy(() => import("./components/superAdmin/Pages/SuperLoginPage"));
const UserListPage = lazy(() => import("./components/superAdmin/Pages/UserListPage"));
const SuperAdminLayout = lazy(() => import("./layouts/SuperAdminLayout"));
const SuperAdminProfile = lazy(() => import("./components/superAdmin/Pages/SuperAdminProfile"));
const Sales = lazy(() => import("./components/admin/observability/sales/Sales"));
const StaffManagement = lazy(() => import("./components/admin/Staff/StaffManagement"));
const AdminOrderPanel = lazy(() => import("./components/admin/OrderPanel/AdminOrderPanel"));

const RouteFallback = () => {
  const location = useLocation();
  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/super-admin");
  const isDarkMode = (() => {
    if (typeof window === "undefined") return false;
    try {
      const savedAdminTheme = localStorage.getItem("admin-theme");
      if (savedAdminTheme) return savedAdminTheme === "dark";
    } catch (_) {
      // ignore storage access issues
    }
    const root = document.documentElement;
    const body = document.body;
    return (
      root.classList.contains("admin-dark") ||
      root.classList.contains("dark") ||
      body.classList.contains("admin-dark") ||
      body.classList.contains("dark")
    );
  })();

  if (!isAdminRoute) return null;

  return (
    <div
      className={`flex min-h-screen items-center justify-center ${
        isDarkMode ? "bg-slate-950 text-slate-200" : "bg-white text-gray-600"
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm ${
          isDarkMode
            ? "border-slate-700 bg-slate-900/80"
            : "border-orange-100 bg-orange-50/40"
        }`}
      >
        <span
          className={`h-4 w-4 animate-spin rounded-full border-2 ${
            isDarkMode
              ? "border-orange-300 border-t-transparent"
              : "border-orange-500 border-t-transparent"
          }`}
        />
        <span className="text-sm font-semibold tracking-wide">
          TapnBite Loading...
        </span>
      </div>
    </div>
  );
};

const SuperAdminPrivateRoute = ({ children }) => {
  const allowedDomains = [
    "app.flamendough.com",
    "www.app.flamendough.com",
    "localhost",
  ];

  const host =
    typeof window !== "undefined" ? window.location.hostname : "";

  if (!allowedDomains.includes(host)) {
    return <ErrorPage />;
  }

  return children;
};

const AdminOnlyRoute = ({ children }) => {
  const userRole =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : "";

  if (userRole === "staff") {
    return <Navigate to="/admin/orders" replace />;
  }

  return children;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <ErrorBoundary>
      <CommonNotificationProvider>
        <BellNotificationProvider>
          <BrowserRouter>
            <DynamicFavicon />

            <Suspense fallback={<RouteFallback />}>
              <Routes>
            {/* Public Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="filter" element={<Filter />} />
            </Route>

            {/* Admin Login (Public) */}
            <Route path="login" element={<LoginPage />} />

            {/* Admin Protected Routes */}
            <Route
              path="admin"
              element={
                <PrivateRoute>
                  <AdminLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Admin />} />
              <Route path="menu" element={<Menu />} />
              {/* <Route path="orderlist" element={<OrdersList />} /> */}
              <Route path="completedorder" element={<CompletedOrders />} />
              <Route path="orders" element={<Orders />} />
              <Route path="cancelledorder" element={<CancelledOrders />} />

              <Route path="profile" element={<Adminprofile />} />
              <Route
                path="sales"
                element={
                  <AdminOnlyRoute>
                    <Sales />
                  </AdminOnlyRoute>
                }
              />
              <Route
                path="revenue"
                element={
                  <AdminOnlyRoute>
                    <Revenue />
                  </AdminOnlyRoute>
                }
              />
              <Route
                path="staff"
                element={
                  <AdminOnlyRoute>
                    <StaffManagement />
                  </AdminOnlyRoute>
                }
              />
              <Route 
                path="order-panel" 
                element={
                  <AdminOnlyRoute>
                    <AdminOrderPanel />
                  </AdminOnlyRoute>
                } 
              />
              <Route path="comingsoon" element={<ComingSoon />} />
            </Route>
            <Route path="kds" element={<PrivateRoute><KitchenDisplaySystem /></PrivateRoute>} />

            {/* Super Admin Login (Public) */}
            <Route path="super-login" element={<SuperLoginPage />} />

            {/* Super Admin Protected Routes */}
            <Route
              path="super-admin"
              element={
                <SuperAdminPrivateRoute>
                  <SuperAdminLayout />
                </SuperAdminPrivateRoute>
              }
            >
              <Route index element={<Navigate to="user-list" replace />} />
              <Route path="create-user" element={<Navigate to="/super-admin/user-list" replace />} />
              <Route path="user-list" element={<UserListPage />} />
              <Route path="admins" element={<Navigate to="/super-admin/user-list" replace />} />
              <Route path="profile" element={<SuperAdminProfile />} />
            </Route>

            {/* 404 Error */}
            <Route path="*" element={<ErrorPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </BellNotificationProvider>
    </CommonNotificationProvider>
    </ErrorBoundary>
  </Provider>
);
