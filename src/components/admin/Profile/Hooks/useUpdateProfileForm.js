import { useState, useCallback } from "react";
import config from "../../../../config";

export const useUpdateProfileForm = (initialData, token, onUpdateSuccess) => {
    const [formData, setFormData] = useState({
        tableNumbers: initialData.tableNumbers || "",
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
        publicId: initialData.logo?.public_id || "",
    });

    const [categories, setCategories] = useState(initialData.categories || []);
    const [currentCategoryInput, setCurrentCategoryInput] = useState("");
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "",
    });

    const [categorySuggestions, setCategorySuggestions] = useState(() => {
        try {
            const saved = localStorage.getItem("restaurantCategories");
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Error parsing categories from localStorage:", e);
            return [];
        }
    });

    const showNotification = (message, type = "success") => {
        setNotification({ show: true, message, type });
    };

    const closeNotification = () => {
        const notificationType = notification.type;
        setNotification({ show: false, message: "", type: "" });
        if (notificationType === "success") {
            onUpdateSuccess();
        }
    };

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

    // --- Category Handlers ---

    // const handleCategoryKeyDown = (e) => {
    //     if (e.key === "Enter" || e.key === " ") {
    //         e.preventDefault();
    //         const value = currentCategoryInput.trim();
    //         if (!value) return;

    //         const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);

    //         if (!categories.includes(capitalizedValue)) {
    //             setCategories((prev) => [...prev, capitalizedValue]);

    //             if (!categorySuggestions.includes(capitalizedValue)) {
    //                 const updatedSuggestions = [...categorySuggestions, capitalizedValue];
    //                 setCategorySuggestions(updatedSuggestions);
    //                 localStorage.setItem(
    //                     "restaurantCategories",
    //                     JSON.stringify(updatedSuggestions)
    //                 );
    //             }
    //         }
    //         setCurrentCategoryInput("");
    //     }
    // };
    const handleCategoryKeyDown = (e) => {
        // Only check for "Enter"
        if (e.key === "Enter") {
            e.preventDefault();

            // Trim whitespace AND any trailing hyphens
            const value = currentCategoryInput.trim().replace(/-+$/, "");

            if (!value) return;

            const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);

            if (!categories.includes(capitalizedValue)) {
                setCategories((prev) => [...prev, capitalizedValue]);

                if (!categorySuggestions.includes(capitalizedValue)) {
                    const updatedSuggestions = [...categorySuggestions, capitalizedValue];
                    setCategorySuggestions(updatedSuggestions);
                    localStorage.setItem(
                        "restaurantCategories",
                        JSON.stringify(updatedSuggestions)
                    );
                }
            }
            setCurrentCategoryInput("");
        }
    };
    const handleRemoveCategory = useCallback((categoryToRemove) => {
        setCategories((prev) => prev.filter((cat) => cat !== categoryToRemove));
    }, []);

    // --- Form Submission ---

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
            return;
        }

        try {
            setIsSubmitting(true);
            const formDataToUpload = new FormData();

            // ✅ UPDATED: Append all form data fields EXCEPT orderModes
            Object.keys(formData).forEach((key) => {
                if (key !== "orderModes") {
                    formDataToUpload.append(key, formData[key]);
                }
            });

            // ✅ UPDATED: Append orderModes as separate fields
            formDataToUpload.append(
                "orderModes[eathere]",
                formData.orderModes.eathere
            );
            formDataToUpload.append(
                "orderModes[takeaway]",
                formData.orderModes.takeaway
            );
            formDataToUpload.append(
                "orderModes[delivery]",
                formData.orderModes.delivery
            );

            if (file) {
                formDataToUpload.append("file", file);
            }

            // Append categories array
            categories.forEach((category) => {
                formDataToUpload.append("categories", category);
            });
            if (categories.length === 0) {
                formDataToUpload.append("categories", ""); // To clear array on backend
            }

            const res = await fetch(`${config.BASE_URL}/api/restaurant/`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formDataToUpload,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to update");

            showNotification("Restaurant updated successfully!", "success");
            // onUpdateSuccess() will be called from closeNotification
        } catch (err) {
            console.error("Update error:", err);
            showNotification(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ NEW: Calculate active modes count for disabling toggles
    const activeModesCount = Object.values(formData.orderModes).filter(Boolean)
        .length;
    const atLeastOneModeActive = activeModesCount > 0;

    return {
        formData, categories, currentCategoryInput, setCurrentCategoryInput,
        file, fileError, isSubmitting, notification, categorySuggestions,
        activeModesCount, atLeastOneModeActive, handleChange, handleGstToggle,
        handleOrderModeToggle, handleFileChange, handleCategoryKeyDown,
        handleRemoveCategory, handleSubmit, closeNotification,
    };
}