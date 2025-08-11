import React, { useEffect, useState } from "react";
import { FaExclamationTriangle, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { FiMapPin, FiX } from "react-icons/fi";
import fenceAlertSound from "../assets/Alert.mp3";

interface BreachData {
  device_id: string;
  lat?: string;
  lon?: string;
  timestamp: string;
}

const Fence: React.FC = () => {
  const [breach, setBreach] = useState<BreachData | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [visible, setVisible] = useState(false);

  const fetchFenceStatus = async () => {
    try {
      const response = await fetch("https://realgbackend-production.up.railway.app/api/fence");
      
      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      setConnectionError(false);

      if (data.breach) {
        // Fetch the latest breach details from history
        const historyResponse = await fetch("https://realgbackend-production.up.railway.app/api/alerts/history");
        const historyData = await historyResponse.json();
        
        // Find the most recent geofence breach
        const latestFenceBreach = historyData.find(
          (alert: any) => alert.type === "GEOFENCE"
        );

        if (latestFenceBreach) {
          const newBreach = {
            device_id: latestFenceBreach.device_id || "Unknown",
            lat: latestFenceBreach.lat,
            lon: latestFenceBreach.lon,
            timestamp: latestFenceBreach.timestamp
          };
          
          setBreach(newBreach);
          
          if (!visible && !isMuted) {
            const audio = new Audio(fenceAlertSound);
            audio.play().catch((e) => console.error("Audio play failed:", e));
          }
          setVisible(true);
        }
      } else {
        setVisible(false);
        setBreach(null);
      }
    } catch (error) {
      console.error("Error fetching fence status:", error);
      setConnectionError(true);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const setupPolling = async () => {
      await fetchFenceStatus();
      intervalId = setInterval(fetchFenceStatus, 5000);
    };

    setupPolling();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMuted]);

  const handleDismiss = async () => {
    try {
      await fetch("https://realgbackend-production.up.railway.app/api/fence/clear", {
        method: "POST",
      });
      setVisible(false);
      setBreach(null);
    } catch (error) {
      console.error("Error clearing fence breach:", error);
    }
  };

  const handleTrack = () => {
    if (breach?.lat && breach?.lon) {
      const url = `https://www.google.com/maps?q=${breach.lat},${breach.lon}`;
      window.open(url, "_blank");
    }
  };

  if (connectionError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-fade-in">
          <div className="p-6 relative">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <FaExclamationTriangle className="text-yellow-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">⚠️ Connection Error</h2>
                <p className="text-sm text-gray-500">Unable to connect to geofence monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!visible || !breach) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-fade-in border-l-4 border-orange-500">
        <div className="p-6 relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full mr-4">
                <FaExclamationTriangle className="text-orange-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">🚧 Geofence Breach</h2>
                <p className="text-sm text-gray-500">Safety perimeter violation</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title={isMuted ? "Unmute alerts" : "Mute alerts"}
              >
                {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
              </button>
              <button 
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          {/* Alert Content */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center">
              <div className="w-1/3 text-sm font-medium text-gray-500">Device ID</div>
              <div className="w-2/3 font-mono text-gray-800">{breach.device_id}</div>
            </div>
            
            {breach.lat && breach.lon ? (
              <>
                <div className="flex items-center">
                  <div className="w-1/3 text-sm font-medium text-gray-500">Location</div>
                  <div className="w-2/3 font-mono text-gray-800">
                    {breach.lat}, {breach.lon}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-1/3 text-sm font-medium text-gray-500">Time</div>
                  <div className="w-2/3 font-mono text-gray-800">
                    {new Date(breach.timestamp).toLocaleString()}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center">
                <div className="w-1/3 text-sm font-medium text-gray-500">Location</div>
                <div className="w-2/3 font-mono text-gray-500 italic">
                  No location data available
                </div>
              </div>
            )}
            
            <div className="bg-orange-50 p-3 rounded-lg mt-4">
              <p className="text-orange-800 text-sm">
                Worker {breach.device_id} has breached the safety perimeter. Immediate action required!
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {breach.lat && breach.lon ? (
              <button
                onClick={handleTrack}
                className="flex-1 flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                <FiMapPin size={18} />
                <span>Track Location</span>
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 text-gray-500 py-3 px-4 rounded-lg font-medium">
                <FiMapPin size={18} />
                <span>No Location</span>
              </div>
            )}
            <button
              onClick={handleDismiss}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <FiX size={18} />
              <span>Acknowledge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fence;