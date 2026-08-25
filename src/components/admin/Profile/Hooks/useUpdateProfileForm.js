import { useState, useCallback } from "react";
import {
    useUpdateRestaurantMutation,
    useUpdateRestaurantGSTMutation
} from "@/redux/adminRedux/adminAPI";

export const useUpdateProfileForm = (initialData, onUpdateSuccess) => {
    // Redux Mutations
    const [updateRestaurantProfile, { isLoading: isProfileSubmitting }] = useUpdateRestaurantMutation();
    const [updateGSTSettings, { isLoading: isGSTSubmitting }] = useUpdateRestaurantGSTMutation();
    const isSubmitting = isProfileSubmitting || isGSTSubmitting;

    const [formData, setFormData] = useState({
        restaurantName: initialData.restaurantName || initialData.name || "",
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
            indoor: { tables: initialData.sections?.indoor?.tables ?? 0 },
            outdoor: { tables: initialData.sections?.outdoor?.tables ?? 0 },
            rooftop: { tables: initialData.sections?.rooftop?.tables ?? 0 },
            rooms: { rooms: initialData.sections?.rooms?.rooms ?? 0 },
        },
    });

    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");

    // ── Name display style (frontend-only, stored in localStorage) ──────────
    const [nameStyle, setNameStyle] = useState(() => {
        try {
            const saved = localStorage.getItem("restaurantNameStyle");
            return saved ? JSON.parse(saved) : { fontSize: 24, align: "left" };
        } catch {
            return { fontSize: 24, align: "left" };
        }
    });

    const handleNameStyleChange = (newStyle) => {
        setNameStyle(newStyle);
        try {
            localStorage.setItem("restaurantNameStyle", JSON.stringify(newStyle));
        } catch { /* ignore */ }
    };

    const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "",
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
        } else if (name === "restaurantName") {
            processedValue = value.slice(0, 30);
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

    const handleOrderModeToggle = (mode) => {
        const currentModes = formData.orderModes;
        const currentValue = currentModes[mode];

        if (currentValue === true) {
            const activeModesCount = Object.values(currentModes).filter(Boolean).length;
            if (activeModesCount === 1) {
                showNotification("At least one order mode must be enabled.", "error");
                return;
            }
        }

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

    const handleSubmit = async (e) => {
        e.preventDefault();

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

            Object.keys(formData).forEach((key) => {
                if (
                    key !== "orderModes" &&
                    key !== "sections" &&
                    key !== "gstEnabled" &&
                    key !== "gstRate" &&
                    key !== "gstNumber" &&
                    key !== "publicId"
                ) {
                    formDataToUpload.append(key, formData[key]);
                }
            });

            formDataToUpload.append("orderModes[eathere]", formData.orderModes.eathere);
            formDataToUpload.append("orderModes[takeaway]", formData.orderModes.takeaway);
            formDataToUpload.append("orderModes[delivery]", formData.orderModes.delivery);

            formDataToUpload.append("sections[indoor][tables]", formData.sections?.indoor?.tables ?? 0);
            formDataToUpload.append("sections[outdoor][tables]", formData.sections?.outdoor?.tables ?? 0);
            formDataToUpload.append("sections[rooftop][tables]", formData.sections?.rooftop?.tables ?? 0);
            formDataToUpload.append("sections[rooms][rooms]", formData.sections?.rooms?.rooms ?? 0);

            if (file) {
                formDataToUpload.append("file", file);
            }

            await Promise.all([
                updateRestaurantProfile(formDataToUpload).unwrap(),
                updateGSTSettings({
                    gstEnabled: formData.gstEnabled,
                    gstRate: Number(formData.gstRate),
                    gstNumber: formData.gstNumber
                }).unwrap()
            ]);

            if (onUpdateSuccess) {
                onUpdateSuccess();
            }

        } catch (err) {
            console.error("Update error:", err);
            const errorMessage = err?.data?.message || err?.message || "Failed to update restaurant";
            showNotification(errorMessage, "error");
        }
    };

    const activeModesCount = Object.values(formData.orderModes).filter(Boolean).length;
    const atLeastOneModeActive = activeModesCount > 0;

    return {
        formData,
        file,
        fileError,
        isSubmitting,
        notification,
        activeModesCount,
        atLeastOneModeActive,
        handleChange,
        handleGstToggle,
        handleOrderModeToggle,
        handleFileChange,
        handleSubmit,
        closeNotification,
        nameStyle,
        handleNameStyleChange,
    };
};
