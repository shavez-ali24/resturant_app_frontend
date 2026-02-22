import * as React from "react";
import {
  ScrollText,
} from "lucide-react";
import { NavMain } from "@/components/superAdmin/sidebar/navMain";
import { NavUser } from "@/components/superAdmin/sidebar/navUser";
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
import { useSidebar } from "@/components/ui/sidebar";
import logo from "@/assets/tapNOrder.png";

export function SuperAdminSidebar({ ...props }) {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  const [userData, setUserData] = React.useState({
    name: "Super Admin",
    email: "admin@example.com",
    avatar: ""
  });

  // Enhanced user data fetching with validation
  React.useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.role === 'superadmin') {
            setUserData({
              name: parsedUser.name || "Super Admin",
              email: parsedUser.email || "admin@example.com",
              avatar: parsedUser.avatar || ""
            });
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fallback to default data
        setUserData({
          name: "Super Admin",
          email: "admin@example.com",
          avatar: ""
        });
      }
    };

    loadUserData();
  }, []);

 
  React.useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth < 1024) {
        toggleSidebar(false);
      }
    };

    handleRouteChange();
  }, [location.pathname, toggleSidebar]);

  // Keyboard navigation support
  React.useEffect(() => {
    const handleKeyNavigation = (event) => {
      // Add keyboard navigation logic here if needed
      if (event.altKey && event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        // Map number keys to navigation items
        // console.log(`Keyboard navigation attempt: Alt+${event.key}`);
      }
    };

    document.addEventListener('keydown', handleKeyNavigation);
    return () => document.removeEventListener('keydown', handleKeyNavigation);
  }, []);

  const handleSidebarInteraction = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar(false);
      sessionStorage.setItem('sidebarState', 'closed');
    }
  };

  const data = {
    user: userData,
    navMain: [
      {
        title: "User Management",
        url: "#",
        icon: ScrollText,
        isActive: location.pathname.startsWith('/super-admin'),
        items: [
          { 
            title: "User List", 
            url: "/super-admin/user-list",
            isActive: location.pathname === '/super-admin/user-list'
          },
        ],
      },
    ],
  };

  return (
    <Sidebar
      className="!h-[calc(100svh-var(--header-height))] overflow-y-auto border-r border-orange-100 bg-gradient-to-b from-orange-50 to-orange-100/70"
      {...props}
    >
      {/* Header */}
      <SidebarHeader className="bg-transparent px-4 pb-3 pt-6 sm:pt-8">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="mt-2 h-auto w-full justify-center rounded-xl bg-transparent px-2 py-2 hover:bg-orange-100/70 sm:mt-6"
            >
              <Link
                to="/super-admin"
                onClick={handleSidebarInteraction}
                className="flex w-full items-center justify-center"
              >
                <img src={logo} alt="Tap N Bite Logo" className="h-11 w-auto sm:h-12" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="bg-transparent px-2">
        <NavMain
          items={data.navMain.map((section) => ({
            ...section,
            items: section.items.map((item) => ({
              ...item,
              onClick: handleSidebarInteraction,
            })),
          }))}
        />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="bg-transparent p-2">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
