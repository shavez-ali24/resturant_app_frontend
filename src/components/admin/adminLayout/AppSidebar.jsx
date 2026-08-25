import * as React from "react";
import {
  Utensils,
  ClipboardList,
  TrendingUp,
  ChefHat,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import { NavMain } from "@/components/admin/adminLayout/NavMain";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import logo from "@/assets/tapNbite-176x96.png";
import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar({ isDarkMode = false, ...props }) {
  const { isMobile, open, setOpen, openMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const colors = useSelector((state) => state.admin?.theme?.colors) || {
    primary: "#EF9F27",
    primaryMid: "#fde68a",
    primaryLight: "#fff8f5"
  };
  const location = useLocation();
  const previousPathRef = React.useRef(location.pathname);
  const sidebarRootRef = React.useRef(null);

  const sidebarShellClass = isDarkMode
    ? "border-r border-slate-700/70 bg-[#0f172a] [&_[data-sidebar=sidebar]]:bg-[#0f172a]"
    : "border-r border-[#ede8e3] bg-white [&_[data-sidebar=sidebar]]:bg-white";
  const sidebarSectionClass = isDarkMode ? "bg-[#0f172a]" : "bg-white";

  // Get user role from localStorage
  const userRole = localStorage.getItem("userRole") || "";
  const isAdmin = userRole === "admin";
  const isStaff = userRole === "staff";
  const homeRoute = isStaff ? "/admin/orders" : "/admin";

  // Define navigation items based on role (memoized to prevent recreation on every render)
  const filteredNavMain = React.useMemo(() => {
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
    ];

    return navMain.filter(
      (section) => section.roles.includes(userRole) && section.items.length > 0
    );
  }, [isAdmin, isStaff, userRole]);

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

  // Reusable hover values based on CSS variables instead of dynamic inline JS event listeners
  const toggleBtnStyle = {
    "--hover-bg": isDarkMode ? "#334155" : `${colors.primary}0a`,
    "--hover-border": colors.primary,
    backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
    borderColor: isDarkMode ? "#334155" : "#ede8e3",
    color: colors.primary,
  };

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
            className="h-8 w-8 rounded-full flex items-center justify-center border transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 group-data-[collapsible=icon]:mx-auto shadow-sm hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)]"
            style={toggleBtnStyle}
            aria-label="Toggle sidebar"
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
export default AppSidebar;
