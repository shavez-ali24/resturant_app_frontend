import React from "react";
import { useGetMenuQuery } from "../../redux/clientRedux/clientAPI";

const HelperData = () => {
  const { data, isLoading: loading, error } = useGetMenuQuery();

  if (loading) return <p>Loading menu...</p>;
  if (error) return <p>Error: {error?.data?.message || error?.message || 'An error occurred'}</p>;

  const menu = Array.isArray(data) ? data : Array.isArray(data?.menu) ? data.menu : [];

  return (
    <div>
      <h1>Menu</h1>
      <ul>
        {menu.map((item) => (
          <li key={item._id}>
            {item.name} - ${item.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HelperData;