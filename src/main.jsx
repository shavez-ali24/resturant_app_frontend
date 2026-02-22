/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import "./index.css";
// import AddItems from "./components/admin/Menu/AddItems.jsx";
import Admin from "./pages/Admin";
import AdminLayout from "./layouts/AdminLayout";
import Menu from "./components/admin/Menu/Menu.jsx";
import { Provider } from "react-redux";
import { store } from "./redux/store";
// import OrdersList from "./components/admin/order/OrdersList.jsx";
import Filter from "./components/Client/Filter";
import LoginPage from "@/components/admin/adminLayout/LoginPage";
import PrivateRoute from "./components/admin/adminLayout/PrivateRoute";
import Orders from "./components/admin/orderManagement/pendingOrders/PendingOrders";
import CompletedOrders from "./components/admin/orderManagement/completeOrder/CompletedOrders";
import CancelledOrders from "./components/admin/orderManagement/cancelOrder/CancelledOrders";
import Adminprofile from "./components/admin/Profile/Profile";
import Revenue from "./components/admin/observability/revenue/Revenue";
import ComingSoon from "./components/admin/common/ComingSoon";
import ErrorPage from "./components/admin/common/ErrorPage";
import SuperLoginPage from "./components/superAdmin/Pages/SuperLoginPage";
import UserListPage from "./components/superAdmin/Pages/UserListPage";
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import SuperAdminProfile from "./components/superAdmin/Pages/SuperAdminProfile";
import Sales from "./components/admin/observability/sales/Sales";
import StaffManagement from "./components/admin/Staff/StaffManagement";
// import AppTitle from "./AppTitle";
import DynamicFavicon from "./DynamicFavicon";
import { NotificationProvider } from "./components/admin/common/NotificationModal";

const SuperAdminPrivateRoute = ({ children }) => {
  return children;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <NotificationProvider>
      <BrowserRouter>
        <DynamicFavicon />

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
            <Route path="sales" element={<Sales />} />
            <Route path="revenue" element={<Revenue />} />
            <Route path="staff" element={<StaffManagement />} />
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
      </BrowserRouter>
    </NotificationProvider>
  </Provider>
);
