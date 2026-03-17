/* eslint-disable react-refresh/only-export-components */
import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import PrivateRoute from "./components/admin/adminLayout/PrivateRoute";
import DynamicFavicon from "./DynamicFavicon";
import { NotificationProvider } from "./components/admin/common/NotificationModal";

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

const RouteFallback = () => {
  const location = useLocation();
  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/super-admin");

  if (!isAdminRoute) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-gray-600">
      <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/40 px-4 py-3 shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <span className="text-sm font-semibold tracking-wide">TapnBite Loading...</span>
      </div>
    </div>
  );
};

const SuperAdminPrivateRoute = ({ children }) => {
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
    <NotificationProvider>
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
              <Route path="comingsoon" element={<ComingSoon />} />
            </Route>

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
    </NotificationProvider>
  </Provider>
);
