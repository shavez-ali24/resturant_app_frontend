import * as React from "react";
import {
  SquareMenu,
  User,
  ListOrdered,
  ChartNoAxesCombined,
} from "lucide-react";
import { NavMain } from "@/components/admin/nav-main";
import { NavUser } from "@/components/admin/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/tapNOrder.webp";
import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar({ ...props }) {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();

  // Get user data from localStorage
  const userData = {
    name: localStorage.getItem("userName") || "User",
    email: localStorage.getItem("userEmail") || "",
    avatar: localStorage.getItem("userAvatar") || "",
  };

  const data = {
    user: userData,
    navMain: [
     
      {
        title: "Order Management",
        url: "#",
        icon: ListOrdered,
        isActive: true,
        items: [
          { title: "Orders", url: "/admin/orders" },
          { title: "Completed Order", url: "/admin/completedorder" },
          { title: "Cancelled Order", url: "/admin/cancelledorder" },
        ],
      },
      {
        title: "Menu Management",
        url: "#",
        icon: SquareMenu,
        isActive: true,
        items: [
          { title: "Menu", url: "/admin/menu" },
          // {title: "Demo Menu", url: "/admin/demomenu"}
        ],
      },
      {
        title: "Observability",
        url: "#",
        icon: ChartNoAxesCombined,
        isActive: true,
        items: [
          { title: "Sales", url: "/admin/sales" },
          { title: "Revenue", url: "/admin/revenue" },
        ],
      },
    ],
  };

  // Auto close sidebar on route change (for mobile or small screens)
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      toggleSidebar(false);
    }
  }, [location.pathname, toggleSidebar]);

  return (
    <Sidebar
      className="overflow-y-auto  !h-[calc(100svh-var(--header-height))]"
      {...props}
    >
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="mt-12">
              <Link
                to="/admin"
                onClick={() => window.innerWidth < 1024 && toggleSidebar(false)}
              >
                <img src={logo} alt="Logo" className="h-12 w-auto " />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="mt-2">
        <NavMain
          items={data.navMain.map((section) => ({
            ...section,
            items: section.items.map((item) => ({
              ...item,
              onClick: () => window.innerWidth < 1024 && toggleSidebar(false),
            })),
          }))}
        />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
