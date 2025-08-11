import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell 
} from 'recharts';
import { 
  Thermometer, Wind, CloudRain, UserCheck 
} from 'lucide-react';
import { WeatherData, ForecastData, ConvertTemp } from '../types';

interface WeatherCardsProps {
  currentConditions: WeatherData;
  forecast: ForecastData;
  useCelsius: boolean;
  convertTemp: ConvertTemp;
}

const WeatherCards: React.FC<WeatherCardsProps> = ({ 
  currentConditions, 
  forecast,
  useCelsius,
  convertTemp
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Temperature Card */}
      <div className="bg-gray-100 bg-opacity-60 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Thermometer className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Temperature</span>
          </div>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
            {currentConditions?.condition}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-3xl font-bold">
            {currentConditions ? convertTemp(currentConditions.temperature) : '--'}{useCelsius ? '°C' : '°F'}
          </h3>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              Feels like {currentConditions ? convertTemp(currentConditions.temperature + (currentConditions.windSpeed / 10)) : '--'}{useCelsius ? '°C' : '°F'}
            </p>
            <p className="text-xs text-gray-500">
              Dew point: {currentConditions ? convertTemp(currentConditions.dewPoint || 0) : '--'}{useCelsius ? '°C' : '°F'}
            </p>
          </div>
        </div>
        <div className="mt-4 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[currentConditions]}>
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.1}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wind Card */}
      <div className="bg-gray-100 bg-opacity-60 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wind className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Wind</span>
          </div>
          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded">
            {currentConditions ? windDirectionToText(currentConditions.windDirection) : '--'}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-3xl font-bold">
            {currentConditions?.windSpeed || '--'} km/h
          </h3>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              Gusts {currentConditions ? (currentConditions.gustSpeed || currentConditions.windSpeed + 5).toFixed(1) : '--'} km/h
            </p>
          </div>
        </div>
        <div className="mt-4 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[currentConditions]}>
              <Area
                type="monotone"
                dataKey="windSpeed"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.1}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Precipitation Card */}
      <div className="bg-gray-100 bg-opacity-60 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CloudRain className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Precipitation</span>
          </div>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
            {forecast?.rainChance || '--'}% chance
          </span>
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-3xl font-bold">
            {currentConditions?.rainfall || '--'} mm
          </h3>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              Last hour
            </p>
          </div>
        </div>
        <div className="mt-4 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[currentConditions]}>
              <Area
                type="monotone"
                dataKey="rainfall"
                stroke="#06B6D4"
                fill="#06B6D4"
                fillOpacity={0.1}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Worker Safety Card */}
      <div className="bg-gray-100 bg-opacity-60 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Worker Safety</span>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-3xl font-bold">
              --
            </h3>
            <p className="text-sm text-gray-600">Safety recommendations</p>
          </div>
        </div>
        <div className="mt-4 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Heat', value: 25 },
              { name: 'UV', value: 25 },
              { name: 'Wind', value: 25 },
              { name: 'Rain', value: 25 }
            ]}>
              <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                <Cell fill="#F59E0B" />
                <Cell fill="#FBBF24" />
                <Cell fill="#8B5CF6" />
                <Cell fill="#06B6D4" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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

export default WeatherCards;