import { combineReducers } from "@reduxjs/toolkit";
import superAdminReducer from "./superAdminRedux/superAdminSlice";
import { superAdminApi } from "./superAdminRedux/superAdminAPI";

import clientReducer from "./clientRedux/clientSlice";
import { clientApi } from "./clientRedux/clientAPI";

import adminReducer from "./adminRedux/adminSlice"; // ✅ Add admin reducer
import { adminApi } from "./adminRedux/adminAPI"; // ✅ Add admin API

const rootReducer = combineReducers({
  superAdmin: superAdminReducer,
  [superAdminApi.reducerPath]: superAdminApi.reducer,

  client: clientReducer,
  [clientApi.reducerPath]: clientApi.reducer,

  admin: adminReducer, // ✅ Add admin reducer
  [adminApi.reducerPath]: adminApi.reducer, // ✅ Add admin API
});

export default rootReducer;