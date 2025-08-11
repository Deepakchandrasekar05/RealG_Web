import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Alert {
  type: 'SOS' | 'GEOFENCE';
  device_id: string;
  lat: number | string | null;
  lon: number | string | null;
  timestamp: string;
}

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get('https://realgbackend-production.up.railway.app/api/alerts/history');
        // Ensure we're working with an array and transform data if needed
        const alertsData = Array.isArray(response.data) ? response.data : [];
        setAlerts(alertsData);
      } catch (err) {
        setError('Failed to load alerts history');
        console.error('Error fetching alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCoordinate = (coord: number | string | null): string => {
    if (coord === null) return 'N/A';
    const num = typeof coord === 'string' ? parseFloat(coord) : coord;
    return isNaN(num) ? 'Invalid' : num.toFixed(6);
  };

  if (loading) return <div className="p-4">Loading alerts...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-gray-700 mb-2">Emergency SOS and Geofencing Alerts History</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="py-2 px-4 border">Type</th>
              <th className="py-2 px-4 border">Device ID</th>
              <th className="py-2 px-4 border">Location</th>
              <th className="py-2 px-4 border">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length > 0 ? (
              alerts.map((alert, index) => {
                const lat = formatCoordinate(alert.lat);
                const lon = formatCoordinate(alert.lon);
                const hasValidCoords = lat !== 'N/A' && lon !== 'N/A' && lat !== 'Invalid' && lon !== 'Invalid';
                
                return (
                  <tr key={`${alert.timestamp}-${index}`} className="border-b">
                    <td className="py-2 px-4 border">
                      <span className={`inline-block px-2 py-1 rounded text-white ${
                        alert.type === 'SOS' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}>
                        {alert.type}
                      </span>
                    </td>
                    <td className="py-2 px-4 border">{alert.device_id}</td>
                    <td className="py-2 px-4 border">
                      {hasValidCoords ? (
                        <a 
                          href={`https://maps.google.com/?q=${lat},${lon}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {lat}, {lon}
                        </a>
                      ) : (
                        <span className="text-gray-500">No location data</span>
                      )}
                    </td>
                    <td className="py-2 px-4 border">{formatDate(alert.timestamp)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  No alerts recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Alerts;