import * as React from "react";
import {
  Utensils,
  User,
  ClipboardList,
  TrendingUp,
  Boxes,
  ChefHat,
  PanelLeftClose,
  PanelRightClose,
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
import { useSelector } from "react-redux";
import logo from "@/assets/tapNbite-176x96.png";

import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar({ isDarkMode = false, ...props }) {
  const { isMobile, open, setOpen, openMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const colors = useSelector((state) => state.admin.theme.colors) || { primary: "#f97316" };
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
      <SidebarHeader className={`mt-0 sm:mt-14 px-4 py-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4 ${sidebarSectionClass}`}>
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
          <Link
            to={homeRoute}
            onClick={closeSidebarForViewport}
            className="flex-1 group-data-[collapsible=icon]:hidden flex justify-center pl-6"
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
          <button
            type="button"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-full flex items-center justify-center border transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 group-data-[collapsible=icon]:mx-auto shadow-sm"
            style={{
              backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
              borderColor: isDarkMode ? "#334155" : "#ede8e3",
              color: colors.primary,
            }}
            aria-label="Toggle sidebar"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? "#334155" : `${colors.primary}0a`;
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? "#1e293b" : "#ffffff";
              e.currentTarget.style.borderColor = isDarkMode ? "#334155" : "#ede8e3";
            }}
          >
            <PanelLeftClose size={15} className="stroke-[1.8] group-data-[collapsible=icon]:hidden transition-transform duration-300 hover:-translate-x-0.5" />
            <PanelRightClose size={15} className="stroke-[1.8] hidden group-data-[collapsible=icon]:block transition-transform duration-300 hover:translate-x-0.5" />
          </button>
        </div>
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
