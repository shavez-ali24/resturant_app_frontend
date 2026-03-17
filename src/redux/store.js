// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import clientReducer from "./clientRedux/clientSlice";
import { clientApi } from "./clientRedux/clientAPI";
import { adminApi } from "./adminRedux/adminAPI";
import { superAdminApi } from "./superAdminRedux/superAdminAPI";

const CART_STORAGE_VERSION = "v1";

const getCartStorageKey = () => {
  if (typeof window === "undefined") return `client_cart_${CART_STORAGE_VERSION}`;
  const host = window.location.host || "app";
  return `client_cart_${CART_STORAGE_VERSION}:${host}`;
};

const loadCartState = () => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(getCartStorageKey());
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return undefined;
    return parsed;
  } catch {
    return undefined;
  }
};

const saveCartState = (cart) => {
  if (typeof window === "undefined") return;
  try {
    const key = getCartStorageKey();
    const hasItems =
      cart &&
      cart.items &&
      typeof cart.items === "object" &&
      Object.keys(cart.items).length > 0;
    if (!hasItems) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(cart));
  } catch {
    // ignore write errors
  }
};

const getDefaultClientState = () => {
  try {
    return clientReducer(undefined, { type: "@@INIT" });
  } catch {
    return undefined;
  }
};

const persistedCart = loadCartState();
const defaultClientState = getDefaultClientState();
const preloadedState =
  persistedCart && defaultClientState
    ? { client: { ...defaultClientState, cart: persistedCart } }
    : undefined;

export const store = configureStore({
  reducer: rootReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(clientApi.middleware)
      .concat(adminApi.middleware)
      .concat(superAdminApi.middleware),
});

let lastCartSnapshot = null;
store.subscribe(() => {
  const cart = store.getState()?.client?.cart;
  if (!cart) return;
  const serialized = JSON.stringify(cart);
  if (serialized === lastCartSnapshot) return;
  lastCartSnapshot = serialized;
  saveCartState(cart);
});
