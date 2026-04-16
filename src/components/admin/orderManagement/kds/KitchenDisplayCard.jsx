import React, { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import {
  formatElapsedTimer,
  formatOrderTableId,
  getItemCustomizationText,
  getOrderTypeBadgeClass,
  getOrderTypeKey,
  getOrderTypeLabel,
  getOrderCustomerName,
  getOrderIdShortValue,
  getOrderPreparingStartedAt,
  getOrderIdValue,
  getOrderItemsList,
  getPreparingDelayLevel,
  getStatusBadge,
} from "../commonOrderFile/utils";

const getStatusHeaderClasses = (statusValue, delayLevel = "fresh") => {
  const normalized = String(statusValue || "").trim().toLowerCase();

  if (normalized === "preparing") {
    switch (delayLevel) {
      case "critical":
        return "border-rose-200 bg-gradient-to-r from-rose-200 via-orange-50 to-white dark:border-rose-500/30 dark:from-rose-500/25 dark:via-slate-900 dark:to-slate-950";
      case "late":
        return "border-orange-200 bg-gradient-to-r from-orange-200 via-amber-50 to-white dark:border-orange-500/30 dark:from-orange-500/25 dark:via-slate-900 dark:to-slate-950";
      case "warning":
        return "border-amber-200 bg-gradient-to-r from-amber-200 via-yellow-50 to-white dark:border-amber-500/30 dark:from-amber-500/25 dark:via-slate-900 dark:to-slate-950";
      default:
        return "border-teal-200 bg-gradient-to-r from-teal-200 via-teal-50 to-white dark:border-teal-500/30 dark:from-teal-500/20 dark:via-slate-900 dark:to-slate-950";
    }
  }

  return "border-amber-200 bg-gradient-to-r from-amber-200 via-white to-orange-50 dark:border-amber-500/30 dark:from-amber-500/20 dark:via-slate-900 dark:to-slate-950";
};

const getOrderIdBadgeClasses = (statusValue, delayLevel = "fresh") => {
  const normalized = String(statusValue || "").trim().toLowerCase();

  if (normalized !== "preparing") {
    return "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100";
  }

  switch (delayLevel) {
    case "critical":
      return "border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100";
    case "late":
      return "border border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-100";
    case "warning":
      return "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100";
    default:
      return "border border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-100";
  }
};

const getPreparingTimerClasses = (delayLevel = "fresh") => {
  switch (delayLevel) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100";
    case "late":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-100";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100";
    default:
      return "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-100";
  }
};

const getCardShellClasses = (statusValue, delayLevel = "fresh", isDarkMode) => {
  const normalized = String(statusValue || "").trim().toLowerCase();

  if (normalized !== "preparing") {
    return isDarkMode
      ? "border-slate-800 bg-slate-950/90"
      : "border-orange-200 bg-white";
  }

  switch (delayLevel) {
    case "critical":
      return isDarkMode
        ? "border-rose-500/40 bg-slate-950/90 shadow-[0_24px_80px_-36px_rgba(244,63,94,0.45)]"
        : "border-rose-200 bg-rose-50/50 shadow-[0_24px_80px_-36px_rgba(244,63,94,0.28)]";
    case "late":
      return isDarkMode
        ? "border-orange-500/40 bg-slate-950/90 shadow-[0_24px_80px_-36px_rgba(249,115,22,0.45)]"
        : "border-orange-200 bg-orange-50/40 shadow-[0_24px_80px_-36px_rgba(249,115,22,0.24)]";
    case "warning":
      return isDarkMode
        ? "border-amber-500/35 bg-slate-950/90 shadow-[0_24px_80px_-36px_rgba(245,158,11,0.35)]"
        : "border-amber-200 bg-amber-50/45 shadow-[0_24px_80px_-36px_rgba(245,158,11,0.2)]";
    default:
      return isDarkMode
        ? "border-teal-500/30 bg-slate-950/90 shadow-[0_24px_80px_-36px_rgba(20,184,166,0.24)]"
        : "border-teal-200 bg-teal-50/35 shadow-[0_24px_80px_-36px_rgba(20,184,166,0.18)]";
  }
};

