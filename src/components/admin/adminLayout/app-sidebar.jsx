import * as React from "react";
import {
  Utensils,
  User,
  ClipboardList,
  TrendingUp,
  Boxes,
  ChefHat,
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

import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar({ isDarkMode = false, ...props }) {
  const { isMobile, open, setOpen, openMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const previousPathRef = React.useRef(location.pathname);
  const openRef = React.useRef(open);
  const autoCollapseTimerRef = React.useRef(null);
  const sidebarRootRef = React.useRef(null);
  const sidebarFixedRef = React.useRef(null);
  const hoverActivatedRef = React.useRef(false);
  const hoverOpenRef = React.useRef(false);
  const hoverOpenTimerRef = React.useRef(null);
  const hoverCloseTimerRef = React.useRef(null);
  const sidebarShellClass = isDarkMode
    ? "border-r border-slate-700/70 bg-[#0f172a] [&_[data-sidebar=sidebar]]:bg-[#0f172a]"
    : "border-r border-[#ede8e3] bg-white [&_[data-sidebar=sidebar]]:bg-white";
  const sidebarSectionClass = isDarkMode
    ? "bg-[#0f172a]"
    : "bg-white";

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
    ...(isAdmin || isStaff
      ? [
        {
          title: "Kitchen KDS",
          url: "#",
          icon: ChefHat,
          isActive: true,
          roles: ["admin", "staff"],
          items: [{ title: "Kitchen View", url: "/kds", target: "_blank" }],
        },
      ]
      : []),
    {
      title: "Orders",
      url: "#",
      icon: ClipboardList,
      isActive: true,
      roles: ["admin", "staff"],
      items: [
        { title: "Live Orders", url: "/admin/orders" },
        { title: "Completed Orders", url: "/admin/completedorder" },
        { title: "Cancelled Orders", url: "/admin/cancelledorder" },
      ],
    },

    ...(isAdmin || isStaff
      ? [
        {
          title: "Digital Menu",
          url: "#",
          icon: Utensils,
          isActive: true,
          roles: ["admin", "staff"],
          items: [{ title: "Edit Menu", url: "/admin/menu" }],
        },
      ]
      : []),
    ...(isAdmin
      ? [
          {
            title: "Analytics",
            url: "#",
            icon: TrendingUp,
            isActive: true,
            roles: ["admin"],
            items: [
              { title: "Revenue", url: "/admin/revenue" },
              { title: "Sales", url: "/admin/sales" },
            ],
          },
        ]
      : []),
    /*
    ...(isAdmin
      ? [
          {
            title: "Inventory",
            url: "#",
            icon: Boxes,
            isActive: true,
            roles: ["admin"],
            items: [{ title: "Stock Control", url: "/admin/comingsoon" }],
          },
        ]
      : []),
    */
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
      ref={sidebarRootRef}
      className={`overflow-y-auto !h-[calc(100svh-var(--header-height))] ${sidebarShellClass}`}
      collapsible="icon"
      {...props}
    >
      {/* Header */}
      <SidebarHeader className={`px-14 py-3 group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:py-4 group-data-[collapsible=icon]:items-center ${sidebarSectionClass}`}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className={`mt-0 sm:mt-20 group-data-[collapsible=icon]:mt-20 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:justify-center hover:!bg-transparent active:!bg-transparent focus:!bg-transparent ${sidebarSectionClass}`}
              style={{ backgroundColor: 'transparent' }}
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
                  className="h-12 w-auto group-data-[collapsible=icon]:hidden"
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


    </Sidebar>
  );
}
