import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  Sun,
  CloudRain,
  Cloud,
  Umbrella,
  Car,
  Sunset,
  CalendarClock,
  MapPin,
  Gauge,
  CloudSun,
  CloudLightning,
  Snowflake,
  Eye,
  Sunrise,
  Moon,
  Compass,
  ThermometerSun,
  ThermometerSnowflake,
  Waves,
  RefreshCw,
  HardHat,
  Construction,
  ShieldAlert,
  UserCheck,
  ClipboardCheck,
  Clock,
  SunDim,
  BarChart2,
  Activity,
  Anchor,
  CalendarDays,
  Lightbulb,
  AlertCircle,
  ClipboardList,
  AlertOctagon,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';

// Types
type WeatherCondition = 'Sunny' | 'Partly Cloudy' | 'Cloudy' | 'Rain' | 'Thunderstorm' | 'Snow' | 'Fog';

interface WeatherData {
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainfall: number;
  airQuality: number;
  uvIndex: number;
  pressure: number;
  visibility: number;
  condition: WeatherCondition;
  gustSpeed?: number;
  dewPoint?: number;
}

interface ForecastData {
  date: string;
  highTemp: number;
  lowTemp: number;
  rainChance: number;
  windSpeed: number;
  condition: WeatherCondition;
  sunrise: string;
  sunset: string;
  workHours?: number;
  concretePouringScore?: number;
}

interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  timestamp: string;
  affectedZone?: string;
  duration?: string;
  actionItems?: string[];
}

interface Suggestion {
  type: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: 'low' | 'medium' | 'high';
  relatedAlert?: string;
  implementationTime?: string;
}

interface CraneStatus {
  operation: 'normal' | 'limited' | 'suspended';
  message: string;
  maxLoadCapacity: number;
  maxHeight: number;
  recommendedActions: string[];
  safetyFactor: number;
  windGustWarning?: boolean;
  lastUpdated: string;
}

interface ConstructionInsight {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  impact: 'positive' | 'neutral' | 'negative';
  trend?: 'improving' | 'deteriorating' | 'stable';
  timeSensitivity?: string;
}

interface WorkerSafetyStatus {
  heatRisk: 'low' | 'moderate' | 'high' | 'extreme';
  coldRisk: 'low' | 'moderate' | 'high';
  uvRisk: 'low' | 'moderate' | 'high' | 'extreme';
  windRisk: 'low' | 'moderate' | 'high';
  rainRisk: 'low' | 'moderate' | 'high';
  recommendations: string[];
}

interface SiteActivityRecommendation {
  activity: string;
  optimalTime: string;
  riskFactors: string[];
  equipmentRequirements: string[];
  crewSizeRecommendation: string;
}

