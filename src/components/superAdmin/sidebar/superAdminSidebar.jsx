import * as React from "react";
import {
  ScrollText,
  SquareMenu,
  LifeBuoy,
  Send,
  Frame,
  PieChart,
  Map,
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
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";

export function SuperAdminSidebar({ ...props }) {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = React.useState({
    name: "Super Admin",
    email: "admin@example.com",
    avatar: ""
  });
  const [sidebarStats, setSidebarStats] = React.useState({
    totalClicks: 0,
    lastActive: null,
    frequentlyAccessed: []
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

  // Track sidebar navigation analytics
  const trackNavigation = (itemTitle, itemUrl) => {
    setSidebarStats(prev => ({
      ...prev,
      totalClicks: prev.totalClicks + 1,
      lastActive: new Date().toISOString(),
      frequentlyAccessed: [
        ...prev.frequentlyAccessed.filter(item => item.title !== itemTitle),
        { title: itemTitle, url: itemUrl, timestamp: new Date().toISOString() }
      ].slice(0, 5) // Keep only last 5 items
    }));

    // console.log(`Navigation tracked: ${itemTitle} -> ${itemUrl}`);
  };

  
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

  // Session management for sidebar state persistence
  React.useEffect(() => {
    const savedSidebarState = sessionStorage.getItem('sidebarState');
    if (savedSidebarState === 'closed') {
      toggleSidebar(false);
    }
  }, [toggleSidebar]);

  const handleSidebarInteraction = (action, item = null) => {
    if (item) {
      trackNavigation(item.title, item.url);
    }

    if (window.innerWidth < 1024) {
      toggleSidebar(false);
      sessionStorage.setItem('sidebarState', 'closed');
    }
  };

  const data = {
    user: userData,
    navMain: [
      {
        title: "Details",
        url: "#",
        icon: ScrollText,
        isActive: location.pathname.startsWith('/super-admin'),
        items: [
          { 
            title: "Create User", 
            url: "/super-admin/create-user",
            isActive: location.pathname === '/super-admin/create-user'
          },
          { 
            title: "User List", 
            url: "/super-admin/user-list",
            isActive: location.pathname === '/super-admin/user-list'
          },
        ],
      },
    ],
    navSecondary: [
      { title: "Support", url: "#", icon: LifeBuoy },
      { title: "Feedback", url: "#", icon: Send },
    ],
    projects: [
      { name: "Design Engineering", url: "#", icon: Frame },
      { name: "Sales & Marketing", url: "#", icon: PieChart },
      { name: "Travel", url: "#", icon: Map },
    ],
  };

  return (
    <Sidebar
      className="overflow-y-auto !h-[calc(100svh-var(--header-height))]"
      {...props}
    >
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="mt-9">
              <Link
                to="/super-admin"
                onClick={() => handleSidebarInteraction('dashboard_click', { title: 'Dashboard', url: '/super-admin' })}
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col ">
                    <span className="font-bold text-lg text-gray-900">Super Admin</span>
                    {/* <span className="text-xs text-gray-500">Admin Panel</span> */}
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <NavMain
          items={data.navMain.map((section) => ({
            ...section,
            items: section.items.map((item) => ({
              ...item,
              onClick: () => handleSidebarInteraction('nav_click', item),
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