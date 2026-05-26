import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import {
  useBillOrderMutation,
  useToggleItemReadyMutation,
} from "../../../../redux/adminRedux/adminAPI";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, Trash2, Home, Truck, Utensils, Edit3, Save, X, ClipboardList, ListChecks, Printer } from "lucide-react";
import {
  getOrderTypeBadgeClass,
  getOrderTypeItemClass,
  getOrderTypeKey,
  getOrderTypeLabel,
  recalcTotal,
  formatOrderTableId,
  isEatHereOrder,
} from "../commonOrderFile/utils";

const ITEM_READY_CHANNEL = "kds-bill-item-ready-sync";
const ORDER_STATUS_CHANNEL = "kds-bill-order-status-sync";

const broadcastItemReady = (orderId, itemId, isReady) => {
  try {
    const channel = new BroadcastChannel(ITEM_READY_CHANNEL);
    channel.postMessage({ orderId, itemId, isReady });
    channel.close();
  } catch (e) {
    console.warn("BroadcastChannel not supported:", e);
  }
};

const broadcastOrderStatus = (orderId, status) => {
  try {
    const channel = new BroadcastChannel(ORDER_STATUS_CHANNEL);
    channel.postMessage({ orderId, status });
    channel.close();
  } catch (e) {
    console.warn("BroadcastChannel not supported:", e);
  }
};

const listenForItemReady = (callback) => {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(ITEM_READY_CHANNEL);
  channel.onmessage = (event) => callback(event.data);
  return () => channel.close();
};

const listenForOrderStatus = (callback) => {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(ORDER_STATUS_CHANNEL);
  channel.onmessage = (event) => callback(event.data);
  return () => channel.close();
};

