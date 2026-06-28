import { useEffect } from "react";
import { useGetPublicRestaurantQuery } from "@/redux/clientRedux/clientAPI";

import logoFallback from "@/assets/tapNbite.png";

const DynamicFavicon = () => {
  const { data, isLoading, isError } = useGetPublicRestaurantQuery();

  useEffect(() => {
    if (isLoading || isError) return;

    const logoUrl = data?.restaurant?.logo?.url || logoFallback;
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
