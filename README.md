# TapnBite — Client Side Documentation

> Complete reference for the customer-facing frontend. Covers every feature, every API connection, every state flow, and everything needed to migrate to Next.js.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure (Client Side)](#3-folder-structure-client-side)
4. [Environment Variables](#4-environment-variables)
5. [Routing](#5-routing)
6. [Layout & Dark Mode](#6-layout--dark-mode)
7. [API Connections](#7-api-connections)
8. [Redux State Management](#8-redux-state-management)
9. [Components — Detailed](#9-components--detailed)
10. [Services](#10-services)
11. [Utils](#11-utils)
12. [Real-time (SSE)](#12-real-time-sse)
13. [Cart Persistence](#13-cart-persistence)
14. [Pricing Logic](#14-pricing-logic)
15. [Order Flow — End to End](#15-order-flow--end-to-end)
16. [Filters & Search](#16-filters--search)
17. [Next.js Migration Guide](#17-nextjs-migration-guide)

---

## 1. Project Overview

TapnBite is a multi-tenant restaurant ordering platform. Each restaurant gets its own domain. Customers scan a QR code, land on the menu, browse items, add to cart, and place orders — all without logging in.

The backend identifies which restaurant to serve based on the `Origin` / `Referer` header (tenant middleware). The frontend never sends a restaurant ID — the domain does that automatically.

---

## 2. Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| State | Redux Toolkit + RTK Query |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Fingerprinting | @fingerprintjs/fingerprintjs |
| Geolocation | Browser API + OpenStreetMap Nominatim |
| Real-time | Server-Sent Events (SSE) |
| UI Components | shadcn/ui (Radix UI based) |

---

## 3. Folder Structure (Client Side)

```
src/
├── components/
│   └── Client/
│       ├── Category.jsx          # Horizontal category scroller
│       ├── Filter.jsx            # Veg/NonVeg/Mixed/Combo filter bar
│       ├── FoodListing.jsx       # Menu items grid with cart controls
│       ├── Header.jsx            # Top bar + cart accordion + orders sidebar
│       ├── OrderFormModal.jsx    # Order type + customer details form
│       ├── OrderComplete.jsx     # "Place Order" button wrapper
│       ├── RestaurantClosed.jsx  # Full-screen closed state UI
│       ├── SearchItem.jsx        # Floating search button + drawer
│       ├── OfferSlider.jsx       # Promotional banner carousel
│       ├── Toast.jsx             # Toast notification system
│       ├── Copywright.jsx        # Footer
│       └── HelperData.jsx        # Dev helper — menu data display
├── pages/
│   └── Home.jsx                  # Main page — orchestrates all client components
├── layouts/
│   └── MainLayout.jsx            # Shell — dark mode state + Outlet
├── redux/
│   └── clientRedux/
│       ├── clientAPI.js          # RTK Query — all API calls
│       └── clientSlice.js        # Cart state + reducers
├── service/
│   ├── fingerprintService.js     # Browser fingerprint (visitor ID)
│   └── deliveryService.js        # Geolocation + reverse geocoding
├── utils/
│   ├── sseConnectionManager.js   # Robust SSE manager with reconnect
│   └── orderSyncBroadcast.js     # BroadcastChannel for cross-tab sync
└── config.js                     # BASE_URL from env
```

---

## 4. Environment Variables

```env
VITE_API_BASE_URL=https://your-backend-url.com
```

Used in `src/config.js`:

```js
const config = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
};
```

**Next.js equivalent:**
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
```

---

## 5. Routing

Client routes are defined in `src/main.jsx`:

```
/           → MainLayout → Home.jsx
/filter     → Filter.jsx (standalone, rarely used)
```

`MainLayout` wraps the client routes and provides `isDarkMode` + `toggleDarkMode` via React Router's `useOutletContext`.

---

## 6. Layout & Dark Mode

**File:** `src/layouts/MainLayout.jsx`

- Max width `520px`, centered — mobile-first design
- Dark mode state stored in `localStorage` as `client-theme` (`"dark"` or `"light"`)
- Passed to all child components via `<Outlet context={{ isDarkMode, toggleDarkMode }} />`
- Child components read it with `useOutletContext()`

**Next.js migration:** Replace `Outlet` context with a React Context provider or Zustand store.

---

## 7. API Connections

**File:** `src/redux/clientRedux/clientAPI.js`

Base URL: `config.BASE_URL` (from env)

All requests go through RTK Query's `fetchBaseQuery`. No auth token is sent — these are public endpoints. The backend identifies the restaurant from the request's `Origin` header (tenant middleware).

### Endpoints

#### `GET /api/restaurant/public`
- Hook: `useGetRestaurantQuery()`
- Returns restaurant profile: name, logo, categories, GST settings, delivery charges, table count, order modes, `isOpen` status
- Used by: `Home.jsx`, `Header.jsx`, `OrderFormModal.jsx`

#### `GET /api/menu/public`
- Hook: `useGetMenuQuery()`
- Returns array of menu items with pricing, discounts, variants, images
- Used by: `Home.jsx`, `FoodListing.jsx`

#### `POST /api/order`
- Hook: `useCreateOrderMutation()`
- Public endpoint — no JWT needed
- Backend uses `Origin` header to identify restaurant (tenant middleware)
- Request body:
```json
{
  "fingerPrint": "abc123",
  "customerName": "John",
  "customerPhone": "9876543210",
  "orderType": "Eat Here | Take Away | Delivery",
  "tableId": "T1",
  "address": "123 Main St",
  "items": [
    {
      "menuItemId": "...",
      "name": "Burger",
      "quantity": 2,
      "price": 150,
      "discountedPrice": 120,
      "discountApplied": { "type": "percentage", "value": 20 },
      "variant": "half",
      "customizations": "No onions"
    }
  ]
}
```
- Used by: `Header.jsx` → `handleOrderSubmit()`

#### `GET /api/order/fingerprint`
- Hook: `useGetOrdersByFingerprintQuery({ fingerPrint, page })`
- Returns paginated orders for this browser fingerprint
- Used by: `Header.jsx` — orders sidebar
- Query params: `fingerPrint`, `page`

#### SSE: `GET /api/notifications?fingerPrint={fp}`
- Not RTK Query — raw `EventSource`
- Receives real-time order status updates
- Events: `ORDER_STATUS_CHANGED`, `ORDER_UPDATED`
- Used by: `Header.jsx`

---

## 8. Redux State Management

### Store Setup

**File:** `src/redux/store.js`

Cart is persisted to `localStorage` with a versioned key: `client_cart_v1:{hostname}`. This means each restaurant domain has its own cart.

```js
// Cart key format
`client_cart_v1:${window.location.host}`
```

On store init, the persisted cart is loaded as `preloadedState`. On every state change, the cart is saved back (only if it has items).

### clientSlice

**File:** `src/redux/clientRedux/clientSlice.js`

**State shape:**
```js
{
  restaurant: null,
  menu: [],
  orders: [],
  loading: false,
  error: null,
  cart: {
    items: {},        // keyed by cartKey (itemId or itemId-variantKey)
    totalAmount: 0,
    totalItems: 0,
  }
}
```

**Actions:**

| Action | What it does |
|---|---|
| `addToCart({ id, item, price, quantity })` | Adds item or increments quantity. Resolves price with priority chain. |
| `removeFromCart(id)` | Decrements quantity or removes item if qty = 1 |
| `updateCartItem({ id, updates })` | Merges updates into cart item (used for customizations) |
| `clearCart()` | Empties cart completely |
| `setRestaurant(data)` | Sets restaurant data |
| `setMenu(data)` | Sets menu data |

**Cart key format:**
- Single/combo items: `item._id`
- Variant items: `${item._id}-${variantKey}` (e.g. `abc123-half`)

This allows the same item in different variants to be separate cart entries.

**Price resolution priority in `addToCart`:**
1. Explicit `price` parameter
2. `item.price`
3. `item.comboPrice` (for combo items)
4. `item.variantRates[variantKey].price`
5. `item.originalPrice`

---

## 9. Components — Detailed

### `Home.jsx`

The main page. Orchestrates everything.

**What it does:**
- Fetches restaurant + menu via RTK Query
- Shows animated loader for 2s minimum
- Manages filter state: `{ veg, nonVeg, mixed, combo }`
- Manages `activeCategory` (null = All)
- Filters `menu` array based on search + filters + category
- Passes filtered menu to `FoodListing`
- Mutual exclusion: selecting a type filter clears active category, selecting a category clears type filters

**Key state:**
```js
const [filters, setFilters] = useState({ veg: false, nonVeg: false, mixed: false, combo: false });
const [search, setSearch] = useState("");
const [activeCategory, setActiveCategory] = useState(null);
```

**Filter logic:**
```js
if (filters.veg && item.type !== "veg") return false;
if (filters.nonVeg && item.type !== "non-veg") return false;
if (filters.mixed && item.type !== "mixed") return false;
if (filters.combo && item.pricingType !== "combo") return false;
if (activeCategory && item.category !== activeCategory) return false;
```

---

### `Header.jsx`

The most complex component. Handles cart, orders, SSE, and order submission.

**Features:**
- **Cart bar** (bottom of screen when cart has items): collapsed pill → expanded full-screen accordion
- **Orders sidebar** (right slide-in): shows all past orders for this fingerprint with real-time status
- **SSE connection**: listens for order updates, shows status banner, triggers vibration on "preparing"
- **Order form**: opens `OrderFormModal` when user taps "Order Now"
- **Search**: inline search dropdown in header
- **Dark mode toggle**: sun/moon button

**SSE flow in Header:**
```
fingerPrint loaded
  → EventSource opened to /api/notifications?fingerPrint=xxx
  → onmessage: ORDER_UPDATED / ORDER_STATUS_CHANGED
    → update allOrders state
    → if status changed → show banner + vibrate
    → refetch orders from API
```

**Price calculation:**
- Estimates totals from latest order's item prices (since public API doesn't return prices in cart)
- Falls back to cart item prices if no orders exist
- Applies GST and delivery charges from restaurant data

**Rocket animation:** On successful order, a rocket icon animates from cart to the orders button.

---

### `FoodListing.jsx`

Renders all menu items grouped by category.

**Layout modes per category:**
- `single` (1 item): horizontal card layout
- `double` (2 items): 2-column grid
- `multi` (3+ items): horizontal scroll carousel

**Features:**
- Variant dropdown (quarter/half/full etc.) — opens upward in multi layout, downward in single/double
- Discount badges on images (e.g. "20% OFF")
- Combo badge
- Veg/Non-veg/Mixed dot indicator
- Customization pencil icon (appears when item is in cart)
- Description modal (tap on image)
- Customization modal (tap pencil icon)
- Unavailable overlay

**Cart key logic:**
```js
const cartKey = item.pricingType === "variant" && selectedVariant
  ? `${item._id}-${selectedVariant}`
  : item._id;
```

---

### `OrderFormModal.jsx`

Two-step form:

**Step 1 — Order type selection:**
- Shows only enabled order modes from `restaurant.orderModes`
- Options: Eat Here, Take Away, Delivery
- Shows delivery charges for Delivery option

**Step 2 — Customer details:**
- Name: letters only, max 15 chars, auto-capitalize
- Phone: digits only, exactly 10
- Table: dropdown from `restaurant.tableNumbers` (generates T1, T2... Tn)
- Address: text input + "Use Current Location" button (calls `deliveryService`)

**Validation:**
```js
const isFormValid = () => {
  if (!NAME_VALID_PATTERN.test(name.trim())) return false;
  if (!PHONE_VALID_PATTERN.test(phone)) return false;
  if (orderType === "Eat Here") return !!tableId;
  if (orderType === "Delivery") return !!address.trim();
  return true; // Take Away
};
```

---

### `Category.jsx`

Horizontal scrollable category chips with images.

- Each chip is `116px × 54px` with image background + gradient overlay
- Active chip gets orange ring + shadow
- "All" button at top right resets `activeCategory` to null
- Normalizes category names (handles dashes, extra spaces, case)

---

### `Filter.jsx`

Two sections:
- **Left**: All / Veg / Non-Veg / Mixed — mutually exclusive radio-style buttons
- **Right**: Combo — independent toggle

Selecting any type filter clears the active category (handled in `Home.jsx`).

---

### `SearchItem.jsx`

- Floating orange button at `bottom-24 right-4`
- Tap opens animated bottom drawer with search input
- Backdrop click closes it

---

### `RestaurantClosed.jsx`

Full-screen page shown when `restaurant.isOpen === false`.

- Animated hanging "CLOSED" sign
- Shows restaurant logo or moon icon
- Shows reopen time if `restaurant.reopenAt` is set
- "Refresh Status" button reloads the page

---

### `Toast.jsx`

Custom toast system (not shadcn's toast).

- `ToastProvider` wraps the app
- `useToast()` hook returns `{ toast }` function
- Auto-dismisses after `duration` ms (default 4000)
- Animated with Framer Motion

---

### `OfferSlider.jsx`

Simple carousel with 3 hardcoded promotional banner images. Replace with dynamic data from backend when needed.

---

### `Copywright.jsx`

Fixed footer at bottom with copyright and email link. Uses `env(safe-area-inset-bottom)` for iPhone notch support.

---

## 10. Services

### `fingerprintService.js`

**Purpose:** Identify a browser without login. Used to track orders for a specific customer.

**How it works:**
1. Check `localStorage` for existing fingerprint
2. If not found, load FingerprintJS and generate `visitorId`
3. Store in both `localStorage` and a cookie (365 days)
4. Return the same ID on every call

```js
const fp = await fingerprintService.getFingerprint();
// Returns: "abc123xyz..." (stable across sessions)
```

**Used in:**
- `Header.jsx` — SSE connection + order fetch
- `Header.jsx` → `handleOrderSubmit()` — sent with order

---

### `deliveryService.js`

**Purpose:** Get user's current address for delivery orders.

**Functions:**

`getCurrentLocation()` — Browser geolocation API
- `enableHighAccuracy: true`
- Timeout: 15 seconds
- Returns `{ latitude, longitude, accuracy }`

`reverseGeocode(lat, lng)` — OpenStreetMap Nominatim API
- URL: `https://nominatim.openstreetmap.org/reverse?format=json&lat=...&lon=...&zoom=18`
- Builds address string prioritizing: house number → road → neighbourhood → city → state → postcode
- Falls back to `display_name` if manual build lacks street info

`getCurrentAddress()` — Combines both
- If accuracy > 100m and no street info found, retries once after 1 second
- Throws error if geolocation denied/unavailable

**Used in:** `OrderFormModal.jsx` → "Use Current Location" button

---

## 11. Utils

### `sseConnectionManager.js`

**Purpose:** Reliable SSE connection with automatic reconnection.

```js
const manager = new SSEConnectionManager({
  url: sseUrl,
  onMessage: (event) => { /* handle event */ },
  onConnectionChange: (connected) => { /* update UI */ },
  maxRetries: 15,
});
manager.connect();
// Later:
manager.destroy();
```

**Features:**
- Progressive backoff: `delay = min(30000, 3000 + retryCount * (retryCount+1) * 500)`
- Idle detection: reconnects if no message for 2 minutes
- Network monitoring: pauses on offline, reconnects on online
- Tab visibility: reconnects when tab becomes visible (handles laptop sleep/wake)
- Auth guard: stops retrying after max retries to avoid hammering server

**Note:** `Header.jsx` uses a simpler inline SSE (not this class). This class is available for use in Next.js migration.

---

### `orderSyncBroadcast.js`

**Purpose:** Sync state between browser tabs (KDS ↔ Bill page).

```js
// Tab A (KDS) marks item ready:
broadcastItemReady(orderId, itemId, true);

// Tab B (Bill page) listens:
const cleanup = listenForItemReady(({ orderId, itemId, isReady }) => {
  // update UI
});
```

Uses `BroadcastChannel` API. Gracefully no-ops if not supported.

---

## 12. Real-time (SSE)

The client connects to SSE to receive live order status updates.

**Endpoint:** `GET /api/notifications?fingerPrint={fp}`

**Connection setup in `Header.jsx`:**
```js
const source = new EventSource(`${BASE_URL}/api/notifications?fingerPrint=${fp}`);

source.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  if (payload.type === "ORDER_UPDATED" || payload.type === "ORDER_STATUS_CHANGED") {
    // 1. Update allOrders state
    // 2. If status changed → show banner
    // 3. If status is "preparing" → vibrate device
    // 4. Refetch orders from API
  }
};
```

**Events received by client:**
- `ORDER_UPDATED` — any change to the order (item ticked, status changed)
- `ORDER_STATUS_CHANGED` — status specifically changed

**Status banner:** Shows for 3.5 seconds when order enters "preparing" status. Also triggers device vibration pattern `[160, 80, 160]`.

**Reconnect:** On error, waits 5 seconds then increments `sseRetryKey` state, which triggers the `useEffect` to re-establish connection.

---

## 13. Cart Persistence

Cart is saved to `localStorage` on every Redux state change.

**Key:** `client_cart_v1:{hostname}` — domain-specific so each restaurant has its own cart.

**Saved when:** Cart has at least one item.
**Cleared when:** Cart becomes empty.

**On app load:** Persisted cart is loaded as Redux `preloadedState`.

---

## 14. Pricing Logic

### Item Types

| Type | Base Price Field | Discount Field |
|---|---|---|
| `single` | `item.price` | `item.discount` |
| `variant` | `item.variantRates[key].price` | `item.variantRates[key].discount` |
| `combo` | `item.comboPrice` | `item.discount` |

### Discount Calculation

```js
const calculateDiscountedPrice = (item, variantKey = null) => {
  // Get base price based on type
  // If discount.active && discount.value > 0:
  //   percentage: price - (price * value / 100)
  //   flat: price - value
  // Else: return base price
};
```

### What gets stored in cart

The **discounted price** is stored as `item.price` in the cart. The original price is stored as `item.originalPrice`. This ensures the cart total always reflects what the customer actually pays.

### Order payload prices

When submitting an order:
```js
{
  price: cartItem.originalPrice,        // original before discount
  discountedPrice: cartItem.price,      // final price after discount
  discountApplied: cartItem.discount,   // discount object
}
```

---

## 15. Order Flow — End to End

```
1. Customer browses menu (FoodListing)
   ↓
2. Taps "Add" → Redux addToCart
   ↓
3. Cart bar appears at bottom (Header)
   ↓
4. Taps "View Cart" → full-screen cart accordion
   ↓
5. Taps "Order Now" → OrderFormModal opens
   ↓
6. Selects order type (Eat Here / Take Away / Delivery)
   ↓
7. Fills name, phone, table/address
   ↓
8. Taps "Place Order"
   ↓
9. Header.handleOrderSubmit():
   a. Validates form
   b. Gets fingerprint
   c. Builds orderItems array from cart
   d. Calls createOrder mutation → POST /api/order
   ↓
10. On success:
    a. Rocket animation plays
    b. Cart cleared
    c. Modal closed
    d. Orders refetched after 500ms
   ↓
11. SSE receives ORDER_UPDATED events
    → Orders sidebar updates in real-time
    → Status banner shown when "preparing"
    → Device vibrates
```

---

## 16. Filters & Search

**Search:** Filters by `item.name` and `item.description` (case-insensitive substring match).

**Type filters (mutually exclusive):**
- Veg: `item.type === "veg"`
- Non-Veg: `item.type === "non-veg"`
- Mixed: `item.type === "mixed"`

**Combo filter (independent):**
- `item.pricingType === "combo"`

**Category filter:**
- `item.category === activeCategory` (normalized comparison)

**Mutual exclusion rules:**
- Selecting Veg/NonVeg/Mixed/Combo → clears `activeCategory`
- Selecting a category → clears all type filters

**Empty state messages:**
- "No veg items available" / "No non-veg items available" etc.
- "No items in {category}"
- "No items found" (search)

---

## 17. Next.js Migration Guide

### What changes

| Current (Vite + React Router) | Next.js equivalent |
|---|---|
| `src/pages/Home.jsx` | `app/page.tsx` or `pages/index.tsx` |
| `src/layouts/MainLayout.jsx` | `app/layout.tsx` |
| `useOutletContext()` for dark mode | React Context or Zustand |
| `import.meta.env.VITE_API_BASE_URL` | `process.env.NEXT_PUBLIC_API_BASE_URL` |
| `BrowserRouter` + `Routes` | Next.js file-based routing |
| `<Suspense>` + lazy imports | Next.js automatic code splitting |
| `createRoot` in `main.jsx` | `app/layout.tsx` with providers |

### What stays the same

- All Redux logic (`clientSlice.js`, `clientAPI.js`) — works unchanged
- All components in `src/components/Client/` — copy as-is
- All services (`fingerprintService.js`, `deliveryService.js`) — copy as-is
- All utils (`sseConnectionManager.js`, `orderSyncBroadcast.js`) — copy as-is
- Cart persistence logic in `store.js` — copy as-is
- All API endpoint URLs and request shapes — unchanged

### Key things to handle in Next.js

**1. Providers wrapper** — Create `app/providers.tsx`:
```tsx
"use client";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

export function Providers({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
```

**2. Dark mode context** — Replace `useOutletContext`:
```tsx
// contexts/DarkModeContext.tsx
const DarkModeContext = createContext({ isDarkMode: false, toggleDarkMode: () => {} });
```

**3. SSE in Next.js** — SSE uses `EventSource` which is browser-only. Wrap in `useEffect` and check `typeof window !== "undefined"`. Already done in the current code.

**4. FingerprintJS** — Browser-only. Already guarded. Works fine in Next.js client components.

**5. `"use client"` directive** — All components that use hooks, Redux, or browser APIs need `"use client"` at the top. This includes: `Home`, `Header`, `FoodListing`, `OrderFormModal`, `Filter`, `Category`, `SearchItem`.

**6. Cart localStorage** — Already uses `typeof window !== "undefined"` guards. Works in Next.js.

**7. Config** — Replace `src/config.js`:
```ts
// lib/config.ts
const config = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
};
export default config;
```

**8. RTK Query setup** — Same as current. Add `"use client"` to any component using RTK Query hooks.

**9. `createPortal`** — Used in `FoodListing.jsx` for modals. Works in Next.js client components.

**10. `BroadcastChannel`** — Already has `typeof BroadcastChannel === "undefined"` guard. Works fine.

### Suggested Next.js file structure

```
app/
├── layout.tsx              ← MainLayout equivalent
├── page.tsx                ← Home equivalent
├── providers.tsx           ← Redux + Notification providers
components/
└── client/                 ← Copy all from src/components/Client/
redux/
└── clientRedux/            ← Copy as-is
service/
├── fingerprintService.js   ← Copy as-is
└── deliveryService.js      ← Copy as-is
utils/
├── sseConnectionManager.js ← Copy as-is
└── orderSyncBroadcast.js   ← Copy as-is
lib/
└── config.ts               ← Replace config.js
```

### API calls — Server vs Client

All client API calls (`/api/restaurant/public`, `/api/menu/public`, `/api/order`) can be made from **client components** using RTK Query exactly as they are now.

Optionally, `/api/restaurant/public` and `/api/menu/public` can be moved to **Server Components** using `fetch()` for better SEO and initial load performance:

```tsx
// app/page.tsx (Server Component)
async function getRestaurant() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/restaurant/public`, {
    next: { revalidate: 60 }, // ISR — revalidate every 60s
  });
  return res.json();
}
```

The tenant middleware on the backend reads the `Origin` header — Next.js server-side fetches won't have the browser's origin. For server-side fetches, you'll need to pass the domain explicitly or keep these as client-side calls.

---

*Documentation generated from source code — resturant_app_frontend*