const BillPage = ({
  order,
  restaurantDetails,
  onClose,
  menuItems = [],
  updateOrder,
  sseEvent,
  autoPrint = false
}) => {
  const billRef = useRef();
  const user = useSelector((state) => state.admin.user);
  const isStaff = user?.role === "staff";

  const [isEditMode, setIsEditMode] = useState(false);
  const [localOrderData, setLocalOrderData] = useState(null);
  const [initialOrderSnapshot, setInitialOrderSnapshot] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });
  const [itemChecks, setItemChecks] = useState({});
  const [toggleItemReady] = useToggleItemReadyMutation();
  const [billOrder, { isLoading: isBilling }] = useBillOrderMutation();

  // ✅ FIX: Ref to block SSE overwrite during post-save restore window
  const restoringRef = useRef(false);

  const activeOrder = localOrderData || order;
  const isPreviewOnly = Boolean(order?.previewMode === "new-items-only");
  const isAlreadyBilled = String(activeOrder?.status || "").toLowerCase() === "completed";

  // ✅ FIX: Use activeOrder.status so checkboxes don't disappear after edit
  const showItemChecks = !isPreviewOnly && ["pending", "preparing", "ready"].includes(
    String(activeOrder?.status || "").toLowerCase()
  );

  const orderStorageKey =
    order?._id || order?.orderId || order?.id || "";

  // Helper to build a stable key for an item (for matching across edit saves)
  const buildItemCheckBase = (item) => {
    const baseId =
      item?.menuItemId ||
      item?.menuItem?._id ||
      item?.name ||
      "item";
    const variant = item?.variantName || item?.variant || "";
    const customizations = item?.customizations || "";
    return `${baseId}::${variant}::${customizations}`;
  };

  const normalizeItemsWithBillKeys = (items = [], previousItems = []) => {
    const previousQueues = new Map();
    previousItems.forEach((item) => {
      const baseKey = buildItemCheckBase(item);
      if (!baseKey) return;
      if (!previousQueues.has(baseKey)) previousQueues.set(baseKey, []);
      const key =
        item?.billItemKey ||
        `${baseKey}::${previousQueues.get(baseKey).length + 1}`;
      previousQueues.get(baseKey).push(key);
    });

    const used = new Set();
    const counters = new Map();

    return items.map((item) => {
      const baseKey = buildItemCheckBase(item);
      let key;

      const queue = previousQueues.get(baseKey);
      if (queue && queue.length) {
        while (queue.length && used.has(queue[0])) queue.shift();
        if (queue.length) key = queue.shift();
      }

      if (!key) {
        const nextCount = (counters.get(baseKey) || 0) + 1;
        counters.set(baseKey, nextCount);
        key = `${baseKey}::${nextCount}`;
      }

      used.add(key);
      return { ...item, billItemKey: key };
    });
  };

  const getNextBillItemKey = (items, baseKey) => {
    let max = 0;
    items.forEach((item) => {
      const key = item?.billItemKey;
      if (!key || !key.startsWith(`${baseKey}::`)) return;
      const parts = key.split("::");
      const last = parts[parts.length - 1];
      const num = Number(last);
      if (Number.isFinite(num)) max = Math.max(max, num);
    });
    return `${baseKey}::${max + 1}`;
  };

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;
    const updateMode = () =>
      setIsDarkMode(
        root.classList.contains("admin-dark") || root.classList.contains("dark")
      );

    updateMode();
    const observer = new MutationObserver(updateMode);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Initialize local order data
  useEffect(() => {
    if (order) {
      const orderItems = Array.isArray(order.items) ? order.items : [];
      const normalizedItems = normalizeItemsWithBillKeys(
        orderItems.map((item) => ({
          ...item,
          menuItemId: item.menuItemId || item.menuItem?._id || item._id,
          name: item.name || item.menuItem?.name || "",
          price: item.discountedPrice || item.price || 0,
          quantity: item.quantity || 1,
          variantName: item.variant || item.variantName || null,
          variants: item.variants || item.menuItem?.variantRates || null,
          customizations: item.customizations || "",
          // ✅ FIX: Preserve isReady when normalizing
          isReady: item.isReady || false,
        })),
        localOrderData?.items || []
      );

      const newLocalOrderData = {
        ...order,
        items: normalizedItems,
      };

      setLocalOrderData(newLocalOrderData);

      if (order.source?.section && order.source?.number) {
        setSelectedTableId(`${order.source.section}:${order.source.number}`);
      } else {
        setSelectedTableId(order.tableId || "");
      }
      setAddress(order.address || "");

      setInitialOrderSnapshot({
        status: newLocalOrderData.status,
        items: newLocalOrderData.items.map(item => ({
          _id: item._id,
          menuItemId: item.menuItemId,
          isReady: item.isReady || false,
        })),
        itemCount: newLocalOrderData.items.length
      });
    }
  }, [order]);

  // ✅ FIX: itemChecks — only update from backend when NOT in edit mode
  // AND not in restore window (restoringRef)
  useEffect(() => {
    // Do NOT overwrite during edit mode — user is actively editing
    if (isEditMode) return;
    // Do NOT overwrite during restore window after save
    if (restoringRef.current) return;

    if (!showItemChecks || !orderStorageKey) {
      setItemChecks({});
      return;
    }

    const checks = {};
    (order?.items || []).forEach((item) => {
      if (item._id) {
        checks[item._id] = !!item?.isReady;
      }
    });

    setItemChecks(checks);
  }, [order, showItemChecks, orderStorageKey, isEditMode]);

  // ✅ FIX: SSE updates — skip during edit mode and restore window
  useEffect(() => {
    if (
      sseEvent?.type !== "ORDER_UPDATED" ||
      !sseEvent?.data ||
      !orderStorageKey
    ) {
      return;
    }

    // Skip SSE overwrite during restore window
    if (restoringRef.current) return;
    // Skip SSE overwrite during edit mode
    if (isEditMode) return;

    const updatedOrder = sseEvent.data;
    const updatedOrderId = updatedOrder._id || updatedOrder.id || updatedOrder.orderId;

    if (String(updatedOrderId) === String(orderStorageKey)) {
      if (updatedOrder.items && showItemChecks) {
        const sseChecks = {};
        updatedOrder.items.forEach(item => {
          if (item._id) {
            sseChecks[item._id] = !!item.isReady;
          }
        });

        setItemChecks(prev => {
          const merged = { ...prev };
          Object.keys(sseChecks).forEach(key => {
            merged[key] = sseChecks[key];
          });
          return merged;
        });
      }
    }
  }, [sseEvent, orderStorageKey, showItemChecks, isEditMode]);

  const toggleItemCheck = async (itemKey) => {
    const currentValue = itemChecks[itemKey] || false;
    const newValue = !currentValue;

    const currentActiveOrder = isEditMode && localOrderData ? localOrderData : order;
    const item = (currentActiveOrder?.items || []).find(item => item._id === itemKey);

    if (item && item._id) {
      try {
        setItemChecks((prev) => ({
          ...prev,
          [itemKey]: newValue,
        }));

        await toggleItemReady({ orderId: orderStorageKey, itemId: item._id }).unwrap();
        broadcastItemReady(orderStorageKey, item._id, newValue);
      } catch (err) {
        console.error("Failed to toggle item ready status:", err);
        setItemChecks((prev) => ({
          ...prev,
          [itemKey]: currentValue,
        }));
      }
    }
  };

  // Listen for BroadcastChannel updates from other tabs
  useEffect(() => {
    if (!showItemChecks || !orderStorageKey) return () => {};

    const cleanup = listenForItemReady(({ orderId, itemId, isReady }) => {
      if (String(orderId) === String(orderStorageKey)) {
        setItemChecks((prev) => {
          if (prev[itemId] === isReady) return prev;
          return { ...prev, [itemId]: isReady };
        });
      }
    });
    return cleanup;
  }, [orderStorageKey, showItemChecks]);

  // Listen for order status changes from KDS
  useEffect(() => {
    if (!orderStorageKey) return () => {};

    const cleanup = listenForOrderStatus(({ orderId, status }) => {
      if (String(orderId) === String(orderStorageKey)) {
        setLocalOrderData((prev) => {
          if (!prev) return prev;
          if (String(prev.status) === String(status)) return prev;
          return { ...prev, status };
        });
      }
    });
    return cleanup;
  }, [orderStorageKey]);

  // When order status becomes "ready" via SSE, auto-mark all items as ready
  useEffect(() => {
    const currentActiveOrder = isEditMode && localOrderData ? localOrderData : order;
    if (!currentActiveOrder?.status || !currentActiveOrder?.items) return;
    if (String(currentActiveOrder.status).toLowerCase() !== "ready") return;

    const unreadyItems = currentActiveOrder.items.filter(item => item._id && !item.isReady);
    if (unreadyItems.length === 0) return;

    Promise.all(
      unreadyItems.map(item =>
        toggleItemReady({ orderId: orderStorageKey, itemId: item._id }).unwrap()
      )
    ).then(() => {
      const newChecks = {};
      currentActiveOrder.items.forEach(item => {
        if (item._id) {
          newChecks[item._id] = true;
        }
      });
      setItemChecks(newChecks);
    }).catch(console.error);
  }, [order?.status, localOrderData?.status]);

  const activeOrderTypeKey = getOrderTypeKey(activeOrder?.orderType);

  const parseAmount = (value) => {
    if (value == null) return 0;
    if (typeof value === "number") return value;
    const cleaned = String(value).replace(/[^\d.]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const restaurantDeliveryCharge = parseAmount(restaurantDetails?.deliveryCharges);
  const hasOrderDeliveryCharge =
    activeOrder?.deliveryCharges !== undefined &&
    activeOrder?.deliveryCharges !== null &&
    String(activeOrder?.deliveryCharges).trim() !== "";
  const orderDeliveryCharge = hasOrderDeliveryCharge
    ? parseAmount(activeOrder?.deliveryCharges)
    : 0;
  const resolvedDeliveryCharge = hasOrderDeliveryCharge
    ? orderDeliveryCharge
    : restaurantDeliveryCharge;
  const deliveryCharges =
    activeOrderTypeKey === "delivery"
      ? resolvedDeliveryCharge
      : 0;

  // 🔧 FIX: Room charge from order document (source of truth)
  // Backend billOrder saves roomCharge to order.stay.roomCharge
  // Only show when stay.enabled === true (room order)
  const isStayEnabled = activeOrder?.stay?.enabled === true;
  const roomCharge = isStayEnabled ? parseAmount(activeOrder?.stay?.roomCharge || 0) : 0;

  const itemsSubtotal = recalcTotal(activeOrder?.items || []);
  const backendSubtotal = parseAmount(activeOrder?.subtotal);
  const hasBackendSubtotal =
    Number.isFinite(backendSubtotal) && backendSubtotal > 0;

  const displaySubtotal = isEditMode
    ? itemsSubtotal
    : (hasBackendSubtotal ? backendSubtotal : itemsSubtotal);

  const gstRate = parseAmount(
    activeOrder?.gstRate ??
    restaurantDetails?.gstRate ??
    order?.gstRate ??
    0
  );
  const backendGstAmount = parseAmount(activeOrder?.gstAmount);
  const computedGstAmount = gstRate > 0
    ? (displaySubtotal * gstRate) / 100
    : 0;
  const displayGstAmount = isEditMode
    ? computedGstAmount
    : (backendGstAmount || computedGstAmount);

  // 🔧 FIX: Include roomCharge in grand total
  const computedGrandTotal = displaySubtotal + displayGstAmount + deliveryCharges + roomCharge;
  const backendGrandTotal = parseAmount(activeOrder?.totalAmount || 0);
  let displayGrandTotal = computedGrandTotal;

  if (!isEditMode && backendGrandTotal) {
    const diff = Math.abs(backendGrandTotal - computedGrandTotal);
    if (diff <= 0.01) {
      displayGrandTotal = backendGrandTotal;
    } else if (Math.abs(backendGrandTotal - displaySubtotal) <= 0.01) {
      displayGrandTotal = computedGrandTotal;
    } else {
      displayGrandTotal = backendGrandTotal;
    }
  }

  const restaurantName =
    restaurantDetails?.restaurantName ||
    restaurantDetails?.name ||
    "Restaurant Name";
  const restaurantAddress = restaurantDetails?.address || "Restaurant Address";
  const restaurantPhone = restaurantDetails?.phoneNumber || "N/A";
  const rawGstin =
    restaurantDetails?.gstNumber ??
    restaurantDetails?.gstin ??
    restaurantDetails?.gstIN ??
    "";
  const normalizedGstin = String(rawGstin || "").trim();
  const restaurantGstin =
    normalizedGstin && restaurantDetails?.gstEnabled !== false
      ? normalizedGstin
      : null;
  const displayAddress = isEditMode ? address : activeOrder?.address;
  const forceLightBill = true;
  const billThemeIsDark = isDarkMode && !forceLightBill;
  const billSurfaceClass = billThemeIsDark
    ? "bg-slate-950 text-slate-100"
    : "bg-white text-gray-900";
  const billPanelClass = billThemeIsDark ? "bg-slate-950" : "bg-white";
  const billBorderClass = billThemeIsDark ? "border-slate-700" : "border-gray-200";
  const billTextClass = billThemeIsDark ? "text-slate-100" : "text-gray-900";
  const billMutedTextClass = billThemeIsDark ? "text-slate-300" : "text-gray-700";
  const billContentBgClass = billThemeIsDark ? "bg-slate-950" : "bg-white";
  const billInputClass = billThemeIsDark
    ? "border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-600"
    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200";
  const billSelectContentClass = billThemeIsDark
    ? "border-slate-700 bg-slate-950"
    : "border-gray-200 bg-white";
  const billSelectItemClass = billThemeIsDark
    ? "text-slate-200 hover:bg-slate-800 data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-50"
    : "text-gray-700 hover:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900";
  const billControlButtonClass = billThemeIsDark
    ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";
  const billCheckboxClass = billThemeIsDark
    ? "border-slate-600 bg-slate-900 text-orange-300 accent-orange-400"
    : "border-gray-300 text-orange-600 accent-orange-500";

  const getFinalQR = () => {
    const rawQR =
      (typeof restaurantDetails?.qrCode === "string" ||
      typeof restaurantDetails?.qrCode === "number")
        ? String(restaurantDetails?.qrCode)
        : (
            restaurantDetails?.qrCode?.url ||
            restaurantDetails?.qrCode?.secure_url ||
            restaurantDetails?.qrCode?.secureUrl ||
            restaurantDetails?.qrCode?.path ||
            restaurantDetails?.qrCode?.base64 ||
            ""
          );
    const cleanedQR = String(rawQR || "").replace(/\s/g, "");
    if (!cleanedQR) return "";
    if (cleanedQR.startsWith("data:image")) return cleanedQR;
    if (/^https?:\/\//i.test(cleanedQR)) return cleanedQR;
    return `data:image/png;base64,${cleanedQR}`;
  };
  const qrSrc = getFinalQR();

  // =============================
  // EDIT MODE FUNCTIONS
  // =============================

  const handleAddItem = (menuItemId) => {
    if (!localOrderData) return;
    const selected = menuItems.find(m => m._id === menuItemId);
    if (!selected) return;

    let newItem;
    const baseKey = buildItemCheckBase({
      menuItemId: selected._id,
      variantName: selected.pricingType === "variant" ? Object.keys(selected.variantRates || {})[0] : null,
      customizations: "",
    }) || `${selected._id || selected.name || "item"}`;
    const nextKey = getNextBillItemKey(localOrderData?.items || [], baseKey);

    if (selected.pricingType === "variant" && selected.variantRates) {
      const firstVariant = Object.keys(selected.variantRates)[0];
      newItem = {
        menuItemId: selected._id,
        name: selected.name,
        quantity: 1,
        variantName: firstVariant,
        variants: selected.variantRates,
        price: selected.variantRates[firstVariant],
        customizations: "",
        billItemKey: nextKey,
        isReady: false, // new item — always false
      };
    } else {
      newItem = {
        menuItemId: selected._id,
        name: selected.name,
        quantity: 1,
        variantName: null,
        variants: null,
        price: selected.price,
        customizations: "",
        billItemKey: nextKey,
        isReady: false, // new item — always false
      };
    }

    const items = [...(localOrderData?.items || []), newItem];

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
  };

  const handleRemoveItem = (idx) => {
    if (!localOrderData) return;
    if (localOrderData.items.length <= 1) {
      setError("Minimum 1 item required");
      return;
    }

    const items = localOrderData.items.filter((_, i) => i !== idx);

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
    setError("");
  };

  const handleQuantityChange = (idx, qty) => {
    if (!localOrderData) return;
    const quantity = Math.max(1, parseInt(qty) || 1);
    const items = [...localOrderData.items];
    items[idx] = { ...items[idx], quantity };

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
  };

  const handleVariantChange = (idx, variant) => {
    if (!localOrderData) return;
    const items = [...localOrderData.items];
    const item = { ...items[idx] };

    if (!item.variants || !item.variants[variant]) return;

    item.variantName = variant;
    item.price = item.variants[variant];
    item.billItemKey = buildItemCheckBase(item) || item.billItemKey;
    items[idx] = item;

    setLocalOrderData(prev => ({
      ...prev,
      items,
      totalAmount: recalcTotal(items)
    }));
  };

  const handleOrderTypeChange = (orderType) => {
    if (!localOrderData) return;
    const currentType = getOrderTypeKey(localOrderData.orderType);
    const newType = getOrderTypeKey(orderType);
    const defaultDeliveryCharge = parseAmount(
      localOrderData?.deliveryCharges ??
      order?.deliveryCharges ??
      restaurantDetails?.deliveryCharges
    );

    if (currentType === "delivery" && (newType === "eat_here" || newType === "take_away")) {
      setAddress("");
    }
    if (currentType === "eat_here" && (newType === "take_away" || newType === "delivery")) {
      setSelectedTableId("");
    }

    setLocalOrderData(prev => ({
      ...prev,
      orderType,
      deliveryCharges: newType === "delivery" ? defaultDeliveryCharge : 0
    }));
  };

  const handleTableChange = (tableId) => {
    setSelectedTableId(tableId);
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };

  // =============================
  // SAVE CHANGES — MAIN FIX HERE
  // =============================
  const handleSaveChanges = async () => {
    if (isSubmitting || !localOrderData) return;

    if (localOrderData.items.length === 0) {
      setError("Minimum 1 item required");
      return;
    }

    const selectedOrderTypeKey = getOrderTypeKey(localOrderData.orderType);

    if (selectedOrderTypeKey === "eat_here" && !selectedTableId) {
      setError("Please select a table for Eat Here order");
      return;
    }

    if (selectedOrderTypeKey === "delivery" && !address.trim()) {
      setError("Please enter address for Delivery order");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const initialStatus = initialOrderSnapshot?.status;
      const currentStatus = localOrderData.status;
      const initialItemCount = initialOrderSnapshot?.itemCount || 0;
      const currentItemCount = localOrderData.items.length;
      const isAddingNewItems = currentItemCount > initialItemCount;

      // ✅ FIX 1: Capture ready items by STABLE KEY before save
      // Backend gives new _id after edit — so we match by menuItemId+variant+customizations
      const readyStableKeys = new Set();
      (order?.items || []).forEach(item => {
        if (item.isReady === true && item._id) {
          readyStableKeys.add(buildItemCheckBase(item));
        }
      });

      // ✅ FIX 2: Send isReady in payload for existing items
      // This preserves isReady on backend even if backend resets it
      const payload = {
        orderType: localOrderData.orderType,
         replaceItems: true,
        items: localOrderData.items.map(item => {
          const payloadItem = {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            variant: item.variantName || null,
            customizations: item.customizations || "",
          };

          if (item._id) {
            payloadItem._id = item._id;
            // ✅ KEY FIX: Send isReady so backend preserves it
            // Previously this was MISSING — causing undefined/false on backend
            payloadItem.isReady = item.isReady === true ? true : false;
          }

          return payloadItem;
        })
      };

      let statusChanged = false;
      if (initialStatus === "ready" && isAddingNewItems) {
        payload.status = "preparing";
        statusChanged = true;
      } else if (currentStatus !== initialStatus) {
        payload.status = currentStatus;
        statusChanged = true;
      }

      if (selectedOrderTypeKey === "eat_here" && selectedTableId) {
        const [section, numStr] = selectedTableId.split(":");
        const number = parseInt(numStr, 10) || 1;
        const type = section === "rooms" ? "ROOM" : "TABLE";
        payload.source = { section, number, type };
      }

      if (selectedOrderTypeKey === "delivery" && address.trim()) {
        payload.address = address.trim();
        payload.deliveryCharges =
          parseAmount(localOrderData?.deliveryCharges) ||
          parseAmount(restaurantDetails?.deliveryCharges) ||
          0;
      }

      if (selectedOrderTypeKey === "take_away") {
        payload.source = { section: null, number: null, type: "NONE" };
        payload.address = null;
      }

      const saveResult = await updateOrder({
        orderId: localOrderData._id,
        updatedData: payload,
      }).unwrap();

      if (statusChanged && payload.status) {
        broadcastOrderStatus(localOrderData._id, payload.status);
      }

      // ✅ FIX 3: Restore isReady for previously-ready items
      // Match by stable key because backend assigns new _id after edit
      if (readyStableKeys.size > 0) {
        // Try all possible response formats from updateOrder API
        const savedItems =
          saveResult?.order?.items ||
          saveResult?.items ||
          saveResult?.data?.items ||
          saveResult?.data?.order?.items ||
          [];

        const itemsToRestore = savedItems.filter(
          newItem => newItem._id && readyStableKeys.has(buildItemCheckBase(newItem))
        );

        if (itemsToRestore.length > 0) {
          // ✅ FIX 4: Block SSE + itemChecks useEffect during restore window
          restoringRef.current = true;

          // Optimistically set restored items as checked in UI immediately
          setItemChecks(prev => {
            const next = { ...prev };
            itemsToRestore.forEach(item => {
              next[item._id] = true;
            });
            return next;
          });

          try {
            await Promise.all(
              itemsToRestore.map(item =>
                toggleItemReady({
                  orderId: localOrderData._id,
                  itemId: item._id
                }).unwrap().then(() => {
                  broadcastItemReady(localOrderData._id, item._id, true);
                })
              )
            );
          } catch (err) {
            console.warn("Failed to restore some item ready states:", err);
          } finally {
            // Release restore lock after 600ms so SSE can resume
            setTimeout(() => {
              restoringRef.current = false;
            }, 600);
          }
        }
      }

      setIsEditMode(false);
    } catch (err) {
      console.error("Update Order Failed:", err);
      setError(err?.data?.message || "Failed to update order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    const orderItems = Array.isArray(order?.items) ? order.items : [];
    const normalizedItems = normalizeItemsWithBillKeys(
      orderItems.map((item) => ({
        ...item,
        menuItemId: item.menuItemId || item.menuItem?._id || item._id,
        name: item.name || item.menuItem?.name || "",
        price: item.discountedPrice || item.price || 0,
        quantity: item.quantity || 1,
        variantName: item.variant || item.variantName || null,
        variants: item.variants || item.menuItem?.variantRates || null,
        customizations: item.customizations || "",
        isReady: item.isReady || false,
      })),
      localOrderData?.items || []
    );

    const newLocalOrderData = {
      ...order,
      items: normalizedItems,
    };

    setLocalOrderData(newLocalOrderData);
    setSelectedTableId(order.tableId || "");
    setAddress(order.address || "");
    setIsEditMode(false);
    setError("");
  };

  const handlePrint = () => {
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";

    document.body.appendChild(printFrame);
    const doc = printFrame.contentWindow.document;

    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("");
        } catch {
          return "";
        }
      })
      .join("");

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
            ${styles}
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .printable-bill,
              .printable-bill * {
                color: #000000 !important;
                background: #ffffff !important;
                border-color: #000000 !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }
              .printable-bill {
                background: #ffffff !important;
              }
            }
          </style>
        </head>
        <body>
          ${billRef.current.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      }, 300);

      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    };
  };

  const handleBillOrder = async () => {
    const orderId = activeOrder?._id || activeOrder?.id || activeOrder?.orderId;
    if (!orderId || isBilling || isAlreadyBilled || isPreviewOnly) return;

    setError("");
    try {
      const response = await billOrder(orderId).unwrap();
      const billedData = response?.order || response;
      setLocalOrderData((prev) => ({
        ...(prev || activeOrder),
        ...billedData,
        _id: activeOrder?._id || billedData?._id || billedData?.orderId,
        items: activeOrder?.items || prev?.items || [],
        customerName: activeOrder?.customerName || prev?.customerName,
        customerPhone: activeOrder?.customerPhone || prev?.customerPhone,
        orderType: activeOrder?.orderType || prev?.orderType,
        source: billedData?.source || activeOrder?.source || prev?.source,
        status: billedData?.status || "completed",
        totalAmount: billedData?.totalAmount ?? activeOrder?.totalAmount ?? prev?.totalAmount,
        completedAt: billedData?.completedAt || new Date().toISOString(),
      }));
      broadcastOrderStatus(orderId, "completed");
    } catch (err) {
      setError(err?.data?.message || err?.message || "Failed to bill order");
    }
  };

  // Auto-print support for the layout card printer icon (one-click bill print)
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => {
      if (billRef.current) {
        handlePrint();
        onClose?.();
      }
    }, 700);
    return () => clearTimeout(t);
  }, [autoPrint, onClose]);

  const handleKOTPrint = () => {
    const kotRestName =
      restaurantDetails?.restaurantName ||
      restaurantDetails?.name ||
      "Restaurant";
    const kotOrderId = activeOrder?.orderId || activeOrder?._id?.slice(-4) || "N/A";
    const kotItems = activeOrder?.items || [];

    // Build type info with location
    const orderType = activeOrder?.orderType || "";
    const section = activeOrder?.source?.section;
    const number = activeOrder?.source?.number;
    let typeInfo = orderType || "N/A";
    if (section && number != null) {
      const labels = { indoor: "Indoor", outdoor: "Outdoor", rooftop: "Rooftop", rooms: "Room" };
      const secLabel = labels[section] || (section.charAt(0).toUpperCase() + section.slice(1));
      const unit = activeOrder?.source?.type === "ROOM" ? "" : "Table";
      const loc = unit ? `${secLabel} ${unit} ${number}` : `${secLabel} ${number}`;
      typeInfo = `${orderType} · ${loc}`;
    }

    const container = document.createElement("div");
    container.innerHTML = `
      <div style="padding:24px;font-family:monospace;font-size:14px;max-width:400px;margin:0 auto;color:#000">
        <div style="text-align:center;margin-bottom:16px">
          <h2 style="margin:0;font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#000">${kotRestName}</h2>
          <hr style="width:75%;margin:8px auto;border:none;border-top:1px solid #000" />
          <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#000">Kitchen Order Ticket</p>
        </div>

        <div style="margin-bottom:12px;border-top:1px dashed #000;border-bottom:1px dashed #000;padding:8px 0;font-size:12px;color:#000">
          <div style="display:flex;justify-content:space-between"><span style="font-weight:600">Order ID</span><span>${kotOrderId}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="font-weight:600">Name</span><span>${activeOrder?.customerName || "Guest"}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="font-weight:600">Type</span><span>${typeInfo}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="font-weight:600">Time</span><span>${activeOrder?.createdAt ? new Date(activeOrder.createdAt).toLocaleString("en-IN", { hour12: true }) : "N/A"}</span></div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:12px;color:#000">
          <thead>
            <tr style="border-bottom:1px solid #000">
              <th style="padding:4px 0;text-align:left;font-weight:600;color:#000">Item</th>
              <th style="padding:4px 0;text-align:right;font-weight:600;color:#000">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${kotItems.map(item => `
              <tr style="border-bottom:1px dotted #000">
                <td style="padding:4px 0;color:#000">${getItemName(item)}${(item.variant || item.variantName) ? ` <span style="color:#000">(${item.variant || item.variantName})</span>` : ""}</td>
                <td style="padding:4px 0;text-align:right;font-weight:500;color:#000">${item.quantity || 1}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

      </div>
    `;

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";

    document.body.appendChild(printFrame);
    const doc = printFrame.contentWindow.document;

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #fff; color: #000; font-family: monospace; padding: 20px; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>${container.innerHTML}</body>
      </html>
    `);
    doc.close();

    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      }, 300);
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    };
  };

  const getItemName = (item) => {
    return item?.name || item?.menuItem?.name || "Item";
  };

  const getOrderTypeIcon = (type) => {
    switch (getOrderTypeKey(type)) {
      case "eat_here":
        return <Utensils size={16} />;
      case "take_away":
        return <Home size={16} />;
      case "delivery":
        return <Truck size={16} />;
      default:
        return <Utensils size={16} />;
    }
  };
  const getOrderTypeBadge = (type) => getOrderTypeBadgeClass(type);

  const MotionDiv = motion.div;

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <MotionDiv
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-[0_20px_45px_-24px_rgba(249,115,22,0.4)] ${
          isDarkMode
            ? "border-slate-700 bg-[#1e293b] text-slate-100"
            : "border-[#ede8e3] bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b p-4 ${
            isDarkMode
              ? "border-slate-700 bg-slate-800/60"
              : "border-[#ede8e3] bg-[#f7f3ef]"
          }`}
        >
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-semibold ${isDarkMode ? "text-slate-100" : "text-[#1c1917]"}`}>
              {isPreviewOnly ? "New Items Bill Preview" : "Order Details & Bill"}
            </h3>
            {isPreviewOnly && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                isDarkMode
                  ? "border-sky-500/40 bg-sky-500/20 text-sky-200"
                  : "border-sky-200 bg-sky-100 text-sky-700"
              }`}>
                {order?.previewLabel || "New Items Only"}
              </span>
            )}
            {isStaff && !isEditMode && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                isDarkMode
                  ? "border-orange-500/40 bg-orange-500/20 text-orange-200"
                  : "border-orange-200 bg-orange-100 text-orange-700"
              }`}>
                Staff View
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isStaff && !isEditMode && !isPreviewOnly && (
              <button
                onClick={() => setIsEditMode(true)}
                className={`relative rounded-lg p-2 transition-colors ${
                  isDarkMode
                    ? "text-orange-300 hover:bg-slate-800"
                    : "text-orange-700 hover:bg-orange-100"
                }`}
                title="Edit Order"
              >
                <Edit3 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className={`rounded-full p-1 transition-colors ${
                isDarkMode
                  ? "text-slate-400 hover:bg-slate-800 hover:text-orange-300"
                  : "text-gray-400 hover:bg-orange-100 hover:text-orange-700"
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Edit Mode Header */}
        {isEditMode && (
          <div className={`flex items-center justify-between border-b px-4 py-2 ${
            isDarkMode ? "border-slate-700 bg-slate-900" : "border-orange-100 bg-orange-50/80"
          }`}>
            <span className={`text-sm font-medium ${isDarkMode ? "text-orange-300" : "text-orange-700"}`}>Edit Mode</span>
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className={`rounded-lg p-1.5 transition-colors ${
                  isDarkMode
                    ? "text-slate-400 hover:bg-slate-800"
                    : "text-gray-500 hover:bg-orange-100"
                }`}
                title="Cancel"
              >
                <X size={16} />
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSubmitting}
                className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
                  isDarkMode
                    ? "text-emerald-300 hover:bg-emerald-500/15"
                    : "text-green-600 hover:bg-green-100"
                }`}
                title="Save"
              >
                <Save size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`border-b px-4 py-2 ${
            isDarkMode ? "border-red-500/40 bg-red-500/15" : "border-red-200 bg-red-50"
          }`}>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Scrollable Content */}
        <div className={`flex-1 overflow-y-auto p-6 ${billContentBgClass}`}>
          <div ref={billRef} className={`printable-bill ${billSurfaceClass}`}>

            {/* Restaurant Header */}
            <div className={`mb-4 border-b pb-4 ${billBorderClass}`}>
              <div className="flex flex-col items-center text-center">
                {qrSrc ? (
                  <img
                    src={qrSrc}
                    alt="QR Code"
                    className={`mb-2 h-12 w-12 rounded-md border ${billBorderClass} object-contain`}
                  />
                ) : null}
                <h2 className={`text-xl font-bold ${billTextClass}`}>{restaurantName}</h2>
                <p className={`text-sm ${billTextClass}`}>{restaurantAddress}</p>
                <p className={`text-sm ${billTextClass}`}>Phone: {restaurantPhone}</p>
                {restaurantGstin && (
                  <p className={`text-sm ${billTextClass}`}>GSTIN: {restaurantGstin}</p>
                )}
              </div>
            </div>
 
            {/* Order Creator (screen only, hidden on print) */}
            {(() => {
              const role = (activeOrder?.createdByRole || "user").toLowerCase();
              const label = role === "admin" ? "Admin" : role === "staff" ? "Staff" : "User";
              const badgeClass =
                role === "admin"
                  ? "border-orange-200 bg-orange-100 text-orange-700"
                  : role === "staff"
                  ? "border-blue-200 bg-blue-100 text-blue-700"
                  : "border-green-200 bg-green-100 text-green-700";
              return (
                <div className="no-print mb-3 flex items-center gap-2 text-sm">
                  <span className={`${billTextClass} font-medium`}>Order Created By:</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${badgeClass}`}>
                    {label}
                  </span>
                </div>
              );
            })()}
 
            {/* Customer & Order Info */}
            <div className={`mb-4 grid grid-cols-2 gap-x-4 text-sm ${billTextClass}`}>
              <p>
                <strong>Customer:</strong> {activeOrder?.customerName || "Guest"}
              </p>
              <p>
                <strong>Phone:</strong> {activeOrder?.customerPhone || "N/A"}
              </p>
              {(activeOrder?.source?.section || activeOrder?.source?.sectionName || activeOrder?.tableId) && (
                <p>
                  <strong>
                    {activeOrder?.source?.type === "ROOM" ? "Room:" : "Table:"}
                  </strong>{" "}
                  {(activeOrder?.source?.section || activeOrder?.source?.sectionName)
                    ? (() => {
                        const label = formatOrderTableId(activeOrder?.tableId, activeOrder?.source);
                        return label || "—";
                      })()
                    : activeOrder.tableId
                  }
                </p>
              )}
              <p>
                <strong>Time:</strong>{" "}
                {activeOrder?.createdAt
                  ? new Date(activeOrder.createdAt).toLocaleTimeString([], { hour12: true })
                  : "N/A"}
              </p>
              <p>
                <strong>Type:</strong>{" "}
                {(() => {
                  if (!isEatHereOrder(activeOrder?.orderType)) return activeOrder?.orderType || "N/A";
                  const tableLabel = formatOrderTableId(activeOrder?.tableId, activeOrder?.source);
                  return tableLabel ? `${tableLabel} : ` : "";
                })()}
                {activeOrder?.orderType || "N/A"}
              </p>
            </div>

            {activeOrderTypeKey === "delivery" && displayAddress && (
              <div className={`mb-4 rounded border p-3 text-sm ${billBorderClass} ${billPanelClass}`}>
                <strong>Delivery Address:</strong>
                <br />
                {displayAddress}
              </div>
            )}

            {/* EDIT MODE: Order Type & Table/Address */}
            {isEditMode && (
              <div className="mb-4 space-y-3">
                {/* Order Type */}
                <div>
                  <label className={`mb-1 block text-sm font-medium ${billMutedTextClass}`}>
                    Order Type
                  </label>
                  <Select
                    value={localOrderData?.orderType}
                    onValueChange={handleOrderTypeChange}
                  >
                    <SelectTrigger className={`h-10 w-full rounded-xl border px-3 text-sm font-medium shadow-sm ring-1 ring-black/5 transition-all outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 ${getOrderTypeBadge(localOrderData?.orderType)}`}>
                      <div className="flex items-center gap-2 text-sm">
                        {getOrderTypeIcon(localOrderData?.orderType)}
                        <span>{getOrderTypeLabel(localOrderData?.orderType)}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className={`rounded-xl border p-1 shadow-xl ${billSelectContentClass}`}>
                      <SelectGroup>
                        <SelectItem value="Eat Here" className={`cursor-pointer rounded-lg py-2 text-sm font-medium ${getOrderTypeItemClass("Eat Here")}`}>
                          <div className="flex items-center gap-2">
                            <Utensils size={16} /> Eat Here
                          </div>
                        </SelectItem>
                        <SelectItem value="Take Away" className={`cursor-pointer rounded-lg py-2 text-sm font-medium ${getOrderTypeItemClass("Take Away")}`}>
                          <div className="flex items-center gap-2">
                            <Home size={16} /> Take Away
                          </div>
                        </SelectItem>
                        <SelectItem value="Delivery" className={`cursor-pointer rounded-lg py-2 text-sm font-medium ${getOrderTypeItemClass("Delivery")}`}>
                          <div className="flex items-center gap-2">
                            <Truck size={16} /> Delivery
                          </div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table / Room Selection - Eat Here */}
                {getOrderTypeKey(localOrderData?.orderType) === "eat_here" && (() => {
                  const sec = restaurantDetails?.sections || {};
                  const indoorCount  = sec.indoor?.tables  || restaurantDetails?.tableNumbers || 0;
                  const outdoorCount = sec.outdoor?.tables || 0;
                  const rooftopCount = sec.rooftop?.tables || 0;
                  const roomsCount   = sec.rooms?.rooms    || 0;

                  const sectionDefs = [
                    { key: "indoor",  label: "Indoor",  count: indoorCount,  unit: "Table" },
                    { key: "outdoor", label: "Outdoor", count: outdoorCount, unit: "Table" },
                    { key: "rooftop", label: "Rooftop", count: rooftopCount, unit: "Table" },
                    { key: "rooms",   label: "Rooms",   count: roomsCount,   unit: "Room"  },
                  ].filter(s => s.count > 0);

                  const [selSection, selNum] = selectedTableId ? selectedTableId.split(":") : ["", ""];
                  const onlyOne = sectionDefs.length === 1;

                  return (
                    <div>
                      <label className={`mb-2 block text-sm font-medium ${billMutedTextClass}`}>
                        {onlyOne ? "Select Table *" : "Select Section & Table *"}
                      </label>
                      {sectionDefs.length === 0 ? (
                        <p className={`rounded-xl border border-dashed p-3 text-sm text-center ${billInputClass}`}>
                          No tables configured yet.
                        </p>
                      ) : onlyOne ? (
                        <Select
                          value={selectedTableId || `${sectionDefs[0].key}:1`}
                          onValueChange={(v) => handleTableChange(`${sectionDefs[0].key}:${v}`)}
                        >
                          <SelectTrigger className={`h-9 w-full rounded-lg border text-sm font-medium ${billInputClass}`}>
                            <SelectValue placeholder={`Select ${sectionDefs[0].unit}`}>
                              {selNum ? `${sectionDefs[0].unit} ${selNum}` : `Select ${sectionDefs[0].unit}`}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className={`max-h-[180px] overflow-y-auto rounded-xl border p-1 shadow-xl ${billSelectContentClass}`}>
                            <SelectGroup>
                              {Array.from({ length: sectionDefs[0].count }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)} className={`cursor-pointer py-2 text-sm font-medium ${billSelectItemClass}`}>
                                  {sectionDefs[0].unit} {i + 1}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {sectionDefs.map(({ key, label, count, unit }) => {
                            const isSelected = selSection === key;
                            return (
                              <div key={key} className={`flex flex-col gap-1.5 ${isSelected ? "col-span-full" : ""}`}>
                                <button
                                  type="button"
                                  onClick={() => handleTableChange(isSelected ? "" : `${key}:1`)}
                                  className={`flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all ${
                                    isSelected
                                      ? "border-orange-500 bg-orange-500 text-white"
                                      : billThemeIsDark
                                        ? "border-slate-600 bg-slate-800 text-slate-200 hover:border-orange-400"
                                        : "border-gray-200 bg-white text-gray-700 hover:border-orange-400"
                                  }`}
                                >
                                  <span className="flex-1 text-left">{label}</span>
                                  <span className={`text-xs font-normal ${isSelected ? "text-white/80" : billThemeIsDark ? "text-slate-400" : "text-gray-400"}`}>
                                    {count} {unit}{count > 1 ? "s" : ""}
                                  </span>
                                </button>
                                {isSelected && (
                                  <Select value={selNum || "1"} onValueChange={(v) => handleTableChange(`${key}:${v}`)}>
                                    <SelectTrigger className={`h-9 w-full rounded-lg border text-sm font-medium ${billInputClass}`}>
                                      <SelectValue placeholder={`Select ${unit}`} />
                                    </SelectTrigger>
                                    <SelectContent className={`max-h-[180px] overflow-y-auto rounded-xl border p-1 shadow-xl ${billSelectContentClass}`}>
                                      <SelectGroup>
                                        {Array.from({ length: count }, (_, i) => (
                                          <SelectItem key={i + 1} value={String(i + 1)} className={`cursor-pointer py-2 text-sm font-medium ${billSelectItemClass}`}>
                                            {unit} {i + 1}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Address - Delivery */}
                {getOrderTypeKey(localOrderData?.orderType) === "delivery" && (
                  <div>
                    <label className={`mb-1 block text-sm font-medium ${billMutedTextClass}`}>
                      Delivery Address *
                    </label>
                    <textarea
                      value={address}
                      onChange={handleAddressChange}
                      placeholder="Enter delivery address"
                      className={`w-full resize-none rounded-xl border p-3 text-sm shadow-sm transition-all outline-none ${billInputClass}`}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Items Table */}
            <table className={`mb-4 w-full border-y text-sm ${billBorderClass}`}>
              <thead>
                <tr className="bg-transparent">
                  <th className="py-2 px-2 text-left">Item</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">Price</th>
                  <th className="py-2 px-2 text-right">Total</th>
                  {showItemChecks && (
                    <th className="no-print py-2 px-2 text-center">Sent</th>
                  )}
                  {isEditMode && <th className="py-2 px-2 text-center">Action</th>}
                </tr>
              </thead>
              <tbody>
                {(activeOrder?.items || [])?.map((item, i) => {
                  const itemPrice = parseAmount(
                    item.discountedPrice ??
                    item.price ??
                    item.menuItem?.price ??
                    0
                  );
                  const itemQuantity = parseAmount(item.quantity ?? 1);
                  const itemTotal = itemPrice * itemQuantity;
                  const itemKey = item._id;
                  const isChecked = !!itemChecks[itemKey];
                  const itemVariant = item.variantName || item.variant;

                  return (
                    <tr key={i} className={`border-b ${billBorderClass}`}>
                      <td className="py-1.5 px-2">
                        <div>
                          {getItemName(item)}
                          {itemVariant && (
                            <div className={`text-xs ${billTextClass}`}>({itemVariant})</div>
                          )}
                          {item.comboItems && (
                            <div className={`text-xs ${billTextClass}`}>
                              Combo: {item.comboItems.length} items
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        {isEditMode ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleQuantityChange(i, item.quantity - 1)}
                              className={`rounded p-1 transition-colors ${billControlButtonClass}`}
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(i, item.quantity + 1)}
                              className={`rounded p-1 transition-colors ${billControlButtonClass}`}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        {isEditMode && item.variants ? (
                          <Select
                            value={item.variantName}
                            onValueChange={(v) => handleVariantChange(i, v)}
                          >
                            <SelectTrigger className={`h-8 w-24 rounded-lg border text-xs font-medium shadow-sm transition-all outline-none ${billInputClass}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={`rounded-xl border p-1 shadow-xl ${billSelectContentClass}`}>
                              {Object.entries(item.variants).map(([variant, price]) => (
                                <SelectItem
                                  key={variant}
                                  value={variant}
                                  className={`cursor-pointer rounded-lg py-1 text-xs font-medium ${billSelectItemClass}`}
                                >
                                  {variant}: ₹{price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          `₹${itemPrice}`
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right font-medium">
                        ₹{itemTotal.toFixed(2)}
                      </td>
                      {showItemChecks && item._id && (
                        <td className="no-print py-1.5 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItemCheck(itemKey)}
                            className={`h-4 w-4 cursor-pointer rounded border transition-colors ${billCheckboxClass}`}
                            aria-label={`Mark ${getItemName(item)} as sent`}
                          />
                        </td>
                      )}
                      {isEditMode && (
                        <td className="py-1.5 px-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(i)}
                            className="rounded p-1 text-red-500 transition-colors hover:bg-red-50"
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* EDIT MODE: Add Item */}
            {isEditMode && (
              <div className="mb-4">
                <label className={`mb-1 block text-sm font-medium ${billMutedTextClass}`}>
                  Add Item
                </label>
                <Select onValueChange={handleAddItem}>
                  <SelectTrigger className={`h-10 w-full rounded-xl border px-3 text-sm font-medium shadow-sm transition-all outline-none ${billInputClass}`}>
                    <SelectValue placeholder="Select item to add..." />
                  </SelectTrigger>
                  <SelectContent className={`max-h-60 rounded-xl border p-1 shadow-xl ${billSelectContentClass}`}>
                    <SelectGroup>
                      {menuItems.map((item) => (
                        <SelectItem
                          key={item._id}
                          value={item._id}
                          className={`cursor-pointer rounded-lg py-2 text-sm font-medium ${billSelectItemClass}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{item.name}</span>
                            <span className={`ml-2 text-xs ${billTextClass}`}>
                              {item.pricingType === "variant"
                                ? "Variant"
                                : `₹${item.price || 0}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Totals */}
            <div className={`ml-auto max-w-xs space-y-1 rounded-xl border p-3 text-sm ${billBorderClass} ${billPanelClass}`}>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{displaySubtotal.toFixed(2)}</span>
              </div>

              {displayGstAmount > 0 && (
                <div className="flex justify-between">
                  <span>GST {gstRate > 0 ? `(${gstRate}%)` : ""}</span>
                  <span>₹{displayGstAmount.toFixed(2)}</span>
                </div>
              )}

              {/* 🔧 FIX: Show room charge only when stay.enabled === true (room order) */}
              {isStayEnabled && roomCharge > 0 && (
                <div className="flex justify-between">
                  <span>Room Charges</span>
                  <span>₹{roomCharge.toFixed(2)}</span>
                </div>
              )}

              {activeOrderTypeKey === "delivery" && (
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>₹{deliveryCharges.toFixed(2)}</span>
                </div>
              )}

              <div className={`flex justify-between font-bold border-t pt-2 mt-2 ${billBorderClass}`}>
                <span>Grand Total</span>
                <span>₹{displayGrandTotal.toFixed(2)}</span>
              </div>
            </div>

            <p className={`mt-4 border-t pt-3 text-center text-xs ${billBorderClass} ${billTextClass}`}>
              Hope to serve you again soon! 😊🍽️
            </p>
          </div>
        </div>

        {/* Footer - Responsive buttons */}
        <div className={`flex flex-wrap items-center justify-end gap-2 border-t p-3 sm:p-4 ${
          isDarkMode
            ? "border-slate-700 bg-slate-800/40"
            : "border-[#ede8e3] bg-[#f7f3ef]"
        }`}>
          {isEditMode && (
            <button
              onClick={handleCancelEdit}
              className={`flex h-8 sm:h-9 items-center rounded-lg border px-2.5 sm:px-4 text-xs sm:text-sm font-semibold transition-colors ${
                isDarkMode
                  ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"
              }`}
            >
              Cancel
            </button>
          )}

           <button
             onClick={handleKOTPrint}
             className="flex h-8 sm:h-9 items-center rounded-lg bg-orange-500 px-2.5 sm:px-4 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-orange-600"
           >
             KOT
           </button>
 
          {!isPreviewOnly && (
            <button
              onClick={handleBillOrder}
              disabled={isBilling || isAlreadyBilled}
              className={`flex h-8 sm:h-9 items-center rounded-lg px-2.5 sm:px-4 text-xs sm:text-sm font-semibold text-white transition-colors ${
                isBilling || isAlreadyBilled
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isBilling ? "Billing..." : isAlreadyBilled ? "Billed" : "Bill Order"}
            </button>
          )}

          {!isPreviewOnly && (
            <button
              onClick={handlePrint}
              className={`flex h-8 sm:h-9 items-center gap-1.5 rounded-lg px-2.5 sm:px-4 text-xs sm:text-sm font-semibold text-white transition-colors ${
                isDarkMode
                  ? "bg-sky-600 hover:bg-sky-500"
                  : "bg-sky-600 hover:bg-sky-700"
              }`}
            >
              <Printer size={14} />
              Print Bill
            </button>
          )}

          <button
            onClick={onClose}
            className={`flex h-8 sm:h-9 items-center rounded-lg border px-2.5 sm:px-4 text-xs sm:text-sm font-semibold transition-colors sm:ml-auto ${
              isDarkMode
                ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"
            }`}
          >
            Close
          </button>
         </div>
       </MotionDiv>
    </MotionDiv>
  );
};

export default React.memo(BillPage);
