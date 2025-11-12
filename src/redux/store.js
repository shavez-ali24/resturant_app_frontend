import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import { superAdminApi } from "./superAdminRedux/superAdminAPI";
import { clientApi } from "./clientRedux/clientAPI";
import { adminApi } from "./adminRedux/adminAPI";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      superAdminApi.middleware,
      clientApi.middleware,
      adminApi.middleware // ✅ Add admin API middleware
    ),
});

export default store;