// UI Components
const Switch = ({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (checked: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${checked ? 'bg-red-600' : 'bg-gray-200'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

const Label = ({ htmlFor, children }: { htmlFor?: string, children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
    {children}
  </label>
);

const Button = ({ variant = 'default', size = 'default', onClick, children, className = '' }: { 
  variant?: 'default' | 'outline' | 'destructive', 
  size?: 'default' | 'sm',
  onClick?: () => void,
  children: React.ReactNode,
  className?: string
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500';
  const variantClasses = variant === 'outline' 
    ? 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700' : 
    variant === 'destructive'
    ? 'bg-red-600 text-gray-100 hover:bg-red-700' :
    'bg-red-600 text-gray-100 hover:bg-red-700';
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm';
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md ${className}`} />
);

const SeverityBadge = ({ severity }: { severity: 'info' | 'warning' | 'danger' }) => (
  <span className={`text-xs px-2 py-1 rounded ${
    severity === 'danger' ? 'bg-red-100 text-red-800' :
    severity === 'warning' ? 'bg-amber-100 text-amber-800' :
    'bg-blue-100 text-blue-800'
  }`}>
    {severity === 'danger' ? 'Critical' : severity === 'warning' ? 'Warning' : 'Info'}
  </span>
);

// Real-time weather API service with enhanced data
const fetchRealTimeWeather = async (lat: number, lon: number): Promise<WeatherData[]> => {
  try {
    // Using OpenWeatherMap API (you would need an API key in production)
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=d1ee93402c4d7089aea224b06edcac6d&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const data = await response.json();
    
    // Process the data into our format with enhanced fields
    const processedData: WeatherData[] = data.list.map((item: any) => {
      const date = new Date(item.dt * 1000);
      const hour = date.getHours();
      const hourString = `${hour.toString().padStart(2, '0')}:00`;
      
      // Determine weather condition
      let condition: WeatherCondition = 'Sunny';
      const weatherMain = item.weather[0].main.toLowerCase();
      if (weatherMain.includes('thunder')) condition = 'Thunderstorm';
      else if (weatherMain.includes('rain')) condition = 'Rain';
      else if (weatherMain.includes('snow')) condition = 'Snow';
      else if (weatherMain.includes('cloud')) condition = item.clouds.all > 50 ? 'Cloudy' : 'Partly Cloudy';
      else if (weatherMain.includes('fog') || weatherMain.includes('mist')) condition = 'Fog';
      
      // Calculate dew point
      const temp = item.main.temp;
      const humidity = item.main.humidity;
      const dewPoint = temp - ((100 - humidity) / 5);
      
      return {
        time: hourString,
        temperature: temp,
        humidity: humidity,
        windSpeed: item.wind.speed * 3.6, // Convert m/s to km/h
        windDirection: item.wind.deg,
        gustSpeed: item.wind.gust ? item.wind.gust * 3.6 : (item.wind.speed * 3.6) + 5, // Add gust if not available
        rainfall: item.rain ? item.rain['3h'] || 0 : 0,
        airQuality: 50 + Math.random() * 50, // Simulating AQI since OpenWeatherMap requires separate API call
        uvIndex: Math.round((item.clouds.all / 100) * 8), // Simple UV index simulation
        pressure: item.main.pressure,
        visibility: item.visibility / 1000, // Convert meters to km
        condition,
        dewPoint: parseFloat(dewPoint.toFixed(1))
      };
    });
    
    return processedData.slice(0, 24); // Return next 24 hours of data
  } catch (error) {
    console.error('Error fetching real-time weather:', error);
    // Fallback to mock data if API fails
    return fetchMockWeatherData(lat, lon);
  }
};

const fetchMockWeatherData = async (lat: number, lon: number): Promise<WeatherData[]> => {
  // This is a fallback function that generates realistic mock data based on location
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const now = new Date();
  const isUrban = Math.abs(lat - 40.7128) < 5 && Math.abs(lon - (-74.0060)) < 5; // Roughly near NYC
  const locationFactor = isUrban ? 1.2 : 0.9;
  const isCoastal = Math.abs(lon - (-74.0060)) < 2; // Rough coastal area
  
  const data: WeatherData[] = [];
  for (let i = 0; i < 24; i++) {
    const time = new Date(now);
    time.setHours(time.getHours() + i);
    const hour = time.getHours();
    const hourString = `${hour.toString().padStart(2, '0')}:00`;
    
    // Generate realistic weather patterns
    const baseTemp = 15 + 10 * Math.sin((hour - 6) * Math.PI / 12) * locationFactor;
    const tempVariation = (Math.random() - 0.5) * 3;
    const humidityBase = 50 + 20 * Math.sin((hour - 3) * Math.PI / 12);
    const humidityVariation = (Math.random() - 0.5) * 15;
    
    // Weather condition simulation
    let condition: WeatherCondition = 'Sunny';
    const rand = Math.random();
    if (rand > 0.9) condition = 'Thunderstorm';
    else if (rand > 0.7) condition = 'Rain';
    else if (rand > 0.5) condition = 'Cloudy';
    else if (rand > 0.3) condition = 'Partly Cloudy';
    
    // Wind simulation - higher near coasts
    const baseWindSpeed = isCoastal ? 
      8 + Math.random() * 12 + Math.sin(hour / 6 * Math.PI) * 8 :
      5 + Math.random() * 10 + Math.sin(hour / 6 * Math.PI) * 5;
    
    const temperature = parseFloat((baseTemp + tempVariation).toFixed(1));
    const humidity = Math.round(humidityBase + humidityVariation);
    const dewPoint = parseFloat((temperature - ((100 - humidity)/5)).toFixed(1));
    
    data.push({
      time: hourString,
      temperature,
      humidity,
      windSpeed: parseFloat(baseWindSpeed.toFixed(1)),
      windDirection: Math.round(Math.random() * 360),
      gustSpeed: parseFloat((baseWindSpeed + 5 + Math.random() * 5).toFixed(1)),
      rainfall: condition === 'Rain' ? parseFloat((Math.random() * 5).toFixed(1)) : 
               condition === 'Thunderstorm' ? parseFloat((Math.random() * 10).toFixed(1)) : 0,
      airQuality: Math.round(50 + (Math.random() * 50) * (isUrban ? 1.3 : 1)),
      uvIndex: hour > 6 && hour < 20 ? Math.round(Math.abs(8 - Math.abs(12 - hour)) + Math.random() * 2) : 0,
      pressure: Math.round(1010 + (Math.random() - 0.5) * 15),
      visibility: condition === 'Fog' ? Math.round(Math.random() * 2) : 
                 condition === 'Rain' ? Math.round(5 + Math.random() * 5) : 
                 Math.round(8 + Math.random() * 12),
      condition,
      dewPoint
    });
  }
  
  return data;
};

const fetchForecast = async (lat: number, lon: number): Promise<ForecastData[]> => {
  try {
    // Using OpenWeatherMap API for forecast
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=7&appid=d1ee93402c4d7089aea224b06edcac6d&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    
    const data = await response.json();
    
    return data.list.map((day: any, index: number) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      const dateString = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      // Determine weather condition
      let condition: WeatherCondition = 'Sunny';
      const weatherMain = day.weather[0].main.toLowerCase();
      if (weatherMain.includes('thunder')) condition = 'Thunderstorm';
      else if (weatherMain.includes('rain')) condition = 'Rain';
      else if (weatherMain.includes('snow')) condition = 'Snow';
      else if (weatherMain.includes('cloud')) condition = 'Cloudy';
      
      // Generate realistic sunrise/sunset times
      const sunriseHour = 6 + Math.round(Math.random() * 1.5);
      const sunsetHour = 18 + Math.round(Math.random() * 2);
      const sunrise = `${sunriseHour}:${Math.floor(Math.random() * 30 + 15).toString().padStart(2, '0')}`;
      const sunset = `${sunsetHour}:${Math.floor(Math.random() * 30 + 15).toString().padStart(2, '0')}`;
      
      // Calculate work hours (daylight hours minus breaks)
      const daylightHours = sunsetHour - sunriseHour;
      const workHours = Math.max(0, daylightHours - 2); // Subtract break times
      
      // Calculate concrete pouring score (0-100)
      const tempRange = day.temp.max - day.temp.min;
      const pouringScore = Math.max(0, 100 - 
        (Math.max(0, day.temp.min - 5) * 5) - // Penalize for low temps
        (Math.max(0, day.temp.max - 32) * 5) - // Penalize for high temps
        (day.pop * 20) - // Penalize for rain chance
        (tempRange * 3) // Penalize for large temp swings
      );
      
      return {
        date: dateString,
        highTemp: day.temp.max,
        lowTemp: day.temp.min,
        rainChance: Math.round(day.pop * 100),
        windSpeed: day.speed * 3.6, // Convert m/s to km/h
        condition,
        sunrise,
        sunset,
        workHours,
        concretePouringScore: Math.round(Math.min(100, Math.max(0, pouringScore)))
      };
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    // Fallback to mock forecast
    return fetchMockForecast();
  }
};

const fetchMockForecast = async (): Promise<ForecastData[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const forecasts: ForecastData[] = [];
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dateString = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    // Generate forecast with realistic patterns
    const baseTemp = 22 + (Math.random() - 0.5) * 10;
    const willRain = Math.random() > (i < 2 ? 0.6 : 0.7);
    const isStorm = willRain && Math.random() > 0.7;
    
    // Generate realistic sunrise/sunset times
    const sunriseHour = 6 + Math.round(Math.random() * 1.5);
    const sunsetHour = 18 + Math.round(Math.random() * 2);
    const sunrise = `${sunriseHour}:${Math.floor(Math.random() * 30 + 15).toString().padStart(2, '0')}`;
    const sunset = `${sunsetHour}:${Math.floor(Math.random() * 30 + 15).toString().padStart(2, '0')}`;
    
    // Calculate work hours
    const daylightHours = sunsetHour - sunriseHour;
    const workHours = Math.max(0, daylightHours - 2);
    
    // Calculate concrete pouring score
    const highTemp = Math.round(baseTemp + 5 - (i * 0.5));
    const lowTemp = Math.round(baseTemp - 5 - (i * 0.3));
    const tempRange = highTemp - lowTemp;
    const rainChance = willRain ? Math.round(Math.random() * 30 + (isStorm ? 40 : 20)) : Math.round(Math.random() * 15);
    
    const pouringScore = Math.max(0, 100 - 
      (Math.max(0, lowTemp - 5) * 5) - 
      (Math.max(0, highTemp - 32) * 5) - 
      (rainChance / 100 * 20) - 
      (tempRange * 3)
    );
    
    forecasts.push({
      date: dateString,
      highTemp,
      lowTemp,
      rainChance,
      windSpeed: Math.round(5 + Math.random() * 10 + (isStorm ? 5 : 0)),
      condition: isStorm ? 'Thunderstorm' : willRain ? 'Rain' : Math.random() > 0.5 ? 'Partly Cloudy' : 'Sunny',
      sunrise,
      sunset,
      workHours,
      concretePouringScore: Math.round(Math.min(100, Math.max(0, pouringScore)))
    });
  }
  
  return forecasts;
};

const windDirectionToText = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round((degrees % 360) / 22.5) % 16];
};

const getConditionIcon = (condition: WeatherCondition, size = 5): JSX.Element => {
  const className = `h-${size} w-${size}`;
  switch (condition) {
    case 'Sunny': return <Sun className={`${className} text-yellow-500`} />;
    case 'Partly Cloudy': return <CloudSun className={`${className} text-gray-400`} />;
    case 'Cloudy': return <Cloud className={`${className} text-gray-500`} />;
    case 'Rain': return <CloudRain className={`${className} text-blue-500`} />;
    case 'Thunderstorm': return <CloudLightning className={`${className} text-purple-500`} />;
    case 'Snow': return <Snowflake className={`${className} text-blue-300`} />;
    case 'Fog': return <Eye className={`${className} text-gray-300`} />;
    default: return <Sun className={`${className} text-yellow-500`} />;
  }
};

const getCraneStatus = (windSpeed: number, windGust: number): CraneStatus => {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (windGust > 50 || windSpeed > 40) {
    return {
      operation: 'suspended',
      message: 'All crane operations must be suspended immediately due to dangerous wind conditions',
      maxLoadCapacity: 0,
      maxHeight: 0,
      safetyFactor: 0,
      windGustWarning: true,
      recommendedActions: [
        'Secure all crane booms and equipment immediately',
        'Lower all loads to the ground',
        'Implement emergency shutdown procedures',
        'Evacuate crane operators from high elevations',
        'Monitor wind conditions continuously until safe',
        'Do not resume operations until winds drop below 30 km/h'
      ],
      lastUpdated: now
    };
  } else if (windGust > 40 || windSpeed > 30) {
    return {
      operation: 'limited',
      message: 'Crane operations must be strictly limited due to high winds',
      maxLoadCapacity: 40,
      maxHeight: 15,
      safetyFactor: 0.6,
      windGustWarning: true,
      recommendedActions: [
        'Reduce load capacity to 40% of normal',
        'Limit boom height to 15 meters',
        'Increase safety margins for all lifts',
        'Use tag lines for all loads',
        'Avoid lifting large surface area loads',
        'Conduct additional safety briefings',
        'Monitor wind gusts continuously'
      ],
      lastUpdated: now
    };
  } else if (windGust > 30 || windSpeed > 20) {
    return {
      operation: 'limited',
      message: 'Exercise caution with crane operations due to strong winds',
      maxLoadCapacity: 70,
      maxHeight: 30,
      safetyFactor: 0.8,
      recommendedActions: [
        'Reduce load capacity to 70% of normal',
        'Limit boom height to 30 meters',
        'Use extra caution with light, bulky loads',
        'Secure all loose materials',
        'Consider postponing non-critical lifts',
        'Monitor wind conditions hourly'
      ],
      lastUpdated: now
    };
  } else {
    return {
      operation: 'normal',
      message: 'Normal crane operations permitted with standard safety protocols',
      maxLoadCapacity: 100,
      maxHeight: 100,
      safetyFactor: 1.0,
      recommendedActions: [
        'Maintain standard operating procedures',
        'Monitor wind conditions periodically',
        'Continue regular safety checks',
        'Be prepared to reduce operations if winds increase'
      ],
      lastUpdated: now
    };
  }
};

const getWorkerSafetyStatus = (currentData: WeatherData): WorkerSafetyStatus => {
  const recommendations: string[] = [];
  let heatRisk: 'low' | 'moderate' | 'high' | 'extreme' = 'low';
  let coldRisk: 'low' | 'moderate' | 'high' = 'low';
  let uvRisk: 'low' | 'moderate' | 'high' | 'extreme' = 'low';
  let windRisk: 'low' | 'moderate' | 'high' = 'low';
  let rainRisk: 'low' | 'moderate' | 'high' = 'low';

  // Heat risk assessment
  if (currentData.temperature > 35) {
    heatRisk = 'extreme';
    recommendations.push(
      'Implement mandatory work/rest cycles (20min work/40min rest)',
      'Provide cooling stations with shade and water',
      'Require frequent hydration breaks (every 15 minutes)',
      'Schedule strenuous work for cooler morning hours'
    );
  } else if (currentData.temperature > 32) {
    heatRisk = 'high';
    recommendations.push(
      'Increase rest periods to 50% of work time',
      'Provide cool drinking water every 30 minutes',
      'Monitor workers for heat stress symptoms',
      'Rotate workers to less strenuous tasks'
    );
  } else if (currentData.temperature > 28) {
    heatRisk = 'moderate';
    recommendations.push(
      'Provide 10-minute rest breaks every hour',
      'Ensure adequate water availability',
      'Encourage workers to wear light-colored clothing'
    );
  }

  // Cold risk assessment
  if (currentData.temperature < -10) {
    coldRisk = 'high';
    recommendations.push(
      'Limit outdoor exposure to 30-minute intervals',
      'Provide heated break areas',
      'Require insulated cold weather gear',
      'Monitor for frostbite and hypothermia'
    );
  } else if (currentData.temperature < 0) {
    coldRisk = 'moderate';
    recommendations.push(
      'Provide warm break areas',
      'Encourage layered clothing',
      'Schedule work during warmest part of day'
    );
  } else if (currentData.temperature < 5) {
    coldRisk = 'low';
    recommendations.push(
      'Provide warm beverages',
      'Encourage proper cold weather attire'
    );
  }

  // UV risk assessment
  if (currentData.uvIndex > 8) {
    uvRisk = 'extreme';
    recommendations.push(
      'Mandatory SPF 50+ sunscreen application every 2 hours',
      'Require long-sleeve shirts and wide-brim hats',
      'Schedule work in shaded areas when possible',
      'Provide UV-protective eyewear'
    );
  } else if (currentData.uvIndex > 6) {
    uvRisk = 'high';
    recommendations.push(
      'Require SPF 30+ sunscreen application every 2 hours',
      'Encourage protective clothing',
      'Schedule breaks in shaded areas'
    );
  } else if (currentData.uvIndex > 3) {
    uvRisk = 'moderate';
    recommendations.push(
      'Recommend sunscreen application',
      'Encourage hats and sunglasses'
    );
  }

  // Wind risk assessment
  if (currentData.windSpeed > 40) {
    windRisk = 'high';
    recommendations.push(
      'Suspend work at heights',
      'Secure all loose materials',
      'Use additional fall protection',
      'Limit exposure to windy areas'
    );
  } else if (currentData.windSpeed > 30) {
    windRisk = 'moderate';
    recommendations.push(
      'Secure tools and materials',
      'Be cautious with lightweight materials',
      'Increase fall protection measures'
    );
  }

  // Rain risk assessment
  if (currentData.rainfall > 10) {
    rainRisk = 'high';
    recommendations.push(
      'Postpone non-essential outdoor work',
      'Use non-slip footwear',
      'Increase visibility with high-vis rain gear',
      'Be cautious of slippery surfaces'
    );
  } else if (currentData.rainfall > 5) {
    rainRisk = 'moderate';
    recommendations.push(
      'Use rain gear',
      'Increase footing awareness',
      'Cover electrical equipment'
    );
  }

  // Add general recommendations if none specific were added
  if (recommendations.length === 0) {
    recommendations.push(
      'Normal safety precautions sufficient',
      'Maintain regular hydration',
      'Follow standard PPE requirements'
    );
  }

  return {
    heatRisk,
    coldRisk,
    uvRisk,
    windRisk,
    rainRisk,
    recommendations
  };
};

const getSiteActivityRecommendations = (
  currentData: WeatherData,
  forecast: ForecastData[]
): SiteActivityRecommendation[] => {
  const recommendations: SiteActivityRecommendation[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  
  // Crane operations recommendation
  const craneStatus = getCraneStatus(currentData.windSpeed, currentData.gustSpeed || currentData.windSpeed + 5);
  recommendations.push({
    activity: 'Crane Operations',
    optimalTime: craneStatus.operation === 'normal' ? 
      'All daylight hours' : 
      craneStatus.operation === 'limited' ? 
        'Morning hours (lower winds)' : 
        'Not recommended today',
    riskFactors: [
      `Wind speed: ${currentData.windSpeed} km/h`,
      craneStatus.windGustWarning ? `Gusts up to ${currentData.gustSpeed} km/h` : '',
      craneStatus.operation !== 'normal' ? 'Reduced capacity' : ''
    ].filter(Boolean),
    equipmentRequirements: [
      'Standard crane equipment',
      craneStatus.operation !== 'normal' ? 'Additional tag lines' : '',
      craneStatus.windGustWarning ? 'Wind monitoring device' : ''
    ].filter(Boolean),
    crewSizeRecommendation: craneStatus.operation === 'normal' ? 
      'Standard crew' : 'Additional ground crew recommended'
  });

  // Concrete pouring recommendation
  const todayPouringScore = forecast[0]?.concretePouringScore || 0;
  const tomorrowPouringScore = forecast[1]?.concretePouringScore || 0;
  recommendations.push({
    activity: 'Concrete Pouring',
    optimalTime: todayPouringScore > 70 ? 
      'Morning hours' : 
      tomorrowPouringScore > 70 ? 
        'Consider postponing to tomorrow' : 
        'Not recommended in next 48 hours',
    riskFactors: [
      `Today's score: ${todayPouringScore}/100`,
      `Tomorrow's score: ${tomorrowPouringScore}/100`,
      todayPouringScore < 50 ? 'Suboptimal conditions' : ''
    ].filter(Boolean),
    equipmentRequirements: [
      'Standard concrete equipment',
      todayPouringScore < 70 ? 'Curing blankets' : '',
      todayPouringScore < 70 ? 'Temperature monitoring' : ''
    ].filter(Boolean),
    crewSizeRecommendation: 'Standard crew'
  });

  // Roofing work recommendation
  const isGoodRoofingTime = currentData.windSpeed < 20 && 
    currentData.rainfall === 0 && 
    currentHour > 8 && currentHour < 16;
  recommendations.push({
    activity: 'Roofing Work',
    optimalTime: isGoodRoofingTime ? 
      'Today until 4 PM' : 
      forecast[0]?.rainChance < 30 ? 
        'Tomorrow morning' : 
        'Postpone until better conditions',
    riskFactors: [
      currentData.windSpeed >= 20 ? `Wind speed: ${currentData.windSpeed} km/h` : '',
      currentData.rainfall > 0 ? 'Wet surfaces' : '',
      currentHour > 16 ? 'Late in day' : ''
    ].filter(Boolean),
    equipmentRequirements: [
      'Standard fall protection',
      currentData.windSpeed > 15 ? 'Additional tie-offs' : '',
      'Roofing materials'
    ].filter(Boolean),
    crewSizeRecommendation: 'Standard crew'
  });

  // Excavation work recommendation
  const isGoodExcavationTime = currentData.rainfall < 5 && 
    forecast[0]?.rainChance < 50;
  recommendations.push({
    activity: 'Excavation Work',
    optimalTime: isGoodExcavationTime ? 
      'All daylight hours' : 
      'Morning hours only',
    riskFactors: [
      currentData.rainfall >= 5 ? 'Wet conditions' : '',
      forecast[0]?.rainChance >= 50 ? 'Rain expected' : '',
      'Trench safety concerns'
    ].filter(Boolean),
    equipmentRequirements: [
      'Standard excavation equipment',
      isGoodExcavationTime ? '' : 'Pump for water removal',
      'Trench boxes'
    ].filter(Boolean),
    crewSizeRecommendation: 'Standard crew'
  });

  // Steel erection recommendation
  const isGoodSteelTime = currentData.windSpeed < 25 && 
    currentData.temperature > 5 && 
    currentData.temperature < 35;
  recommendations.push({
    activity: 'Steel Erection',
    optimalTime: isGoodSteelTime ? 
      'Morning hours' : 
      'Postpone until better conditions',
    riskFactors: [
      currentData.windSpeed >= 25 ? 'High winds' : '',
      currentData.temperature <= 5 ? 'Cold metal' : '',
      currentData.temperature >= 35 ? 'Heat stress risk' : ''
    ].filter(Boolean),
    equipmentRequirements: [
      'Standard steel erection equipment',
      'Additional fall protection',
      'Tag lines'
    ].filter(Boolean),
    crewSizeRecommendation: 'Full crew with additional spotters'
  });

  return recommendations;
};

const getConstructionInsights = (
  currentData: WeatherData | null,
  forecast: ForecastData[],
  craneStatus: CraneStatus,
  workerSafety: WorkerSafetyStatus
): ConstructionInsight[] => {
  const insights: ConstructionInsight[] = [];
  
  if (!currentData) return insights;
  
  // Crane operation insight
  insights.push({
    title: 'Crane Operations',
    value: craneStatus.operation === 'normal' ? 'Normal' : 
           craneStatus.operation === 'limited' ? 'Limited' : 'Suspended',
    description: craneStatus.message,
    icon: HardHat,
    impact: craneStatus.operation === 'normal' ? 'positive' : 
            craneStatus.operation === 'limited' ? 'neutral' : 'negative',
    trend: forecast[0]?.windSpeed > currentData.windSpeed ? 'deteriorating' : 
           forecast[0]?.windSpeed < currentData.windSpeed ? 'improving' : 'stable',
    timeSensitivity: 'Immediate'
  });
  
  // Optimal work hours insight
  const currentHour = new Date().getHours();
  const isDaytime = currentHour > 6 && currentHour < 20;
  const tempComfort = currentData.temperature > 10 && currentData.temperature < 30;
  const rainToday = forecast[0]?.rainChance > 50;
  const workHoursToday = forecast[0]?.workHours || 8;
  
  insights.push({
    title: 'Optimal Work Hours',
    value: `${workHoursToday} productive hours`,
    description: isDaytime && !rainToday && tempComfort ? 
      'Current conditions are optimal for outdoor work' :
      rainToday ? 'Rain expected today - plan indoor work' :
      !isDaytime ? 'Nighttime - limited visibility' :
      'Temperature extremes may affect worker comfort',
    icon: Construction,
    impact: isDaytime && !rainToday && tempComfort ? 'positive' : 'neutral',
    timeSensitivity: 'Today'
  });
  
  // Material storage insight
  const rainNext24h = forecast.slice(0, 2).some(day => day.rainChance > 60);
  
  insights.push({
    title: 'Material Storage',
    value: rainNext24h ? 'Cover Required' : 'Normal',
    description: rainNext24h ? 
      'High chance of rain in next 24 hours - cover all materials' :
      'No significant rain expected - normal storage conditions',
    icon: Umbrella,
    impact: rainNext24h ? 'neutral' : 'positive',
    timeSensitivity: 'Next 24 hours'
  });
  
  // Concrete pouring insight
  const tempRangeNext48h = forecast.slice(0, 2).reduce((acc, day) => {
    return {
      min: Math.min(acc.min, day.lowTemp),
      max: Math.max(acc.max, day.highTemp)
    };
  }, { min: Infinity, max: -Infinity });
      const goodPouringConditions = tempRangeNext48h.min > 5 && tempRangeNext48h.max < 32;
  const pouringScore = forecast[0]?.concretePouringScore || 0;
  
  insights.push({
    title: 'Concrete Pouring',
    value: goodPouringConditions ? 'Recommended' : 'Not Recommended',
    description: goodPouringConditions ?
      `Excellent conditions for concrete pouring (score: ${pouringScore}/100)` :
      `Poor conditions (score: ${pouringScore}/100) - Temperature range ${tempRangeNext48h.min}°C to ${tempRangeNext48h.max}°C`,
    icon: Waves,
    impact: goodPouringConditions ? 'positive' : 'negative',
    trend: forecast[0]?.concretePouringScore > (forecast[1]?.concretePouringScore || 0) ? 'improving' : 'deteriorating',
    timeSensitivity: 'Next 48 hours'
  });
  
  // Worker safety insight
  const safetyRisk = workerSafety.heatRisk === 'extreme' || workerSafety.heatRisk === 'high' || 
                    workerSafety.coldRisk === 'high' || 
                    workerSafety.uvRisk === 'extreme' || 
                    workerSafety.windRisk === 'high' || 
                    workerSafety.rainRisk === 'high';
  
  insights.push({
    title: 'Worker Safety',
    value: safetyRisk ? 'High Risk' : 'Normal',
    description: safetyRisk ?
      'Multiple risk factors present - review safety recommendations' :
      'Standard safety precautions sufficient',
    icon: UserCheck,
    impact: safetyRisk ? 'negative' : 'positive',
    timeSensitivity: 'Immediate'
  });
  
  // Equipment maintenance insight
  const tempExtremes = currentData.temperature > 35 || currentData.temperature < 0;
  const humidityRisk = currentData.humidity > 80 || currentData.humidity < 30;
  
  insights.push({
    title: 'Equipment Maintenance',
    value: tempExtremes || humidityRisk ? 'Increased Checks' : 'Normal',
    description: tempExtremes ?
      'Temperature extremes may affect equipment performance - increase maintenance checks' :
      humidityRisk ?
        'Humidity levels may accelerate corrosion - check lubrication and seals' :
        'Normal maintenance schedule sufficient',
    icon: ClipboardCheck,
    impact: tempExtremes || humidityRisk ? 'neutral' : 'positive',
    timeSensitivity: 'Daily'
  });
  
  // Logistics insight
  const visibilityRisk = currentData.visibility < 1;
  const windRisk = currentData.windSpeed > 30;
  
  insights.push({
    title: 'Site Logistics',
    value: visibilityRisk || windRisk ? 'Challenging' : 'Normal',
    description: visibilityRisk ?
      'Low visibility - reduce vehicle speeds and increase signaling' :
      windRisk ?
        'High winds may affect material handling - secure all loads' :
        'Normal logistics operations',
    icon: Car,
    impact: visibilityRisk || windRisk ? 'neutral' : 'positive',
    timeSensitivity: 'Immediate'
  });
  
  return insights;
};

const Dashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<WeatherData[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [useCelsius, setUseCelsius] = useState(true);
  const [selectedChart, setSelectedChart] = useState('temperature');
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);
  const [craneStatus, setCraneStatus] = useState<CraneStatus | null>(null);
  const [constructionInsights, setConstructionInsights] = useState<ConstructionInsight[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);
  const [locationName, setLocationName] = useState('Loading...');
  const [workerSafety, setWorkerSafety] = useState<WorkerSafetyStatus | null>(null);
  const [activityRecommendations, setActivityRecommendations] = useState<SiteActivityRecommendation[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get user's current location
      if (!userLocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        const { latitude: lat, longitude: lon } = position.coords;
        setUserLocation({ lat, lon });
        
        // Get location name (reverse geocoding)
        try {
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=d1ee93402c4d7089aea224b06edcac6d`
          );
          const data = await response.json();
          if (data.length > 0) {
            setLocationName(`${data[0].name}, ${data[0].country}`);
          }
        } catch (error) {
          console.error('Error fetching location name:', error);
          setLocationName(`${lat.toFixed(4)}°, ${lon.toFixed(4)}°`);
        }
      }
      
      if (userLocation) {
        const [weatherData, forecast] = await Promise.all([
          fetchRealTimeWeather(userLocation.lat, userLocation.lon),
          fetchForecast(userLocation.lat, userLocation.lon)
        ]);

        setSensorData(weatherData);
        setForecastData(forecast);
        setLastUpdated(new Date().toLocaleTimeString());
        
        const currentData = weatherData[0];
        generateAlerts(currentData, forecast);
        
        // Update crane status based on current wind speed
        const currentWindSpeed = currentData.windSpeed;
        const currentGustSpeed = currentData.gustSpeed || currentData.windSpeed + 5;
        const status = getCraneStatus(currentWindSpeed, currentGustSpeed);
        setCraneStatus(status);
        
        // Generate worker safety assessment
        const safetyStatus = getWorkerSafetyStatus(currentData);
        setWorkerSafety(safetyStatus);
        
        // Generate activity recommendations
        const recommendations = getSiteActivityRecommendations(currentData, forecast);
        setActivityRecommendations(recommendations);
        
        // Generate construction insights
        const insights = getConstructionInsights(currentData, forecast, status, safetyStatus);
        setConstructionInsights(insights);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to mock data at default location (New York)
      const fallbackLocation = { lat: 40.7128, lon: -74.0060 };
      setUserLocation(fallbackLocation);
      setLocationName('New York, US');
      
      const [weatherData, forecast] = await Promise.all([
        fetchMockWeatherData(fallbackLocation.lat, fallbackLocation.lon),
        fetchMockForecast()
      ]);
      
      setSensorData(weatherData);
      setForecastData(forecast);
      setLastUpdated(new Date().toLocaleTimeString());
      
      const currentData = weatherData[0];
      generateAlerts(currentData, forecast);
      
      const currentWindSpeed = currentData.windSpeed;
      const currentGustSpeed = currentData.gustSpeed || currentData.windSpeed + 5;
      const status = getCraneStatus(currentWindSpeed, currentGustSpeed);
      setCraneStatus(status);
      
      const safetyStatus = getWorkerSafetyStatus(currentData);
      setWorkerSafety(safetyStatus);
      
      const recommendations = getSiteActivityRecommendations(currentData, forecast);
      setActivityRecommendations(recommendations);
      
      const insights = getConstructionInsights(currentData, forecast, status, safetyStatus);
      setConstructionInsights(insights);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    loadData();

    // Set up refresh every 15 minutes if auto-refresh is enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadData, 15 * 60 * 1000);
    }
    return () => clearInterval(interval);
  }, [loadData, autoRefresh]);

  const generateAlerts = (currentData: WeatherData, forecast: ForecastData[]) => {
    const newAlerts: Alert[] = [];
    const newSuggestions: Suggestion[] = [];
    const timestamp = new Date().toLocaleTimeString();

    // Temperature alerts
    if (currentData.temperature > 35) {
      newAlerts.push({
        type: 'Extreme Heat Warning',
        severity: 'danger',
        message: `Dangerous heat conditions (${currentData.temperature}°C) - High risk of heat stroke`,
        icon: ThermometerSun,
        timestamp,
        affectedZone: 'Entire site',
        duration: 'Until temperatures drop below 32°C',
        actionItems: [
          'Implement mandatory work/rest cycles',
          'Provide cooling stations',
          'Monitor workers for heat stress symptoms'
        ]
      });
      newSuggestions.push({
        type: 'Work Suspension',
        message: 'Consider suspending outdoor work during peak heat hours (11AM-3PM)',
        icon: AlertTriangle,
        priority: 'high',
        relatedAlert: 'Extreme Heat Warning',
        implementationTime: 'Immediately'
      });
    } else if (currentData.temperature > 32) {
      newAlerts.push({
        type: 'Heat Warning',
        severity: 'warning',
        message: `High temperature (${currentData.temperature}°C) - Increased risk of heat-related illnesses`,
        icon: ThermometerSun,
        timestamp,
        affectedZone: 'Outdoor work areas',
        actionItems: [
          'Increase hydration breaks',
          'Provide shaded rest areas',
          'Rotate workers to less strenuous tasks'
        ]
      });
    } else if (currentData.temperature < -10) {
      newAlerts.push({
        type: 'Extreme Cold Warning',
        severity: 'danger',
        message: `Dangerous cold conditions (${currentData.temperature}°C) - Risk of frostbite and hypothermia`,
        icon: ThermometerSnowflake,
        timestamp,
        affectedZone: 'Entire site',
        duration: 'Until temperatures rise above -5°C',
        actionItems: [
          'Limit outdoor exposure to 30-minute intervals',
          'Provide heated break areas',
          'Monitor workers for cold stress symptoms'
        ]
      });
    } else if (currentData.temperature < 0) {
      newAlerts.push({
        type: 'Cold Weather Alert',
        severity: 'warning',
        message: `Freezing temperatures (${currentData.temperature}°C) - Increased risk of cold stress`,
        icon: ThermometerSnowflake,
        timestamp,
        actionItems: [
          'Provide warm break areas',
          'Encourage layered clothing',
          'Schedule work during warmest part of day'
        ]
      });
    }

    // Wind alerts
    const gustSpeed = currentData.gustSpeed || currentData.windSpeed + 5;
    if (gustSpeed > 50) {
      newAlerts.push({
        type: 'Extreme Wind Warning',
        severity: 'danger',
        message: `Dangerous wind gusts (${gustSpeed.toFixed(1)} km/h) - Immediate danger from flying debris`,
        icon: Wind,
        timestamp,
        affectedZone: 'Entire site',
        duration: 'Until winds drop below 40 km/h',
        actionItems: [
          'Suspend all crane operations',
          'Secure all loose materials',
          'Evacuate workers from heights'
        ]
      });
    } else if (gustSpeed > 40) {
      newAlerts.push({
        type: 'High Wind Warning',
        severity: 'warning',
        message: `Strong wind gusts (${gustSpeed.toFixed(1)} km/h) - Difficult working conditions`,
        icon: Wind,
        timestamp,
        actionItems: [
          'Limit crane operations',
          'Secure scaffolding and materials',
          'Use extra caution at heights'
        ]
      });
    }

    // UV index alerts
    if (currentData.uvIndex > 8) {
      newAlerts.push({
        type: 'Extreme UV Radiation',
        severity: 'danger',
        message: `Extreme UV index (${currentData.uvIndex}) - Very high risk of skin damage`,
        icon: Sun,
        timestamp,
        affectedZone: 'Outdoor work areas',
        duration: '10AM-4PM',
        actionItems: [
          'Mandatory SPF 50+ sunscreen',
          'Require UV-protective clothing',
          'Schedule breaks in shade'
        ]
      });
    }

    // Air quality alerts
    if (currentData.airQuality > 150) {
      newAlerts.push({
        type: 'Poor Air Quality',
        severity: 'warning',
        message: `Unhealthy air quality (${currentData.airQuality}) - Sensitive groups affected`,
        icon: AlertCircle,
        timestamp,
        actionItems: [
          'Limit strenuous outdoor activity',
          'Provide N95 masks if needed',
          'Monitor workers with respiratory conditions'
        ]
      });
    }

    // Check upcoming forecast for significant changes
    if (forecast[0]?.rainChance > 70) {
      newSuggestions.push({
        type: 'Weather Advisory',
        message: `Very high chance of rain (${forecast[0].rainChance}%) expected today - reschedule outdoor work`,
        icon: CloudRain,
        priority: 'high',
        implementationTime: 'Today'
      });
    }

    if (forecast[0]?.highTemp > 32 || forecast[0]?.lowTemp < 0) {
      newSuggestions.push({
        type: 'Temperature Advisory',
        message: `Extreme temperatures expected (High: ${forecast[0].highTemp}°C, Low: ${forecast[0].lowTemp}°C) - adjust work schedules`,
        icon: Thermometer,
        priority: 'medium',
        implementationTime: 'Today'
      });
    }

    // Concrete pouring suggestions
    if (forecast[0]?.concretePouringScore && forecast[0].concretePouringScore < 50) {
      newSuggestions.push({
        type: 'Construction Advisory',
        message: `Poor concrete pouring conditions (score: ${forecast[0].concretePouringScore}/100) - consider postponing`,
        icon: Waves,
        priority: 'medium',
        implementationTime: 'Today'
      });
    }

    setAlerts(newAlerts);
    setSuggestions(newSuggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }));
  };

  const toggleTemperatureUnit = () => {
    setUseCelsius(!useCelsius);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const convertTemp = (temp: number): number => {
    return useCelsius ? temp : parseFloat((temp * 9 / 5 + 32).toFixed(1));
  };

  const getWindRoseData = () => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions.map(direction => {
      const relevantData = sensorData.filter(data => 
        windDirectionToText(data.windDirection) === direction
      );
      const avgSpeed = relevantData.length > 0 ?
        relevantData.reduce((sum, data) => sum + data.windSpeed, 0) / relevantData.length :
        0;
      return {
        direction,
        speed: parseFloat(avgSpeed.toFixed(1)),
        gusts: relevantData.length > 0 ?
          relevantData.reduce((sum, data) => sum + (data.gustSpeed || data.windSpeed + 5), 0) / relevantData.length :
          avgSpeed + 5
      };
    });
  };

  const getAqiCategory = (value: number): string => {
    if (value >= 0 && value <= 50) return 'Good';
    if (value <= 100) return 'Moderate';
    if (value <= 150) return 'Unhealthy for Sensitive Groups';
    if (value <= 200) return 'Unhealthy';
    if (value <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getAqiColor = (value: number): string => {
    if (value >= 0 && value <= 50) return 'bg-green-500';
    if (value <= 100) return 'bg-yellow-500';
    if (value <= 150) return 'bg-orange-500';
    if (value <= 200) return 'bg-red-500';
    if (value <= 300) return 'bg-purple-500';
    return 'bg-maroon-500';
  };

  const getSafetyColor = (level: string): string => {
    switch (level) {
      case 'extreme': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-400';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };const downloadCraneReport = () => {
  if (!craneStatus) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const primaryColor = [33, 150, 243]; // Blue
  const secondaryColor = [76, 175, 80]; // Green
  const accentColor = [255, 152, 0]; // Orange
  const darkColor = [33, 37, 41];
  const lightColor = [245, 245, 245];

  // Cover Page
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('CRANE OPERATIONS REPORT', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(locationName, pageWidth / 2, 40, { align: 'center' });
  
  // Logo placeholder (replace with actual logo)
  // doc.addImage(logoData, 'PNG', pageWidth/2 - 15, 60, 30, 30);
  
  doc.setFontSize(16);
  doc.setTextColor(...darkColor);
  doc.text('Prepared for:', pageWidth / 2, 110, { align: 'center' });
  doc.text('Construction Site Management', pageWidth / 2, 120, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 
           pageWidth / 2, 140, { align: 'center' });
  
  doc.addPage();

  // Header with blue bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('CRANE OPERATIONS REPORT', margin, 8);
  doc.text(`Page 1`, pageWidth - margin, 8, { align: 'right' });

  // Report Title
  doc.setFontSize(20);
  doc.setTextColor(...darkColor);
  doc.text('Crane Operations Status', margin, 30);

  // Summary Box
  doc.setFillColor(238, 242, 246);
  doc.roundedRect(margin, 35, pageWidth - 2 * margin, 30, 3, 3, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(margin, 35, pageWidth - 2 * margin, 30, 3, 3, 'D');
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('Report Summary:', margin + 5, 45);
  
  const statusColor = craneStatus.operation === 'normal' ? secondaryColor : 
                     craneStatus.operation === 'limited' ? accentColor : [244, 67, 54];
  
  doc.setFontSize(14);
  doc.setTextColor(...statusColor);
  doc.text(`Current Status: ${craneStatus.operation.toUpperCase()}`, margin + 5, 55);
  
  // Status Details Section
  doc.setFontSize(16);
  doc.setTextColor(...darkColor);
  doc.text('Operational Details', margin, 75);
  
  doc.setDrawColor(220);
  doc.line(margin, 78, pageWidth - margin, 78);

  // Status Card
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, 83, pageWidth - 2 * margin, 40, 3, 3, 'F');
  doc.roundedRect(margin, 83, pageWidth - 2 * margin, 40, 3, 3, 'D');
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('OPERATION STATUS', margin + 8, 93);
  
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text(craneStatus.message, margin + 8, 103);
  
  doc.setTextColor(100);
  doc.setFontSize(10);
  doc.text(`Last Updated: ${craneStatus.lastUpdated}`, margin + 8, 113);

  // Metrics Grid
  const metrics = [
    { 
      title: 'MAX LOAD CAPACITY', 
      value: `${craneStatus.maxLoadCapacity}%`, 
      color: craneStatus.maxLoadCapacity > 80 ? secondaryColor : craneStatus.maxLoadCapacity > 50 ? accentColor : [244, 67, 54]
    },
    { 
      title: 'MAX HEIGHT', 
      value: `${craneStatus.maxHeight} m`, 
      color: primaryColor 
    },
    { 
      title: 'SAFETY FACTOR', 
      value: `${craneStatus.safetyFactor.toFixed(1)}x`, 
      color: craneStatus.safetyFactor > 1.5 ? secondaryColor : accentColor
    }
  ];

  const cardWidth = (pageWidth - 2 * margin - 10) / 3;
  metrics.forEach((metric, i) => {
    const x = margin + (i * (cardWidth + 5));
    
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, 130, cardWidth, 30, 3, 3, 'F');
    doc.setDrawColor(220);
    doc.roundedRect(x, 130, cardWidth, 30, 3, 3, 'D');
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(metric.title, x + 5, 140);
    
    doc.setFontSize(14);
    doc.setTextColor(...metric.color);
    doc.text(metric.value, x + 5, 150);
  });

  // Weather Conditions Section
  const currentData = sensorData[0];
  if (currentData) {
    doc.setFontSize(16);
    doc.setTextColor(...darkColor);
    doc.text('Environmental Conditions', margin, 175);
    doc.setDrawColor(220);
    doc.line(margin, 178, pageWidth - margin, 178);

    // Weather Card
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, 183, pageWidth - 2 * margin, 50, 3, 3, 'F');
    doc.roundedRect(margin, 183, pageWidth - 2 * margin, 50, 3, 3, 'D');
    
    // Wind
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('WIND SPEED', margin + 8, 195);
    doc.setFontSize(14);
    doc.setTextColor(...darkColor);
    doc.text(`${currentData.windSpeed} km/h (${windDirectionToText(currentData.windDirection)})`, margin + 8, 205);
    
    // Gusts
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('GUST SPEED', margin + 100, 195);
    doc.setFontSize(14);
    doc.setTextColor(...darkColor);
    doc.text(`${currentData.gustSpeed || currentData.windSpeed + 5} km/h`, margin + 100, 205);
    
    // Safety Threshold
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Operational Wind Limit: 50 km/h`, pageWidth - margin - 8, 205, { align: 'right' });
  }

  // Recommendations Section
  doc.setFontSize(16);
  doc.setTextColor(...darkColor);
  doc.text('Recommended Actions', margin, 240);
  doc.setDrawColor(220);
  doc.line(margin, 243, pageWidth - margin, 243);

  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, 248, pageWidth - 2 * margin, craneStatus.recommendedActions.length * 10 + 15, 3, 3, 'F');
  doc.roundedRect(margin, 248, pageWidth - 2 * margin, craneStatus.recommendedActions.length * 10 + 15, 3, 3, 'D');
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('ACTIONS REQUIRED:', margin + 8, 260);
  
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  craneStatus.recommendedActions.forEach((action, i) => {
    doc.text(`• ${action}`, margin + 12, 270 + (i * 10));
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Confidential - For internal use only', pageWidth / 2, 290, { align: 'center' });

  // Save PDF
  doc.save(`Crane_Ops_Report_${locationName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

const downloadSiteReport = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const primaryColor = [33, 150, 243]; // Blue
  const secondaryColor = [76, 175, 80]; // Green
  const accentColor = [255, 152, 0]; // Orange
  const darkColor = [33, 37, 41];
  const lightColor = [245, 245, 245];

  // Cover Page
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('CONSTRUCTION SITE REPORT', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(locationName, pageWidth / 2, 40, { align: 'center' });
  
  // Logo placeholder (replace with actual logo)
  // doc.addImage(logoData, 'PNG', pageWidth/2 - 15, 60, 30, 30);
  
  doc.setFontSize(16);
  doc.setTextColor(...darkColor);
  doc.text('Weather & Operations Analysis', pageWidth / 2, 110, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 
           pageWidth / 2, 140, { align: 'center' });
  
  doc.addPage();

  // Header with blue bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('CONSTRUCTION SITE REPORT', margin, 8);
  doc.text(`Page 1`, pageWidth - margin, 8, { align: 'right' });

  // Current Conditions Section
  doc.setFontSize(20);
  doc.setTextColor(...darkColor);
  doc.text('Current Site Conditions', margin, 30);

  const currentData = sensorData[0];
  if (currentData) {
    // Weather Summary Card
    doc.setFillColor(238, 242, 246);
    doc.roundedRect(margin, 35, pageWidth - 2 * margin, 70, 3, 3, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(margin, 35, pageWidth - 2 * margin, 70, 3, 3, 'D');
    
    // Main weather row
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text(currentData.condition, margin + 10, 50);
    
    doc.setFontSize(36);
    doc.setTextColor(...darkColor);
    doc.text(`${convertTemp(currentData.temperature)}${useCelsius ? '°C' : '°F'}`, margin + 80, 55);
    
    // Weather details
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Feels like ${convertTemp(currentData.temperature + (currentData.windSpeed / 10))}${useCelsius ? '°C' : '°F'}`, margin + 80, 65);
    
    // Weather metrics
    const weatherMetrics = [
      { icon: '💨', label: 'Wind', value: `${currentData.windSpeed} km/h` },
      { icon: '🌧️', label: 'Rain', value: `${currentData.rainfall} mm` },
      { icon: '💧', label: 'Humidity', value: `${currentData.humidity}%` }
    ];
    
    weatherMetrics.forEach((metric, i) => {
      const x = margin + 150 + (i * 50);
      doc.setFontSize(12);
      doc.text(metric.icon, x, 50);
      doc.setTextColor(100);
      doc.text(metric.label, x, 60);
      doc.setTextColor(...darkColor);
      doc.text(metric.value, x, 70);
    });
  }

  // Safety Conditions Section
  if (workerSafety) {
    doc.setFontSize(16);
    doc.setTextColor(...darkColor);
    doc.text('Worker Safety Conditions', margin, 115);
    doc.setDrawColor(220);
    doc.line(margin, 118, pageWidth - margin, 118);

    // Safety metrics
    const safetyMetrics = [
      { 
        label: 'Heat Risk', 
        value: workerSafety.heatRisk,
        color: workerSafety.heatRisk === 'Low' ? secondaryColor : 
              workerSafety.heatRisk === 'Moderate' ? accentColor : [244, 67, 54]
      },
      { 
        label: 'UV Risk', 
        value: workerSafety.uvRisk,
        color: workerSafety.uvRisk === 'Low' ? secondaryColor : 
              workerSafety.uvRisk === 'Moderate' ? accentColor : [244, 67, 54]
      },
      { 
        label: 'Wind Risk', 
        value: workerSafety.windRisk,
        color: workerSafety.windRisk === 'Low' ? secondaryColor : 
              workerSafety.windRisk === 'Moderate' ? accentColor : [244, 67, 54]
      },
      { 
        label: 'Rain Risk', 
        value: workerSafety.rainRisk,
        color: workerSafety.rainRisk === 'Low' ? secondaryColor : 
              workerSafety.rainRisk === 'Moderate' ? accentColor : [244, 67, 54]
      }
    ];

    const safetyCardWidth = (pageWidth - 2 * margin - 15) / 4;
    safetyMetrics.forEach((metric, i) => {
      const x = margin + (i * (safetyCardWidth + 5));
      
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(x, 125, safetyCardWidth, 30, 3, 3, 'F');
      doc.setDrawColor(220);
      doc.roundedRect(x, 125, safetyCardWidth, 30, 3, 3, 'D');
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(metric.label, x + 5, 135);
      
      doc.setFontSize(12);
      doc.setTextColor(...metric.color);
      doc.text(metric.value.toUpperCase(), x + 5, 145);
    });
  }

  // 7-Day Forecast Section
  doc.setFontSize(16);
  doc.setTextColor(...darkColor);
  doc.text('7-Day Weather Forecast', margin, 170);
  doc.setDrawColor(220);
  doc.line(margin, 173, pageWidth - margin, 173);

  // Forecast table header
  doc.setFillColor(238, 242, 246);
  doc.rect(margin, 178, pageWidth - 2 * margin, 10, 'F');
  doc.setDrawColor(200);
  doc.rect(margin, 178, pageWidth - 2 * margin, 10, 'D');
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('DATE', margin + 5, 185);
  doc.text('CONDITION', margin + 50, 185);
  doc.text('HIGH/LOW', margin + 120, 185);
  doc.text('RAIN', margin + 170, 185);
  doc.text('WIND', margin + 200, 185);

  // Forecast rows
  doc.setFontSize(10);
  forecastData.forEach((day, i) => {
    const y = 190 + (i * 10);
    
    // Alternate row colors
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 5, pageWidth - 2 * margin, 10, 'F');
    }
    
    doc.setTextColor(...darkColor);
    doc.text(day.date, margin + 5, y);
    doc.text(day.condition, margin + 50, y);
    doc.text(`${convertTemp(day.highTemp)}${useCelsius ? '°C' : '°F'}/${convertTemp(day.lowTemp)}${useCelsius ? '°C' : '°F'}`, margin + 120, y);
    doc.text(`${day.rainChance}%`, margin + 170, y);
    doc.text(`${day.windSpeed} km/h`, margin + 200, y);
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Confidential - For internal use only', pageWidth / 2, 290, { align: 'center' });

  doc.save(`Site_Report_${locationName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};


  const downloadSiteOperationsReport = () => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Site Operations Report', 105, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 28, { align: 'center' });
  doc.text(`Location: ${locationName}`, 105, 34, { align: 'center' });

  // Current Conditions Summary
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Current Conditions Summary', 14, 46);
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  
  const currentData = sensorData[0];
  if (currentData) {
    let yPos = 56;
    
    // Weather Condition
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text('Weather Condition:', 14, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(currentData.condition, 60, yPos);
    
    // Temperature
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.text('Temperature:', 14, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(`${convertTemp(currentData.temperature)}${useCelsius ? '°C' : '°F'} (Feels like ${convertTemp(currentData.temperature + (currentData.windSpeed / 10))}${useCelsius ? '°C' : '°F'})`, 60, yPos);
    
    // Wind
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.text('Wind:', 14, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(`${currentData.windSpeed} km/h (${windDirectionToText(currentData.windDirection)}), Gusts to ${currentData.gustSpeed?.toFixed(1) || (currentData.windSpeed + 5).toFixed(1)} km/h`, 60, yPos);
    
    // Precipitation
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.text('Precipitation:', 14, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(`${currentData.rainfall} mm (24h total: ${sensorData.reduce((sum, d) => sum + d.rainfall, 0).toFixed(1)} mm)`, 60, yPos);
    
    // Worker Safety
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.text('Worker Safety:', 14, yPos);
    doc.setFont(undefined, 'normal');
    if (workerSafety) {
      doc.text(`Heat: ${workerSafety.heatRisk}, UV: ${workerSafety.uvRisk}, Wind: ${workerSafety.windRisk}, Rain: ${workerSafety.rainRisk}`, 60, yPos);
    } else {
      doc.text('Not available', 60, yPos);
    }
  }

  // Activity Recommendations
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Activity Recommendations', 14, 100);
  
  doc.setFontSize(10);
  let yPos = 110;
  
  activityRecommendations.forEach((activity, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(`${activity.activity}:`, 14, yPos);
    
    yPos += 7;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Optimal Time: ${activity.optimalTime}`, 20, yPos);
    
    yPos += 7;
    doc.text(`Risk Factors: ${activity.riskFactors.join(', ')}`, 20, yPos);
    
    yPos += 7;
    doc.text(`Equipment Needs: ${activity.equipmentRequirements.join(', ')}`, 20, yPos);
    
    yPos += 7;
    doc.text(`Crew Recommendation: ${activity.crewSizeRecommendation}`, 20, yPos);
    
    yPos += 10; // Extra space between activities
  });

  // Concrete Pouring Conditions
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Concrete Pouring Conditions', 14, yPos + 10);
  
  doc.setFontSize(10);
  yPos += 20;
  
  forecastData.slice(0, 3).forEach((day, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont(undefined, 'bold');
    doc.text(`${day.date}:`, 14, yPos);
    
    yPos += 7;
    doc.setFont(undefined, 'normal');
    doc.text(`Score: ${day.concretePouringScore}/100 (${day.concretePouringScore > 70 ? 'Ideal' : day.concretePouringScore > 40 ? 'Marginal' : 'Poor'})`, 20, yPos);
    
    yPos += 7;
    doc.text(`Temperature: ${convertTemp(day.lowTemp)}${useCelsius ? '°C' : '°F'} to ${convertTemp(day.highTemp)}${useCelsius ? '°C' : '°F'}`, 20, yPos);
    
    yPos += 7;
    doc.text(`Rain Chance: ${day.rainChance}%`, 20, yPos);
    
    yPos += 7;
    doc.text(`Wind: ${day.windSpeed} km/h`, 20, yPos);
    
    yPos += 10; // Extra space between days
  });

  // Crane Operations Status
  if (craneStatus) {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Crane Operations Status', 14, yPos + 10);
    
    doc.setFontSize(10);
    yPos += 20;
    
    doc.setFont(undefined, 'bold');
    doc.text(`Status: ${craneStatus.operation === 'normal' ? 'Normal Operations' : craneStatus.operation === 'limited' ? 'Limited Operations' : 'Operations Suspended'}`, 14, yPos);
    
    yPos += 7;
    doc.setFont(undefined, 'normal');
    doc.text(craneStatus.message, 20, yPos);
    
    yPos += 10;
    doc.text(`Max Load Capacity: ${craneStatus.maxLoadCapacity}%`, 14, yPos);
    
    yPos += 7;
    doc.text(`Max Height: ${craneStatus.maxHeight}m`, 14, yPos);
    
    yPos += 7;
    doc.text(`Safety Factor: ${craneStatus.safetyFactor.toFixed(1)}x`, 14, yPos);
    
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Recommended Actions:', 14, yPos);
    
    yPos += 7;
    doc.setFont(undefined, 'normal');
    craneStatus.recommendedActions.forEach((action, i) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`• ${action}`, 20, yPos);
      yPos += 7;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Adaptive Weather Intelligence - Automated Report', 105, 290, { align: 'center' });

  // Save the PDF
  doc.save(`site-operations-report-${new Date().toISOString().slice(0, 10)}.pdf`);
};

  const currentConditions = sensorData.length > 0 ? sensorData[0] : null;
  const windRoseData = getWindRoseData();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-40" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((_, i) => (
            <div key={i} className="rounded-xl shadow-sm p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-64 w-full" />
            </div>
          ))}
        </div>

        <div className="rounded-xl shadow-sm p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="ttext-3xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-gray-700 mb-2">Adaptive Weather Intelligence</h1>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Location: {locationName}</span>
            <span className="mx-2">•</span>
            <CalendarClock className="h-4 w-4 mr-1" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="temperature-unit"
              checked={!useCelsius}
              onCheckedChange={toggleTemperatureUnit}
            />
            <Label htmlFor="temperature-unit">
              {useCelsius ? '°C' : '°F'}
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={toggleAutoRefresh}
            />
            <Label htmlFor="auto-refresh">
              Auto Refresh
            </Label>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'overview'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('alerts')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'alerts'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Alerts ({alerts.length})
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('safety')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'safety'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Worker Safety
            </div>
          </button>
        </nav>
      </div>

      {/* Overview Tab Content */}
      {selectedTab === 'overview' && (
        <>
          {/* Construction Insights */}
          <div className="bg-gray-100 bg-opacity-60 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Construction Site Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {constructionInsights.map((insight, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.impact === 'positive' ? 'border-green-500 bg-green-50' :
                    insight.impact === 'negative' ? 'border-red-500 bg-red-50' :
                    'border-amber-500 bg-amber-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      insight.impact === 'positive' ? 'bg-green-100 text-green-600' :
                      insight.impact === 'negative' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      <insight.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{insight.title}</h3>
                      <p className={`text-sm font-bold ${
                        insight.impact === 'positive' ? 'text-green-700' :
                        insight.impact === 'negative' ? 'text-red-700' :
                        'text-amber-700'
                      }`}>
                        {insight.value}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      {insight.trend && (
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500 mr-1">Trend:</span>
                          <span className={`text-xs ${
                            insight.trend === 'improving' ? 'text-green-600' :
                            insight.trend === 'deteriorating' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {insight.trend === 'improving' ? 'Improving' :
                             insight.trend === 'deteriorating' ? 'Deteriorating' : 'Stable'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Conditions Cards */}
          {/* Current Conditions Cards */}
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
                  {currentConditions ? convertTemp(currentConditions.temperature).toFixed(2) : '--'}{useCelsius ? '°C' : '°F'}
                </h3>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Feels like {currentConditions ? convertTemp(currentConditions.temperature + (currentConditions.windSpeed / 10)).toFixed(2) : '--'}{useCelsius ? '°C' : '°F'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Dew point: {currentConditions ? convertTemp(currentConditions.dewPoint || 0).toFixed(2) : '--'}{useCelsius ? '°C' : '°F'}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sensorData.slice(0, 6)}>
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
                  {currentConditions?.windSpeed ? parseFloat(currentConditions.windSpeed).toFixed(2) : '--'} km/h
                </h3>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Gusts {currentConditions ? (currentConditions.gustSpeed || currentConditions.windSpeed + 5).toFixed(2) : '--'} km/h
                  </p>
                  <p className="text-xs text-gray-500">
                    {craneStatus?.operation === 'normal' ? 'Normal crane ops' : craneStatus?.operation === 'limited' ? 'Limited crane ops' : 'Crane ops suspended'}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sensorData.slice(0, 6)}>
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
                  {forecastData[0]?.rainChance ? parseFloat(forecastData[0].rainChance).toFixed(2) : '--'}% chance
                </span>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-bold">
                  {currentConditions?.rainfall ? parseFloat(currentConditions.rainfall).toFixed(2) : '--'} mm
                </h3>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Last hour
                  </p>
                  <p className="text-xs text-gray-500">
                    24h total: {sensorData.reduce((sum, d) => sum + d.rainfall, 0).toFixed(2)} mm
                  </p>
                </div>
              </div>
              <div className="mt-4 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sensorData.slice(0, 6)}>
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
                {workerSafety && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    workerSafety.heatRisk === 'extreme' || workerSafety.coldRisk === 'high' || 
                    workerSafety.uvRisk === 'extreme' ? 'bg-red-100 text-red-800' :
                    workerSafety.heatRisk === 'high' || workerSafety.uvRisk === 'high' ? 'bg-amber-100 text-amber-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {workerSafety.heatRisk === 'extreme' || workerSafety.coldRisk === 'high' || 
                    workerSafety.uvRisk === 'extreme' ? 'High Risk' :
                    workerSafety.heatRisk === 'high' || workerSafety.uvRisk === 'high' ? 'Moderate Risk' : 'Low Risk'}
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-3xl font-bold">
                    {workerSafety?.recommendations.length ? workerSafety.recommendations.length.toFixed(2) : '--'}
                  </h3>
                  <p className="text-sm text-gray-600">Safety recommendations</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Heat: {workerSafety?.heatRisk || '--'}
                  </p>
                  <p className="text-xs text-gray-500">
                    UV: {workerSafety?.uvRisk || '--'}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Heat', value: workerSafety ? 
                      workerSafety.heatRisk === 'extreme' ? 100 : 
                      workerSafety.heatRisk === 'high' ? 75 :
                      workerSafety.heatRisk === 'moderate' ? 50 : 25 : 0
                    },
                    { name: 'UV', value: workerSafety ? 
                      workerSafety.uvRisk === 'extreme' ? 100 : 
                      workerSafety.uvRisk === 'high' ? 75 :
                      workerSafety.uvRisk === 'moderate' ? 50 : 25 : 0
                    },
                    { name: 'Wind', value: workerSafety ? 
                      workerSafety.windRisk === 'high' ? 100 : 
                      workerSafety.windRisk === 'moderate' ? 50 : 25 : 0
                    },
                    { name: 'Rain', value: workerSafety ? 
                      workerSafety.rainRisk === 'high' ? 100 : 
                      workerSafety.rainRisk === 'moderate' ? 50 : 25 : 0
                    }
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

          {/* Charts Section */}
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
                    {currentConditions.gustSpeed?.toFixed(1) || (currentConditions.windSpeed + 5).toFixed()} km/h
                  </p>
                )}
              </div>
            </div>
          </div>

          
          {/* Forecast Section */}
          <div className="bg-gray-100 bg-opacity-60 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">7-Day Forecast</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadSiteReport}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
              {forecastData.map((day, index) => (
                <div key={index} className="text-center p-3 rounded-lg bg-gray-100 bg-opacity-80 hover:bg-gray-100 transition-colors">
                  <p className="font-medium text-gray-700">{day.date.split(',')[0]}</p>
                  <p className="text-xs text-gray-500">{day.date.split(',')[1]}</p>
                  <div className="my-2 flex justify-center">
                    {getConditionIcon(day.condition, 6)}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{day.condition.toLowerCase()}</p>
                  <div className="flex justify-center gap-4 mt-2">
                    <span className="font-bold text-gray-800">{convertTemp(day.highTemp)}{useCelsius ? '°' : '°F'}</span>
                    <span className="text-gray-500">{convertTemp(day.lowTemp)}{useCelsius ? '°' : '°F'}</span>
                  </div>
                  <div className="mt-2 flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-center text-blue-600">
                      <Droplets className="h-3 w-3 mr-1" />
                      {day.rainChance}%
                    </div>
                    <div className="flex items-center justify-center text-gray-600">
                      <Wind className="h-3 w-3 mr-1" />
                      {day.windSpeed} km/h
                    </div>
                    <div className="flex items-center justify-center text-amber-500">
                      <Sunrise className="h-3 w-3 mr-1" />
                      {day.sunrise}
                    </div>
                    <div className="flex items-center justify-center text-red-500">
                      <Sunset className="h-3 w-3 mr-1" />
                      {day.sunset}
                    </div>
                    {day.concretePouringScore && (
                      <div className="mt-1">
                        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              day.concretePouringScore > 70 ? 'bg-green-500' :
                              day.concretePouringScore > 40 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${day.concretePouringScore}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">Concrete: {day.concretePouringScore}/100</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Alerts Tab Content */}
      {selectedTab === 'alerts' && (
        <div className="space-y-6">
          {/* Active Alerts */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Active Alerts ({alerts.length})</h2>
              <div className="flex gap-2">
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  {alerts.filter(a => a.severity === 'danger').length} Critical
                </span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                  {alerts.filter(a => a.severity === 'warning').length} Warnings
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`border-l-4 p-4 rounded cursor-pointer transition-all ${
                      alert.severity === 'danger'
                        ? 'bg-red-50 border-red-500 hover:bg-red-100'
                        : alert.severity === 'warning'
                          ? 'bg-amber-50 border-amber-500 hover:bg-amber-100'
                          : 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                    }`}
                    onClick={() => setExpandedAlert(expandedAlert === index ? null : index)}
                  >
                    <div className="flex items-start space-x-3">
                      <alert.icon className={`h-5 w-5 ${
                        alert.severity === 'danger'
                          ? 'text-red-500'
                          : alert.severity === 'warning'
                            ? 'text-amber-500'
                            : 'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className={`font-medium ${
                            alert.severity === 'danger'
                              ? 'text-red-800'
                              : alert.severity === 'warning'
                                ? 'text-amber-800'
                                : 'text-blue-800'
                          }`}>
                            {alert.type}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{alert.timestamp}</span>
                            <SeverityBadge severity={alert.severity} />
                          </div>
                        </div>
                        <p className={`text-sm ${
                          alert.severity === 'danger'
                            ? 'text-red-600'
                            : alert.severity === 'warning'
                              ? 'text-amber-600'
                              : 'text-blue-600'
                        }`}>
                          {alert.message}
                        </p>
                        {expandedAlert === index && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            {alert.affectedZone && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Affected Area:</span> {alert.affectedZone}
                              </p>
                            )}
                            {alert.duration && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Duration:</span> {alert.duration}
                              </p>
                            )}
                            {alert.actionItems && alert.actionItems.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-600">Required Actions:</p>
                                <ul className="list-disc pl-5 text-xs text-gray-600">
                                  {alert.actionItems.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No active weather alerts</p>
                  <p className="text-sm mt-1">All systems normal</p>
                </div>
              )}
            </div>
          </div>

          {/* Work Suggestions */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Work & Safety Recommendations</h2>
            <div className="space-y-3">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`bg-gray-50 border-l-4 p-4 rounded hover:bg-gray-100 transition-colors ${
                      suggestion.priority === 'high' ? 'border-red-400' :
                      suggestion.priority === 'medium' ? 'border-amber-400' :
                      'border-gray-400'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-1 rounded ${
                        suggestion.priority === 'high' ? 'bg-red-100 text-red-600' :
                        suggestion.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <suggestion.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-800">{suggestion.type}</p>
                          {suggestion.priority === 'high' && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">High Priority</span>
                          )}
                          {suggestion.priority === 'medium' && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Medium Priority</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{suggestion.message}</p>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          {suggestion.implementationTime && (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{suggestion.implementationTime}</span>
                            </>
                          )}
                          {suggestion.relatedAlert && (
                            <span className="ml-2">
                              Related to: {suggestion.relatedAlert}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No specific work recommendations at this time</p>
                  <p className="text-sm mt-1">Conditions are generally favorable for outdoor work</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safety Tab Content */}
      {selectedTab === 'safety' && workerSafety && (
        <div className="space-y-6">
          {/* Worker Safety Overview */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Worker Safety Conditions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Heat Risk */}
              <div className="p-4 rounded-lg border-l-4 border-amber-500 bg-amber-50">
                <div className="flex items-center space-x-3">
                  <ThermometerSun className="h-6 w-6 text-amber-600" />
                  <div>
                    <h3 className="font-medium text-gray-800">Heat Risk</h3>
                    <p className={`text-lg font-bold ${
                      workerSafety.heatRisk === 'extreme' ? 'text-red-700' :
                      workerSafety.heatRisk === 'high' ? 'text-amber-700' :
                      workerSafety.heatRisk === 'moderate' ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      {workerSafety.heatRisk.charAt(0).toUpperCase() + workerSafety.heatRisk.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getSafetyColor(workerSafety.heatRisk)}`}
                      style={{ 
                        width: workerSafety.heatRisk === 'extreme' ? '100%' :
                               workerSafety.heatRisk === 'high' ? '75%' :
                               workerSafety.heatRisk === 'moderate' ? '50%' : '25%'
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Current temp: {currentConditions ? convertTemp(currentConditions.temperature) : '--'}{useCelsius ? '°C' : '°F'}
                  </p>
                </div>
              </div>

              {/* UV Risk */}
              <div className="p-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50">
                <div className="flex items-center space-x-3">
                  <Sun className="h-6 w-6 text-yellow-600" />
                  <div>
                    <h3 className="font-medium text-gray-800">UV Radiation</h3>
                    <p className={`text-lg font-bold ${
                      workerSafety.uvRisk === 'extreme' ? 'text-red-700' :
                      workerSafety.uvRisk === 'high' ? 'text-amber-700' :
                      workerSafety.uvRisk === 'moderate' ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      {workerSafety.uvRisk.charAt(0).toUpperCase() + workerSafety.uvRisk.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getSafetyColor(workerSafety.uvRisk)}`}
                      style={{ 
                        width: workerSafety.uvRisk === 'extreme' ? '100%' :
                               workerSafety.uvRisk === 'high' ? '75%' :
                               workerSafety.uvRisk === 'moderate' ? '50%' : '25%'
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    UV Index: {currentConditions?.uvIndex || '--'}
                  </p>
                </div>
              </div>

              {/* Cold Risk */}
              <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50">
                <div className="flex items-center space-x-3">
                  <ThermometerSnowflake className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-gray-800">Cold Risk</h3>
                    <p className={`text-lg font-bold ${
                      workerSafety.coldRisk === 'high' ? 'text-red-700' :
                      workerSafety.coldRisk === 'moderate' ? 'text-amber-700' :
                      'text-green-700'
                    }`}>
                      {workerSafety.coldRisk.charAt(0).toUpperCase() + workerSafety.coldRisk.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getSafetyColor(workerSafety.coldRisk)}`}
                      style={{ 
                        width: workerSafety.coldRisk === 'high' ? '75%' :
                               workerSafety.coldRisk === 'moderate' ? '50%' : '25%'
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Feels like: {currentConditions ? convertTemp(currentConditions.temperature - (currentConditions.windSpeed / 10)) : '--'}{useCelsius ? '°C' : '°F'}
                  </p>
                </div>
              </div>

              {/* Wind/Rain Risk */}
              <div className="p-4 rounded-lg border-l-4 border-purple-500 bg-purple-50">
                <div className="flex items-center space-x-3">
                  <Wind className="h-6 w-6 text-purple-600" />
                  <div>
                    <h3 className="font-medium text-gray-800">Wind/Rain Risk</h3>
                    <p className={`text-lg font-bold ${
                      workerSafety.windRisk === 'high' || workerSafety.rainRisk === 'high' ? 'text-red-700' :
                      workerSafety.windRisk === 'moderate' || workerSafety.rainRisk === 'moderate' ? 'text-amber-700' :
                      'text-green-700'
                    }`}>
                      {workerSafety.windRisk === 'high' || workerSafety.rainRisk === 'high' ? 'High' :
                       workerSafety.windRisk === 'moderate' || workerSafety.rainRisk === 'moderate' ? 'Moderate' : 'Low'}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        workerSafety.windRisk === 'high' || workerSafety.rainRisk === 'high' ? 'bg-red-500' :
                        workerSafety.windRisk === 'moderate' || workerSafety.rainRisk === 'moderate' ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}
                      style={{ 
                        width: workerSafety.windRisk === 'high' || workerSafety.rainRisk === 'high' ? '75%' :
                               workerSafety.windRisk === 'moderate' || workerSafety.rainRisk === 'moderate' ? '50%' : '25%'
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Wind: {currentConditions?.windSpeed || '--'} km/h, Rain: {currentConditions?.rainfall || '--'} mm
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Recommendations */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Safety Recommendations</h2>
            <div className="space-y-4">
              {workerSafety.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <ClipboardCheck className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PPE Requirements */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Recommended PPE</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(workerSafety.heatRisk === 'extreme' || workerSafety.heatRisk === 'high') && (
                <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="flex items-center space-x-2">
                    <ThermometerSun className="h-5 w-5 text-red-600" />
                    <h3 className="font-medium text-gray-800">Heat Protection</h3>
                  </div>
                  <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                    <li>Cooling vests</li>
                    <li>Wide-brim hats</li>
                    <li>UV-protective clothing</li>
                    <li>Hydration packs</li>
                  </ul>
                </div>
              )}

              {workerSafety.uvRisk === 'extreme' || workerSafety.uvRisk === 'high' ? (
                <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                  <div className="flex items-center space-x-2">
                    <Sun className="h-5 w-5 text-amber-600" />
                    <h3 className="font-medium text-gray-800">Sun Protection</h3>
                  </div>
                  <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                    <li>SPF 50+ sunscreen</li>
                    <li>UV-protective sunglasses</li>
                    <li>Long-sleeve shirts</li>
                    <li>Neck flaps</li>
                  </ul>
                </div>
              ) : null}

              {(workerSafety.coldRisk === 'high' || workerSafety.coldRisk === 'moderate') && (
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center space-x-2">
                    <ThermometerSnowflake className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-gray-800">Cold Protection</h3>
                  </div>
                  <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                    <li>Insulated gloves</li>
                    <li>Thermal base layers</li>
                    <li>Winter work boots</li>
                    <li>Face protection</li>
                  </ul>
                </div>
              )}

              {(workerSafety.windRisk === 'high' || workerSafety.rainRisk === 'high') && (
                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center space-x-2">
                    <Wind className="h-5 w-5 text-purple-600" />
                    <h3 className="font-medium text-gray-800">Wind/Rain Protection</h3>
                  </div>
                  <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                    <li>Waterproof outerwear</li>
                    <li>Non-slip footwear</li>
                    <li>High-vis rain gear</li>
                    <li>Goggles (for high winds)</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Operations Tab Content */}
            {/* Operations Tab Content */}
      {selectedTab === 'operations' && (
        <div className="space-y-6">
          {/* Activity Recommendations */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Site Activity Recommendations</h2>
            <div className="space-y-4">
              {activityRecommendations.map((activity, index) => (
                <div key={index} className="p-4 rounded-lg border border-gray-200 hover:border-red-300 transition-colors">
                  <h3 className="font-medium text-gray-800">{activity.activity}</h3>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Optimal Time</p>
                      <p className="text-sm text-gray-800">{activity.optimalTime}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Risk Factors</p>
                      <ul className="text-sm text-gray-800 list-disc pl-5">
                        {activity.riskFactors.map((risk, i) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Equipment Needs</p>
                      <ul className="text-sm text-gray-800 list-disc pl-5">
                        {activity.equipmentRequirements.map((equip, i) => (
                          <li key={i}>{equip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-600">Crew Recommendation</p>
                    <p className="text-sm text-gray-800">{activity.crewSizeRecommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Concrete Pouring Planner */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Concrete Pouring Planner</h2>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {forecastData.slice(0, 7).map((day, index) => (
                <div key={index} className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="font-medium text-gray-700">{day.date.split(',')[0]}</p>
                  <p className="text-xs text-gray-500">{day.date.split(',')[1]}</p>
                  <div className="my-2">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          day.concretePouringScore > 70 ? 'bg-green-500' :
                          day.concretePouringScore > 40 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${day.concretePouringScore}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">
                      {day.concretePouringScore}/100
                    </span>
                  </div>
                  <div className="flex justify-center gap-4">
                    <span className="text-sm font-bold">{convertTemp(day.highTemp)}{useCelsius ? '°' : '°F'}</span>
                    <span className="text-sm text-gray-500">{convertTemp(day.lowTemp)}{useCelsius ? '°' : '°F'}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <p>{day.rainChance}% rain</p>
                    <p>{day.windSpeed} km/h wind</p>
                  </div>
                  <div className="mt-2">
                    {day.concretePouringScore > 70 ? (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Ideal
                      </span>
                    ) : day.concretePouringScore > 40 ? (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                        Marginal
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Poor
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800">Ideal Conditions (70-100)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Temperature between 5°C and 32°C, low rain chance, minimal wind
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <h3 className="font-medium text-amber-800">Marginal Conditions (40-70)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Temperature near limits or moderate rain/wind risk
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <h3 className="font-medium text-red-800">Poor Conditions (0-40)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Extreme temperatures, high rain chance, or strong winds
                </p>
              </div>
            </div>
          </div>

          {/* Daily Work Schedule */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Optimal Work Schedule</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recommended Activities
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conditions
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crew Size
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-50 divide-y divide-gray-200">
                  {[
                    { time: '6AM-9AM', activities: ['Steel erection', 'Crane operations', 'Roofing'], conditions: 'Cool temperatures, low wind', crew: 'Full crew' },
                    { time: '9AM-12PM', activities: ['Concrete pouring', 'Masonry', 'Framing'], conditions: 'Moderate temperatures', crew: 'Full crew' },
                    { time: '12PM-1PM', activities: ['Lunch break'], conditions: 'Peak heat/UV', crew: 'Break only' },
                    { time: '1PM-3PM', activities: ['Indoor work', 'Equipment maintenance', 'Material prep'], conditions: 'Peak heat/UV', crew: 'Reduced crew' },
                    { time: '3PM-6PM', activities: ['Excavation', 'Site cleanup', 'Finishing work'], conditions: 'Cooling temperatures', crew: 'Full crew' },
                  ].map((period, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {period.time}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <ul className="list-disc pl-5">
                          {period.activities.map((activity, i) => (
                            <li key={i}>{activity}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {period.conditions}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {period.crew}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800">Today's Daylight Hours</h3>
                <p className="text-2xl font-bold mt-1">
                  {forecastData[0]?.sunrise} - {forecastData[0]?.sunset}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {forecastData[0]?.workHours} productive work hours
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800">Recommended Work Focus</h3>
                <p className="text-xl font-bold mt-1">
                  {currentConditions?.temperature > 28 ? 'Early Morning Work' :
                   currentConditions?.temperature < 5 ? 'Midday Work' : 'Full Day Operations'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Based on current temperature: {currentConditions ? convertTemp(currentConditions.temperature) : '--'}{useCelsius ? '°C' : '°F'}
                </p>
              </div>
            </div>
          </div>

          {/* Equipment Readiness */}
          <div className="rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Equipment Readiness</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Crane Readiness</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Operation Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      craneStatus?.operation === 'normal' ? 'bg-green-100 text-green-800' :
                      craneStatus?.operation === 'limited' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {craneStatus?.operation === 'normal' ? 'Operational' :
                       craneStatus?.operation === 'limited' ? 'Limited' : 'Suspended'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Load:</span>
                    <span className="font-medium">{craneStatus?.maxLoadCapacity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Height:</span>
                    <span className="font-medium">{craneStatus?.maxHeight}m</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Material Handling</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage Conditions:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      forecastData.some(day => day.rainChance > 50) ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {forecastData.some(day => day.rainChance > 50) ? 'Cover Required' : 'Normal'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temperature Exposure:</span>
                    <span className="font-medium">
                      {Math.min(...forecastData.map(d => d.lowTemp))}° to {Math.max(...forecastData.map(d => d.highTemp))}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Humidity:</span>
                    <span className="font-medium">
                      {currentConditions?.humidity}%
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Vehicle Operations</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ground Conditions:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      currentConditions?.rainfall > 5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {currentConditions?.rainfall > 5 ? 'Wet' : 'Dry'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visibility:</span>
                    <span className="font-medium">
                      {currentConditions?.visibility} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wind Impact:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      currentConditions?.windSpeed > 30 ? 'bg-amber-100 text-amber-800' :
                      currentConditions?.windSpeed > 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {currentConditions?.windSpeed > 30 ? 'High' :
                       currentConditions?.windSpeed > 20 ? 'Moderate' : 'Low'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 py-6">
        <p>Construction Weather Dashboard v1.2 - Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mt-1">Data refreshes every 15 minutes. Critical alerts trigger immediate notifications.</p>
      </div>
    </div>
  );
};

export default Dashboard;