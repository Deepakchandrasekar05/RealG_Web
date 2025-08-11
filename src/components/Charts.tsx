import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, AreaChart, Area
} from 'recharts';
import { WeatherData } from '../types';

interface ChartsProps {
  sensorData: WeatherData[];
  windRoseData: any[];
  currentConditions: WeatherData;
}

const Charts: React.FC<ChartsProps> = ({ sensorData, windRoseData, currentConditions }) => {
  const [selectedChart, setSelectedChart] = useState('temperature');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Main Chart */}
      <div className="bg-gray-100 bg-opacity-60 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Detailed Weather Metrics</h2>
          <select
            value={selectedChart}
            onChange={(e) => setSelectedChart(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="temperature">Temperature</option>
            <option value="humidity">Humidity</option>
            <option value="windSpeed">Wind Speed</option>
            <option value="rainfall">Rainfall</option>
            <option value="airQuality">Air Quality</option>
            <option value="pressure">Pressure</option>
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedChart}
                stroke={
                  selectedChart === 'temperature' ? '#3B82F6' :
                  selectedChart === 'humidity' ? '#10B981' :
                  selectedChart === 'windSpeed' ? '#8B5CF6' :
                  selectedChart === 'rainfall' ? '#06B6D4' :
                  selectedChart === 'airQuality' ? '#F59E0B' :
                  '#EC4899'
                }
                strokeWidth={2}
                activeDot={{ r: 6 }}
                name={
                  selectedChart === 'temperature' ? 'Temperature (°C)' :
                  selectedChart === 'humidity' ? 'Humidity (%)' :
                  selectedChart === 'windSpeed' ? 'Wind Speed (km/h)' :
                  selectedChart === 'rainfall' ? 'Rainfall (mm)' :
                  selectedChart === 'airQuality' ? 'Air Quality' :
                  'Pressure (hPa)'
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wind Rose Chart */}
      <div className="bg-gray-100 bg-opacity-60 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Wind Direction & Speed</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius={120} data={windRoseData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="direction" />
              <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 5']} />
              <Radar
                name="Wind Speed"
                dataKey="speed"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.3}
              />
              <Radar
                name="Wind Gusts"
                dataKey="gusts"
                stroke="#EC4899"
                fill="#EC4899"
                fillOpacity={0.3}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-gray-500 text-center">
          {currentConditions && (
            <p>
              Current wind: {currentConditions.windSpeed} km/h (
              {windDirectionToText(currentConditions.windDirection)}) with gusts to{" "}
              {currentConditions.gustSpeed?.toFixed(1) || (currentConditions.windSpeed + 5).toFixed(1)} km/h
            </p>
          )}
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

export default Charts;