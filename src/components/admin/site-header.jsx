import { useState } from "react";
import { PanelRightClose } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import NotificationBell from "./Filter/NotificationBell";

// ✅ Change this URL to match your backend route
const API_URL = "/api/restaurant/status";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const [isOpen, setIsOpen] = useState();
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const handleToggle = async () => {
    const newStatus = !isOpen;

    // Ask for confirmation
    const confirmChange = window.confirm(
      `Are you sure you want to turn ${newStatus ? "ON" : "OFF"} the restaurant?`
    );

    if (!confirmChange) return;

    try {
      setLoading(true);

      const res = await fetch(API_URL, {
        method: "PATCH", // ✅ using PATCH instead of PUT
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ isOpen: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsOpen(newStatus);
        alert(data.message || `Restaurant is now ${newStatus ? "open" : "closed"}.`);
      } else {
        alert(data.message || "Failed to update restaurant status.");
      }
    } catch (err) {
      console.error("Error updating restaurant status:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="flex sticky top-0 z-50 w-full items-center border-b bg-background p-1">
      <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
        <PanelRightClose
          size={30}
          onClick={toggleSidebar}
          className="cursor-pointer"
        />
        <Separator orientation="vertical" />
        <div className="w-full flex justify-end sm:ml-auto sm:w-auto">
          <div className="flex items-center rounded-xl justify-between border gap-5 border-gray-200 p-2 bg-gray-50">
            <label
              htmlFor="restaurant-toggle"
              className="text-gray-700 font-semibold"
            >
              🏬 Restaurant
            </label>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="restaurant-toggle"
                className="sr-only peer"
                checked={isOpen}
                disabled={loading}
                onChange={handleToggle}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>

            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
}
