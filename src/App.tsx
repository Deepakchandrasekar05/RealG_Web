import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Alert from './components/Alert';
import Dashboard from './pages/Dashboard';
import CCTVMonitoring from './pages/CCTVMonitoring';
import WorkerTracking from './pages/WorkerTracking';
import Attendance from './pages/Attendance';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Camera from './pages/camera';
import History from './pages/History';
import Site from './pages/Site';
import OperationsDashboard from './pages/OperationsDashboard';
import './App.css';
import logo3 from "../src/assets/Logo3.png";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default on desktop
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/desktop on mount and resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(false); // Always show full sidebar on mobile
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <Router>
      <div className="flex h-screen relative">
        {/* Background Image with proper sizing and blur */}
        
        {/* Dark overlay to improve content visibility */}
        <div className="fixed inset-0 z-0 bg-black bg-opacity-30" />

        {/* Main Content Container */}
        <div className="flex h-screen w-full relative z-10">
          {/* Overlay - Only for mobile */}
          {sidebarOpen && isMobile && (
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={`fixed inset-y-0 left-0 z-30 bg-gray-800 text-white flex-shrink-0 transition-all duration-300 ease-in-out ${
              isMobile
                ? `${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64`
                : `translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'} static`
            }`}
          >
            <Sidebar 
              onClose={() => setSidebarOpen(false)}
              isMobile={isMobile}
              isCollapsed={isCollapsed}
              toggleSidebar={toggleSidebar}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-white bg-opacity-90 shadow-sm z-10">
              <div className="flex items-center justify-between p-4">
                {/* Menu Button - Only shown on mobile */}
                {isMobile && (
                  <button
                    onClick={toggleSidebar}
                    className="text-gray-600 hover:text-gray-900 focus:outline-none"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                )}
                
                {/* Logo - Centered on mobile, left-aligned on desktop */}
                <div className={`${window.innerWidth < 768 ? 'absolute left-1/2 transform -translate-x-1/2' : 'mx-auto'}`}>
                  <img 
                    src={logo3} 
                    alt="RealG Logo" 
                    className="h-14 w-auto"
                  />
                </div>
                
                {/* Empty div to balance flex layout on mobile */}
                {isMobile && <div className="w-6"></div>}
              </div>
            </header>

            {/* Alert Component */}
            <Alert />

            {/* Main Content */}
            <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-white bg-opacity-90 p-2 md:p-1 transition-all duration-300 ${
              isMobile ? 'ml-0' : isCollapsed ? 'ml-20' : 'ml-64'
            }`}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/cctv" element={<CCTVMonitoring />} />
                <Route path="/camera/:cameraId" element={<Camera />} />
                <Route path="/history/:cameraId" element={<History />} />
                <Route path="/site" element={<Site />} />
                <Route path="/tracking" element={<WorkerTracking />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/operations" element={<OperationsDashboard />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;