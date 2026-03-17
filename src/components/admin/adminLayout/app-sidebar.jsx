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
import logo from "@/assets/tapNbite-176x96.png";
// import logo from "@/assets/loader.gif";

import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar({ isDarkMode = false, ...props }) {
  const { isMobile, open, setOpen, openMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const previousPathRef = React.useRef(location.pathname);
  const sidebarShellClass = isDarkMode
    ? "border-r border-slate-700/70 bg-slate-950 [&_[data-sidebar=sidebar]]:bg-slate-950"
    : "";
  const sidebarSectionClass = isDarkMode
    ? "bg-slate-950"
    : "bg-gradient-to-r from-orange-50 to-orange-100";

  // Get user role from localStorage
  const userRole = localStorage.getItem("userRole") || "";
  const isAdmin = userRole === "admin";
  const isStaff = userRole === "staff";
  const homeRoute = isStaff ? "/admin/orders" : "/admin";

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
            items: [{ title: "Menu", url: "/admin/menu" }],
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

  const closeSidebarForViewport = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 1024) {
      if (isMobile) {
        setOpenMobile(false);
      } else {
        setOpen(false);
      }
    }
  }, [isMobile, setOpen, setOpenMobile]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const prevPath = previousPathRef.current;
    if (prevPath === location.pathname) return;
    previousPathRef.current = location.pathname;

    if (window.innerWidth < 1024) {
      if (isMobile) {
        setOpenMobile(false);
      } else {
        setOpen(false);
      }
    }
  }, [location.pathname, isMobile, setOpen, setOpenMobile]);

  return (
    <Sidebar
      className={`overflow-y-auto !h-[calc(100svh-var(--header-height))] ${sidebarShellClass}`}
      {...props}
    >
      {/* Header */}
      <SidebarHeader className={`px-14 py-3 ${sidebarSectionClass}`}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className={`mt-0 sm:mt-20 ${sidebarSectionClass}`}
            >
              <Link
                to={homeRoute}
                onClick={closeSidebarForViewport}
              >
                <img
                  src={logo}
                  alt="Logo"
                  width="88"
                  height="48"
                  decoding="async"
                  className="h-12 w-auto"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className={sidebarSectionClass}>
        <NavMain
          isDarkMode={isDarkMode}
          items={filteredNavMain.map((section) => ({
            ...section,
            items: section.items.map((item) => ({
              ...item,
              onClick: closeSidebarForViewport,
            })),
          }))}
        />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className={sidebarSectionClass}>
        <NavUser user={userData} isDarkMode={isDarkMode} />
      </SidebarFooter>
    </Sidebar>
  );
}
