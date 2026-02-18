import * as React from "react";
import {
  SquareMenu,
  User,
  ListOrdered,
  ChartNoAxesCombined,
  Users,
  DollarSign,
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
import logo from "@/assets/tapNOrder.png";
// import logo from "@/assets/loader.gif";

import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar({ ...props }) {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();

  // Get user role from localStorage
  const userRole = localStorage.getItem("userRole") || "";
  const isAdmin = userRole === "admin";
  const isStaff = userRole === "staff";

  const userData = {
    name: localStorage.getItem("userName") || "User",
    email: localStorage.getItem("userEmail") || "",
    avatar: localStorage.getItem("userAvatar") || "",
  };

  // Define navigation items based on role
  const navMain = [
    {
      title: "Order Management",
      url: "#",
      icon: ListOrdered,
      isActive: true,
      roles: ["admin", "staff"],
      items: [
        { title: "Pending Orders", url: "/admin/orders" },
        { title: "Completed Orders", url: "/admin/completedorder" },
        { title: "Cancelled Orders", url: "/admin/cancelledorder" },
      ],
    },
    ...(isAdmin || isStaff
      ? [
          {
            title: "Menu Management",
            url: "#",
            icon: SquareMenu,
            isActive: true,
            roles: ["admin", "staff"],
            items: [{ title: "Menu Items", url: "/admin/menu" }],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: "Observability",
            url: "#",
            icon: ChartNoAxesCombined,
            isActive: true,
            roles: ["admin"],
            items: [
              { title: "Revenue", url: "/admin/revenue" },
              { title: "Sales", url: "/admin/sales" },
            ],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: "Inventory Management",
            url: "#",
            icon: SquareMenu,
            isActive: true,
            roles: ["admin"],
            items: [{ title: "coming soon", url: "/admin/comingsoon" }],
          },
        ]
      : []),
    {
      title: "Profile",
      url: "/admin/profile",
      icon: User,
      isActive: location.pathname === "/admin/profile",
      roles: ["admin", "staff"],
      items: [],
    },
  ];

  // Filter items based on user role
  const filteredNavMain = navMain.filter(
    (section) => section.roles.includes(userRole) && section.items.length > 0
  );

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
      <SidebarHeader className=" px-14 py-3  bg-gradient-to-r from-orange-50 to-orange-100 ">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="mt-0 sm:mt-20 bg-gradient-to-r from-orange-50 to-orange-100"
            >
              <Link
                to="/admin"
                onClick={() =>
                  window.innerWidth < 1024 && toggleSidebar(false)
                }
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
          items={filteredNavMain.map((section) => ({
            ...section,
            items: section.items.map((item) => ({
              ...item,
              onClick: () =>
                window.innerWidth < 1024 && toggleSidebar(false),
            })),
          }))}
          itemClassName="hover:bg-orange-200/70 rounded-lg transition-colors duration-200"
        />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className=" bg-gradient-to-r from-orange-50 to-orange-100">
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
