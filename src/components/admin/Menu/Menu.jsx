import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CirclePlus,
  GripVertical,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";
import MenuFilter from "./ComponentsMenu/MenuFilter";
import MenuItemViewModal from "./ComponentsMenu/MenuItemViewModal";
import EditItemModal from "./ComponentsMenu/EditItemModal";
import DeleteConfirmModal from "./ComponentsMenu/DeleteConfirmModal";
import { useNotify } from "../common/NotificationModal";
import { useAdminTour } from "../../../hooks/useAdminTour";
import { TOUR_KEYS, getMenuSteps } from "../../../utils/adminTour";

import {
  useGetMenuQuery,
  useDeleteMenuItemMutation,
  useUpdateMenuItemMutation,
  useCreateMenuItemMutation,
  useGetRestaurantProfileQuery,
  useUpdateRestaurantProfileMutation,
  useReorderMenuItemsMutation,
  useReorderCategoriesMutation,
} from "../../../redux/adminRedux/adminAPI";

const extractTextCandidate = (value, priorityKeys = []) => {
  if (value === undefined || value === null) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = extractTextCandidate(entry, priorityKeys);
      if (resolved) return resolved;
    }
    return "";
  }

  if (typeof value === "object") {
    for (const key of priorityKeys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const resolved = extractTextCandidate(value[key], priorityKeys);
        if (resolved) return resolved;
      }
    }

    for (const nestedValue of Object.values(value)) {
      const resolved = extractTextCandidate(nestedValue, priorityKeys);
      if (resolved) return resolved;
    }
  }

  return "";
};

const normalizeFoodType = (value = "") => {
  const rawValue = extractTextCandidate(value, [
    "type",
    "foodType",
    "food_type",
    "foodtype",
    "foodTypeName",
    "food_type_name",
    "name",
    "label",
    "value",
  ]);

  const normalized = String(rawValue || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (["veg", "vegetarian", "vegitarian"].includes(normalized)) {
    return "veg";
  }

  if (
    normalized === "nonveg" ||
    normalized === "non-veg" ||
    normalized === "non-vegetarian" ||
    normalized === "nonvegetarian" ||
    normalized === "egg"
  ) {
    return "non-veg";
  }

  if (normalized === "mixed" || normalized === "mix" || normalized === "both") {
    return "mixed";
  }

  return "";
};

const buildCategoryLookup = (categories = []) => {
  const lookup = {};

  categories.forEach((entry) => {
    if (typeof entry === "string" || typeof entry === "number") {
      const label = String(entry).trim();
      if (label) lookup[label.toLowerCase()] = label;
      return;
    }

    if (!entry || typeof entry !== "object") return;

    const label = extractTextCandidate(entry, [
      "name",
      "category",
      "categoryName",
      "category_label",
      "label",
      "title",
      "value",
    ]);

    if (!label) return;

    const idCandidates = [
      entry._id,
      entry.id,
      entry.categoryId,
      entry.category_id,
      entry.value,
    ]
      .map((val) => String(val || "").trim())
      .filter(Boolean);

    lookup[label.toLowerCase()] = label;
    idCandidates.forEach((id) => {
      lookup[id.toLowerCase()] = label;
    });
  });

  return lookup;
};

const detectCategoryObjectKey = (category) => {
  if (!category || typeof category !== "object") return "name";
  const candidates = [
    "name",
    "category",
    "categoryName",
    "label",
    "title",
    "value",
    "displayName",
  ];
  const match = candidates.find(
    (key) => typeof category[key] === "string" && category[key].trim()
  );
  return match || "name";
};

const resolveCategoryMode = (values = []) => {
  const list = Array.isArray(values) ? values : [];
  const objectItem = list.find(
    (item) => item && typeof item === "object" && !Array.isArray(item)
  );
  if (!objectItem) return { mode: "string", key: "name" };
  return { mode: "object", key: detectCategoryObjectKey(objectItem) };
};

const appendCategoriesToFormData = (fd, categories, mode) => {
  if (mode?.mode === "object") {
    categories.forEach((category, index) => {
      fd.append(`categories[${index}][${mode.key}]`, category);
      fd.append(`categories[${index}][displayOrder]`, index);
    });
    return;
  }

  if (categories.length === 0) {
    fd.append("categories", "");
    return;
  }

  categories.forEach((category) => fd.append("categories", category));
};

const resolveCategoryValue = (item = {}, categoryLookup = {}, categoryOptions = []) => {
  const rawCategory =
    item?.category ??
    item?.categoryName ??
    item?.categoryLabel ??
    item?.category_label ??
    item?.categoryId ??
    item?.category_id ??
    item?.menuCategory ??
    item?.productCategory ??
    item?.details?.category ??
    item?.meta?.category ??
    "";

  const candidate = extractTextCandidate(rawCategory, [
    "name",
    "category",
    "categoryName",
    "category_label",
    "label",
    "title",
    "value",
    "slug",
  ]);

  const trimmed = String(candidate || "").trim();
  if (!trimmed) return "";

  const fromLookup = categoryLookup[trimmed.toLowerCase()];
  if (fromLookup) return fromLookup;

  const matchedCategory = categoryOptions.find(
    (category) => category.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchedCategory) return matchedCategory;

  const normalizedCandidate = trimmed
    .replace(/-+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (normalizedCandidate) {
    const normalizedKey = normalizedCandidate.toLowerCase();
    const fromNormalized = categoryLookup[normalizedKey];
    if (fromNormalized) return fromNormalized;

    const matchedNormalized = categoryOptions.find(
      (category) => category.toLowerCase() === normalizedKey
    );
    if (matchedNormalized) return matchedNormalized;
  }

  if (/^[a-f0-9]{24}$/i.test(trimmed)) return "";

  return trimmed;
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "";
  return `₹${amount.toFixed(0)}`;
};

const getItemPriceLabel = (item = {}) => {
  const pricingType = item?.pricingType || "single";

  if (pricingType === "combo") {
    return formatCurrency(item?.comboPrice ?? item?.price ?? 0);
  }

  if (pricingType === "variant") {
    const variants = item?.variantRates || {};
    const prices = ["quarter", "half", "full"]
      .map((key) => Number(variants?.[key]?.price))
      .filter((val) => !Number.isNaN(val));
    if (prices.length) {
      return `${formatCurrency(Math.min(...prices))}+`;
    }
    return "Varies";
  }

  return formatCurrency(item?.price ?? item?.comboPrice ?? 0);
};

const getDiscountedPriceDetails = (price, discount) => {
  const basePrice = Number(price);
  if (Number.isNaN(basePrice)) {
    return { current: null, original: null, hasDiscount: false };
  }

  const discountValue = Number(discount?.value ?? 0);
  const isActive = Boolean(discount?.active) && discountValue > 0;
  if (!isActive) {
    return { current: basePrice, original: null, hasDiscount: false };
  }

  const discountType = String(discount?.type || "flat").toLowerCase();
  const discounted =
    discountType === "percentage"
      ? basePrice - (basePrice * discountValue) / 100
      : basePrice - discountValue;

  return {
    current: Math.max(discounted, 0),
    original: basePrice,
    hasDiscount: true,
  };
};

const getSinglePriceDetails = (item = {}) => {
  if (item?.pricingType !== "single") return null;
  return getDiscountedPriceDetails(item?.price, item?.discount);
};

const getVariantPriceDetails = (item = {}) => {
  if (item?.pricingType !== "variant") return [];
  const variants = item?.variantRates || {};
  const entries = [
    { key: "quarter", label: "Q" },
    { key: "half", label: "H" },
    { key: "full", label: "F" },
  ];

  return entries
    .map((entry) => {
      const rate = variants?.[entry.key];
      if (!rate?.price && rate?.price !== 0) return null;
      const details = getDiscountedPriceDetails(rate.price, rate.discount);
      if (details.current == null) return null;
      return {
        key: entry.key,
        label: entry.label,
        ...details,
      };
    })
    .filter(Boolean);
};

const FoodTypeIndicator = ({ type = "" }) => {
  const normalized = String(type || "").toLowerCase();
  const isVeg = normalized === "veg";
  const isNonVeg = normalized === "non-veg";
  const borderClass = isVeg
    ? "border-green-600 bg-green-100"
    : isNonVeg
    ? "border-red-600 bg-red-100"
    : "border-yellow-600 bg-yellow-100";
  const dotClass = isVeg
    ? "bg-green-600"
    : isNonVeg
    ? "bg-red-600"
    : "bg-yellow-600";

  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-[3px] border ${borderClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
    </span>
  );
};

const AvailabilityBadge = ({ available }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      available
        ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300"
        : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
    }`}
  >
    {available ? <CheckCircle size={12} /> : <XCircle size={12} />}
    {available ? "In stock" : "Out of stock"}
  </span>
);

const StockToggle = ({ status = "in", onToggle, disabled = false }) => {
  const isMixed = status === "mixed";
  const isIn = status === "in";
  const label = isMixed ? "Mixed" : isIn ? "In stock" : "Out of stock";
  const [cooldown, setCooldown] = useState(false);
  const cooldownRef = useRef(null);

  const pillClass = isMixed
    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
    : isIn
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
    : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";
  const trackClass = isMixed
    ? "bg-amber-500 dark:bg-amber-400"
    : isIn
    ? "bg-green-600 dark:bg-emerald-400"
    : "bg-red-600 dark:bg-rose-500";
  const knobTranslate = isMixed
    ? "translate-x-1.5"
    : isIn
    ? "translate-x-3"
    : "translate-x-0";

  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      disabled={disabled || cooldown}
      onClick={() => {
        if (disabled || cooldown) return;
        onToggle?.();
        setCooldown(true);
        if (cooldownRef.current) clearTimeout(cooldownRef.current);
        cooldownRef.current = setTimeout(() => {
          setCooldown(false);
        }, 500);
      }}
      className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-semibold transition ${
        disabled || cooldown
          ? "cursor-not-allowed opacity-60"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
      } ${pillClass}`}
    >
      <span className={`relative h-4 w-7 rounded-full ${trackClass}`}>
        <span
          className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow transition ${knobTranslate}`}
        />
      </span>
      <span>{label}</span>
    </button>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative px-3 pb-2 text-sm font-semibold transition ${
      active
        ? "text-orange-600"
        : "text-[#78716c] hover:text-[#1c1917] dark:text-slate-300 dark:hover:text-slate-100"
    }`}
  >
    {children}
    <span
      className={`absolute left-0 right-0 -bottom-[1px] h-0.5 rounded-full transition ${
        active ? "bg-orange-500" : "bg-transparent"
      }`}
    />
  </button>
);

