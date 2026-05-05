
const normalizeStatusValue = (status) =>
  String(status || "").trim().toLowerCase();

const PREPARING_START_MAP_KEY = "order-preparing-start-map-v1";

const parseTimestampValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const parsedTime = Date.parse(String(value));
  return Number.isFinite(parsedTime) ? parsedTime : null;
};

const readPreparingStartMap = () => {
  if (typeof window === "undefined") return {};

  try {
    const rawValue = window.localStorage.getItem(PREPARING_START_MAP_KEY);
    if (!rawValue) return {};
    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {};
  }
};

const writePreparingStartMap = (value) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PREPARING_START_MAP_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage access issues.
  }
};

const getOrderIdFromValue = (orderOrId) => {
  if (typeof orderOrId === "string" || typeof orderOrId === "number") {
    return String(orderOrId);
  }

  return String(orderOrId?._id || orderOrId?.id || orderOrId?.orderId || "");
};

const findPreparingHistoryTimestamp = (historyEntries) => {
  if (!Array.isArray(historyEntries)) return null;

  for (let index = historyEntries.length - 1; index >= 0; index -= 1) {
    const entry = historyEntries[index];
    const entryStatus = normalizeStatusValue(
      entry?.status || entry?.type || entry?.key
    );

    if (entryStatus !== "preparing") continue;

    const timestamp = parseTimestampValue(
      entry?.at ||
        entry?.timestamp ||
        entry?.createdAt ||
        entry?.date ||
        entry?.time
    );

    if (timestamp) return timestamp;
  }

  return null;
};

export const getOrderIdValue = (order) =>
  String(order?._id || order?.id || order?.orderId || "");

export const getOrderIdShortValue = (order, visibleChars = 4) => {
  const fullId = getOrderIdFromValue(order).toUpperCase();
  if (!fullId) return "";
  return fullId.length > visibleChars
    ? fullId.slice(-visibleChars)
    : fullId;
};

export const getOrderIdShortValueWithTheme = (order, visibleChars = 4) => {
  const fullId = getOrderIdFromValue(order).toUpperCase();
  if (!fullId) return "";
  
  // Get theme from localStorage
  const isDarkMode = typeof window !== "undefined" && window.localStorage.getItem("admin-theme") === "dark";
  
  const shortId = fullId.length > visibleChars
    ? fullId.slice(-visibleChars)
    : fullId;
    
  // Apply theme-based styling
  if (isDarkMode) {
    return `#${shortId}`;
  } else {
    return `#${shortId}`;
  }
};

export const getOrderCustomerName = (order) =>
  String(
    order?.customerName ||
      order?.customer?.name ||
      order?.user?.name ||
      order?.orderedBy?.name ||
      order?.guestName ||
      order?.name ||
      "Guest"
  ).trim();

export const getOrderCustomerPhone = (order) =>
  String(
    order?.customerPhone ||
      order?.customer?.phone ||
      order?.user?.phone ||
      order?.orderedBy?.phone ||
      order?.phone ||
      "N/A"
  ).trim();

export const getOrderItemsList = (order) => {
  const itemSources = [
    order?.items,
    order?.orderItems,
    order?.cartItems,
    order?.cart?.items,
    order?.bill?.items,
    order?.billItems,
    order?.menuItems,
  ];

  const matchedSource = itemSources.find((source) => Array.isArray(source));
  return matchedSource || [];
};

