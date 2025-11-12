import { useState, useEffect } from "react";
import config from "../../../../config";

const API_URL = `${config.BASE_URL}/api/restaurant`;

export const useProfileData = (token, triggerRefetch) => {
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        restaurantName: "",
        qrCode: "",
        logoUrl: "",
        domain: "",
        address: "",
        phoneNumber: "",
        tableNumbers: "",
        categories: [],
        gstNumber: "",
        gstRate: 0,
        gstEnabled: false,
        // ✅ NEW: Add orderModes to the initial state
        orderModes: { eathere: true, takeaway: true, delivery: true },
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAdminDetails = async () => {
            setLoading(true);
            const localName = localStorage.getItem("userName") || "Admin User";
            const localEmail =
                localStorage.getItem("userEmail") || "admin@example.com";

            if (!token) {
                setError("No token found. Please log in.");
                setProfileData((prev) => ({
                    ...prev,
                    name: localName,
                    email: localEmail,
                    restaurantName: "Login required",
                }));
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/admin`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: token ? `Bearer ${token}` : "",

                    },
                });

                if (!res.ok) {
                    throw new Error(
                        `Failed to fetch restaurant details (Status: ${res.status})`
                    );
                }

                const data = await res.json();
                console.log("Fetched restaurant data:", data);

                if (data.restaurant) {
                    const r = data.restaurant;
                    setProfileData({
                        name: localName,
                        email: localEmail,
                        restaurantName: r.restaurantName || r.name || "My Restaurant",
                        qrCode: r.qrCode || "",
                        logoUrl: r.logo?.url || "",
                        logo: r.logo, // Pass the whole logo object for public_id
                        domain: r.domain || "N/A",
                        address: r.address || "N/A",
                        phoneNumber: r.phoneNumber || "N/A",
                        tableNumbers: r.tableNumbers || "N/A",
                        categories: r.categories || [],
                        gstNumber: r.gstNumber || "N/A",
                        gstRate: r.gstRate || 0,
                        gstEnabled: r.gstEnabled || false,
                        // ✅ NEW: Set the orderModes from the fetched data
                        orderModes: r.orderModes || {
                            eathere: true,
                            takeaway: true,
                            delivery: true,
                        },
                    });
                    setError(null); // Clear any previous error
                } else {
                    throw new Error("Restaurant data not found in response");
                }
            } catch (err) {
                console.error("Error fetching admin details:", err);
                setError(err.message);
                setProfileData((prev) => ({
                    ...prev,
                    name: localName,
                    email: localEmail,
                    restaurantName: "Error Loading Data",
                }));
            } finally {
                setLoading(false);
            }
        };

        fetchAdminDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_URL, token, triggerRefetch]);

    return { profileData, loading, error };
}