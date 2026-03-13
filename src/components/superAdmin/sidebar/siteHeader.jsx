import { SidebarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
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
  const handleToggleSidebar = useCallback(() => {
    const now = Date.now();
    setSidebarState(prev => ({
      isOpen: !prev.isOpen,
      lastToggled: now
    }));
    
    // Log toggle activity for analytics
    // console.log(`Sidebar toggled to: ${!sidebarState.isOpen} at ${new Date(now).toISOString()}`);
    
    toggleSidebar();
  }, [toggleSidebar]);

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
  }, [handleToggleSidebar]);

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b border-orange-200 bg-gradient-to-r from-orange-100/95 to-orange-200/95 p-1 backdrop-blur-sm">
      <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
        {/* Sidebar Toggle with enhanced logic */}
        <Button
          className="h-9 w-9 rounded-xl border border-orange-200 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600"
          variant="outline"
          size="icon"
          onClick={handleToggleSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar (Ctrl+B)"
        >
          <SidebarIcon />
        </Button>

        <Separator orientation="vertical" className="mr-2 h-6 bg-orange-200/70" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-800">{userData?.name || "Super Admin"}</span>
          <span className="text-xs text-gray-600">Management Panel</span>
        </div>
      </div>
    </header>
  );
}
