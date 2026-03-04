import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="relative mx-auto min-h-screen max-w-[520px] overflow-hidden bg-[linear-gradient(180deg,#fffaf5_0%,#fffdfb_48%,#ffffff_100%)] font-mostrate font-semibold text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.14),transparent_58%)]" />
      <main className="relative min-h-screen bg-white">
        <Outlet /> {/* <-- Renders child route here */}
      </main>
    </div>
  );
}
