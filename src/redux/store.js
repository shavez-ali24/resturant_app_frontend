// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import { clientApi } from "./clientRedux/clientAPI";
import { adminApi } from "./adminRedux/adminAPI";
import { superAdminApi } from "./superAdminRedux/superAdminAPI";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(clientApi.middleware)
      .concat(adminApi.middleware)
      .concat(superAdminApi.middleware),
});
