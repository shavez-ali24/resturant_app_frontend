// ─── IMPORTS ───────────────────────────────────────────
// MainLayout — Client app shell (mobile-first, 520px max-width, dark mode support)
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
          ? "client-dark dark bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-slate-100"
          : "bg-gradient-to-b from-orange-50/80 via-[#fffcf9] to-[#fffbf6] text-slate-900"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDarkMode
            ? "bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_58%)]"
            : "bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.14),transparent_58%)]"
        }`}
      />
      <main className={`relative min-h-screen ${isDarkMode ? "bg-slate-950/70" : "bg-[#fffcf9]"}`}>
        <Outlet context={{ isDarkMode, toggleDarkMode }} />
      </main>
    </div>
  );
}
