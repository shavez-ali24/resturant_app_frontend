/**
 * EditItemPage.jsx
 * Full-page "Edit Item" — same layout and components as AddItemPage.
 * Loads item data from the menu query by itemId param, pre-fills the form,
 * and calls updateMenuItem on submit. Navigates back to /admin/menu on success.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { defaultAddFormState } from "./Lib/constants";
import ErrorDisplay from "./ComponentsMenu/AddItemModal/components/ErrorDisplay";
import FormInput from "./ComponentsMenu/AddItemModal/components/FormInput";
import PricingTypeSelector from "./ComponentsMenu/AddItemModal/components/PricingTypeSelector";
import SinglePriceSection from "./ComponentsMenu/AddItemModal/components/SinglePriceSection";
import VariantPriceSection from "./ComponentsMenu/AddItemModal/components/VariantPriceSection";
import ComboPriceSection from "./ComponentsMenu/AddItemModal/components/ComboPriceSection";
import CategoryTypeSelectors from "./ComponentsMenu/AddItemModal/components/CategoryTypeSelectors";
import ImageUpload from "./ComponentsMenu/AddItemModal/components/ImageUpload";
import AvailabilityToggle from "./ComponentsMenu/AddItemModal/components/AvailabilityToggle";
import VisibilityToggle from "./ComponentsMenu/AddItemModal/components/VisibilityToggle";
import SubmitButton from "./ComponentsMenu/AddItemModal/components/SubmitButton";
import DescriptionField from "./ComponentsMenu/AddItemModal/components/DescriptionField";

import { validateForm } from "./ComponentsMenu/AddItemModal/utils/validators";
import {
  handleAddFormChange,
  handleAddFormFileChange,
  setPricingType,
} from "./ComponentsMenu/AddItemModal/utils/formHandlers";

import {
  useGetMenuQuery,
  useGetRestaurantQuery,
  useUpdateMenuItemMutation,
  useUpdateRestaurantMutation,
  useReorderCategoriesMutation,
  useCreateCategoriesMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../../../redux/adminRedux/adminAPI";
import { useNotify } from "../common/NotificationModal";

// ── Helpers (same as AddItemPage) ─────────────────────────────────────────────
const normalizeCategoryLabel = (value = "") => {
  const cleaned = String(value || "").replace(/-+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};
const normalizeCategoryKey = (value = "") => normalizeCategoryLabel(value).toLowerCase();

const sortUniqueCategories = (categories = []) => {
  const getLabel = (v) => {
    if (typeof v === "string" || typeof v === "number") return String(v).trim();
    if (!v || typeof v !== "object") return "";
    return String(v.name || v.category || v.categoryName || v.label || v.title || "").trim();
  };
  const seen = new Set();
  const out = [];
  categories.map(getLabel).filter(Boolean).forEach((label) => {
    const key = label.toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(label); }
  });
  return out;
};

const detectCategoryObjectKey = (cat) => {
  if (!cat || typeof cat !== "object") return "name";
  return ["name", "category", "categoryName", "label", "title", "value", "displayName"]
    .find(k => typeof cat[k] === "string" && cat[k].trim()) || "name";
};

const resolveCategoryMode = (values = []) => {
  const obj = values.find(v => v && typeof v === "object" && !Array.isArray(v));
  if (!obj) return { mode: "string", key: "name" };
  return { mode: "object", key: detectCategoryObjectKey(obj) };
};

const appendCategoriesToFormData = (fd, categories, mode) => {
  if (mode?.mode === "object") {
    categories.forEach((cat, i) => {
      fd.append(`categories[${i}][${mode.key}]`, cat);
      fd.append(`categories[${i}][displayOrder]`, i);
    });
    return;
  }
  if (!categories.length) { fd.append("categories", ""); return; }
  categories.forEach(cat => fd.append("categories", cat));
};

const defaultDiscount = { type: "flat", value: "", active: false };

const normalizeFoodType = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (["veg", "vegetarian", "vegitarian"].includes(normalized)) return "veg";
  if (["nonveg", "non-veg", "non-vegetarian", "nonvegetarian"].includes(normalized)) return "non-veg";
  if (["mixed", "mix", "both"].includes(normalized)) return "mixed";
  return "";
};

const resolveCategoryValue = (rawCategory, restaurantCategories = []) => {
  const candidate = (() => {
    if (!rawCategory) return "";
    if (typeof rawCategory === "string") return rawCategory.trim();
    if (typeof rawCategory === "object") {
      return String(
        rawCategory.name || rawCategory.categoryName || rawCategory.categoryLabel ||
        rawCategory.label || rawCategory.title || rawCategory.value || ""
      ).trim();
    }
    return "";
  })();
  if (!candidate) return "";
  if (/^[a-f0-9]{24}$/i.test(candidate)) return "";
  const match = restaurantCategories.find(c => c.toLowerCase() === candidate.toLowerCase());
  return match || candidate;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function EditItemPage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const notify = useNotify();
  const colors = useSelector((state) => state.admin.theme.colors);

  // ── Dark mode ────────────────────────────────────────────────────────────
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () =>
      setIsDarkMode(root.classList.contains("admin-dark") || root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const [updateMenuItem] = useUpdateMenuItemMutation();
  const [updateRestaurantProfile] = useUpdateRestaurantMutation();
  const [reorderCategories] = useReorderCategoriesMutation();
  const [createCategory] = useCreateCategoriesMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const { data: restaurantData } = useGetRestaurantQuery();
  const { data: apiResponse = {}, isLoading: isLoadingMenuItems } = useGetMenuQuery();

  const [restaurantCategories, setRestaurantCategories] = useState([]);
  const [formData, setFormData] = useState(defaultAddFormState);
  const [addFile, setAddFile] = useState(null);
  const [addFileError, setAddFileError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [comboItems, setComboItems] = useState([]);
  const [itemLoaded, setItemLoaded] = useState(false);
  const formRef = useRef(null);

  // Extract categories from restaurant data
  useEffect(() => {
    const cats = restaurantData?.restaurant?.categories || [];
    setRestaurantCategories(sortUniqueCategories(cats));
  }, [restaurantData]);

  const categoryMode = useMemo(
    () => resolveCategoryMode(restaurantData?.restaurant?.categories || []),
    [restaurantData]
  );

  // Extract all menu items
  const allMenuItems = useMemo(() => {
    if (!apiResponse) return [];
    if (Array.isArray(apiResponse)) return apiResponse;
    if (Array.isArray(apiResponse.menu)) return apiResponse.menu;
    if (Array.isArray(apiResponse.data)) return apiResponse.data;
    return [];
  }, [apiResponse]);

  // Find the item to edit
  const itemToEdit = useMemo(
    () => allMenuItems.find(item => item._id === itemId) || null,
    [allMenuItems, itemId]
  );

  // Pre-fill form when item is found
  useEffect(() => {
    if (!itemToEdit || itemLoaded) return;

    const cats = restaurantData?.restaurant?.categories || [];
    const catList = sortUniqueCategories(cats);

    const categoryValue = resolveCategoryValue(
      itemToEdit.category || itemToEdit.categoryName || itemToEdit.categoryLabel || "",
      catList
    );
    const normalizedType = normalizeFoodType(
      itemToEdit.type || itemToEdit.foodType || itemToEdit.food_type || ""
    );

    const incomingDiscount = itemToEdit.discount || { ...defaultDiscount };
    const normalizedDiscount = {
      type: incomingDiscount.type || "flat",
      value: incomingDiscount.value !== undefined && incomingDiscount.value !== null
        ? String(incomingDiscount.value) : "",
      active: !!incomingDiscount.active,
    };

    const incomingVariantRates = itemToEdit.variantRates || {};
    const normalizedVariantRates = {
      quarter: { price: "", discount: { ...defaultDiscount } },
      half: { price: "", discount: { ...defaultDiscount } },
      full: { price: "", discount: { ...defaultDiscount } },
    };
    Object.keys(normalizedVariantRates).forEach(key => {
      const src = incomingVariantRates[key] || {};
      const srcDiscount = src.discount || { ...defaultDiscount };
      normalizedVariantRates[key] = {
        price: src.price !== undefined && src.price !== null ? String(src.price) : "",
        discount: {
          type: srcDiscount.type || "flat",
          value: srcDiscount.value !== undefined && srcDiscount.value !== null
            ? String(srcDiscount.value) : "",
          active: !!srcDiscount.active,
        },
      };
    });

    setFormData({
      ...defaultAddFormState,
      name: itemToEdit.name || "",
      description: itemToEdit.description || "",
      pricingType: itemToEdit.pricingType || "single",
      price: itemToEdit.price !== undefined && itemToEdit.price !== null
        ? String(itemToEdit.price) : "",
      comboPrice: itemToEdit.comboPrice !== undefined && itemToEdit.comboPrice !== null
        ? String(itemToEdit.comboPrice) : "",
      category: categoryValue,
      type: normalizedType || "veg",
      available: itemToEdit.available ?? true,
      visibility: itemToEdit.visibility || "PUBLIC",
      discount: normalizedDiscount,
      variantRates: Object.keys(incomingVariantRates).length
        ? normalizedVariantRates
        : defaultAddFormState.variantRates,
    });

    const formattedComboItems = (itemToEdit.comboItems || []).map(ci => ({
      menuItemId: typeof ci.menuItemId === "object" ? ci.menuItemId?._id : ci.menuItemId || "",
      variant: ci.variant || "",
      quantity: ci.quantity || 1,
      name: ci.name || "",
    }));
    setComboItems(formattedComboItems);
    setItemLoaded(true);
  }, [itemToEdit, restaurantData, itemLoaded]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) =>
    handleAddFormChange(e, formData, setFormData, formErrors, setFormErrors, backendError, setBackendError);

  const handleFileChange = (e) =>
    handleAddFormFileChange(e, setAddFile, setAddFileError);

  const handlePricingTypeChange = (type) =>
    setPricingType(type, setFormErrors, setFormData, setComboItems);

  const scrollToFirstError = (errors = {}) => {
    const fieldOrder = ["name", "category", "type", "price", "variantRates", "comboPrice", "comboItems", "discount", "description"];
    const first = fieldOrder.find(f => {
      const v = errors[f];
      if (v === undefined || v === null || v === "") return false;
      if (typeof v === "object") return Object.keys(v).length > 0;
      return true;
    });
    if (!first) return;
    const selectorMap = {
      name: 'input[name="name"]', category: '[data-field="category"]',
      type: '[data-field="type"]', price: 'input[name="price"]',
      variantRates: '[data-field="variantRates"], input[name="quarter.price"]',
      comboPrice: 'input[name="comboPrice"]',
      description: 'textarea[name="description"]',
    };
    const target = formRef.current?.querySelector(selectorMap[first] || `[name="${first}"]`);
    if (target) requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus?.({ preventScroll: true });
    });
  };

  const sanitizeDiscount = (d) => {
    if (!d) return { type: "flat", value: 0, active: false };
    const isActive = d.active === true || d.active === "true";
    const val = isActive ? parseInt((d.value || "0").toString().trim(), 10) : 0;
    return {
      type: d.type === "flat" || d.type === "percentage" ? d.type : "flat",
      value: isNaN(val) ? 0 : val,
      active: isActive,
    };
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setBackendError("");

    // Validate
    const errors = validateForm(formData, comboItems);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      scrollToFirstError(errors);
      return;
    }
    if (addFileError) return;

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name || "");
      fd.append("description", formData.description || "");
      fd.append("pricingType", formData.pricingType || "single");
      fd.append("type", formData.type || "veg");
      fd.append("category", formData.category || "");
      fd.append("available", formData.available ? "true" : "false");
      fd.append("visibility", formData.visibility || "PUBLIC");

      if (formData.pricingType === "single") {
        fd.append("price", (formData.price ?? "0").toString());
        const disc = sanitizeDiscount(formData.discount);
        fd.append("discount[type]", disc.type);
        fd.append("discount[value]", disc.value.toString());
        fd.append("discount[active]", disc.active.toString());
      }

      if (formData.pricingType === "variant") {
        Object.entries(formData.variantRates || {}).forEach(([key, val]) => {
          if (val?.price !== undefined) {
            fd.append(`variantRates[${key}][price]`, val.price.toString());
            const disc = sanitizeDiscount(val.discount);
            fd.append(`variantRates[${key}][discount][type]`, disc.type);
            fd.append(`variantRates[${key}][discount][value]`, disc.value.toString());
            fd.append(`variantRates[${key}][discount][active]`, disc.active.toString());
          }
        });
      }

      if (formData.pricingType === "combo") {
        fd.append("comboPrice", (formData.comboPrice ?? "0").toString());
        const disc = sanitizeDiscount(formData.discount);
        fd.append("discount[type]", disc.type);
        fd.append("discount[value]", disc.value.toString());
        fd.append("discount[active]", disc.active.toString());
        comboItems.forEach((item, i) => {
          fd.append(`comboItems[${i}][menuItemId]`, item.menuItemId);
          fd.append(`comboItems[${i}][variant]`, item.variant || "");
          fd.append(`comboItems[${i}][quantity]`, (item.quantity ?? 1).toString());
        });
      }

      if (addFile) fd.append("file", addFile);

      await updateMenuItem({ itemId, updatedData: fd }).unwrap();
      notify("Menu item updated successfully.", "success");
      navigate("/admin/menu", { state: { selectCategory: formData.category } });
    } catch (err) {
      console.error("❌ Update item error:", err);
      const msg =
        err?.data?.message || err?.data?.error || err?.message ||
        "Unable to update menu item right now.";
      setBackendError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Category handlers ──────────────────────────────────────────────────────
  const handleAddRestaurantCategory = useCallback(async (rawName) => {
    const name = normalizeCategoryLabel(rawName);
    if (!name) return { ok: false, message: "Please enter a valid category name." };
    const dup = restaurantCategories.find(c => normalizeCategoryKey(c) === normalizeCategoryKey(name));
    if (dup) return { ok: true, category: dup, duplicate: true };
    try {
      await createCategory({ name }).unwrap();
      notify(`Category "${name}" added.`, "success");
      return { ok: true, category: name };
    } catch (err) {
      return { ok: false, message: err?.data?.message || "Unable to add category." };
    }
  }, [restaurantCategories, createCategory, notify]);

  const handleRenameRestaurantCategory = useCallback(async (oldName, rawNew) => {
    const newName = normalizeCategoryLabel(rawNew);
    if (!newName) return { ok: false, message: "Please enter a valid category name." };
    const current = restaurantCategories.find(c => normalizeCategoryKey(c) === normalizeCategoryKey(oldName));
    if (!current) return { ok: false, message: "Category not found." };
    if (normalizeCategoryKey(current) === normalizeCategoryKey(newName))
      return { ok: true, category: current, unchanged: true };
    const dup = restaurantCategories.find(c => normalizeCategoryKey(c) === normalizeCategoryKey(newName));
    if (dup) return { ok: false, message: `"${newName}" already exists.` };

    const categoryObj = restaurantData?.restaurant?.categories?.find(
      c => normalizeCategoryKey(c.name || c.label) === normalizeCategoryKey(oldName)
    );
    if (!categoryObj?._id) return { ok: false, message: "Category ID not found." };

    try {
      await updateCategory({ categoryId: categoryObj._id, newName }).unwrap();
      notify(`Category renamed to "${newName}".`, "success");
      return { ok: true, oldCategory: current, category: newName };
    } catch (err) {
      return { ok: false, message: err?.data?.message || "Unable to rename category." };
    }
  }, [restaurantCategories, restaurantData, updateCategory, notify]);

  const handleDeleteRestaurantCategory = useCallback(async (name) => {
    const target = restaurantCategories.find(c => normalizeCategoryKey(c) === normalizeCategoryKey(name));
    if (!target) return { ok: false, message: "Category not found." };

    const categoryObj = restaurantData?.restaurant?.categories?.find(
      c => normalizeCategoryKey(c.name || c.label) === normalizeCategoryKey(name)
    );
    if (!categoryObj?._id) return { ok: false, message: "Category ID not found." };

    try {
      await deleteCategory(categoryObj._id).unwrap();
      notify(`Category "${target}" deleted.`, "success");
      return { ok: true, deletedCategory: target };
    } catch (err) {
      return { ok: false, message: err?.data?.message || "Unable to delete category." };
    }
  }, [restaurantCategories, restaurantData, deleteCategory, notify]);



  // ── Loading / not found states ─────────────────────────────────────────────
  const bg = isDarkMode ? "bg-[#0f172a]" : "bg-[#f7f3ef]";

  if (isLoadingMenuItems && !itemToEdit) {
    return (
      <div className={`flex h-full items-center justify-center ${bg}`}>
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-[#a8a29e]"}`}>
          Loading item...
        </p>
      </div>
    );
  }

  if (!isLoadingMenuItems && !itemToEdit) {
    return (
      <div className={`flex h-full flex-col items-center justify-center gap-4 ${bg}`}>
        <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>
          Item not found.
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/menu")}
          className="text-sm font-semibold hover:underline"
          style={{ color: colors.primary }}
        >
          ← Back to Menu
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const pageBg = isDarkMode ? (colors.dark?.pageBg || "#0f172a") : (colors.pageBg || "#fbfaf8");
  const textPri = isDarkMode ? (colors.dark?.textPrimary || "#f1f5f9") : (colors.textPrimary || "#1c1917");
  const textMut = isDarkMode ? "#64748b" : (colors.textMuted || "#a8a29e");

  return (
    <div className="flex h-full flex-col px-4 py-4 sm:px-6 sm:py-5" style={{ backgroundColor: pageBg }}>

      {/* ── Header row ── */}
      <div className="relative mb-6 flex items-center shrink-0 sm:mb-8">
        <button
          type="button"
          onClick={() => navigate("/admin/menu")}
          className="flex items-center gap-1 text-xs font-extrabold transition-all duration-150 active:scale-[0.98] sm:gap-1.5 sm:text-sm"
          style={{ color: colors.primary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.primaryHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.primary;
          }}
        >
          <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Back to Menu</span>
          <span className="sm:hidden">Back</span>
        </button>
        {/* Title centered */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3">
          <Pencil size={20} className="shrink-0 sm:w-6 sm:h-6" style={{ color: colors.primary }} />
          <div>
            <p className="text-sm font-black leading-tight sm:text-xl" style={{ color: textPri }}>
              Edit Item
            </p>
            <p className="text-[11px] sm:text-sm truncate max-w-[160px] sm:max-w-xs font-semibold" style={{ color: textMut }}>
              {itemToEdit?.name || ""}
            </p>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="w-full flex-1 min-h-0 flex flex-col">
        <form ref={formRef} onSubmit={onSubmitHandler} className="flex-1 min-h-0 flex flex-col">
          {backendError && <div className="mb-4 shrink-0"><ErrorDisplay error={backendError} /></div>}

          {/* Scrollable inputs */}
          <div className="flex-1 min-h-0 overflow-y-scroll pb-2">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">

              {/* Col 1 — Name + Image + Description + Availability */}
              <div className="flex flex-col gap-7">
                <FormInput
                  label="Product Name" name="name" value={formData.name}
                  onChange={handleChange} error={formErrors.name} required
                />
                <ImageUpload
                  addFile={addFile}
                  addFileError={addFileError}
                  handleFileChange={handleFileChange}
                  existingImageUrl={itemToEdit?.image?.url || null}
                />
                <DescriptionField
                  value={formData.description} onChange={handleChange}
                  error={formErrors.description}
                />
                <div className="flex flex-wrap gap-4">
                  <AvailabilityToggle available={formData.available} handleChange={handleChange} />
                  <VisibilityToggle visibility={formData.visibility} handleChange={handleChange} />
                </div>
              </div>

              {/* Col 2 — Category + Food Type + Pricing Type + Price */}
              <div className="flex flex-col gap-7">
                <CategoryTypeSelectors
                  category={formData.category} type={formData.type}
                  restaurantCategories={restaurantCategories}
                  errors={formErrors} setFormData={setFormData} setFormErrors={setFormErrors}
                  onAddCategory={handleAddRestaurantCategory}
                  onRenameCategory={handleRenameRestaurantCategory}
                  onDeleteCategory={handleDeleteRestaurantCategory}
                />
                <PricingTypeSelector
                  pricingType={formData.pricingType}
                  setPricingType={handlePricingTypeChange}
                />
                {formData.pricingType === "single" && (
                  <SinglePriceSection
                    price={formData.price} discount={formData.discount}
                    errors={formErrors} handleChange={handleChange} setFormData={setFormData}
                  />
                )}
                {formData.pricingType === "variant" && (
                  <VariantPriceSection
                    variantRates={formData.variantRates} errors={formErrors.variantRates}
                    handleChange={handleChange} setFormData={setFormData}
                  />
                )}
                {formData.pricingType === "combo" && (
                  <ComboPriceSection
                    comboPrice={formData.comboPrice} comboItems={comboItems}
                    menuItems={allMenuItems.filter(m => m._id !== itemId)}
                    errors={formErrors}
                    handleChange={handleChange} setComboItems={setComboItems}
                    setFormData={setFormData} foodType={formData.type}
                    discount={formData.discount} isLoadingMenu={isLoadingMenuItems}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Buttons — always visible at bottom */}
          <div className="shrink-0 pt-4">
            <SubmitButton
              isAddingItem={isSubmitting}
              onClose={() => navigate("/admin/menu")}
              submitText="Save Changes"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
