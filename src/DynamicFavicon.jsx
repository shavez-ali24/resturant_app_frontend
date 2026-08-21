import { useEffect } from "react";
import { useGetPublicRestaurantQuery } from "@/redux/clientRedux/clientAPI";
import logoFallback from "@/assets/tapNbite.png";

const DynamicFavicon = () => {
  const { data, isLoading } = useGetPublicRestaurantQuery();

  useEffect(() => {
    if (isLoading) return;

    const favicon = document.getElementById("dynamic-favicon");
    if (!favicon) return;

    favicon.href = data?.restaurant?.logo?.url || logoFallback;
  }, [data, isLoading]);

  return null; // No UI component
};

export default DynamicFavicon;
