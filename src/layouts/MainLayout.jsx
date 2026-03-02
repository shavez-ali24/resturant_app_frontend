import { Link, Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="max-w-[500px] mx-auto bg-white min-h-screen font-mostrate font-semibold">
      <main>
        <Outlet /> {/* <-- Renders child route here */}
      </main>
    </div>
  );
}
