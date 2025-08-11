import React, { useState, useRef, useEffect } from 'react';
import { User, Menu } from 'lucide-react';
import logo from '../assets/RealG logo.png'; // Update path as needed

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-[#262626] border-b border-[#1E1E1E] flex items-center justify-between p-4">
      <div className="flex items-center space-x-4">
        {/* Menu button */}
        <button 
          onClick={toggleSidebar}
          className="text-[#888] hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
        
        {/* Logo */}
        <img 
          src={logo} 
          alt="RealG Logo" 
          className="h-8 w-auto" 
        />
      </div>
      
      {/* Profile Icon */}
      <div ref={profileRef} className="relative">
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="h-8 w-8 bg-[#1E1E1E] rounded-full flex items-center justify-center hover:bg-[#2E2E2E] transition-colors duration-300"
        >
          <User size={18} className="text-[#888] hover:text-white" />
        </button>

        {/* Profile Dropdown */}
        {isProfileOpen && (
          <div className="absolute right-0 top-10 w-48 bg-[#1E1E1E] rounded-lg shadow-lg border border-[#2E2E2E] z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2E2E2E]">
              <p className="text-sm text-white">Signed in as</p>
              <p className="text-sm font-medium text-white truncate">admin@realguard.com</p>
            </div>
            <ul>
              <li>
                <button 
                  className="w-full text-left px-4 py-3 text-sm text-[#888] hover:bg-[#2E2E2E] hover:text-white transition-colors duration-300"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Account Settings
                </button>
              </li>
              <li>
                <button 
                  className="w-full text-left px-4 py-3 text-sm text-[#FF0000] hover:bg-[#2E2E2E] transition-colors duration-300"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;