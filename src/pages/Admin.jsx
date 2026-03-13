import Sales from "@/components/admin/observability/sales/Sales";
import { Navigate } from "react-router-dom";

export default function Admin() {
  const userRole =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : "";

  if (userRole === "staff") {
    return <Navigate to="/admin/orders" replace />;
  }

  return (
    <>
      <Sales />
    </>
  );
}
