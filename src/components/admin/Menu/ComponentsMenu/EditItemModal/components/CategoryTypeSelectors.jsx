import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CategoryTypeSelectors = ({
  category,
  type,
  restaurantCategories = [],
  errors = {},
  setFormData,
  setFormErrors
}) => {
  // ✅ Get the display name for the current category
  const getCategoryDisplayName = () => {
    if (!category) return "";
    
    // Find the category in restaurantCategories
    const foundCategory = restaurantCategories.find(cat => {
      const catId = typeof cat === "object" ? cat._id : cat;
      const catName = typeof cat === "object" ? cat.name : cat;
      
      return catId === category || catName === category;
    });
    
    if (foundCategory) {
      return typeof foundCategory === "object" ? foundCategory.name : foundCategory;
    }
    
    return category; // Return the raw value if not found
  };

  const handleCategoryChange = (val) => {
    setFormData((prev) => ({ ...prev, category: val }));
    
    if (errors.category && setFormErrors) {
      setFormErrors(prev => ({ ...prev, category: "" }));
    }
  };

  const handleTypeChange = (val) => {
    setFormData((prev) => ({ ...prev, type: val }));
    
    if (errors.type && setFormErrors) {
      setFormErrors(prev => ({ ...prev, type: "" }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* CATEGORY - FIXED */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Category *
        </label>

        <Select
          value={category || ""}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger
            className={`w-full border ${
              errors.category
                ? "border-red-500 bg-red-50"
                : "border-orange-500 bg-orange-50"
            } rounded-lg p-3 text-sm`}
          >
            <SelectValue placeholder="Select a Category">
              {getCategoryDisplayName() || "Select a Category"}
            </SelectValue>
          </SelectTrigger>

          <SelectContent className="bg-orange-50 border-orange-300 shadow-xl rounded-xl p-1 max-h-60 overflow-y-auto">
            <SelectGroup>
              {restaurantCategories.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  No categories found
                </div>
              ) : (
                restaurantCategories.map((cat) => {
                  const catId = typeof cat === "object" ? cat._id : cat;
                  const catName = typeof cat === "object" ? cat.name : cat;

                  return (
                    <SelectItem
                      key={catId}
                      value={catId}
                      className="data-[highlighted]:bg-orange-200"
                    >
                      {catName}
                    </SelectItem>
                  );
                })
              )}
            </SelectGroup>
          </SelectContent>
        </Select>

        {errors.category && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <ExclamationCircleIcon className="w-4 h-4" />
            {errors.category}
          </p>
        )}
      </div>

      {/* FOOD TYPE - FIXED */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Food Type *
        </label>

        <Select
          value={type || ""}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger
            className={`w-full border ${
              errors.type
                ? "border-red-500 bg-red-50"
                : "border-orange-500 bg-orange-50"
            } rounded-lg p-3 text-sm`}
          >
            <SelectValue placeholder="Select Food Type">
              {type === "veg" && "Veg"}
              {type === "non-veg" && "Non-Veg"}
              {type === "mixed" && "Mixed"}
              {!type && "Select Food Type"}
            </SelectValue>
          </SelectTrigger>

          <SelectContent className="bg-orange-50 border-orange-300 shadow-xl rounded-xl p-1">
            <SelectGroup>
              <SelectItem value="veg">Veg</SelectItem>
              <SelectItem value="non-veg">Non-Veg</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {errors.type && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <ExclamationCircleIcon className="w-4 h-4" />
            {errors.type}
          </p>
        )}
      </div>
    </div>
  );
};

export default CategoryTypeSelectors;
