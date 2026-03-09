import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import {
  AlertTriangle,
  Check,
  Loader2,
  Plus,
  SquarePen,
  Trash,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADD_CATEGORY_VALUE = "__add_category__";

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

const resolveCategoryText = (value) =>
  extractTextCandidate(value, [
    "name",
    "categoryName",
    "categoryLabel",
    "category_label",
    "category_name",
    "label",
    "title",
    "value",
    "category",
    "slug",
    "id",
    "_id",
  ]);

const normalizeFoodTypeValue = (value = "") => {
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
    normalized === "nonvegetarian"
  ) {
    return "non-veg";
  }

  if (normalized === "mixed" || normalized === "mix" || normalized === "both") {
    return "mixed";
  }

  return "";
};

const normalizeCategory = (value = "") => {
  const normalized = value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const CategoryTypeSelectors = ({
  category,
  type,
  restaurantCategories = [],
  errors = {},
  setFormData,
  setFormErrors,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [newCategoryError, setNewCategoryError] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState("");
  const [editCategoryInput, setEditCategoryInput] = useState("");
  const [categoryActionError, setCategoryActionError] = useState("");
  const [activeCategoryAction, setActiveCategoryAction] = useState("");
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [optimisticCategories, setOptimisticCategories] = useState([]);

  useEffect(() => {
    setOptimisticCategories(Array.isArray(restaurantCategories) ? restaurantCategories : []);
  }, [restaurantCategories]);

  const selectedCategoryValue = useMemo(
    () => resolveCategoryText(category),
    [category]
  );

  const selectedTypeValue = useMemo(
    () => normalizeFoodTypeValue(type),
    [type]
  );

  useEffect(() => {
    if (typeof setFormData !== "function") return;

    const normalizedCategory = String(selectedCategoryValue || "").trim();
    const normalizedType = String(selectedTypeValue || "").trim();

    setFormData((prev) => {
      const currentCategory = resolveCategoryText(prev?.category);
      const currentType = normalizeFoodTypeValue(prev?.type);

      const nextCategory = normalizedCategory || currentCategory || "";
      const nextType = normalizedType || currentType || "";

      if (
        String(currentCategory || "").trim() === nextCategory &&
        String(currentType || "").trim() === nextType
      ) {
        return prev;
      }

      return {
        ...prev,
        category: nextCategory,
        type: nextType,
      };
    });
  }, [selectedCategoryValue, selectedTypeValue, setFormData]);

  const categoryOptions = useMemo(() => {
    const unique = new Set(
      optimisticCategories
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean)
    );

    const selectedCategory = String(selectedCategoryValue || "").trim();
    if (selectedCategory) {
      unique.add(selectedCategory);
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [optimisticCategories, selectedCategoryValue]);

  const clearFieldError = (field) => {
    if (errors[field] && setFormErrors) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isSameCategory = (firstValue = "", secondValue = "") =>
    String(firstValue).toLowerCase() === String(secondValue).toLowerCase();

  const resetEditState = () => {
    setEditingCategory("");
    setEditCategoryInput("");
    setCategoryActionError("");
  };

  const closeCategoryDropdown = () => {
    setIsCategoryDropdownOpen(false);
  };

  const handleAddCategorySubmit = async () => {
    const normalizedCategory = normalizeCategory(newCategoryInput);
    if (!normalizedCategory) {
      setNewCategoryError("Category name is required.");
      return;
    }

    const duplicateCategory = categoryOptions.find(
      (existing) => existing.toLowerCase() === normalizedCategory.toLowerCase()
    );

    if (duplicateCategory) {
      setFormData((prev) => ({ ...prev, category: duplicateCategory }));
      clearFieldError("category");
      setNewCategoryError("");
      setNewCategoryInput("");
      setShowAddCategoryInput(false);
      return;
    }

    if (typeof onAddCategory !== "function") {
      setNewCategoryError("Category update is not available right now.");
      return;
    }

    setIsSavingCategory(true);
    setNewCategoryError("");
    setCategoryActionError("");

    try {
      const result = await onAddCategory(normalizedCategory);
      if (!result?.ok) {
        setNewCategoryError(result?.message || "Unable to add category.");
        return;
      }

      const savedCategory = result.category || normalizedCategory;

      setOptimisticCategories((prev) => {
        const alreadyExists = prev.some(
          (existing) => existing.toLowerCase() === savedCategory.toLowerCase()
        );
        return alreadyExists ? prev : [...prev, savedCategory];
      });

      setFormData((prev) => ({ ...prev, category: savedCategory }));
      clearFieldError("category");
      setNewCategoryInput("");
      setShowAddCategoryInput(false);
      closeCategoryDropdown();
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleStartRename = (categoryName) => {
    setShowAddCategoryInput(false);
    setNewCategoryError("");
    setEditingCategory(categoryName);
    setEditCategoryInput(categoryName);
    setCategoryActionError("");
    setDeleteConfirmCategory("");
  };

  const handleRenameCategorySubmit = async () => {
    const oldCategory = editingCategory;
    const normalizedCategory = normalizeCategory(editCategoryInput);

    if (!oldCategory) return;
    if (!normalizedCategory) {
      setCategoryActionError("Category name is required.");
      return;
    }

    if (isSameCategory(oldCategory, normalizedCategory)) {
      resetEditState();
      return;
    }

    const duplicateCategory = categoryOptions.find(
      (existing) =>
        isSameCategory(existing, normalizedCategory) &&
        !isSameCategory(existing, oldCategory)
    );

    if (duplicateCategory) {
      setCategoryActionError(`"${normalizedCategory}" already exists.`);
      return;
    }

    if (typeof onRenameCategory !== "function") {
      setCategoryActionError("Category rename is not available right now.");
      return;
    }

    setActiveCategoryAction(`rename:${oldCategory}`);
    setCategoryActionError("");

    try {
      const result = await onRenameCategory(oldCategory, normalizedCategory);
      if (!result?.ok) {
        setCategoryActionError(result?.message || "Unable to rename category.");
        return;
      }

      const finalOldCategory = result.oldCategory || oldCategory;
      const finalCategory = result.category || normalizedCategory;

      setOptimisticCategories((prev) =>
        prev.map((existingCategory) =>
          isSameCategory(existingCategory, finalOldCategory)
            ? finalCategory
            : existingCategory
        )
      );

      if (isSameCategory(category, finalOldCategory)) {
        setFormData((prev) => ({ ...prev, category: finalCategory }));
      }
      clearFieldError("category");
      resetEditState();
      closeCategoryDropdown();
    } finally {
      setActiveCategoryAction("");
    }
  };

  const requestDeleteCategory = (categoryToDelete) => {
    setShowAddCategoryInput(false);
    resetEditState();
    setCategoryActionError("");
    setDeleteConfirmCategory(categoryToDelete);
    closeCategoryDropdown();
  };

  const handleConfirmDeleteCategory = async () => {
    const categoryToDelete = deleteConfirmCategory;

    if (!categoryToDelete) return;

    if (typeof onDeleteCategory !== "function") {
      setCategoryActionError("Category delete is not available right now.");
      setDeleteConfirmCategory("");
      return;
    }

    setActiveCategoryAction(`delete:${categoryToDelete}`);
    setCategoryActionError("");

    try {
      const result = await onDeleteCategory(categoryToDelete);
      if (!result?.ok) {
        setCategoryActionError(result?.message || "Unable to delete category.");
        return;
      }

      setOptimisticCategories((prev) =>
        prev.filter(
          (existingCategory) => !isSameCategory(existingCategory, categoryToDelete)
        )
      );

      if (isSameCategory(category, categoryToDelete)) {
        setFormData((prev) => ({ ...prev, category: "" }));
      }

      if (isSameCategory(editingCategory, categoryToDelete)) {
        resetEditState();
      }

      clearFieldError("category");
      closeCategoryDropdown();
    } finally {
      setActiveCategoryAction("");
      setDeleteConfirmCategory("");
    }
  };

  const handleCancelDeleteCategory = () => {
    if (activeCategoryAction) return;
    setDeleteConfirmCategory("");
  };

  const handleCategoryInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCategorySubmit();
    }

    if (e.key === "Escape") {
      setShowAddCategoryInput(false);
      setNewCategoryInput("");
      setNewCategoryError("");
    }
  };

  const handleRenameInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameCategorySubmit();
    }

    if (e.key === "Escape") {
      resetEditState();
    }
  };

  const handleActionIconClick = (event, callback) => {
    event.preventDefault();
    event.stopPropagation();
    callback();
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div data-field="category">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Category *
        </label>
        <Select
          open={isCategoryDropdownOpen}
          onOpenChange={setIsCategoryDropdownOpen}
          value={selectedCategoryValue || ""}
          onValueChange={(val) => {
            if (val === ADD_CATEGORY_VALUE) {
              setShowAddCategoryInput(true);
              setNewCategoryError("");
              resetEditState();
              setCategoryActionError("");
              setDeleteConfirmCategory("");
              return;
            }

            setFormData((prev) => ({ ...prev, category: val }));
            setCategoryActionError("");
            clearFieldError("category");
          }}
        >
          <SelectTrigger
            className={`h-11 w-full rounded-xl border px-3 text-sm shadow-sm transition-all outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${
              errors.category ? "border-red-500 bg-red-50" : "border-orange-200 bg-white hover:border-orange-300"
            }`}
          >
            <SelectValue placeholder="Select a Category" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={12}
            className="w-[min(var(--radix-select-trigger-width),calc(100vw-1rem))] max-w-[calc(100vw-1rem)] max-h-[min(50dvh,18rem)] overflow-y-auto rounded-xl border border-orange-200 bg-white p-1 shadow-xl sm:max-h-72"
          >
            <SelectGroup>
              <SelectItem
                value={ADD_CATEGORY_VALUE}
                className="font-semibold text-orange-700 data-[highlighted]:bg-orange-100 data-[highlighted]:text-orange-800"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Add Category
                </span>
              </SelectItem>
            </SelectGroup>
            <SelectSeparator className="my-1 bg-orange-100" />
            <SelectGroup>
              {categoryOptions.length === 0 ? (
                <SelectItem value="no-cat" disabled>No categories found</SelectItem>
              ) : (
                categoryOptions.map((cat) => {
                  const isEditingThisCategory = isSameCategory(editingCategory, cat);

                  if (isEditingThisCategory) {
                    return (
                      <div
                        key={cat}
                        className="mx-1 my-1 rounded-lg border border-orange-200 bg-orange-50 p-1.5"
                      >
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={editCategoryInput}
                            onChange={(event) => {
                              setEditCategoryInput(event.target.value);
                              if (categoryActionError) setCategoryActionError("");
                            }}
                            onKeyDown={handleRenameInputKeyDown}
                            className="h-8 border-orange-200 bg-white text-xs focus-visible:ring-orange-300"
                            disabled={!!activeCategoryAction}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={handleRenameCategorySubmit}
                            disabled={!!activeCategoryAction}
                            aria-label="Save category name"
                          >
                            {activeCategoryAction === `rename:${editingCategory}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-orange-200 bg-white text-orange-700 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={resetEditState}
                            disabled={!!activeCategoryAction}
                            aria-label="Cancel category rename"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {categoryActionError && (
                          <p className="mt-1 text-[11px] text-red-600">{categoryActionError}</p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={cat} className="group relative">
                      <SelectItem
                        value={cat}
                        className="pr-20 data-[highlighted]:bg-orange-200 [&>span:first-child]:hidden"
                      >
                        <span className="block max-w-full truncate">{cat}</span>
                      </SelectItem>
                      <div className="absolute inset-y-0 right-1 z-10 flex items-center gap-0.5">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-orange-700 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                          onPointerDown={(event) => handleActionIconClick(event, () => {})}
                          onClick={(event) =>
                            handleActionIconClick(event, () => handleStartRename(cat))
                          }
                          disabled={isSavingCategory || !!activeCategoryAction}
                          aria-label={`Edit ${cat}`}
                          title="Edit category"
                        >
                          <SquarePen size={16} />
                        </button>

                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          onPointerDown={(event) => handleActionIconClick(event, () => {})}
                          onClick={(event) =>
                            handleActionIconClick(event, () => requestDeleteCategory(cat))
                          }
                          disabled={isSavingCategory || !!activeCategoryAction}
                          aria-label={`Delete ${cat}`}
                          title="Delete category"
                        >
                          {activeCategoryAction === `delete:${cat}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </SelectGroup>
          </SelectContent>
        </Select>

        {showAddCategoryInput && (
          <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50/70 p-2.5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newCategoryInput}
                onChange={(e) => {
                  setNewCategoryInput(e.target.value);
                  if (newCategoryError) setNewCategoryError("");
                }}
                onKeyDown={handleCategoryInputKeyDown}
                placeholder="Type category name"
                className="h-10 border-orange-200 bg-white text-sm focus-visible:ring-orange-300"
                disabled={isSavingCategory || !!activeCategoryAction}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddCategorySubmit}
                  disabled={isSavingCategory || !!activeCategoryAction}
                  className="h-10 rounded-lg !bg-orange-500 px-3 text-sm font-semibold !text-white hover:!bg-orange-600 dark:!bg-orange-500 dark:hover:!bg-orange-400"
                >
                  {isSavingCategory ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    "Add"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAddCategoryInput(false);
                    setNewCategoryInput("");
                    setNewCategoryError("");
                  }}
                  disabled={isSavingCategory || !!activeCategoryAction}
                  className="h-10 rounded-lg border border-orange-200 px-3 text-sm text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
            {newCategoryError && (
              <p className="mt-1.5 text-xs text-red-600">{newCategoryError}</p>
            )}
          </div>
        )}

        {categoryActionError && !editingCategory && (
          <p className="mt-1.5 text-xs text-red-600">{categoryActionError}</p>
        )}

        {errors.category && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {errors.category}
          </p>
        )}
        </div>

        <div data-field="type">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Food Type *
          </label>
          <Select
            value={selectedTypeValue || ""}
            onValueChange={(val) => {
              setFormData((prev) => ({ ...prev, type: val }));
              clearFieldError("type");
            }}
          >
            <SelectTrigger
              className={`h-11 w-full rounded-xl border px-3 text-sm shadow-sm transition-all outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${
                errors.type ? "border-red-500 bg-red-50" : "border-orange-200 bg-white hover:border-orange-300"
              }`}
            >
              <SelectValue placeholder="Select Food Type" />
            </SelectTrigger>
            <SelectContent className="min-w-[140px] cursor-pointer rounded-xl border border-orange-200 bg-white p-1 shadow-xl">
              <SelectGroup>
                <SelectItem value="veg" className="data-[highlighted]:bg-orange-200">Veg</SelectItem>
                <SelectItem value="non-veg" className="data-[highlighted]:bg-orange-200">Non-Veg</SelectItem>
                <SelectItem value="mixed" className="data-[highlighted]:bg-orange-200">Mixed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {errors.type}
            </p>
          )}
        </div>
      </div>

      {deleteConfirmCategory &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
            onClick={handleCancelDeleteCategory}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-orange-100 bg-white/95 p-6 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-100">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-bold text-gray-900">
                    Delete Category?
                  </h3>
                  <p className="text-gray-600">
                    Are you sure you want to delete
                    {" "}
                    <span className="font-semibold text-gray-800">
                      "{deleteConfirmCategory}"
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-orange-100 pt-4 sm:flex-row">
                <Button
                  onClick={handleCancelDeleteCategory}
                  variant="outline"
                  disabled={!!activeCategoryAction}
                  className="h-11 flex-1 rounded-xl border border-orange-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDeleteCategory}
                  disabled={!!activeCategoryAction}
                  className="h-11 flex-1 rounded-xl border border-red-600 bg-gradient-to-r from-red-500 to-red-500 text-sm font-semibold text-white transition-all duration-200 hover:from-red-600 hover:to-red-600"
                >
                  {activeCategoryAction === `delete:${deleteConfirmCategory}` ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Yes, Delete Category"
                  )}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default CategoryTypeSelectors;
