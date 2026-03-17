import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CirclePlus, GripVertical, X } from "lucide-react";
import Heading from "../common/Heading";
import MenuFilter from "./ComponentsMenu/MenuFilter";
import MenuItemCard from "./ComponentsMenu/MenuItemCard";
import MenuItemViewModal from "./ComponentsMenu/MenuItemViewModal";
import AddItemModal from "./ComponentsMenu/AddItemModal";
import EditItemModal from "./ComponentsMenu/EditItemModal";
import DeleteConfirmModal from "./ComponentsMenu/DeleteConfirmModal";
import { useNotify } from "../common/NotificationModal";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { getCompactPageNumbers } from "@/lib/pagination";

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

  if (
    normalized === "veg" ||
    normalized === "vegetarian" ||
    normalized === "vegitarian"
  ) {
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

const Menu = () => {
  const { data: items = [], isLoading, refetch } = useGetMenuQuery();
  const { data: restaurantData } = useGetRestaurantProfileQuery();
  
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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

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

    if (status === 401) return "Your session has expired. Please login again.";
    if (status === 403) return "You do not have permission for this action.";
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

  useEffect(() => setCurrentPage(1), [filters]);

  const filteredItems = useMemo(() => {
    const searchLower = filters.search.toLowerCase();
    return orderedItems.filter((item) => {
      return (
        (!searchLower ||
          item?.name?.toLowerCase().includes(searchLower) ||
          item?.category?.toLowerCase().includes(searchLower)) &&
        (filters.category === "all" ||
          item.category?.toLowerCase() === filters.category.toLowerCase()) &&
        (filters.type === "all" || item.type === filters.type) &&
        (filters.available === "all" ||
          String(!!item.available) === filters.available)
      );
    });
  }, [orderedItems, filters]);

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

  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const pageNumbers = useMemo(
    () => getCompactPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

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

  return (
    <div className="relative min-h-full bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30 px-2 py-3 dark:bg-none dark:bg-slate-950 sm:px-4 sm:py-4 md:px-6">
      <MenuItemViewModal item={viewingItem} isOpen={!!viewingItem} onClose={() => setViewingItem(null)} menu={normalizedItems} />

      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        itemName={deleteConfirm?.name}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteItem}
      />

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddItem}
        restaurantCategories={restaurantCategories}
        menuItems={normalizedItems}
        onAddCategory={handleAddRestaurantCategory}
        onRenameCategory={handleRenameRestaurantCategory}
        onDeleteCategory={handleDeleteRestaurantCategory}
      />

      <AnimatePresence>
          {editingItem && (
          <EditItemModal
            isOpen={!!editingItem}
            item={editingItem}
            onClose={() => setEditingItem(null)}
            restaurantCategories={restaurantCategories}
              menuItems={normalizedItems.filter(item => item._id !== editingItem._id)}
            onSubmit={handleUpdateItem}
            onAddCategory={handleAddRestaurantCategory}
            onRenameCategory={handleRenameRestaurantCategory}
            onDeleteCategory={handleDeleteRestaurantCategory}
          />
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl pb-4">
        <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-orange-100 bg-white/95 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:gap-3 sm:p-4">
          <div className="min-w-0 flex-1">
            <Heading title="Menu Management" />
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setIsCategoryManagerOpen((prev) => !prev)}
                className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold shadow-sm transition-colors sm:h-11 sm:gap-2 sm:px-4 ${
                  isCategoryManagerOpen
                    ? "border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    : "border-orange-200 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                Manage Category
              </Button>
              <Button
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600 sm:h-11 sm:gap-2 sm:px-4"
                onClick={() => setIsAddModalOpen(true)}
              >
                <CirclePlus size={16} />
                <span className="hidden min-[390px]:inline">Add Item</span>
                <span className="inline min-[390px]:hidden">Add</span>
              </Button>
            </div>
          )}
        </div>

        <div className="mb-5 rounded-2xl border border-orange-100 bg-white/95 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:p-4">
          <MenuFilter
            value={filters}
            onFilterChange={(v) => setFilters({ ...filters, ...v })}
            categories={restaurantCategories}
            onResetNotify={handleFilterResetNotification}
          />
        </div>

        {isAdmin && isCategoryManagerOpen && restaurantCategories.length > 1 && (
          <div className="mb-5 overflow-hidden rounded-3xl border border-orange-100 bg-white/95 p-4 shadow-[0_18px_40px_-28px_rgba(249,115,22,0.6)] dark:border-slate-800 dark:bg-slate-900/90 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                  Manage Categories
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 shadow-sm transition hover:bg-orange-50 dark:border-slate-700 dark:bg-slate-900 dark:text-orange-300"
                aria-label="Close category manager"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {isCategoryManagerOpen && (
            <div className="mt-3 grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:max-h-none sm:grid-cols-4 sm:pr-0 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {restaurantCategories.map((category) => {
                const isActive = categoryDragOver === category;
                return (
                  <div
                    key={category}
                    data-category-chip={category}
                    className={`group relative w-full max-w-none overflow-hidden rounded-md border px-2 py-1.5 shadow-sm transition ${
                      isActive
                        ? "border-orange-400 bg-orange-50 shadow-md"
                        : "border-orange-200 bg-white hover:border-orange-300 hover:shadow-md"
                    } dark:border-slate-700 dark:bg-slate-950/60 dark:hover:border-slate-500`}
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700" />
                    <div className="absolute -right-6 -top-6 h-12 w-12 rounded-full bg-orange-100/60 blur-2xl dark:bg-orange-500/20" />

                    <div className="flex items-center gap-2 pl-2.5 pr-2 sm:justify-between">
                      <button
                        type="button"
                        onPointerDown={(event) => handleCategoryPointerDown(event, category)}
                        className="order-1 inline-flex h-6 w-6 shrink-0 touch-none select-none items-center justify-center rounded-md border border-orange-200 bg-white/90 text-orange-600 shadow-sm transition hover:bg-orange-50 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-900/90 dark:text-orange-300 sm:order-2 sm:ml-auto"
                        aria-label={`Drag ${category}`}
                        title="Drag to reorder"
                      >
                        <GripVertical size={12} />
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

        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-orange-100 bg-white/90 px-4 py-3 shadow-sm sm:mb-6 sm:gap-3">
          <h2 className="text-lg font-bold text-gray-800 sm:text-xl">Total Items</h2>
          <span className="inline-flex min-w-[44px] justify-center rounded-full bg-orange-100 px-3 py-1 text-sm font-extrabold text-orange-700">
            {filteredItems.length}
          </span>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white/90 py-12 text-center text-sm text-gray-600 sm:text-base">
            Loading menu items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white/90 py-12 text-center text-sm text-gray-600 sm:text-base">
            No menu item found for current filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {currentItems.map((item) => {
                const canReorder = isAdmin && !isReordering && filteredItems.length > 1;
                const dragHandleProps = canReorder
                  ? {
                      draggable: true,
                      onDragStart: (event) => handleDragStart(event, item._id),
                      onDragEnd: finalizeReorder,
                      onPointerDown: (event) => handlePointerDragStart(event, item._id),
                      onMouseDown: (event) => event.stopPropagation(),
                    }
                  : null;

                return (
                  <div
                    key={item._id}
                    data-menu-id={item._id}
                    onDragOver={(event) => handleDragOver(event, item._id)}
                    onDrop={(event) => event.preventDefault()}
                    onDragLeave={() => setDragOverId(null)}
                    className={`rounded-2xl transition ${
                      dragOverId === item._id ? "ring-2 ring-orange-300/70" : ""
                    }`}
                  >
                    <MenuItemCard
                      item={item}
                      onEdit={() => setEditingItem(buildEditItem(item))}
                      onDelete={() => setDeleteConfirm({ id: item._id, name: item.name })}
                      onView={() => setViewingItem(item)}
                      isAdmin={isAdmin}
                      dragHandleProps={dragHandleProps}
                      isDragging={draggingId === item._id}
                    />
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 px-2">
                <div className="w-full max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <Pagination className="min-w-max cursor-pointer justify-center">
                    <PaginationContent className="w-max min-w-max gap-1 rounded-xl border border-orange-200 bg-white/95 px-1.5 py-1 shadow-sm sm:px-2">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                          className={`h-7 rounded-md border border-orange-200 bg-white px-1.5 text-xs hover:bg-orange-50 cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:h-9 sm:rounded-lg sm:px-3 sm:text-sm sm:[&>span]:inline sm:[&_svg]:h-4 sm:[&_svg]:w-4 ${
                            currentPage === 1 ? "pointer-events-none opacity-50" : ""
                          }`}
                        />
                      </PaginationItem>

                      {pageNumbers.map((page, idx) => (
                        <PaginationItem key={idx}>
                          {typeof page === "string" ? (
                            <PaginationEllipsis className="h-7 w-7 cursor-pointer sm:h-9 sm:w-9" />
                          ) : (
                            <PaginationLink
                              isActive={currentPage === page}
                              className={`h-7 w-7 rounded-md border border-orange-200 p-0 text-[11px] cursor-pointer sm:h-9 sm:w-9 sm:rounded-lg sm:text-sm ${
                                currentPage === page
                                  ? "border-orange-500 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-600"
                                  : "bg-white text-gray-700 hover:bg-orange-50"
                              }`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                          className={`h-7 rounded-md border border-orange-200 bg-white px-1.5 text-xs hover:bg-orange-50 cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5 [&>span]:hidden sm:h-9 sm:rounded-lg sm:px-3 sm:text-sm sm:[&>span]:inline sm:[&_svg]:h-4 sm:[&_svg]:w-4 ${
                            currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                          }`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Menu;
