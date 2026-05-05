import { useState, useCallback, useRef } from "react";
import { useUpdateRestaurantProfileMutation } from "@/redux/adminRedux/adminAPI";

const getCategoryText = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }
    if (typeof value !== "object") return String(value);

    const candidate =
        value.name ||
        value.category ||
        value.categoryName ||
        value.label ||
        value.title ||
        value.value ||
        value.displayName;

    if (candidate) return String(candidate);

    const numericKeys = Object.keys(value).filter((key) => /^\d+$/.test(key));
    if (numericKeys.length) {
        numericKeys.sort((a, b) => Number(a) - Number(b));
        return numericKeys.map((key) => value[key]).join("");
    }

    if (typeof value.toString === "function") {
        const text = String(value);
        if (text && text !== "[object Object]") return text;
    }

    return "";
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

const normalizeCategoryInput = (value = "") =>
    getCategoryText(value)
        .replace(/-+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const formatCategoryLabel = (value = "") => {
    const normalized = normalizeCategoryInput(value);
    if (!normalized) return "";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getCategoryKey = (value = "") =>
    normalizeCategoryInput(value).toLowerCase();

const uniqueCategories = (values = []) => {
    const safeValues = Array.isArray(values) ? values : [];
    const seen = new Set();
    const result = [];

    safeValues.forEach((value) => {
        const label = formatCategoryLabel(value);
        const key = getCategoryKey(label);
        if (!key || seen.has(key)) return;
        seen.add(key);
        result.push(label);
    });

    return result;
};

export const useUpdateProfileForm = (initialData, token, onUpdateSuccess, onClose) => { // Added onClose parameter
    // Redux Mutation
    const [updateRestaurantProfile, { isLoading: isSubmitting }] = useUpdateRestaurantProfileMutation();

    const [formData, setFormData] = useState({
        phoneNumber: initialData.phoneNumber || "",
        address: initialData.address || "",
        gstNumber: initialData.gstNumber || "",
        gstEnabled: initialData.gstEnabled || false,
        orderModes: {
            eathere: initialData.orderModes?.eathere ?? true,
            takeaway: initialData.orderModes?.takeaway ?? true,
            delivery: initialData.orderModes?.delivery ?? true,
        },
        gstRate: initialData.gstRate || 0,
        deliveryCharges: initialData.deliveryCharges || 0,
        publicId: initialData.logo?.public_id || "",
        sections: {
            indoor:  { tables: initialData.sections?.indoor?.tables  ?? 0 },
            outdoor: { tables: initialData.sections?.outdoor?.tables ?? 0 },
            rooftop: { tables: initialData.sections?.rooftop?.tables ?? 0 },
            rooms:   { rooms:  initialData.sections?.rooms?.rooms    ?? 0 },
        },
    });

    const initialCategoryLabels = uniqueCategories(initialData?.categories || []);
    const [categories, setCategories] = useState(() => initialCategoryLabels);
    const initialCategoriesRef = useRef(initialCategoryLabels);
    const [categoryMode] = useState(() =>
        resolveCategoryMode(initialData?.categories || [])
    );
    const [currentCategoryInput, setCurrentCategoryInput] = useState("");
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");

    const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "",
    });

    const [categorySuggestions, setCategorySuggestions] = useState(() => {
        try {
            const saved = localStorage.getItem("restaurantCategories");
            const parsed = saved ? JSON.parse(saved) : [];
            return uniqueCategories(parsed);
        } catch (e) {
            console.error("Error parsing categories from localStorage:", e);
            return [];
        }
    });

    const showNotification = (message, type = "success") => {
        setNotification({ show: true, message, type });
    };

    const closeNotification = () => {
        setNotification({ show: false, message: "", type: "" });
    };

    const scrollToSelector = (selector) => {
        if (typeof document === "undefined") return;
        const target = document.querySelector(selector);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof target.focus === "function") {
            setTimeout(() => target.focus({ preventScroll: true }), 200);
        }
    };

    const scrollToField = (name) => scrollToSelector(`[name="${name}"]`);
    const scrollToId = (id) => scrollToSelector(`#${id}`);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        if (name === "phoneNumber") {
            processedValue = value.replace(/\D/g, "");
            if (processedValue.length > 10) {
                processedValue = processedValue.slice(0, 10);
            }
        } else if (name === "gstRate") {
            processedValue = value
                .replace(/[^0-9.]/g, "")
                .replace(/(\..*?)\..*/g, "$1");
        } else if (name === "deliveryCharges") {
            processedValue = value.replace(/[^0-9]/g, "");
        }

        // Handle nested sections fields e.g. "sections.indoor.tables"
        if (name.startsWith("sections.")) {
            const parts = name.split(".");
            // parts = ["sections", "indoor", "tables"] or ["sections", "rooms", "rooms"]
            const section = parts[1];
            const field = parts[2];
            const numVal = parseInt(processedValue, 10);
            setFormData((prev) => ({
                ...prev,
                sections: {
                    ...prev.sections,
                    [section]: {
                        ...prev.sections?.[section],
                        [field]: isNaN(numVal) ? 0 : Math.max(0, numVal),
                    },
                },
            }));
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: processedValue }));
    };

    const handleGstToggle = (e) => {
        const isEnabled = e.target.checked;
        setFormData((prev) => ({
            ...prev,
            gstEnabled: isEnabled,
            gstNumber: isEnabled ? prev.gstNumber : "",
            gstRate: isEnabled ? prev.gstRate : 0,
        }));
    };

    // ✅ UPDATED: Logic to prevent disabling the last order mode
    const handleOrderModeToggle = (mode) => {
        const currentModes = formData.orderModes;
        const currentValue = currentModes[mode];

        // If the user is trying to turn a mode OFF (from true to false)
        if (currentValue === true) {
            // Count how many modes are currently active
            const activeModesCount = Object.values(currentModes).filter(Boolean).length;

            // If this is the LAST active mode, prevent turning it off
            if (activeModesCount === 1) {
                showNotification("At least one order mode must be enabled.", "error");
                return; // Stop the function here
            }
        }

        // If the check passes (or if user is turning a mode ON), update the state
        setFormData((prev) => ({
            ...prev,
            orderModes: {
                ...prev.orderModes,
                [mode]: !prev.orderModes[mode],
            },
        }));
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFileError("");
        setFile(null);
        if (!selectedFile) return;

        const fileSizeInKB = selectedFile.size / 1024;
        if (fileSizeInKB > 300) {
            setFileError(
                `File size too large: ${fileSizeInKB.toFixed(2)} KB. Max: 300KB`
            );
            e.target.value = "";
            return;
        }
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/avif",
        ];
        if (!allowedTypes.includes(selectedFile.type)) {
            setFileError("Please select a valid image file (JPEG, PNG, etc.)");
            e.target.value = "";
            return;
        }
        setFile(selectedFile);
    };

    // Category Handlers
    const addCategoryFromInput = () => {
        const formattedValue = formatCategoryLabel(currentCategoryInput);

        if (!formattedValue) return;

        setCategories((prev) => {
            const exists = prev.some(
                (category) =>
                    getCategoryKey(category) === getCategoryKey(formattedValue)
            );
            if (exists) return prev;
            return [...prev, formattedValue];
        });

        setCategorySuggestions((prev) => {
            const updatedSuggestions = uniqueCategories([
                ...prev,
                formattedValue,
            ]);
            localStorage.setItem(
                "restaurantCategories",
                JSON.stringify(updatedSuggestions)
            );
            return updatedSuggestions;
        });

        setCurrentCategoryInput("");
    };

    const handleCategoryKeyDown = (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        addCategoryFromInput();
    };

    const handleRemoveCategory = useCallback((categoryToRemove) => {
        setCategories((prev) => prev.filter((cat) => cat !== categoryToRemove));
    }, []);

    const hasCategoryChanges = (current = [], initial = []) => {
        if (current.length !== initial.length) return true;
        return current.some(
            (value, index) => getCategoryKey(value) !== getCategoryKey(initial[index])
        );
    };

    // --- Form Submission with Redux ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            showNotification("No token found. Please login first", "error");
            return;
        }
        
        if (fileError) {
            showNotification(fileError, "error");
            return;
        }

        const { eathere, takeaway, delivery } = formData.orderModes;
        if (!eathere && !takeaway && !delivery) {
            showNotification("At least one order mode must be enabled.", "error");
            scrollToId("eathere-toggle");
            return;
        }

        if (formData.gstEnabled) {
            const gstNumber = String(formData.gstNumber || "").trim();
            const gstRateValue = Number(formData.gstRate);
            if (!gstNumber) {
                showNotification("GST number is required when GST is enabled.", "error");
                scrollToField("gstNumber");
                return;
            }
            if (!gstRateValue) {
                showNotification("GST rate is required when GST is enabled.", "error");
                scrollToField("gstRate");
                return;
            }
        }

        try {
            const formDataToUpload = new FormData();

            // Append all form data fields EXCEPT orderModes and sections
            Object.keys(formData).forEach((key) => {
                if (key !== "orderModes" && key !== "sections") {
                    formDataToUpload.append(key, formData[key]);
                }
            });

            // Append orderModes as separate fields
            formDataToUpload.append("orderModes[eathere]", formData.orderModes.eathere);
            formDataToUpload.append("orderModes[takeaway]", formData.orderModes.takeaway);
            formDataToUpload.append("orderModes[delivery]", formData.orderModes.delivery);

            // Append sections as nested fields
            formDataToUpload.append("sections[indoor][tables]",  formData.sections?.indoor?.tables  ?? 0);
            formDataToUpload.append("sections[outdoor][tables]", formData.sections?.outdoor?.tables ?? 0);
            formDataToUpload.append("sections[rooftop][tables]", formData.sections?.rooftop?.tables ?? 0);
            formDataToUpload.append("sections[rooms][rooms]",    formData.sections?.rooms?.rooms    ?? 0);

            if (file) {
                formDataToUpload.append("file", file);
            }

            const categoriesChanged = hasCategoryChanges(
                categories,
                initialCategoriesRef.current
            );

            if (categoryMode.mode === "object") {
                if (categoriesChanged) {
                    categories.forEach((category, index) => {
                        formDataToUpload.append(
                            `categories[${index}][${categoryMode.key}]`,
                            category
                        );
                        formDataToUpload.append(
                            `categories[${index}][displayOrder]`,
                            index
                        );
                    });
                }
            } else {
                // Append categories array as strings
                // categories.forEach((category) => {
                //     formDataToUpload.append("categories", category);
                // });

                categories.forEach((category, index) => {
    formDataToUpload.append(
        `categories[${index}][name]`,
        category
    );
    formDataToUpload.append(
        `categories[${index}][displayOrder]`,
        index
    );
});

                if (categories.length === 0) {
                    formDataToUpload.append("categories", ""); // To clear array on backend
                }
            }

            // Use Redux mutation
            const result = await updateRestaurantProfile(formDataToUpload).unwrap();
            
            if (result) {
                // CLOSE MODAL FIRST
                if (onClose) {
                    onClose();
                }
                
                // THEN TRIGGER SUCCESS CALLBACK (this will show notification in Profile)
                if (onUpdateSuccess) {
                    onUpdateSuccess();
                }
            }
            
        } catch (err) {
            console.error("Update error:", err);
            const errorMessage = err?.data?.message || err?.message || "Failed to update restaurant";
            showNotification(errorMessage, "error");
        }
    };

    // ✅ Calculate active modes count for disabling toggles
    const activeModesCount = Object.values(formData.orderModes).filter(Boolean).length;
    const atLeastOneModeActive = activeModesCount > 0;

    return {
        formData, 
        categories, 
        currentCategoryInput, 
        setCurrentCategoryInput,
        file, 
        fileError, 
        isSubmitting, // Now from Redux
        notification, 
        categorySuggestions,
        activeModesCount, 
        atLeastOneModeActive, 
        handleChange, 
        handleGstToggle,
        handleOrderModeToggle, 
        handleFileChange, 
        handleCategoryKeyDown,
        handleAddCategory: addCategoryFromInput,
        handleRemoveCategory, 
        handleSubmit, 
        closeNotification,
    };
};
