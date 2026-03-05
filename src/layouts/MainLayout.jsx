import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("client-theme");
    setIsDarkMode(savedTheme === "dark");
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("client-theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <div
      className={`client-app-shell relative mx-auto min-h-screen max-w-[520px] overflow-hidden font-mostrate font-semibold ${
        isDarkMode
          ? "client-dark dark bg-[linear-gradient(180deg,#0f172a_0%,#111827_48%,#020617_100%)] text-slate-100"
          : "bg-[linear-gradient(180deg,#fffaf5_0%,#fffdfb_48%,#ffffff_100%)] text-slate-900"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDarkMode
            ? "bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_58%)]"
            : "bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.14),transparent_58%)]"
        }`}
      />
      <main className={`relative min-h-screen ${isDarkMode ? "bg-slate-950/70" : "bg-white"}`}>
        <Outlet context={{ isDarkMode, toggleDarkMode }} /> {/* <-- Renders child route here */}
      </main>
    </div>
  );
}
