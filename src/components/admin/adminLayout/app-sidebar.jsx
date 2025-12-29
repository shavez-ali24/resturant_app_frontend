import * as React from "react";
import {
  SquareMenu,
  User,
  ListOrdered,
  ChartNoAxesCombined,
} from "lucide-react";
import { NavMain } from "@/components/admin/adminLayout/nav-main";
import { NavUser } from "@/components/admin/adminLayout/nav-user";

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
          { title: "Pending Orders", url: "/admin/orders" },
          { title: "Completed Orders", url: "/admin/completedorder" },
          { title: "Cancelled Orders", url: "/admin/cancelledorder" },
        ],
      },
      {
        title: "Menu Management",
        url: "#",
        icon: SquareMenu,
        isActive: true,
        items: [
          { title: "Menu", url: "/admin/menu" },
         
        ],
      },
      {
        title: "Observability",
        url: "#",
        icon: ChartNoAxesCombined,
        isActive: true,
        items: [
          { title: "Revenue", url: "/admin/revenue" },

          { title: "Sales", url: "/admin/sales" },
        ],
      },
      {
        title: "Profile",
        url: "/admin/profile",
        icon: User,
        isActive: location.pathname === "/admin/profile",
        items: [],
      }
    ],
  };

  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      toggleSidebar(false);
    }
  }, [location.pathname]);

  return (
    
    <Sidebar
      className="overflow-y-auto  !h-[calc(100svh-var(--header-height))] "
      {...props}
    >
      {/* Header */}
      <SidebarHeader className=" px-4 py-3  bg-gradient-to-r from-orange-50 to-orange-100 ">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="mt-0 sm:mt-20 bg-gradient-to-r from-orange-50 to-orange-100">
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
     <SidebarContent className="bg-gradient-to-r from-orange-50 to-orange-100">
  <NavMain
    className="bg-gradient-to-r from-orange-50 to-orange-100"
    items={data.navMain
      .map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          onClick: () => window.innerWidth < 1024 && toggleSidebar(false),
        })),
      }))
      .filter((item) => item.items.length > 0)}
    itemClassName="hover:bg-orange-200/70 rounded-lg transition-colors duration-200"
  />
</SidebarContent>




      {/* Footer */}
      <SidebarFooter className=" bg-gradient-to-r from-orange-50 to-orange-100">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
