import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "@/components/admin/adminLayout/AdminHeader";
import { NotificationProvider } from "@/components/admin/Bell/NotificationContext";

export default function AdminLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme");
    setIsDarkMode(savedTheme === "dark");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isDarkMode) {
      root.classList.add("admin-dark");
      root.classList.add("dark");
      body.classList.add("admin-dark");
    } else {
      root.classList.remove("admin-dark");
      root.classList.remove("dark");
      body.classList.remove("admin-dark");
    }

    return () => {
      root.classList.remove("admin-dark");
      root.classList.remove("dark");
      body.classList.remove("admin-dark");
    };
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("admin-theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <div
      className={`mx-auto min-h-screen font-mostrate font-semibold ${isDarkMode
          ? "admin-dark dark bg-[linear-gradient(180deg,#0f172a_0%,#111827_48%,#020617_100%)] text-slate-100"
          : "bg-[linear-gradient(180deg,#fffaf5_0%,#fffdfb_48%,#ffffff_100%)] text-slate-900"
        }`}
    >
      <NotificationProvider>
        <AdminHeader
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      </NotificationProvider>
    </div>
  );
}
