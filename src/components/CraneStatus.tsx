import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CraneStatus, WeatherData } from '../types';

interface CraneStatusProps {
  status: CraneStatus;
  currentConditions: WeatherData;
}

const CraneStatusComponent: React.FC<CraneStatusProps> = ({ status, currentConditions }) => {
  return (
    <div className="rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Crane Operations Status</h2>
      <div className={`p-4 rounded-lg ${
        status.operation === 'suspended' ? 'bg-red-50 border-red-500' :
        status.operation === 'limited' ? 'bg-amber-50 border-amber-500' :
        'bg-green-50 border-green-500'
      } border-l-4`}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className={`h-6 w-6 ${
            status.operation === 'suspended' ? 'text-red-500' :
            status.operation === 'limited' ? 'text-amber-500' :
            'text-green-500'
          }`} />
          <div>
            <h3 className={`text-lg font-bold ${
              status.operation === 'suspended' ? 'text-red-800' :
              status.operation === 'limited' ? 'text-amber-800' :
              'text-green-800'
            }`}>
              {status.operation === 'suspended' ? 'Operations Suspended' :
              status.operation === 'limited' ? 'Operations Limited' :
              'Normal Operations'}
            </h3>
            <p className="text-gray-700">{status.message}</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg shadow-xs">
                <h4 className="font-medium text-gray-700 mb-2">Operational Limits</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Load Capacity:</span>
                    <span className="font-medium">{status.maxLoadCapacity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Boom Height:</span>
                    <span className="font-medium">{status.maxHeight}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Safety Factor:</span>
                    <span className="font-medium">{status.safetyFactor.toFixed(1)}x</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg shadow-xs">
                <h4 className="font-medium text-gray-700 mb-2">Current Wind Conditions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wind Speed:</span>
                    <span className="font-medium">{currentConditions?.windSpeed || '--'} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gust Speed:</span>
                    <span className="font-medium">
                      {currentConditions ? (currentConditions.gustSpeed || currentConditions.windSpeed + 5).toFixed(1) : '--'} km/h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Direction:</span>
                    <span className="font-medium">
                      {currentConditions ? windDirectionToText(currentConditions.windDirection) : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Recommended Actions</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {status.recommendedActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Last updated: {status.lastUpdated}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function
const windDirectionToText = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round((degrees % 360) / 22.5) % 16];
};

export default CraneStatusComponent;