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
// import logo from "@/assets/loader.gif";

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

  const handleSidebarMouseEnter = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (isMobile || window.innerWidth < 1024) return;
    hoverOpenRef.current = true;
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
    if (!openRef.current) {
      hoverActivatedRef.current = true;
      setOpen(true);
    }
  }, [isMobile, setOpen]);

  const handleSidebarMouseLeave = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (isMobile || window.innerWidth < 1024) return;
    hoverOpenRef.current = false;
    if (!hoverActivatedRef.current || !openRef.current) return;
    if (!hoverCloseTimerRef.current) {
      hoverCloseTimerRef.current = setTimeout(() => {
        hoverCloseTimerRef.current = null;
        if (!hoverActivatedRef.current) return;
        if (!openRef.current) return;
        hoverActivatedRef.current = false;
        setOpen(false);
      }, 3000);
    }
  }, [isMobile, setOpen]);

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

  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  React.useEffect(() => {
    if (!sidebarRootRef.current) return;
    sidebarFixedRef.current = sidebarRootRef.current.querySelector('[data-sidebar="sidebar"]');
  }, []);

  React.useEffect(() => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }

    if (typeof window === "undefined") return undefined;
    if (isMobile || window.innerWidth < 1024) return undefined;

    autoCollapseTimerRef.current = setTimeout(() => {
      if (isMobile || window.innerWidth < 1024) return;
      if (!openRef.current) return;
      hoverActivatedRef.current = false;
      setOpen(false);
    }, 20000);

    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
        autoCollapseTimerRef.current = null;
      }
    };
  }, [location.pathname, isMobile, setOpen]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const hoverOpenDelay = 140;
    const hoverCloseDelay = 3000;
    const openZone = 56;
    const closeBuffer = 24;

    const clearOpenTimer = () => {
      if (hoverOpenTimerRef.current) {
        clearTimeout(hoverOpenTimerRef.current);
        hoverOpenTimerRef.current = null;
      }
    };

    const clearCloseTimer = () => {
      if (hoverCloseTimerRef.current) {
        clearTimeout(hoverCloseTimerRef.current);
        hoverCloseTimerRef.current = null;
      }
    };

    const handlePointerMove = (event) => {
      if (isMobile || window.innerWidth < 1024) return;

      const pointerX = event.clientX;
      const isOpen = openRef.current;

      if (!isOpen) {
        clearCloseTimer();
        if (pointerX <= openZone) {
          if (!hoverOpenTimerRef.current) {
            hoverOpenTimerRef.current = setTimeout(() => {
              hoverOpenTimerRef.current = null;
              if (openRef.current) return;
              hoverActivatedRef.current = true;
              setOpen(true);
            }, hoverOpenDelay);
          }
        } else {
          clearOpenTimer();
        }
        return;
      }

      if (!hoverActivatedRef.current) {
        clearOpenTimer();
        clearCloseTimer();
        return;
      }

      if (!sidebarFixedRef.current && sidebarRootRef.current) {
        sidebarFixedRef.current = sidebarRootRef.current.querySelector('[data-sidebar="sidebar"]');
      }
      const sidebarWidth =
        sidebarFixedRef.current?.getBoundingClientRect().width || 256;
      if (pointerX > sidebarWidth + closeBuffer) {
        if (!hoverCloseTimerRef.current) {
          hoverCloseTimerRef.current = setTimeout(() => {
            hoverCloseTimerRef.current = null;
            if (!hoverActivatedRef.current) return;
            if (!openRef.current) return;
            hoverActivatedRef.current = false;
            setOpen(false);
          }, hoverCloseDelay);
        }
      } else {
        clearCloseTimer();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      clearOpenTimer();
      clearCloseTimer();
    };
  }, [isMobile, setOpen]);

  return (
    <Sidebar
      ref={sidebarRootRef}
      className={`overflow-y-auto !h-[calc(100svh-var(--header-height))] ${sidebarShellClass}`}
      collapsible="icon"
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
      {...props}
    >
      {/* Header */}
      <SidebarHeader className={`px-14 py-3 group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:py-4 group-data-[collapsible=icon]:items-center ${sidebarSectionClass}`}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className={`mt-0 sm:mt-20 group-data-[collapsible=icon]:mt-20 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:justify-center ${sidebarSectionClass}`}
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

      {/* Footer */}
      <SidebarFooter className={sidebarSectionClass}>
        <NavUser user={userData} isDarkMode={isDarkMode} />
      </SidebarFooter>
    </Sidebar>
  );
}
