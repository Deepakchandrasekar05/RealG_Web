import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Camera,
  MapPin,
  Users,
  AlertTriangle,
  Settings,
  LogOut,
  X,
  Menu,
  Landmark,
  HardHat
} from "lucide-react";
import logo from "../assets/RealG logo.png";
import logo2 from "../assets/logo.png";

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onClose, 
  isMobile = false, 
  isCollapsed,
  toggleSidebar 
}) => {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: HardHat, label: "Crane Operations", path: "/operations" },
    { icon: Camera, label: "CCTV Monitoring", path: "/cctv" },
    { icon: MapPin, label: "Worker Tracking", path: "/tracking" },
    { icon: Users, label: "Attendance", path: "/attendance" },
    { icon: AlertTriangle, label: "Alerts", path: "/alerts" },
    { icon: Landmark, label: "Site Planning", path: "/site" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div 
      className={`h-full bg-[#0A0A0A] text-white flex flex-col border-r border-[#1E1E1E] ${
        isMobile ? "fixed inset-y-0 z-50 w-64" : "relative"
      } ${isMobile ? "w-64" : isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Logo and Toggle Section */}
      <div className={`p-4 border-b border-[#1E1E1E] flex items-center ${
        isMobile ? "justify-between" : isCollapsed ? "justify-center" : "justify-between"
      }`}>
        {!isMobile && isCollapsed ? null : (
          <div className="flex items-center space-x-2">
            <img 
              src={logo} 
              alt="RealG Logo" 
              className={`h-11 w-auto ${isCollapsed && !isMobile ? 'hidden' : ''}`}
            />
            {!isCollapsed && (
              <div>
                <img 
                  src={logo2} 
                  alt="Main Logo" 
                  className="h-12 w-auto"
                />
                <p className="text-xs text-[#888]">Emergency Alert System</p>
              </div>
            )}
          </div>
        )}
        
        {/* Show close button in mobile, toggle button in desktop */}
        {isMobile ? (
          <button
            onClick={onClose}
            className="text-[#888] hover:text-white transition-colors duration-300 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className={`text-[#888] hover:text-white transition-colors duration-300 focus:outline-none ${
              isCollapsed ? "mx-auto" : ""
            }`}
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center ${
                    isMobile ? "space-x-3" : isCollapsed ? "justify-center" : "space-x-3"
                  } px-4 py-3 rounded-lg transition-all duration-300 group ${
                    isActive
                      ? "bg-[#FF0000] bg-opacity-20 text-white border-l-4 border-[#FF0000]"
                      : "text-[#888] hover:bg-[#1E1E1E] hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon 
                      size={20} 
                      className={`transition-colors duration-300 ${
                        isActive ? "text-[#FF0000]" : "text-[#888] group-hover:text-[#FF0000]"
                      }`} 
                    />
                    {(isMobile || !isCollapsed) && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export const SidebarWrapper: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isCollapsed, setIsCollapsed] = useState(true); // Changed to true to show shrunk sidebar by default
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      
      if (newIsMobile) {
        setIsCollapsed(false); // Force full sidebar in mobile
      } else {
        setIsCollapsed(true); // Keep collapsed in desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <>
      {/* Mobile Menu Button - Only shown on mobile */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed z-40 p-2 rounded-md text-white bg-[#0A0A0A] focus:outline-none top-4 left-4"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar */}
      {(!isMobile || isMobileSidebarOpen) && (
        <>
          {/* Overlay for mobile */}
          {isMobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}
          
          <Sidebar 
            isMobile={isMobile} 
            isCollapsed={isCollapsed}
            onClose={() => setIsMobileSidebarOpen(false)}
            toggleSidebar={toggleSidebar}
          />
        </>
      )}
    </>
  );
};

export default Sidebar;