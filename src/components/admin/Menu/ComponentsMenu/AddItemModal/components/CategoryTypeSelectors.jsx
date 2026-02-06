import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
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
  restaurantCategories, 
  errors, 
  setFormData 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Category *
        </label>
        <Select
          value={category}
          onValueChange={(val) => {
            setFormData((prev) => ({ ...prev, category: val }));
            if (errors.category) {
              setFormData(prev => ({ ...prev, errors: { ...prev.errors, category: undefined } }));
            }
          }}
        >
          <SelectTrigger
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-orange-50 text-sm ${
              errors.category ? "border-red-500" : "border-orange-500"
            }`}
          >
            <SelectValue placeholder="Select a Category" />
          </SelectTrigger>
          <SelectContent className="bg-orange-50 border-orange-300 shadow-xl rounded-xl p-1 min-w-[140px] cursor-pointer">
            <SelectGroup>
              {restaurantCategories.length === 0 ? (
                <SelectItem value="no-cat" disabled>No categories found</SelectItem>
              ) : (
                restaurantCategories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="data-[highlighted]:bg-orange-200">
                    {cat}
                  </SelectItem>
                ))
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {errors.category}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Food Type *
        </label>
        <Select
          value={type}
          onValueChange={(val) => {
            setFormData((prev) => ({ ...prev, type: val }));
            if (errors.type) {
              setFormData(prev => ({ ...prev, errors: { ...prev.errors, type: undefined } }));
            }
          }}
        >
          <SelectTrigger
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-orange-50 text-sm ${
              errors.type ? "border-red-500" : "border-orange-500"
            }`}
          >
            <SelectValue placeholder="Select Food Type" />
          </SelectTrigger>
          <SelectContent className="bg-orange-50 border-orange-300 shadow-xl rounded-xl p-1 min-w-[140px] cursor-pointer">
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
  );
};

export default CategoryTypeSelectors;
