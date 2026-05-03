import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for localStorage changes (other tabs clearing token)
    const handleStorage = (e) => {
      if (e.key === "token" && !e.newValue) {
        navigate("/login", { replace: true });
      }
    };

    // Also poll every 30s — catches cases where storage event doesn't fire
    // (e.g. same-tab localStorage.clear())
    const interval = setInterval(() => {
      if (!localStorage.getItem("token")) {
        navigate("/login", { replace: true });
      }
    }, 30000);

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [navigate]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
