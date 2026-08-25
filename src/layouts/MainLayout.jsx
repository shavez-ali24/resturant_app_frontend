import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("client-theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isDarkMode) {
      root.classList.add("client-dark");
      root.classList.add("dark");
      body.classList.add("client-dark");
    } else {
      root.classList.remove("client-dark");
      root.classList.remove("dark");
      body.classList.remove("client-dark");
    }

    return () => {
      root.classList.remove("client-dark");
      root.classList.remove("dark");
      body.classList.remove("client-dark");
    };
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("client-theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <div
      className={[
        "client-app-shell relative mx-auto min-h-screen max-w-[520px]",
        "overflow-hidden font-mostrate font-semibold",
        isDarkMode
          ? "client-dark dark bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-slate-100"
          : "bg-gradient-to-b from-orange-50/80 via-[#fffcf9] to-[#fffbf6] text-slate-900",
      ].join(" ")}
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0",
          isDarkMode
            ? "bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_58%)]"
            : "bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.14),transparent_58%)]",
        ].join(" ")}
      />

      <main
        className={[
          "relative min-h-screen",
          isDarkMode
            ? "bg-slate-950/70"
            : "bg-[#fffcf9]",
        ].join(" ")}
      >
        <Outlet
          context={{
            isDarkMode,
            toggleDarkMode,
          }}
        />
      </main>
    </div>
  );
}
