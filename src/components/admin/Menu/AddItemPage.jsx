/**
 * AddItemPage.jsx
 * Full-page "Add New Item" — renders inside AdminLayout so sidebar + header stay visible.
 * After successful submit → navigates back to /admin/menu with category state for auto-select.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pizza } from "lucide-react";
import { defaultAddFormState } from "./Lib/constants";
import ErrorDisplay       from "./ComponentsMenu/AddItemModal/components/ErrorDisplay";
import FormInput          from "./ComponentsMenu/AddItemModal/components/FormInput";
import PricingTypeSelector from "./ComponentsMenu/AddItemModal/components/PricingTypeSelector";
import SinglePriceSection  from "./ComponentsMenu/AddItemModal/components/SinglePriceSection";
import VariantPriceSection from "./ComponentsMenu/AddItemModal/components/VariantPriceSection";
import ComboPriceSection   from "./ComponentsMenu/AddItemModal/components/ComboPriceSection";
import CategoryTypeSelectors from "./ComponentsMenu/AddItemModal/components/CategoryTypeSelectors";
import ImageUpload         from "./ComponentsMenu/AddItemModal/components/ImageUpload";
import AvailabilityToggle  from "./ComponentsMenu/AddItemModal/components/AvailabilityToggle";
import VisibilityToggle    from "./ComponentsMenu/AddItemModal/components/VisibilityToggle";
import SubmitButton        from "./ComponentsMenu/AddItemModal/components/SubmitButton";
import DescriptionField    from "./ComponentsMenu/AddItemModal/components/DescriptionField";

import { validateForm }    from "./ComponentsMenu/AddItemModal/utils/validators";
import {
  handleAddFormChange,
  handleAddFormFileChange,
  setPricingType,
} from "./ComponentsMenu/AddItemModal/utils/formHandlers";

import {
  useGetMenuQuery,
  useGetRestaurantQuery,
  useCreateMenuItemMutation,
  useUpdateRestaurantMutation,
  useCreateCategoriesMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../../../redux/adminRedux/adminAPI";
import { useNotify } from "../common/NotificationModal";

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  return ["name","category","categoryName","label","title","value","displayName"]
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

const sanitizeDiscount = (d) => {
  if (!d) return { type: "flat", value: 0, active: false };
  const isActive = d.active === true || d.active === "true";
  const val = isActive ? parseInt((d.value || "0").toString().trim(), 10) : 0;
  return {
    type:   d.type === "flat" || d.type === "percentage" ? d.type : "flat",
    value:  isNaN(val) ? 0 : val,
    active: isActive,
  };
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function AddItemPage() {
  const navigate = useNavigate();
  const notify   = useNotify();

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

  const [createMenuItem]          = useCreateMenuItemMutation();
  const [updateRestaurantProfile] = useUpdateRestaurantMutation();
  const [createCategory]          = useCreateCategoriesMutation();
  const [updateCategory]          = useUpdateCategoryMutation();
  const [deleteCategory]          = useDeleteCategoryMutation();
  const { data: restaurantData }  = useGetRestaurantQuery();
  const { data: apiResponse = {}, isLoading: isLoadingMenuItems } = useGetMenuQuery();

  const [restaurantCategories, setRestaurantCategories] = useState([]);
  const [addFormData, setAddFormData]   = useState(defaultAddFormState);
  const [addFile, setAddFile]           = useState(null);
  const [addFileError, setAddFileError] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [formErrors, setFormErrors]     = useState({});
  const [backendError, setBackendError] = useState("");
  const [comboItems, setComboItems]     = useState([]);
  const formRef = useRef(null);

  useEffect(() => {
    const cats = restaurantData?.restaurant?.categories || [];
    setRestaurantCategories(sortUniqueCategories(cats));
  }, [restaurantData]);

  useEffect(() => {
    const preselected = sessionStorage.getItem("menuSelectedCategory");
    if (preselected && !addFormData.category) {
      setAddFormData((prev) => ({
        ...prev,
        category: preselected,
      }));
    }
  }, []);

  const categoryMode = useMemo(
    () => resolveCategoryMode(restaurantData?.restaurant?.categories || []),
    [restaurantData]
  );

  const allMenuItems = useMemo(() => {
    if (!apiResponse) return [];
    if (Array.isArray(apiResponse)) return apiResponse;
    if (Array.isArray(apiResponse.menu)) return apiResponse.menu;
    if (Array.isArray(apiResponse.data)) return apiResponse.data;
    return [];
  }, [apiResponse]);

  const handleChange = (e) =>
    handleAddFormChange(e, addFormData, setAddFormData, formErrors, setFormErrors, backendError, setBackendError);

  const handleFileChange = (e) =>
    handleAddFormFileChange(e, setAddFile, setAddFileError);

  const handlePricingTypeChange = (type) =>
    setPricingType(type, setFormErrors, setAddFormData, setComboItems);

  const scrollToFirstError = (errors = {}) => {
    const fieldOrder = ["name","category","type","price","variantRates","comboPrice","comboItems","discount","description"];
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

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setBackendError("");

    const errors = validateForm(addFormData, comboItems);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      scrollToFirstError(errors);
      return;
    }
    if (addFileError) return;

    setIsAddingItem(true);
    try {
      const fd = new FormData();
      fd.append("name",        addFormData.name        || "");
      fd.append("description", addFormData.description || "");
      fd.append("pricingType", addFormData.pricingType || "single");
      fd.append("type",        addFormData.type        || "veg");
      fd.append("category",    addFormData.category    || "");
      fd.append("available",   addFormData.available ? "true" : "false");
      fd.append("visibility",  addFormData.visibility  || "PUBLIC");

      if (addFormData.pricingType === "single") {
        fd.append("price", (addFormData.price ?? "0").toString());
        const disc = sanitizeDiscount(addFormData.discount);
        fd.append("discount[type]",   disc.type);
        fd.append("discount[value]",  disc.value.toString());
        fd.append("discount[active]", disc.active.toString());
      }

      if (addFormData.pricingType === "variant") {
        Object.entries(addFormData.variantRates || {}).forEach(([key, val]) => {
          if (val?.price !== undefined) {
            fd.append(`variantRates[${key}][price]`, val.price.toString());
            const disc = sanitizeDiscount(val.discount);
            fd.append(`variantRates[${key}][discount][type]`,   disc.type);
            fd.append(`variantRates[${key}][discount][value]`,  disc.value.toString());
            fd.append(`variantRates[${key}][discount][active]`, disc.active.toString());
          }
        });
      }

      if (addFormData.pricingType === "combo") {
        fd.append("comboPrice", (addFormData.comboPrice ?? "0").toString());
        const disc = sanitizeDiscount(addFormData.discount);
        fd.append("discount[type]",   disc.type);
        fd.append("discount[value]",  disc.value.toString());
        fd.append("discount[active]", disc.active.toString());
        comboItems.forEach((item, i) => {
          fd.append(`comboItems[${i}][menuItemId]`, item.menuItemId);
          fd.append(`comboItems[${i}][variant]`,    item.variant || "");
          fd.append(`comboItems[${i}][quantity]`,   (item.quantity ?? 1).toString());
        });
      }

      if (addFile) fd.append("file", addFile);

      await createMenuItem(fd).unwrap();
      notify("Menu item added successfully.", "success");
      // Pass category so Menu.jsx can auto-select it
      navigate("/admin/menu", { state: { selectCategory: addFormData.category } });
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || err?.message || "Unable to add item.";
      setBackendError(msg);
    } finally {
      setIsAddingItem(false);
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

  // ── Render ────────────────────────────────────────────────────────────────
  const colors = useSelector((state) => state.admin.theme.colors);
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
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3">
          <Pizza size={20} className="shrink-0 sm:w-7 sm:h-7" style={{ color: colors.primary }} />
          <div>
            <p className="text-sm font-black leading-tight sm:text-xl" style={{ color: textPri }}>
              Add New Item
            </p>
            <p className="text-[11px] sm:text-sm font-semibold" style={{ color: textMut }}>
              Fill in the details below.
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

              {/* Col 1 */}
              <div className="flex flex-col gap-7">
                <FormInput
                  label="Product Name" name="name" value={addFormData.name}
                  onChange={handleChange} error={formErrors.name} required
                />
                <ImageUpload
                  addFile={addFile} addFileError={addFileError}
                  handleFileChange={handleFileChange}
                />
                <DescriptionField
                  value={addFormData.description} onChange={handleChange}
                  error={formErrors.description}
                />
                 <div className="flex flex-wrap gap-4">
                  <AvailabilityToggle available={addFormData.available} handleChange={handleChange} />
                  <VisibilityToggle visibility={addFormData.visibility} handleChange={handleChange} />
                </div>
              </div>

              {/* Col 2 */}
              <div className="flex flex-col gap-7">
                <CategoryTypeSelectors
                  category={addFormData.category} type={addFormData.type}
                  restaurantCategories={restaurantCategories}
                  errors={formErrors} setFormData={setAddFormData} setFormErrors={setFormErrors}
                  onAddCategory={handleAddRestaurantCategory}
                  onRenameCategory={handleRenameRestaurantCategory}
                  onDeleteCategory={handleDeleteRestaurantCategory}
                />
                <PricingTypeSelector
                  pricingType={addFormData.pricingType}
                  setPricingType={handlePricingTypeChange}
                />
                {addFormData.pricingType === "single" && (
                  <SinglePriceSection
                    price={addFormData.price} discount={addFormData.discount}
                    errors={formErrors} handleChange={handleChange} setFormData={setAddFormData}
                  />
                )}
                {addFormData.pricingType === "variant" && (
                  <VariantPriceSection
                    variantRates={addFormData.variantRates} errors={formErrors.variantRates}
                    handleChange={handleChange} setFormData={setAddFormData}
                  />
                )}
                {addFormData.pricingType === "combo" && (
                  <ComboPriceSection
                    comboPrice={addFormData.comboPrice} comboItems={comboItems}
                    menuItems={allMenuItems} errors={formErrors}
                    handleChange={handleChange} setComboItems={setComboItems}
                    setFormData={setAddFormData} foodType={addFormData.type}
                    discount={addFormData.discount} isLoadingMenu={isLoadingMenuItems}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Buttons — fixed at bottom */}
          <div className="shrink-0 pt-4">
            <SubmitButton isAddingItem={isAddingItem} onClose={() => navigate("/admin/menu")} submitText="Add Item" />
          </div>
        </form>
      </div>
    </div>
  );
}