const getStatusItemClass = (statusValue) => {
  if (statusValue === "preparing") {
    return "cursor-pointer rounded-xl px-3 py-2.5 text-[13px] font-semibold text-sky-700 hover:bg-sky-100 hover:text-sky-900 data-[highlighted]:bg-sky-100 data-[highlighted]:text-sky-900 data-[state=checked]:bg-sky-200 data-[state=checked]:text-sky-900 dark:text-sky-300 dark:hover:bg-sky-500/25 dark:hover:text-sky-100 dark:data-[highlighted]:bg-sky-500/30 dark:data-[highlighted]:text-sky-50 dark:data-[state=checked]:bg-sky-500/35 dark:data-[state=checked]:text-sky-50";
  }

  return "cursor-pointer rounded-xl px-3 py-2.5 text-[13px] font-semibold text-amber-700 hover:bg-amber-100 hover:text-amber-900 data-[highlighted]:bg-amber-100 data-[highlighted]:text-amber-900 data-[state=checked]:bg-amber-200 data-[state=checked]:text-amber-900 dark:text-amber-300 dark:hover:bg-amber-500/25 dark:hover:text-amber-100 dark:data-[highlighted]:bg-amber-500/30 dark:data-[highlighted]:text-amber-50 dark:data-[state=checked]:bg-amber-500/35 dark:data-[state=checked]:text-amber-50";
};

const CHECKBOX_COOKIE_AGE = 60 * 60 * 12;