const Menu = () => {
  const { data: items = [], isLoading, refetch } = useGetMenuQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: restaurantData } = useGetRestaurantProfileQuery();
  const isDarkMode = localStorage.getItem("admin-theme") === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  useAdminTour(TOUR_KEYS.menu, getMenuSteps, isDarkMode, 900);

  // Get user role
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const [createMenuItem] = useCreateMenuItemMutation();
  const [updateMenuItem] = useUpdateMenuItemMutation();
  const [deleteMenuItem] = useDeleteMenuItemMutation();
  const [reorderMenuItems] = useReorderMenuItemsMutation();
  const [updateRestaurantProfile] = useUpdateRestaurantProfileMutation();
  const [reorderCategories] = useReorderCategoriesMutation();
  const [restaurantCategories, setRestaurantCategories] = useState([]);
  const [menuOrder, setMenuOrder] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const menuOrderRef = useRef([]);
  const dragStartOrderRef = useRef([]);
  const menuReorderTimerRef = useRef(null);
  const menuReorderPendingRef = useRef([]);
  const pointerDragRef = useRef({ pointerId: null });

  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    type: "all",
    available: "all",
  });

  const [activeTab, setActiveTab] = useState("editor");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [inventoryOpen, setInventoryOpen] = useState({});
  const [availabilityOverrides, setAvailabilityOverrides] = useState({});

  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

  // Refetch on every navigation to this page
  useEffect(() => {
    refetch();
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Store requested category from add/edit in a ref so categoryGroups effect can use it
  const pendingCategoryRef = useRef(location.state?.selectCategory || "");

  // Auto-select category passed from add/edit page — runs once on mount
  useEffect(() => {
    const cat = location.state?.selectCategory;
    if (!cat) return;
    pendingCategoryRef.current = cat;
    // Clear state so browser back doesn't re-trigger
    window.history.replaceState({}, "");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const notify = useNotify();

  const getRawErrorText = useCallback((errorObj) => {
    if (!errorObj) return "";
    if (typeof errorObj === "string") return errorObj;
    if (typeof errorObj?.data === "string") return errorObj.data;
    return (
      errorObj?.data?.message ||
      errorObj?.data?.error ||
      errorObj?.message ||
      errorObj?.error ||
      ""
    );
  }, []);

  const getFriendlyMenuError = useCallback((errorObj, context = "general") => {
    const status = errorObj?.status || errorObj?.originalStatus;
    const rawMessage = getRawErrorText(errorObj).toLowerCase();

    if (status === 401) return "Your session has expired. Please log in again";
    if (status === 403) return "You don't have permission to perform this action";
    if (status === 404) return "Menu item not found. Please refresh and try again.";
    if (status === 409) return "This menu item already exists.";
    if (status === 413) return "Image size is too large. Please upload a smaller image.";
    if (status === 429) return "Too many requests. Please wait and try again.";
    if (status >= 500) return "Server is busy right now. Please try again in a moment.";

    if (
      rawMessage.includes("network") ||
      rawMessage.includes("fetch") ||
      rawMessage.includes("timeout")
    ) {
      return "Network issue detected. Please check your connection and retry.";
    }

    if (rawMessage.includes("image")) return "Please upload a valid image file.";
    if (rawMessage.includes("category")) return "Please select a valid category.";
    if (rawMessage.includes("price")) return "Please enter a valid price.";

    if (context === "add") return "Unable to add menu item right now.";
    if (context === "update") return "Unable to update menu item right now.";
    if (context === "delete") return "Unable to delete menu item right now.";
    return "Something went wrong. Please try again.";
  }, [getRawErrorText]);

  const sortUniqueCategories = useCallback((categories = []) => {
    const getCategoryLabel = (categoryValue) => {
      if (typeof categoryValue === "string") return categoryValue.trim();
      if (typeof categoryValue === "number") return String(categoryValue).trim();
      if (!categoryValue || typeof categoryValue !== "object") return "";

      const candidate =
        categoryValue.name ||
        categoryValue.category ||
        categoryValue.categoryName ||
        categoryValue.label ||
        categoryValue.title ||
        "";

      return String(candidate).trim();
    };

    const seen = new Set();
    const ordered = [];
    categories
      .map(getCategoryLabel)
      .filter(Boolean)
      .forEach((label) => {
        const key = label.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        ordered.push(label);
      });
    return ordered;
  }, []);

  useEffect(() => {
    const incomingCategories = restaurantData?.restaurant?.categories || [];
    setRestaurantCategories(sortUniqueCategories(incomingCategories));
  }, [restaurantData, sortUniqueCategories]);

  const categoryLookup = useMemo(
    () => buildCategoryLookup(restaurantData?.restaurant?.categories || []),
    [restaurantData]
  );

  const categoryMode = useMemo(
    () => resolveCategoryMode(restaurantData?.restaurant?.categories || []),
    [restaurantData]
  );

  const normalizedItems = useMemo(() => {
    const list = Array.isArray(items) ? items : [];

    return list.map((item) => {
      const normalizedType = normalizeFoodType(
        item?.type ??
          item?.foodType ??
          item?.food_type ??
          item?.foodtype ??
          item?.foodTypeName ??
          item?.food_type_name ??
          item?.details?.type ??
          item?.details?.foodType ??
          ""
      );

      return {
        ...item,
        type: normalizedType || "veg",
        category: resolveCategoryValue(item, categoryLookup, restaurantCategories),
      };
    });
  }, [items, categoryLookup, restaurantCategories]);

  const itemsById = useMemo(() => {
    const map = new Map();
    normalizedItems.forEach((item) => {
      if (item?._id) map.set(item._id, item);
    });
    return map;
  }, [normalizedItems]);

  useEffect(() => {
    if (!normalizedItems.length) {
      setMenuOrder([]);
      return;
    }

    const currentIds = normalizedItems
      .map((item) => item?._id)
      .filter(Boolean);

    setMenuOrder((prev) => {
      if (!prev.length) return currentIds;
      const prevSet = new Set(prev);
      const cleanedPrev = prev.filter((id) => currentIds.includes(id));
      const missing = currentIds.filter((id) => !prevSet.has(id));
      if (cleanedPrev.length !== prev.length || missing.length) {
        return [...cleanedPrev, ...missing];
      }
      if (prev.length !== currentIds.length) return currentIds;
      return prev;
    });
  }, [normalizedItems]);

  useEffect(() => {
    menuOrderRef.current = menuOrder;
  }, [menuOrder]);

  const orderedItems = useMemo(() => {
    if (!menuOrder.length) return normalizedItems;
    return menuOrder.map((id) => itemsById.get(id)).filter(Boolean);
  }, [itemsById, menuOrder, normalizedItems]);

  const rawItemsById = useMemo(() => {
    const map = new Map();
    const list = Array.isArray(items) ? items : [];

    list.forEach((item) => {
      if (item?._id) {
        map.set(item._id, item);
      }
    });

    return map;
  }, [items]);

  const buildEditItem = useCallback(
    (displayItem) => {
      const rawItem = rawItemsById.get(displayItem?._id) || {};

      return {
        ...rawItem,
        ...displayItem,
        category:
          displayItem?.category ||
          rawItem?.category ||
          rawItem?.categoryName ||
          rawItem?.categoryLabel ||
          rawItem?.category_label ||
          rawItem?.menuCategory ||
          rawItem?.productCategory ||
          rawItem?.details?.category ||
          rawItem?.meta?.category ||
          "",
        type:
          displayItem?.type ||
          rawItem?.type ||
          rawItem?.foodType ||
          rawItem?.food_type ||
          rawItem?.foodtype ||
          rawItem?.foodTypeName ||
          rawItem?.food_type_name ||
          rawItem?.details?.type ||
          rawItem?.details?.foodType ||
          "veg",
      };
    },
    [rawItemsById]
  );

  const normalizeCategoryLabel = useCallback((value = "") => {
    const cleanedValue = String(value || "")
      .replace(/-+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedValue) return "";
    return cleanedValue.charAt(0).toUpperCase() + cleanedValue.slice(1);
  }, []);

  const normalizeCategoryKey = useCallback(
    (value = "") => normalizeCategoryLabel(value).toLowerCase(),
    [normalizeCategoryLabel]
  );

  const persistRestaurantCategories = useCallback(
    async (updatedCategories, successMessage) => {
      const normalizedCategories = sortUniqueCategories(updatedCategories);

      if (categoryMode?.mode === "object" && normalizedCategories.length === 0) {
        const message = "At least one category is required.";
        notify(message, "error");
        return { ok: false, message };
      }

      const fd = new FormData();
      appendCategoriesToFormData(fd, normalizedCategories, categoryMode);

      try {
        await updateRestaurantProfile(fd).unwrap();
        setRestaurantCategories(normalizedCategories);
        if (successMessage) notify(successMessage, "success");
        return { ok: true, categories: normalizedCategories };
      } catch (error) {
        const message =
          getRawErrorText(error) || "Unable to update categories right now.";
        notify(message, "error");
        return { ok: false, message };
      }
    },
    [categoryMode, getRawErrorText, notify, sortUniqueCategories, updateRestaurantProfile]
  );

  const handleAddRestaurantCategory = useCallback(
    async (rawCategoryName) => {
      const categoryName = normalizeCategoryLabel(rawCategoryName);
      if (!categoryName) {
        return { ok: false, message: "Please enter a valid category name." };
      }

      const duplicate = restaurantCategories.find(
        (cat) => normalizeCategoryKey(cat) === normalizeCategoryKey(categoryName)
      );

      if (duplicate) {
        return { ok: true, category: duplicate, duplicate: true };
      }

      const updateResult = await persistRestaurantCategories(
        [...restaurantCategories, categoryName],
        `Category "${categoryName}" added.`
      );

      if (!updateResult.ok) return updateResult;
      return { ok: true, category: categoryName };
    },
    [
      normalizeCategoryKey,
      normalizeCategoryLabel,
      persistRestaurantCategories,
      restaurantCategories,
    ]
  );

  const handleRenameRestaurantCategory = useCallback(
    async (currentCategoryName, rawUpdatedCategoryName) => {
      const currentCategory = restaurantCategories.find(
        (category) =>
          normalizeCategoryKey(category) ===
          normalizeCategoryKey(currentCategoryName)
      );

      if (!currentCategory) {
        return { ok: false, message: "Category not found." };
      }

      const updatedCategory = normalizeCategoryLabel(rawUpdatedCategoryName);
      if (!updatedCategory) {
        return { ok: false, message: "Please enter a valid category name." };
      }

      if (
        normalizeCategoryKey(currentCategory) ===
        normalizeCategoryKey(updatedCategory)
      ) {
        return { ok: true, category: currentCategory, unchanged: true };
      }

      const duplicate = restaurantCategories.find(
        (category) =>
          normalizeCategoryKey(category) ===
          normalizeCategoryKey(updatedCategory)
      );

      if (duplicate) {
        return {
          ok: false,
          message: `Category "${updatedCategory}" already exists.`,
        };
      }

      const updatedCategories = restaurantCategories.map((category) =>
        category === currentCategory ? updatedCategory : category
      );

      const updateResult = await persistRestaurantCategories(
        updatedCategories,
        `Category "${currentCategory}" renamed to "${updatedCategory}".`
      );

      if (!updateResult.ok) return updateResult;
      return { ok: true, oldCategory: currentCategory, category: updatedCategory };
    },
    [
      normalizeCategoryKey,
      normalizeCategoryLabel,
      persistRestaurantCategories,
      restaurantCategories,
    ]
  );

  const handleDeleteRestaurantCategory = useCallback(
    async (categoryNameToDelete) => {
      const targetCategory = restaurantCategories.find(
        (category) =>
          normalizeCategoryKey(category) ===
          normalizeCategoryKey(categoryNameToDelete)
      );

      if (!targetCategory) {
        return { ok: false, message: "Category not found." };
      }

      if (!isAdmin) {
        return { ok: false, message: "Only admins can delete categories." };
      }

      const targetKey = normalizeCategoryKey(targetCategory);
      const itemsToDelete = normalizedItems.filter(
        (item) => normalizeCategoryKey(item?.category) === targetKey
      );

      let deletedItemsCount = 0;
      if (itemsToDelete.length) {
        try {
          await Promise.all(
            itemsToDelete.map((item) => deleteMenuItem(item._id).unwrap())
          );
          deletedItemsCount = itemsToDelete.length;
        } catch (error) {
          const message = getFriendlyMenuError(error, "delete");
          notify(message, "error");
          return { ok: false, message };
        }
      }

      const updatedCategories = restaurantCategories.filter(
        (category) => category !== targetCategory
      );

      const updateResult = await persistRestaurantCategories(
        updatedCategories,
        deletedItemsCount
          ? `Category "${targetCategory}" deleted with ${deletedItemsCount} items.`
          : `Category "${targetCategory}" deleted.`
      );

      if (!updateResult.ok) return updateResult;
      if (deletedItemsCount > 0) {
        refetch();
      }
      return { ok: true, deletedCategory: targetCategory };
    },
    [
      deleteMenuItem,
      getFriendlyMenuError,
      isAdmin,
      normalizeCategoryKey,
      normalizedItems,
      notify,
      persistRestaurantCategories,
      refetch,
      restaurantCategories,
    ]
  );

  const [categoryDragging, setCategoryDragging] = useState(null);
  const [categoryDragOver, setCategoryDragOver] = useState(null);
  const [isCategoryReordering, setIsCategoryReordering] = useState(false);
  const categoryPointerRef = useRef({ pointerId: null });
  const categoryStartRef = useRef([]);
  const categoryReorderTimerRef = useRef(null);
  const categoryReorderPendingRef = useRef([]);

  useEffect(() => {
    return () => {
      if (menuReorderTimerRef.current) {
        clearTimeout(menuReorderTimerRef.current);
      }
      if (categoryReorderTimerRef.current) {
        clearTimeout(categoryReorderTimerRef.current);
      }
    };
  }, []);

  const moveCategory = useCallback(
    (list, fromCategory, toCategory) => {
      const fromKey = normalizeCategoryKey(fromCategory);
      const toKey = normalizeCategoryKey(toCategory);
      const fromIndex = list.findIndex(
        (cat) => normalizeCategoryKey(cat) === fromKey
      );
      const toIndex = list.findIndex(
        (cat) => normalizeCategoryKey(cat) === toKey
      );
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return list;
      }
      const updated = [...list];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    },
    [normalizeCategoryKey]
  );

  const handleCategoryPointerDown = useCallback(
    (event, category) => {
      if (!isAdmin || isCategoryReordering) return;
      event.preventDefault();
      event.stopPropagation();
      categoryPointerRef.current.pointerId = event.pointerId;
      categoryStartRef.current = restaurantCategories;
      setCategoryDragging(category);
      setCategoryDragOver(category);
      if (typeof event.currentTarget?.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [isAdmin, isCategoryReordering, restaurantCategories]
  );

  useEffect(() => {
    if (!categoryDragging) return;

    const handlePointerMove = (event) => {
      if (categoryPointerRef.current.pointerId !== event.pointerId) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const chip = target?.closest?.("[data-category-chip]");
      const overCategory = chip?.getAttribute?.("data-category-chip");
      if (!overCategory || overCategory === categoryDragging) return;
      setCategoryDragOver(overCategory);
      setRestaurantCategories((prev) =>
        moveCategory(prev, categoryDragging, overCategory)
      );
    };

    const handlePointerEnd = async (event) => {
      if (categoryPointerRef.current.pointerId !== event.pointerId) return;
      categoryPointerRef.current.pointerId = null;
      setCategoryDragging(null);
      setCategoryDragOver(null);

      if (!restaurantCategories.length) return;
      categoryReorderPendingRef.current = restaurantCategories;
      if (categoryReorderTimerRef.current) {
        clearTimeout(categoryReorderTimerRef.current);
      }
      categoryReorderTimerRef.current = setTimeout(async () => {
        const orderToSave = categoryReorderPendingRef.current;
        setIsCategoryReordering(true);
        try {
          const result = await reorderCategories(orderToSave).unwrap();
          const nextCategories = Array.isArray(result?.categories)
            ? result.categories.map((cat) => cat?.name).filter(Boolean)
            : orderToSave;
          if (nextCategories.length) {
            setRestaurantCategories(nextCategories);
          }
          notify("Category order updated.", "success");
        } catch (error) {
          notify(getFriendlyMenuError(error, "update"), "error");
          if (categoryStartRef.current?.length) {
            setRestaurantCategories(categoryStartRef.current);
          }
        } finally {
          setIsCategoryReordering(false);
          categoryReorderTimerRef.current = null;
        }
      }, 1000);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [
    categoryDragging,
    moveCategory,
    getFriendlyMenuError,
    notify,
    reorderCategories,
    restaurantCategories,
  ]);

  const getItemAvailability = useCallback(
    (item) => {
      if (!item?._id) return !!item?.available;
      if (Object.prototype.hasOwnProperty.call(availabilityOverrides, item._id)) {
        return availabilityOverrides[item._id];
      }
      return !!item?.available;
    },
    [availabilityOverrides]
  );

  const filteredItems = useMemo(() => {
    const searchLower = filters.search.toLowerCase();
    const categorySearchKeys = new Set();

    if (searchLower) {
      restaurantCategories.forEach((category) => {
        const label = String(category || "").toLowerCase();
        if (label.includes(searchLower)) {
          categorySearchKeys.add(normalizeCategoryKey(category));
        }
      });
    }

    return orderedItems.filter((item) => {
      const isAvailable = getItemAvailability(item);
      const categoryKey = normalizeCategoryKey(item?.category || "");
      const matchesSearch =
        !searchLower ||
        item?.name?.toLowerCase().includes(searchLower) ||
        item?.category?.toLowerCase().includes(searchLower) ||
        categorySearchKeys.has(categoryKey);
      return (
        matchesSearch &&
        (filters.category === "all" ||
          item.category?.toLowerCase() === filters.category.toLowerCase()) &&
        (filters.type === "all" || item.type === filters.type) &&
        (filters.available === "all" ||
          String(!!isAvailable) === filters.available)
      );
    });
  }, [
    orderedItems,
    filters,
    getItemAvailability,
    restaurantCategories,
    normalizeCategoryKey,
  ]);

  const categoryGroups = useMemo(() => {
    const map = new Map();
    const searchLower = filters.search.toLowerCase();

    filteredItems.forEach((item) => {
      const rawLabel = item?.category || "Uncategorized";
      const label = String(rawLabel || "").trim() || "Uncategorized";
      const key = normalizeCategoryKey(label);
      if (!map.has(key)) {
        map.set(key, { label, items: [] });
      }
      map.get(key).items.push(item);
    });

    const ordered = [];
    const seen = new Set();

    restaurantCategories.forEach((category) => {
      const label = String(category || "").trim();
      if (!label) return;
      const key = normalizeCategoryKey(label);
      const group = map.get(key);
      const items = group?.items || [];
      const matchesSearch = !searchLower || label.toLowerCase().includes(searchLower);
      if (!items.length && searchLower && !matchesSearch) return;
      ordered.push({ label, items });
      seen.add(key);
    });

    map.forEach((value, key) => {
      if (!seen.has(key)) ordered.push(value);
    });

    if (!ordered.length && map.size) {
      return Array.from(map.values());
    }

    return ordered;
  }, [filteredItems, normalizeCategoryKey, restaurantCategories]);

  useEffect(() => {
    if (!categoryGroups.length) {
      if (selectedCategory) setSelectedCategory("");
      return;
    }

    // If we have a pending category from add/edit, try to select it first
    if (pendingCategoryRef.current) {
      const pending = pendingCategoryRef.current;
      const match = categoryGroups.find(
        (g) => normalizeCategoryKey(g.label) === normalizeCategoryKey(pending)
      );
      if (match) {
        pendingCategoryRef.current = "";
        setSelectedCategory(match.label);
        return;
      }
    }

    const selectedKey = normalizeCategoryKey(selectedCategory);
    const exists = categoryGroups.some(
      (category) => normalizeCategoryKey(category.label) === selectedKey
    );
    if (!exists) {
      setSelectedCategory(categoryGroups[0].label);
    }
  }, [categoryGroups, normalizeCategoryKey, selectedCategory]);

  useEffect(() => {
    if (filters.category === "all") return;
    const matched = categoryGroups.find(
      (category) =>
        normalizeCategoryKey(category.label) ===
        normalizeCategoryKey(filters.category)
    );
    if (matched && matched.label !== selectedCategory) {
      setSelectedCategory(matched.label);
    }
  }, [categoryGroups, filters.category, normalizeCategoryKey, selectedCategory]);

  useEffect(() => {
    if (!categoryGroups.length) return;
    setInventoryOpen((prev) => {
      const hasOpen = Object.values(prev).some(Boolean);
      if (hasOpen) return prev;
      const firstKey = normalizeCategoryKey(categoryGroups[0].label);
      return { ...prev, [firstKey]: true };
    });
  }, [categoryGroups, normalizeCategoryKey]);

  const menuEditorItems = useMemo(() => {
    if (!selectedCategory) return filteredItems;
    const selectedKey = normalizeCategoryKey(selectedCategory);
    return filteredItems.filter(
      (item) =>
        normalizeCategoryKey(item?.category || "Uncategorized") === selectedKey
    );
  }, [filteredItems, normalizeCategoryKey, selectedCategory]);

  const getCategoryStockState = useCallback(
    (items = []) => {
      if (!items.length) return "out";
      const availableCount = items.reduce(
        (count, item) => count + (getItemAvailability(item) ? 1 : 0),
        0
      );
      if (availableCount === 0) return "out";
      if (availableCount === items.length) return "in";
      return "mixed";
    },
    [getItemAvailability]
  );

  const toggleInventoryCategory = useCallback((categoryKey) => {
    setInventoryOpen((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  }, []);

  const moveMenuItem = useCallback((list, fromId, toId) => {
    if (fromId === toId) return list;
    const fromIndex = list.indexOf(fromId);
    const toIndex = list.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) return list;
    const updated = [...list];
    updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, fromId);
    return updated;
  }, []);

  const handleDragStart = useCallback(
    (event, itemId) => {
      if (!isAdmin || isReordering) return;
      if (event.pointerType && event.pointerType !== "mouse") return;
      event.stopPropagation();
      dragStartOrderRef.current = menuOrderRef.current;
      setDraggingId(itemId);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", itemId);
    },
    [isAdmin, isReordering]
  );

  const handleDragOver = useCallback(
    (event, overId) => {
      if (!draggingId || draggingId === overId) return;
      event.preventDefault();
      setDragOverId(overId);
      setMenuOrder((prev) => moveMenuItem(prev, draggingId, overId));
    },
    [draggingId, moveMenuItem]
  );

  const handlePointerDragStart = useCallback(
    (event, itemId) => {
      if (!isAdmin || isReordering) return;
      if (event.pointerType === "mouse") return;
      event.preventDefault();
      event.stopPropagation();
      pointerDragRef.current.pointerId = event.pointerId;
      dragStartOrderRef.current = menuOrderRef.current;
      setDraggingId(itemId);
      setDragOverId(itemId);
      setIsPointerDragging(true);
      if (typeof event.currentTarget?.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [isAdmin, isReordering]
  );

  const scheduleMenuReorder = useCallback(
    (finalOrder) => {
      if (!finalOrder?.length) return;
      menuReorderPendingRef.current = finalOrder;
      if (menuReorderTimerRef.current) {
        clearTimeout(menuReorderTimerRef.current);
      }
      menuReorderTimerRef.current = setTimeout(async () => {
        const orderToSave = menuReorderPendingRef.current;
        setIsReordering(true);
        try {
          await reorderMenuItems(orderToSave).unwrap();
          notify("Menu order updated.", "success");
          refetch();
        } catch (error) {
          notify(getFriendlyMenuError(error, "update"), "error");
          if (dragStartOrderRef.current?.length) {
            setMenuOrder(dragStartOrderRef.current);
          }
        } finally {
          setIsReordering(false);
          menuReorderTimerRef.current = null;
        }
      }, 1000);
    },
    [getFriendlyMenuError, notify, reorderMenuItems, refetch]
  );

  const finalizeReorder = useCallback(() => {
    if (!draggingId) return;
    setDraggingId(null);
    setDragOverId(null);
    setIsPointerDragging(false);
    const finalOrder = menuOrderRef.current;
    scheduleMenuReorder(finalOrder);
  }, [draggingId, scheduleMenuReorder]);

  useEffect(() => {
    if (!isPointerDragging) return;

    const handlePointerMove = (event) => {
      if (pointerDragRef.current.pointerId !== event.pointerId) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const card = target?.closest?.("[data-menu-id]");
      const overId = card?.getAttribute?.("data-menu-id");
      if (!overId || overId === draggingId) return;
      setDragOverId(overId);
      setMenuOrder((prev) => moveMenuItem(prev, draggingId, overId));
    };

    const handlePointerEnd = (event) => {
      if (pointerDragRef.current.pointerId !== event.pointerId) return;
      pointerDragRef.current.pointerId = null;
      setIsPointerDragging(false);
      finalizeReorder();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [draggingId, finalizeReorder, isPointerDragging, moveMenuItem]);

// ✅ Fully fixed prepareFormData with robust discount handling
const prepareFormData = (formData, file) => {
  const fd = new FormData();

  fd.append("name", formData.name || "");
  fd.append("description", formData.description || "");
  fd.append("pricingType", formData.pricingType || "single");
  fd.append("type", formData.type || "veg");
  fd.append("category", formData.category || "");
  fd.append("available", formData.available ? "true" : "false");

  // Helper: sanitize discount - preserve actual value and active state
  const sanitizeDiscount = (discount) => {
    // console.log("🔥 sanitizeDiscount input:", discount);
    
    if (!discount) return { type: "flat", value: 0, active: false };
    
    // Parse the value as integer
    const rawValue = discount.value;
    let val = 0;
    if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
      val = parseInt(rawValue.toString().trim(), 10);
      if (isNaN(val)) val = 0;
    }
    
    // Check active - handle both boolean and string representations
    const isActive = discount.active === true || discount.active === "true";
    
    const result = {
      type: discount.type || "flat",
      value: val,
      active: isActive,
    };
    
    // console.log("🔥 sanitizeDiscount result:", result);
    return result;
  };

  // SINGLE PRICING
  if (formData.pricingType === "single") {
    fd.append("price", (formData.price ?? "0").toString());

    const discount = sanitizeDiscount(formData.discount);
    fd.append("discount[type]", discount.type);
    fd.append("discount[value]", discount.value.toString());
    fd.append("discount[active]", discount.active.toString());

    // console.log("[prepareFormData] single discount ->", discount);
  }

  // VARIANT PRICING
  if (formData.pricingType === "variant") {
    Object.entries(formData.variantRates || {}).forEach(([key, val]) => {
      if (val?.price !== undefined) {
        fd.append(`variantRates[${key}][price]`, val.price.toString());

        const discount = sanitizeDiscount(val.discount);
        fd.append(`variantRates[${key}][discount][type]`, discount.type);
        fd.append(`variantRates[${key}][discount][value]`, discount.value.toString());
        fd.append(`variantRates[${key}][discount][active]`, discount.active.toString());

        // console.log(`[prepareFormData] variant ${key} discount ->`, discount);
      }
    });
  }

  // COMBO PRICING
  if (formData.pricingType === "combo") {
    fd.append("comboPrice", (formData.comboPrice ?? "0").toString());
    
    const discount = sanitizeDiscount(formData.discount);
    fd.append("discount[type]", discount.type);
    fd.append("discount[value]", discount.value.toString());
    fd.append("discount[active]", discount.active.toString());
    
    (formData.comboItems || []).forEach((item, index) => {
      fd.append(`comboItems[${index}][menuItemId]`, item.menuItemId);
      fd.append(`comboItems[${index}][variant]`, item.variant || "");
      fd.append(`comboItems[${index}][quantity]`, (item.quantity ?? 1).toString());
    });
  }

  // FILE
  if (file) fd.append("file", file);

  return fd;
};


  const handleAddItem = async (formData, file) => {
    try {
      const fd = prepareFormData(formData, file);
      await createMenuItem(fd).unwrap();
      notify("Menu item added successfully.", "success");
      setIsAddModalOpen(false);
      refetch();
    } catch (error) {
      notify(getFriendlyMenuError(error, "add"), "error");
    }
  };

  const handleUpdateItem = async (formData, file) => {
    try {
      const fd = prepareFormData(formData, file);
      await updateMenuItem({ itemId: formData._id, updatedData: fd }).unwrap();
      notify("Menu item updated successfully.", "success");
      setEditingItem(null);
      refetch();
    } catch (error) {
      notify(getFriendlyMenuError(error, "update"), "error");
    }
  };

  const handleDeleteItem = async () => {
    try {
      await deleteMenuItem(deleteConfirm.id).unwrap();
      notify("Menu item deleted successfully.", "success");
      setDeleteConfirm(null);
      refetch();
    } catch (error) {
      notify(getFriendlyMenuError(error, "delete"), "error");
    }
  };

  const handleFilterResetNotification = useCallback(() => {
    notify("Filters reset successfully.", "success");
  }, [notify]);

  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const handleToggleItemAvailability = useCallback(
    async (item) => {
      if (!isAdmin || !item?._id) return;
      const nextValue = !getItemAvailability(item);
      setAvailabilityOverrides((prev) => ({
        ...prev,
        [item._id]: nextValue,
      }));

      try {
        await updateMenuItem({
          itemId: item._id,
          updatedData: { available: nextValue },
        }).unwrap();
        notify(
          `"${item?.name || "Item"}" marked ${
            nextValue ? "in stock" : "out of stock"
          }.`,
          "success"
        );
      } catch (error) {
        notify(getFriendlyMenuError(error, "update"), "error");
        setAvailabilityOverrides((prev) => {
          const copy = { ...prev };
          delete copy[item._id];
          return copy;
        });
      }
    },
    [getFriendlyMenuError, getItemAvailability, isAdmin, notify, updateMenuItem]
  );

  const handleToggleCategoryAvailability = useCallback(
    async (categoryLabel, items = []) => {
      if (!isAdmin || !items.length) return;
      const currentState = getCategoryStockState(items);
      const nextValue = currentState !== "in";

      setAvailabilityOverrides((prev) => {
        const copy = { ...prev };
        items.forEach((item) => {
          if (item?._id) copy[item._id] = nextValue;
        });
        return copy;
      });

      try {
        await Promise.all(
          items.map((item) =>
            updateMenuItem({
              itemId: item._id,
              updatedData: { available: nextValue },
            }).unwrap()
          )
        );
        notify(
          `"${categoryLabel}" marked ${
            nextValue ? "in stock" : "out of stock"
          }.`,
          "success"
        );
      } catch (error) {
        notify(getFriendlyMenuError(error, "update"), "error");
        setAvailabilityOverrides((prev) => {
          const copy = { ...prev };
          items.forEach((item) => {
            if (item?._id) delete copy[item._id];
          });
          return copy;
        });
      }
    },
    [getCategoryStockState, getFriendlyMenuError, isAdmin, notify, updateMenuItem]
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#f7f3ef] px-2 py-3 dark:bg-[#0f172a] sm:px-4 sm:py-4 md:px-6">
      <MenuItemViewModal
        item={viewingItem}
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
        menu={normalizedItems}
      />

      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        itemName={deleteConfirm?.name}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteItem}
      />

      {/* ── Normal menu content ── */}
      <div className="contents">

      <div className="flex w-full flex-1 min-h-0 flex-col pb-6 px-4">
        <div className="menu-no-anim mb-4 rounded-xl border border-[#ede8e3] bg-white p-4 dark:border-slate-700/60 dark:bg-[#1e293b]">
          <div className="flex items-center justify-between gap-3">
            <div data-tour="menu-heading" className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-[#1c1917] dark:text-slate-100">
                Menu Management
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="relative hidden w-full flex-1 min-w-0 sm:block sm:min-w-[240px] sm:max-w-[420px]">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
                <input
                  type="search"
                  value={filters.search}
                  onChange={handleSearchChange}
                  placeholder="Search items or categories..."
                  className="h-10 w-full rounded-lg border border-[#ede8e3] bg-white px-4 pl-10 text-xs text-[#1c1917] outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-orange-400 dark:focus:ring-orange-500/30"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#ede8e3] bg-white text-[#78716c] transition hover:bg-[#f7f3ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:hidden"
                aria-label="Toggle search"
              >
                <Search size={18} />
              </button>
              <Button
                data-tour="menu-filters-btn"
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-none sm:px-4 ${
                  isFilterOpen
                    ? "border-orange-600 bg-orange-600 text-white hover:bg-orange-700"
                    : "border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Filters</span>
              </Button>
            </div>
          </div>
          {isMobileSearchOpen && (
            <div className="mt-3 sm:hidden">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
                <input
                  type="search"
                  value={filters.search}
                  onChange={handleSearchChange}
                  placeholder="Search items or categories..."
                  className="h-10 w-full rounded-lg border border-[#ede8e3] bg-white px-4 pl-10 text-sm text-[#1c1917] outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-orange-400 dark:focus:ring-orange-500/30"
                />
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 border-b border-[#ede8e3] pb-1 dark:border-slate-700/60">
            <TabButton
              active={activeTab === "editor"}
              onClick={() => setActiveTab("editor")}
            >
              Menu editor
            </TabButton>
            <TabButton
              active={activeTab === "inventory"}
              onClick={() => setActiveTab("inventory")}
            >
              Manage inventory
            </TabButton>
          </div>

          {isFilterOpen && (
            <div className="mt-3 border-t border-[#ede8e3] pt-3 dark:border-slate-700/60">
              <MenuFilter
                value={filters}
                onFilterChange={(v) =>
                  setFilters((prev) => ({ ...prev, ...v }))
                }
                categories={restaurantCategories}
                onResetNotify={handleFilterResetNotification}
                layout="panel"
                showSearch={false}
              />
            </div>
          )}
        </div>

        {isAdmin && isCategoryManagerOpen && restaurantCategories.length > 1 && (
          <div className="menu-no-anim mb-5 overflow-hidden rounded-xl border border-[#ede8e3] bg-white p-4 dark:border-slate-700/60 dark:bg-[#1e293b] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-[#1c1917] dark:text-slate-100">
                    Manage Categories
                  </h3>
                  <span className="rounded-md border border-[#ede8e3] bg-[#f7f3ef] px-2 py-0.5 text-xs font-semibold text-[#78716c] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {restaurantCategories.length}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#ede8e3] bg-white text-[#78716c] transition hover:bg-[#f7f3ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                aria-label="Close category manager"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {isCategoryManagerOpen && (
              <div className="mt-3 grid grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 sm:pr-0 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {restaurantCategories.map((category) => {
                  const isActive = categoryDragOver === category;
                  return (
                    <div
                      key={category}
                      data-category-chip={category}
                      className={`group relative w-full max-w-none overflow-hidden rounded-lg border px-2 py-1.5 transition ${
                        isActive
                          ? "border-orange-400 bg-orange-50"
                          : "border-[#ede8e3] bg-white hover:border-orange-300 hover:bg-[#f7f3ef]"
                      } dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600`}
                    >
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700" />
                      <div className="absolute -right-6 -top-6 h-12 w-12 rounded-full bg-orange-100/60 blur-2xl dark:bg-orange-500/20" />

                      <div className="flex items-center gap-2 pl-2.5 pr-2 sm:justify-between">
                        <button
                          type="button"
                          data-tour="menu-drag-category"
                          onPointerDown={(event) => handleCategoryPointerDown(event, category)}
                          className="order-1 inline-flex shrink-0 touch-none select-none items-center gap-1 rounded-md border border-[#ede8e3] bg-[#f7f3ef] px-1.5 py-1 text-[#78716c] transition hover:bg-[#ede8e3] active:cursor-grabbing dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 sm:order-2 sm:ml-auto"
                          aria-label={`Drag ${category} to reorder`}
                          title="Hold and drag to reorder"
                        >
                          <GripVertical size={13} />
                          <span className="text-[10px] font-semibold leading-none">drag</span>
                        </button>
                        <div className="order-2 min-w-0 flex-1 pr-3 sm:order-1">
                          <div className="truncate text-[13px] font-semibold text-gray-900 dark:text-slate-100">
                            {category}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 min-h-0 flex-col">
          {activeTab === "editor" ? (
            <div className="grid h-full min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4 lg:grid-cols-[280px_1fr] lg:grid-rows-1">
              <div data-tour="menu-categories" className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#ede8e3] bg-white dark:border-slate-700/60 dark:bg-[#1e293b]">
              <div className="flex items-center justify-between border-b border-[#ede8e3] px-4 py-3 dark:border-slate-700/60">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#a8a29e] dark:text-slate-400">
                    Categories ({categoryGroups.length})
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    data-tour="menu-manage-btn"
                    onClick={() => setIsCategoryManagerOpen((prev) => !prev)}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-300"
                  >
                    {isCategoryManagerOpen ? "Close" : "Manage"}
                  </button>
                )}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {isLoading && categoryGroups.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-[#a8a29e] dark:text-slate-400">
                    Loading categories...
                  </div>
                ) : (
                  <>
                    {categoryGroups.map((category) => {
                      const categoryKey = normalizeCategoryKey(category.label);
                      const isActive =
                        normalizeCategoryKey(selectedCategory) === categoryKey;
                      return (
                        <button
                          key={categoryKey}
                          type="button"
                          onClick={() => setSelectedCategory(category.label)}
                          className={`group flex w-full min-w-0 items-center justify-between gap-2 overflow-hidden border-l-4 px-4 py-2.5 text-left text-sm font-semibold transition ${
                            isActive
                              ? "border-orange-500 bg-[#fff7ed] text-orange-600"
                              : "border-transparent text-[#44403c] hover:bg-[#f7f3ef] dark:text-slate-200 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate max-w-[160px] sm:max-w-none">{category.label}</span>
                          <span className="shrink-0 rounded-md border border-[#ede8e3] bg-[#f7f3ef] px-2 py-0.5 text-xs font-semibold text-[#78716c] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {category.items.length}
                          </span>
                        </button>
                      );
                    })}
                    {categoryGroups.length === 0 && (
                      <div className="px-4 py-6 text-sm text-[#a8a29e] dark:text-slate-400">
                        No categories found yet.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

              <div className="flex min-h-0 flex-col rounded-xl border border-[#ede8e3] bg-white dark:border-slate-700/60 dark:bg-[#1e293b]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ede8e3] px-4 py-3 dark:border-slate-700/60">
                  <div>
                    <p className="text-base font-semibold text-[#1c1917] dark:text-slate-100">
                      {selectedCategory || "All items"}
                      <span className="ml-2 text-sm font-medium text-[#a8a29e] dark:text-slate-400">
                        ({menuEditorItems.length})
                      </span>
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate("/admin/menu/add")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500 bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 hover:border-orange-600"
                        data-tour="menu-add-item-btn"
                      >
                        <CirclePlus size={14} />
                        Add New Item
                      </button>
                    </div>
                  )}
                </div>

                <div data-tour="menu-item-list" className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#f0ebe5] pr-1 dark:divide-slate-700/60">
                  {isLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-[#a8a29e] dark:text-slate-400">
                      Loading menu items...
                    </div>
                  ) : (
                    <>
                      {menuEditorItems.map((item) => {
                        const isAvailable = getItemAvailability(item);
                        const priceLabel = getItemPriceLabel(item);
                        const variantDetails = getVariantPriceDetails(item);
                        const singleDetails = getSinglePriceDetails(item);
                        const comboPrice = item?.comboPrice ?? item?.price;
                        const displayPrice = (() => {
                          if (item?.pricingType === "variant" && variantDetails.length) {
                            const minPrice = Math.min(
                              ...variantDetails.map((variant) => variant.current)
                            );
                            return `${formatCurrency(minPrice)}+`;
                          }
                          if (item?.pricingType === "single" && singleDetails?.current != null) {
                            return formatCurrency(singleDetails.current);
                          }
                          if (item?.pricingType === "combo" && comboPrice != null) {
                            return formatCurrency(comboPrice);
                          }
                          return priceLabel;
                        })();
                        const canReorder =
                          isAdmin && !isReordering && menuEditorItems.length > 1;
                        const dragHandleProps = canReorder
                          ? {
                              draggable: true,
                              onDragStart: (event) =>
                                handleDragStart(event, item._id),
                              onDragEnd: finalizeReorder,
                              onPointerDown: (event) =>
                                handlePointerDragStart(event, item._id),
                              onMouseDown: (event) => event.stopPropagation(),
                            }
                          : null;

                        return (
                          <div
                            key={item._id}
                            data-menu-id={item._id}
                            onClick={() => setViewingItem(item)}
                            onDragOver={(event) => handleDragOver(event, item._id)}
                            onDrop={(event) => event.preventDefault()}
                            onDragLeave={() => setDragOverId(null)}
                            className={`group relative flex min-w-0 flex-col gap-3 overflow-hidden px-4 py-3 pr-12 transition sm:flex-row sm:items-center sm:pr-4 ${
                              dragOverId === item._id
                                ? "bg-[#f7f3ef]"
                                : "hover:bg-[#faf7f4] dark:hover:bg-slate-800/60"
                            } cursor-pointer`}
                          >
                            {dragHandleProps && (
                              <button
                                type="button"
                                data-tour="menu-drag-item"
                                {...dragHandleProps}
                                onClick={(event) => event.stopPropagation()}
                                className="inline-flex h-7 w-7 self-start items-center justify-center rounded-md border border-[#ede8e3] bg-white text-[#78716c] transition hover:bg-[#f7f3ef] active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:self-auto"
                                aria-label="Drag to reorder"
                                title="Drag to reorder"
                              >
                                <GripVertical size={14} />
                              </button>
                            )}

                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-800 sm:h-12 sm:w-12">
                              <img
                                src={
                                  item?.image?.url ||
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='11' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E"
                                }
                                alt={item?.name || "Menu item"}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <FoodTypeIndicator type={item?.type} />
                                <span className="truncate text-sm font-semibold text-[#1c1917] dark:text-slate-100 max-w-[140px] sm:max-w-none">
                                  {item?.name || "Unnamed Item"}
                                </span>
                              </div>
                              <p className="text-xs text-[#a8a29e] dark:text-slate-400">
                                {item?.pricingType === "variant"
                                  ? "Variant"
                                  : item?.pricingType === "combo"
                                  ? "Combo"
                                  : "Single"}
                                {item?.category ? ` • ${item.category}` : ""}
                              </p>
                            </div>

                            <div className="flex w-full flex-col items-start gap-1 sm:w-auto sm:items-end">
                              <div className="flex flex-wrap items-center gap-2">
                                <AvailabilityBadge available={isAvailable} />
                              </div>
                              {item?.pricingType === "variant" && variantDetails.length ? (
                                <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#a8a29e] dark:text-slate-400">
                                  {variantDetails.map((variant, index) => (
                                    <span key={variant.key} className="inline-flex items-center gap-1">
                                      <span>
                                        {variant.label} {formatCurrency(variant.current)}
                                      </span>
                                      {variant.hasDiscount && variant.original != null && (
                                        <span className="text-[10px] text-gray-400 line-through">
                                          {formatCurrency(variant.original)}
                                        </span>
                                      )}
                                      {index < variantDetails.length - 1 && (
                                        <span className="px-1 text-gray-300">|</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#a8a29e] dark:text-slate-400">
                                  {item?.pricingType === "combo" && comboPrice != null ? (
                                    <>Combo {formatCurrency(comboPrice)}</>
                                  ) : item?.pricingType === "single" && singleDetails?.current != null ? (
                                    <>
                                      Single {formatCurrency(singleDetails.current)}
                                      {singleDetails.hasDiscount && singleDetails.original != null && (
                                        <span className="ml-1 text-[10px] text-gray-400 line-through">
                                          {formatCurrency(singleDetails.original)}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    ""
                                  )}
                                </span>
                              )}
                            </div>

                            {isAdmin && (
                              <div
                                className="absolute right-4 top-3 flex items-center gap-1 sm:static sm:ml-auto"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => navigate(`/admin/menu/edit/${item._id}`)}
                                  className="rounded-lg p-1.5 text-[#78716c] transition-colors hover:bg-[#f7f3ef] hover:text-[#1c1917] dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                                  aria-label="Edit menu item"
                                >
                                  <Edit size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteConfirm({
                                      id: item._id,
                                      name: item.name,
                                    })
                                  }
                                  className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-slate-700"
                                  aria-label="Delete menu item"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {menuEditorItems.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-[#a8a29e] dark:text-slate-400">
                          No menu items found for this category.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#ede8e3] bg-white dark:border-slate-700/60 dark:bg-[#1e293b]">
              <div className="border-b border-[#ede8e3] px-4 py-3 dark:border-slate-700/60">
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  Inventory
                </p>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#f0ebe5] pr-1 dark:divide-slate-700/60">
                {isLoading ? (
                  <div className="px-4 py-6 text-center text-sm text-[#a8a29e] dark:text-slate-400">
                    Loading inventory...
                  </div>
                ) : (
                  <>
                    {categoryGroups.map((category) => {
                      const categoryKey = normalizeCategoryKey(category.label);
                      const isOpen = !!inventoryOpen[categoryKey];
                      const stockState = getCategoryStockState(category.items);

                      return (
                        <div key={categoryKey} className="bg-white/95 dark:bg-slate-900/60">
                          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toggleInventoryCategory(categoryKey)}
                              className="flex items-center gap-2 text-left"
                            >
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ede8e3] bg-white text-[#78716c] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {isOpen ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                {category.label}
                              </span>
                              <span className="text-xs text-[#a8a29e] dark:text-slate-400">
                                ({category.items.length})
                              </span>
                            </button>

                            <StockToggle
                              status={
                                stockState === "mixed"
                                  ? "mixed"
                                  : stockState === "in"
                                  ? "in"
                                  : "out"
                              }
                              onToggle={() =>
                                handleToggleCategoryAvailability(
                                  category.label,
                                  category.items
                                )
                              }
                              disabled={!isAdmin || category.items.length === 0}
                            />
                          </div>

                          {isOpen && (
                            <div className="border-t border-[#ede8e3] bg-[#f7f3ef] dark:border-slate-700/60 dark:bg-slate-800/40">
                              {category.items.length === 0 ? (
                                <div className="px-11 py-3 text-sm text-[#a8a29e] dark:text-slate-400">
                                  No items inside this category yet.
                                </div>
                              ) : (
                                category.items.map((item) => {
                                  const isAvailable = getItemAvailability(item);
                                  const priceLabel = getItemPriceLabel(item);
                                  return (
                                    <div
                                      key={item._id}
                                      className="flex flex-wrap items-center justify-between gap-3 px-11 py-2"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <FoodTypeIndicator type={item?.type} />
                                          <span className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                                            {item?.name || "Unnamed Item"}
                                          </span>
                                        </div>
                                        <p className="text-xs text-[#a8a29e] dark:text-slate-400">
                                        {priceLabel || "—"} • {item?.pricingType === "variant"
                                          ? "Variant"
                                          : item?.pricingType === "combo"
                                          ? "Combo"
                                          : "Single"}
                                        </p>
                                      </div>

                                      <StockToggle
                                        status={isAvailable ? "in" : "out"}
                                        onToggle={() =>
                                          handleToggleItemAvailability(item)
                                        }
                                        disabled={!isAdmin}
                                      />
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {categoryGroups.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-[#a8a29e] dark:text-slate-400">
                        No categories found for inventory yet.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div> {/* end: normal menu content wrapper */}
    </div>
  );

};

export default Menu;