export const getItemCustomizationText = (item) => {
  const rawValue =
    item?.customizations ??
    item?.customization ??
    item?.customize ??
    item?.preferences ??
    "";

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  if (rawValue && typeof rawValue === "object") {
    return Object.values(rawValue)
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  return String(rawValue || "").trim();
};

export const rememberOrderPreparingStartedAt = (
  orderOrId,
  timestamp = Date.now()
) => {
  const orderId = getOrderIdFromValue(orderOrId);
  const normalizedTimestamp = parseTimestampValue(timestamp);
  if (!orderId || !normalizedTimestamp) return null;

  const currentMap = readPreparingStartMap();
  currentMap[orderId] = normalizedTimestamp;
  writePreparingStartMap(currentMap);
  return normalizedTimestamp;
};

export const clearOrderPreparingStartedAt = (orderOrId) => {
  const orderId = getOrderIdFromValue(orderOrId);
  if (!orderId) return;

  const currentMap = readPreparingStartMap();
  if (!(orderId in currentMap)) return;

  delete currentMap[orderId];
  writePreparingStartMap(currentMap);
};

export const getStoredOrderPreparingStartedAt = (orderOrId) => {
  const orderId = getOrderIdFromValue(orderOrId);
  if (!orderId) return null;

  const currentMap = readPreparingStartMap();
  return parseTimestampValue(currentMap[orderId]);
};

export const getOrderPreparingStartedAt = (order) => {
  const candidateTimestamps = [
    order?.preparingStartedAt,
    order?.preparingAt,
    order?.statusTimestamps?.preparing,
    order?.timestamps?.preparing,
    order?.timeline?.preparing,
    findPreparingHistoryTimestamp(order?.statusHistory),
    findPreparingHistoryTimestamp(order?.timeline),
    order?.__preparingStartedAt,
    getStoredOrderPreparingStartedAt(order),
    normalizeStatusValue(order?.status) === "preparing" ? order?.updatedAt : null,
    normalizeStatusValue(order?.status) === "preparing" ? order?.createdAt : null,
  ];

  for (const candidate of candidateTimestamps) {
    const parsedTimestamp = parseTimestampValue(candidate);
    if (parsedTimestamp) return parsedTimestamp;
  }

  return null;
};

export const formatElapsedTimer = (elapsedMs) => {
  const safeElapsedMs = Math.max(0, Number(elapsedMs) || 0);
  const totalSeconds = Math.floor(safeElapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (value) => String(value).padStart(2, "0");

  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  return `${pad(minutes)}m ${pad(seconds)}s`;
};

export const getPreparingDelayLevel = (elapsedMs) => {
  const elapsedMinutes = Math.max(0, Number(elapsedMs) || 0) / 60000;

  if (elapsedMinutes >= 15) return "critical";
  if (elapsedMinutes >= 10) return "late";
  if (elapsedMinutes >= 5) return "warning";
  return "fresh";
};

export const getStatusBadge = (status) => {
  switch (normalizeStatusValue(status)) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 ring-yellow-300 hover:bg-yellow-200 data-[state=open]:bg-yellow-200 dark:bg-yellow-200 dark:text-yellow-900 dark:ring-yellow-400";
    case "preparing":
      return "bg-teal-100 text-teal-800 ring-teal-300 hover:bg-teal-200 data-[state=open]:bg-teal-200 dark:bg-teal-200 dark:text-teal-900 dark:ring-teal-400";
    case "ready":
      return "bg-blue-100 text-blue-800 ring-blue-300 hover:bg-blue-200 data-[state=open]:bg-blue-200 dark:bg-blue-200 dark:text-blue-900 dark:ring-blue-400";
    case "completed":
      return "bg-emerald-100 text-emerald-800 ring-emerald-300 hover:bg-emerald-200 data-[state=open]:bg-emerald-200 dark:bg-emerald-200 dark:text-emerald-900 dark:ring-emerald-400";
    case "cancelled":
      return "bg-rose-100 text-rose-800 ring-rose-300 hover:bg-rose-200 data-[state=open]:bg-rose-200 dark:bg-rose-200 dark:text-rose-900 dark:ring-rose-400";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-300 hover:bg-slate-200 data-[state=open]:bg-slate-200 dark:bg-slate-200 dark:text-slate-900 dark:ring-slate-400";
  }
};

export const getStatusRowClass = (status) => {
  switch (normalizeStatusValue(status)) {
    case "pending":
      return "bg-transparent dark:bg-transparent";
    case "preparing":
      return "bg-transparent dark:bg-transparent";
    case "ready":
      return "bg-blue-50 dark:bg-transparent";
    case "completed":
      return "bg-transparent dark:bg-transparent";
    case "cancelled":
      return "bg-transparent dark:bg-transparent";
    default:
      return "bg-white/95 dark:bg-slate-900/95";
  }
};

const toNumber = (value) => {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[^\d.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const recalcTotal = (items = []) => {
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    const price = toNumber(
      item?.price ??
      item?.discountedPrice ??
      item?.menuItem?.discountedPrice ??
      item?.menuItem?.price ??
      item?.variantPrice ??
      0
    );
    const rawQty = item?.quantity;
    const quantity = rawQty == null ? 1 : toNumber(rawQty);
    const safeQty = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;

    return sum + price * safeQty;
  }, 0);
};

const normalizeOrderTypeValue = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const toTitleCase = (value) =>
  value.replace(/\b\w/g, (char) => char.toUpperCase());

export const getOrderTypeKey = (value) => {
  const normalized = normalizeOrderTypeValue(value);
  const compact = normalized.replace(/\s+/g, "");

  if (
    normalized === "eat here" ||
    normalized === "dine in" ||
    compact === "eathere" ||
    compact === "dinein"
  ) {
    return "eat_here";
  }

  if (
    normalized === "take away" ||
    normalized === "take out" ||
    normalized === "pick up" ||
    compact === "takeaway" ||
    compact === "takeout" ||
    compact === "pickup"
  ) {
    return "take_away";
  }

  const deliveryAliases = new Set([
    "delivery",
    "homedelivery",
    "doordelivery",
    "deliveryorder",
    "delevry",
    "delievery",
    "delivary",
    "deliveri",
    "homedelevry",
    "homedelievery",
    "homedelivary",
  ]);

  if (
    deliveryAliases.has(compact) ||
    normalized.includes("delivery") ||
    normalized.includes("delevry") ||
    normalized.includes("delievery") ||
    normalized.includes("delivary")
  ) {
    return "delivery";
  }

  return "other";
};

export const isEatHereOrder = (value) => getOrderTypeKey(value) === "eat_here";

export const getOrderTypeLabel = (value) => {
  const key = getOrderTypeKey(value);

  if (key === "eat_here") return "Eat Here";
  if (key === "take_away") return "Take Away";
  if (key === "delivery") return "Delivery";

  const normalized = normalizeOrderTypeValue(value);
  return normalized ? toTitleCase(normalized) : "Type";
};

export const getOrderTypeBadgeClass = (value) => {
  const key = getOrderTypeKey(value);

  if (key === "eat_here") {
    return "bg-emerald-100 text-emerald-800 ring-emerald-300 hover:bg-emerald-200 data-[state=open]:bg-emerald-200 dark:bg-emerald-200 dark:text-emerald-900 dark:ring-emerald-400";
  }

  if (key === "take_away") {
    return "bg-sky-100 text-sky-800 ring-sky-300 hover:bg-sky-200 data-[state=open]:bg-sky-200 dark:bg-sky-200 dark:text-sky-900 dark:ring-sky-400";
  }

  if (key === "delivery") {
    return "bg-yellow-100 text-yellow-800 ring-yellow-300 hover:bg-yellow-200 data-[state=open]:bg-yellow-200 dark:bg-yellow-200 dark:text-yellow-900 dark:ring-yellow-400";
  }

  return "bg-slate-100 text-slate-700 ring-slate-300 hover:bg-slate-200 data-[state=open]:bg-slate-200 dark:bg-slate-200 dark:text-slate-900 dark:ring-slate-400";
};

export const getOrderTypeItemClass = (value) => {
  const key = getOrderTypeKey(value);

  if (key === "eat_here") {
    return "bg-transparent text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 data-[highlighted]:bg-emerald-100 data-[highlighted]:text-emerald-900 data-[state=checked]:bg-emerald-200 data-[state=checked]:text-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-500/25 dark:hover:text-emerald-100 dark:data-[highlighted]:bg-emerald-500/30 dark:data-[highlighted]:text-emerald-50 dark:data-[state=checked]:bg-emerald-500/35 dark:data-[state=checked]:text-emerald-50";
  }

  if (key === "take_away") {
    return "bg-transparent text-sky-700 hover:bg-sky-100 hover:text-sky-900 data-[highlighted]:bg-sky-100 data-[highlighted]:text-sky-900 data-[state=checked]:bg-sky-200 data-[state=checked]:text-sky-900 dark:text-sky-300 dark:hover:bg-sky-500/25 dark:hover:text-sky-100 dark:data-[highlighted]:bg-sky-500/30 dark:data-[highlighted]:text-sky-50 dark:data-[state=checked]:bg-sky-500/35 dark:data-[state=checked]:text-sky-50";
  }

  if (key === "delivery") {
    return "bg-transparent text-yellow-700 hover:bg-yellow-100 hover:text-yellow-900 data-[highlighted]:bg-yellow-100 data-[highlighted]:text-yellow-900 data-[state=checked]:bg-yellow-200 data-[state=checked]:text-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-500/25 dark:hover:text-yellow-100 dark:data-[highlighted]:bg-yellow-500/30 dark:data-[highlighted]:text-yellow-50 dark:data-[state=checked]:bg-yellow-500/35 dark:data-[state=checked]:text-yellow-50";
  }

  return "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 data-[state=checked]:bg-slate-200 data-[state=checked]:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100 dark:data-[highlighted]:bg-slate-700/80 dark:data-[highlighted]:text-slate-100 dark:data-[state=checked]:bg-slate-700/90 dark:data-[state=checked]:text-slate-100";
};

export const formatOrderTableId = (tableId, source) => {
  // ✅ New source object: { section: "indoor", number: 3, type: "TABLE" }
  if (source && source.section && source.number) {
    const sectionLabels = {
      indoor:  "Indoor",
      outdoor: "Outdoor",
      rooftop: "Rooftop",
      rooms:   "Room",
    };
    const section = sectionLabels[String(source.section).toLowerCase()] || 
                    (String(source.section).charAt(0).toUpperCase() + String(source.section).slice(1));
    const unit = source.type === "ROOM" ? "" : "Table";
    return unit ? `${section} ${unit} ${source.number}` : `${section} ${source.number}`;
  }

  if (!tableId) return "";

  if (typeof tableId === "object") {
    if (tableId.name) return String(tableId.name).trim();
    if (tableId.tableNumber !== undefined && tableId.tableNumber !== null) {
      return `T${tableId.tableNumber}`;
    }
    if (tableId._id) return String(tableId._id).trim();
    return "";
  }

  const raw = String(tableId).trim();
  if (!raw) return "";

  const tableMatch = raw.match(/^table[-_\s]?(\d+)$/i);
  if (tableMatch?.[1]) return `T${tableMatch[1]}`;

  if (/^t\d+$/i.test(raw)) return raw.toUpperCase();

  return raw;
};
