"use client";

import React, { useEffect } from "react";
import { useGetRestaurantQuery } from "@/redux/clientRedux/clientAPI";

const DynamicFavicon = () => {
  const { data, isLoading, isError } = useGetRestaurantQuery();

  useEffect(() => {
    if (isLoading || isError) return;

    // Get logo URL from API, fallback to default favicon if not available
    const logoUrl = data?.restaurant?.logo?.url || "/favicon.png";
    if (!logoUrl) return;

    // Remove existing favicons
    const existingIcons = document.querySelectorAll("link[rel='icon']");
    existingIcons.forEach((el) => el.parentNode.removeChild(el));

    // Create new favicon
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.href = logoUrl;
    favicon.type = "image/png";

    document.head.appendChild(favicon);

    // Cleanup function (optional)
    return () => {
      document.head.removeChild(favicon);
    };
  }, [data, isLoading, isError]);

  return null; // No UI component
};

export default DynamicFavicon;