const buildCookieKey = (orderId) => `kds_checks_${String(orderId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;

const readCookieValue = (name) => {
  if (typeof document === "undefined") return "";

  const cookiePrefix = `${encodeURIComponent(name)}=`;
  const cookieEntry = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(cookiePrefix));

  if (!cookieEntry) return "";
  return cookieEntry.slice(cookiePrefix.length);
};

const writeCookieValue = (name, value, maxAge = CHECKBOX_COOKIE_AGE) => {
  if (typeof document === "undefined") return;

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const clearCookieValue = (name) => {
  if (typeof document === "undefined") return;

  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
};

const getItemName = (item) =>
  item?.name ||
  item?.title ||
  item?.menuItem?.name ||
  item?.item?.name ||
  item?.product?.name ||
  "Item";

const getItemQuantity = (item) => {
  const quantity = Number(item?.quantity ?? item?.qty ?? item?.count ?? 1);
  return Number.isFinite(quantity) ? Math.max(1, quantity) : 1;
};

const KitchenDisplayCard = ({
  order,
  isDarkMode,
  isNewOrder,
  updateOrder,
  onDismiss,
}) => {
  const orderId = getOrderIdValue(order) || "-";
  const orderIdShort = getOrderIdShortValue(order) || orderId;
  const createdAtMs = order?.createdAt ? new Date(order.createdAt).getTime() : Date.now();
  const placedAt = new Date(createdAtMs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const status = String(order?.status || "pending").trim().toLowerCase();
  const cookieKey = useMemo(() => buildCookieKey(orderId), [orderId]);
  const items = useMemo(() => getOrderItemsList(order), [order]);
  const itemRows = useMemo(
    () =>
      items.map((item, index) => {
        const stableIdentity =
          item?._id ||
          item?.id ||
          item?.menuItemId ||
          item?.menuItem?._id ||
          item?.sku ||
          item?.code ||
          getItemName(item);

        return {
          itemKey: `${orderId}-${stableIdentity}-${index}`,
          itemName: getItemName(item),
          itemKitchenNote:
            item?.specialInstructions ||
            item?.notes ||
            item?.note ||
            item?.instruction ||
            "",
          itemCustomization: getItemCustomizationText(item),
          itemVariant: String(item?.variantName || item?.variant || "").trim(),
          quantity: getItemQuantity(item),
        };
      }),
    [items, orderId]
  );
  const customerName = getOrderCustomerName(order);
  const hasNamedCustomer =
    Boolean(customerName) && customerName.trim().toLowerCase() !== "guest";
  const orderTypeKey = getOrderTypeKey(order?.orderType);
  const orderTypeLabel = getOrderTypeLabel(order?.orderType);
  const tableLabel = formatOrderTableId(
    order?.tableId ||
      order?.table ||
      order?.tableNumber ||
      order?.table?.name ||
      order?.table?.tableNumber ||
      order?.table?.number
  );
  const orderTypeBadgeLabel =
    orderTypeKey === "eat_here" && tableLabel
      ? `${orderTypeLabel} • ${tableLabel}`
      : orderTypeLabel;
  const cardTitle =
    hasNamedCustomer
      ? customerName
      : tableLabel
      ? `Table ${tableLabel}`
      : `Order #${orderIdShort}`;
  const cardTitleClassName = hasNamedCustomer
    ? "text-[1.45rem] sm:text-[1.65rem]"
    : "text-[1.55rem] sm:text-[1.75rem]";
  const totalQty = itemRows.reduce((sum, entry) => sum + entry.quantity, 0);
  const preparingStartedAtMs = useMemo(
    () => getOrderPreparingStartedAt(order),
    [order]
  );

  const [checkedItems, setCheckedItems] = useState(new Set());
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const completionRatio = itemRows.length > 0 ? checkedItems.size / itemRows.length : 0;
  const preparingElapsedMs =
    status === "preparing" && preparingStartedAtMs
      ? Math.max(0, nowMs - preparingStartedAtMs)
      : 0;
  const preparingDelayLevel =
    status === "preparing"
      ? getPreparingDelayLevel(preparingElapsedMs)
      : "fresh";

  useEffect(() => {
    if (status !== "preparing" || !preparingStartedAtMs) return undefined;

    setNowMs(Date.now());
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [preparingStartedAtMs, status]);

  useEffect(() => {
    const rawValue = readCookieValue(cookieKey);
    if (!rawValue) {
      setCheckedItems(new Set());
      return;
    }

    try {
      const parsedValue = JSON.parse(decodeURIComponent(rawValue));
      const availableKeys = new Set(itemRows.map((entry) => entry.itemKey));
      const nextCheckedItems = new Set(
        Array.isArray(parsedValue)
          ? parsedValue.filter((itemKey) => availableKeys.has(itemKey))
          : []
      );

      setCheckedItems(nextCheckedItems);

      if (nextCheckedItems.size === 0) {
        clearCookieValue(cookieKey);
      } else {
        writeCookieValue(cookieKey, JSON.stringify([...nextCheckedItems]));
      }
    } catch {
      clearCookieValue(cookieKey);
      setCheckedItems(new Set());
    }
  }, [cookieKey, itemRows]);

  useEffect(() => {
    if (checkedItems.size === 0) {
      clearCookieValue(cookieKey);
      return;
    }

    writeCookieValue(cookieKey, JSON.stringify([...checkedItems]));
  }, [checkedItems, cookieKey]);

  const handleStatusChange = async (nextStatus) => {
    if (!orderId || nextStatus === status || isUpdatingStatus || isCompleting) return;

    setIsUpdatingStatus(true);
    const success = await updateOrder(orderId, { status: nextStatus });
    if (!success) {
      setIsUpdatingStatus(false);
      return;
    }

    setIsUpdatingStatus(false);
  };

  const completeOrder = async () => {
    if (!orderId || isCompleting) return;

    setIsCompleting(true);
    const success = await updateOrder(
      orderId,
      { status: "completed" },
      {
        silentSuccess: true,
        successMessage: `Kitchen order #${orderIdShort} completed.`,
      }
    );

    if (success) {
      clearCookieValue(cookieKey);
      onDismiss?.(orderId);
      return;
    }

    setIsCompleting(false);
  };

  const toggleItemChecked = (itemKey) => {
    if (isCompleting || isUpdatingStatus) return;

    let nextCheckedItems = null;

    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      nextCheckedItems = next;
      return next;
    });

    if (itemRows.length > 0 && nextCheckedItems?.size === itemRows.length) {
      void completeOrder();
    }
  };

  const handleResetChecks = () => {
    setCheckedItems(new Set());
    clearCookieValue(cookieKey);
  };

  return (
    <article
      className={`relative h-fit self-start overflow-hidden rounded-[1.85rem] border p-2.5 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.25)] transition duration-200 ${getCardShellClasses(
        status,
        preparingDelayLevel,
        isDarkMode
      )} ${isNewOrder ? "ring-2 ring-orange-300 shadow-[0_24px_80px_-32px_rgba(251,146,60,0.45)]" : ""}`}
    >
      {isNewOrder && (
        <div className="absolute right-3 top-3 z-10">
          <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-orange-300 bg-orange-100 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-200">
            <Sparkles size={12} />
            New
          </span>
        </div>
      )}

      <div className="space-y-3">
        <div
          className={`rounded-[1.65rem] border px-3.5 py-3.5 ${getStatusHeaderClasses(
            status,
            preparingDelayLevel
          )}`}
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${getOrderIdBadgeClasses(
                    status,
                    preparingDelayLevel
                  )}`}
                >
                  Order #{orderIdShort}
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] ring-1 ring-inset ${getOrderTypeBadgeClass(
                    order?.orderType
                  )}`}
                >
                  {orderTypeBadgeLabel}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className={`truncate font-black tracking-tight text-slate-950 dark:text-white ${cardTitleClassName}`}>
                  {cardTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 sm:text-base">
                    Placed {placedAt}
                  </p>
                  {status === "preparing" && preparingStartedAtMs ? (
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${getPreparingTimerClasses(
                        preparingDelayLevel
                      )}`}
                    >
                      Prep {formatElapsedTimer(preparingElapsedMs)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="w-full max-w-[210px] self-start xl:w-auto xl:min-w-[168px]">
              <Select
                value={status}
                onValueChange={handleStatusChange}
                disabled={isUpdatingStatus || isCompleting}
              >
                <SelectTrigger
                  className={`h-10 w-full rounded-2xl border border-transparent px-3 text-[11px] font-black uppercase shadow-sm ring-1 ring-black/5 transition-all hover:brightness-95 focus:ring-2 focus:ring-orange-200 focus:ring-offset-1 sm:h-11 sm:px-3.5 sm:text-[12px] sm:min-w-[168px] ${getStatusBadge(
                    status
                  )}`}
                >
                  <span className="mx-auto">
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[150px] rounded-[1.4rem] border border-orange-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-950">
                  <SelectItem value="pending" className={getStatusItemClass("pending")}>
                    Pending
                  </SelectItem>
                  <SelectItem value="preparing" className={getStatusItemClass("preparing")}>
                    Preparing
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div
          className={`rounded-[1.65rem] border p-3.5 ${
            isDarkMode
              ? "border-slate-800 bg-slate-900/80 text-slate-100"
              : "border-orange-200 bg-orange-50/70 text-slate-900"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-200">
                Kitchen Items
              </p>
              <p className="mt-2 text-lg font-black sm:text-[1.4rem]">
                {totalQty} item{totalQty !== 1 ? "s" : ""}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${
                checkedItems.size === itemRows.length && itemRows.length > 0
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {checkedItems.size}/{itemRows.length} done
            </span>
          </div>

          <div className="mt-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400 transition-all duration-300"
              style={{
                width:
                  checkedItems.size > 0
                    ? `${Math.max(6, completionRatio * 100)}%`
                    : "0%",
              }}
            />
          </div>

          {checkedItems.size > 0 ? (
            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                onClick={handleResetChecks}
                disabled={isCompleting || isUpdatingStatus}
                className="rounded-full border border-orange-200 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-orange-200 dark:hover:bg-slate-900"
              >
                Reset Checks
              </button>
            </div>
          ) : null}

          <div className="mt-3 space-y-2.5">
            {itemRows.length > 0 ? (
              itemRows.map(
                ({
                  itemKey,
                  itemName,
                  itemKitchenNote,
                  itemCustomization,
                  itemVariant,
                  quantity,
                }) => {
                  const checked = checkedItems.has(itemKey);
                  return (
                    <label
                      key={itemKey}
                      className={`flex cursor-pointer items-start gap-3 rounded-[1.15rem] border px-3 py-2.5 transition ${
                        checked
                          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                          : isDarkMode
                          ? "border-slate-700 bg-slate-950/80 hover:border-slate-600"
                          : "border-orange-200 bg-white hover:border-orange-300"
                      } ${isCompleting ? "pointer-events-none opacity-70" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItemChecked(itemKey)}
                        disabled={isCompleting || isUpdatingStatus}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={`block text-base font-black leading-tight sm:text-[1.25rem] ${
                              checked
                                ? "text-slate-400 line-through dark:text-slate-500"
                                : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {itemName}
                          </span>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:text-[12px]">
                            x{quantity}
                          </span>
                        </div>

                        {itemVariant ? (
                          <p className="mt-2 text-xs font-bold text-teal-700 dark:text-teal-200 sm:text-[0.95rem]">
                            Variant: {itemVariant}
                          </p>
                        ) : null}

                        {itemCustomization ? (
                          <p className="mt-2 text-xs font-semibold text-orange-700 dark:text-orange-200 sm:text-sm">
                            Custom: {itemCustomization}
                          </p>
                        ) : null}

                        {itemKitchenNote ? (
                          <p className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-200 sm:text-sm">
                            Note: {itemKitchenNote}
                          </p>
                        ) : null}
                      </div>
                    </label>
                  );
                })
            ) : (
              <div className="rounded-2xl border border-dashed border-orange-200 px-4 py-6 text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No kitchen items available for this ticket.
              </div>
            )}
          </div>

          {isCompleting ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              All items checked. Completing and removing this ticket from KDS...
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default KitchenDisplayCard;
