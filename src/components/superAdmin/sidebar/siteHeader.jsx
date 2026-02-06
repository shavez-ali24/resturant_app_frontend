import { SidebarIcon } from "lucide-react";
import { SearchForm } from "@/components/superAdmin/sidebar/searchForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [sidebarState, setSidebarState] = useState({
    isOpen: true,
    lastToggled: Date.now()
  });

  // Enhanced user authentication check
  useEffect(() => {
    const validateUserSession = () => {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
          navigate('/super-login');
          return;
        }

        const parsedUser = JSON.parse(user);
        if (parsedUser.role !== 'superadmin') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/super-login');
          return;
        }

        setUserData(parsedUser);
      } catch (error) {
        console.error('User validation error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/super-login');
      }
    };

    validateUserSession();
  }, [navigate]);

  // Track sidebar toggle frequency for UX analytics
  const handleToggleSidebar = () => {
    const now = Date.now();
    setSidebarState(prev => ({
      isOpen: !prev.isOpen,
      lastToggled: now
    }));
    
    // Log toggle activity for analytics
    // console.log(`Sidebar toggled to: ${!sidebarState.isOpen} at ${new Date(now).toISOString()}`);
    
    toggleSidebar();
  };

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && sidebarState.isOpen) {
        toggleSidebar();
        setSidebarState(prev => ({ ...prev, isOpen: false }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarState.isOpen, toggleSidebar]);

  // Keyboard shortcut for sidebar toggle
  useEffect(() => {
    const handleKeyPress = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        handleToggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Performance monitoring for header interactions
  const [interactionCount, setInteractionCount] = useState(0);

  const trackInteraction = (action) => {
    setInteractionCount(prev => prev + 1);
    // console.log(`Header interaction: ${action}, Total interactions: ${interactionCount + 1}`);
  };

  return (
    <header className="flex sticky top-0 z-50 w-full items-center border-b bg-background p-1">
      <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
        {/* Sidebar Toggle with enhanced logic */}
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={() => {
            handleToggleSidebar();
            trackInteraction('sidebar_toggle');
          }}
          aria-label="Toggle sidebar"
          title="Toggle sidebar (Ctrl+B)"
        >
          <SidebarIcon />
        </Button>

        <Separator orientation="vertical" className="mr-2 h-4" />

       
      </div>
    </header>
  );
}