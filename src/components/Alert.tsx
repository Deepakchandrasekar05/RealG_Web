import React, { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { FiMapPin, FiX } from "react-icons/fi";
import alertSound from "../assets/alert.mp3";

interface AlertData {
  device_id: string;
  lat: string;
  lon: string;
}

const Alert: React.FC = () => {
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const response = await fetch("https://realgbackend-production.up.railway.app/api/alert");
        const data = await response.json();

        if (data.alert) {
          setAlert(data.alert);
          setVisible(true);

          const audio = new Audio(alertSound);
          audio.play().catch((e) => console.error("Audio play failed:", e));
        }
      } catch (error) {
        console.error("Error fetching alert:", error);
      }
    };

    fetchAlert();
    const interval = setInterval(fetchAlert, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async () => {
    try {
      await fetch("https://realgbackend-production.up.railway.app/api/alert/clear", {
        method: "POST",
      });
      setVisible(false);
      setAlert(null);
    } catch (error) {
      console.error("Error clearing alert:", error);
    }
  };

  const handleTrack = () => {
    if (alert) {
      const url = `https://www.google.com/maps?q=${alert.lat},${alert.lon}`;
      window.open(url, "_blank");
    }
  };

  if (!visible || !alert) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-fade-in">
        <div className="p-6 relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <FaExclamationTriangle className="text-red-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">🚨 Emergency SoS Alert</h2>
                <p className="text-sm text-gray-500">Immediate attention required</p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Alert Content */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center">
              <div className="w-1/3 text-sm font-medium text-gray-500">Device ID</div>
              <div className="w-2/3 font-mono text-gray-800">{alert.device_id}</div>
            </div>
            <div className="flex items-center">
              <div className="w-1/3 text-sm font-medium text-gray-500">Location</div>
              <div className="w-2/3 font-mono text-gray-800">
                {alert.lat}, {alert.lon}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleTrack}
              className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <FiMapPin size={18} />
              <span>Track Location</span>
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <FiX size={18} />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;