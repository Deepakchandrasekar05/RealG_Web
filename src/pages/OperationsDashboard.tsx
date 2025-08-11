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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  Thermometer,
  Wind,
  AlertTriangle,
  HardHat,
  Construction,
  UserCheck,
  ClipboardCheck,
  Clock,
  Download,
  Gauge,
  Anchor,
  CloudRain,
  Sun,
  Cloud,
  Snowflake,
  Eye,
  Compass,
  ThermometerSun,
  ThermometerSnowflake,
  RefreshCw,
  MapPin,
  CalendarClock,
  ShieldAlert,
  AlertCircle,
  Siren,
  Lightbulb,
  SunSnow,
  Droplets,
  CloudSunRain,
  CloudLightning,
  Umbrella,
  Activity,
  ClipboardList,
  Users,
  Clock4,
  SunDim,
  CloudDrizzle,
  CheckCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';

// Types
type WeatherCondition = 'Sunny' | 'Partly Cloudy' | 'Cloudy' | 'Rain' | 'Thunderstorm' | 'Snow' | 'Fog' | 'Drizzle' | 'Hail';

interface WeatherData {
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainfall: number;
  condition: WeatherCondition;
  gustSpeed?: number;
  uvIndex?: number;
  visibility?: number;
  dewPoint?: number;
  pressure?: number;
}

interface ForecastData {
  date: string;
  highTemp: number;
  lowTemp: number;
  rainChance: number;
  windSpeed: number;
  condition: WeatherCondition;
  concretePouringScore?: number;
  uvIndex?: number;
  visibility?: number;
}

interface CraneStatus {
  operation: 'normal' | 'limited' | 'suspended' | 'emergency';
  message: string;
  maxLoadCapacity: number;
  maxHeight: number;
  recommendedActions: string[];
  safetyFactor: number;
  windGustWarning?: boolean;
  lastUpdated: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
  lightningRisk?: boolean;
  temperatureRisk?: boolean;
  visibilityRisk?: boolean;
}

interface SiteActivityRecommendation {
  activity: string;
  optimalTime: string;
  riskFactors: string[];
  equipmentRequirements: string[];
  crewSizeRecommendation: string;
  safetyLevel: 'safe' | 'caution' | 'danger';
  productivityImpact: 'minimal' | 'moderate' | 'significant';
  durationRecommendation?: string;
}

interface SafetyIncident {
  type: 'near-miss' | 'injury' | 'equipment-failure' | 'weather-event' | 'safety-violation';
  description: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
  actionTaken: string;
  location?: string;
}

interface EquipmentStatus {
  type: string;
  status: 'operational' | 'limited' | 'out-of-service';
  lastInspection: string;
  nextInspection: string;
  issues?: string[];
}

const fetchRealTimeWeather = async (lat: number, lon: number): Promise<WeatherData[]> => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=d1ee93402c4d7089aea224b06edcac6d&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const data = await response.json();
    
    const processedData: WeatherData[] = data.list.map((item: any) => {
      const date = new Date(item.dt * 1000);
      const hourString = `${date.getHours().toString().padStart(2, '0')}:00`;
      
      let condition: WeatherCondition = 'Sunny';
      const weatherMain = item.weather[0].main.toLowerCase();
      if (weatherMain.includes('thunder')) condition = 'Thunderstorm';
      else if (weatherMain.includes('drizzle')) condition = 'Drizzle';
      else if (weatherMain.includes('rain')) condition = 'Rain';
      else if (weatherMain.includes('snow')) condition = 'Snow';
      else if (weatherMain.includes('hail')) condition = 'Hail';
      else if (weatherMain.includes('cloud')) condition = item.clouds.all > 70 ? 'Cloudy' : 'Partly Cloudy';
      else if (weatherMain.includes('fog') || weatherMain.includes('mist')) condition = 'Fog';
      
      return {
        time: hourString,
        temperature: item.main.temp,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed * 3.6,
        windDirection: item.wind.deg,
        gustSpeed: item.wind.gust ? item.wind.gust * 3.6 : (item.wind.speed * 3.6) + 5,
        rainfall: item.rain ? item.rain['3h'] || 0 : 0,
        condition,
        uvIndex: Math.round((item.pop || 0) * 10), // Approximate UV index
        visibility: item.visibility ? item.visibility / 1000 : 10, // Convert to km
        dewPoint: item.dew_point || calculateDewPoint(item.main.temp, item.main.humidity),
        pressure: item.main.pressure
      };
    });
    
    return processedData.slice(0, 24);
  } catch (error) {
    console.error('Error fetching real-time weather:', error);
    return fetchMockWeatherData(lat, lon);
  }
};

const calculateDewPoint = (temp: number, humidity: number): number => {
  // Magnus formula approximation
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
  return (b * alpha) / (a - alpha);
};

const fetchMockWeatherData = async (lat: number, lon: number): Promise<WeatherData[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const now = new Date();
  const isUrban = Math.abs(lat - 40.7128) < 5 && Math.abs(lon - (-74.0060)) < 5;
  const locationFactor = isUrban ? 1.2 : 0.9;
  const isCoastal = Math.abs(lon - (-74.0060)) < 2;
  
  const data: WeatherData[] = [];
  for (let i = 0; i < 24; i++) {
    const time = new Date(now);
    time.setHours(time.getHours() + i);
    const hour = time.getHours();
    const hourString = `${hour.toString().padStart(2, '0')}:00`;
    
    const baseTemp = 15 + 10 * Math.sin((hour - 6) * Math.PI / 12) * locationFactor;
    const tempVariation = (Math.random() - 0.5) * 3;
    const humidityBase = 50 + 20 * Math.sin((hour - 3) * Math.PI / 12);
    const humidityVariation = (Math.random() - 0.5) * 15;
    
    let condition: WeatherCondition = 'Sunny';
    const rand = Math.random();
    if (rand > 0.95) condition = 'Thunderstorm';
    else if (rand > 0.85) condition = 'Hail';
    else if (rand > 0.75) condition = 'Rain';
    else if (rand > 0.65) condition = 'Drizzle';
    else if (rand > 0.5) condition = 'Cloudy';
    else if (rand > 0.3) condition = 'Partly Cloudy';
    
    const baseWindSpeed = isCoastal ? 
      8 + Math.random() * 12 + Math.sin(hour / 6 * Math.PI) * 8 :
      5 + Math.random() * 10 + Math.sin(hour / 6 * Math.PI) * 5;
    
    const temp = parseFloat((baseTemp + tempVariation).toFixed(1));
    const humidity = Math.round(humidityBase + humidityVariation);
    
    data.push({
      time: hourString,
      temperature: temp,
      humidity,
      windSpeed: parseFloat(baseWindSpeed.toFixed(1)),
      windDirection: Math.round(Math.random() * 360),
      gustSpeed: parseFloat((baseWindSpeed + 5 + Math.random() * 5).toFixed(1)),
      rainfall: condition === 'Rain' ? parseFloat((Math.random() * 5).toFixed(1)) : 
               condition === 'Thunderstorm' ? parseFloat((Math.random() * 10).toFixed(1)) : 
               condition === 'Drizzle' ? parseFloat((Math.random() * 2).toFixed(1)) : 0,
      condition,
      uvIndex: Math.round((hour / 24) * 10 + (Math.random() - 0.5) * 2),
      visibility: condition === 'Fog' ? parseFloat((0.1 + Math.random() * 0.9).toFixed(1)) :
                 condition === 'Rain' ? parseFloat((2 + Math.random() * 5).toFixed(1)) :
                 condition === 'Thunderstorm' ? parseFloat((1 + Math.random() * 3).toFixed(1)) :
                 parseFloat((10 + (Math.random() - 0.5) * 2).toFixed(1)),
      dewPoint: calculateDewPoint(temp, humidity),
      pressure: 980 + Math.round(Math.random() * 40)
    });
  }
  
  return data;
};

const fetchForecast = async (lat: number, lon: number): Promise<ForecastData[]> => {
  try {
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
      
      let condition: WeatherCondition = 'Sunny';
      const weatherMain = day.weather[0].main.toLowerCase();
      if (weatherMain.includes('thunder')) condition = 'Thunderstorm';
      else if (weatherMain.includes('hail')) condition = 'Hail';
      else if (weatherMain.includes('rain')) condition = 'Rain';
      else if (weatherMain.includes('drizzle')) condition = 'Drizzle';
      else if (weatherMain.includes('snow')) condition = 'Snow';
      else if (weatherMain.includes('cloud')) condition = 'Cloudy';
      
      const tempRange = day.temp.max - day.temp.min;
      const pouringScore = Math.max(0, 100 - 
        (Math.max(0, day.temp.min - 5) * 5) -
        (Math.max(0, day.temp.max - 32) * 5) -
        (day.pop * 20) -
        (tempRange * 3)
      );
      
      return {
        date: dateString,
        highTemp: day.temp.max,
        lowTemp: day.temp.min,
        rainChance: Math.round(day.pop * 100),
        windSpeed: day.speed * 3.6,
        condition,
        concretePouringScore: Math.round(Math.min(100, Math.max(0, pouringScore))),
        uvIndex: Math.round((index === 0 ? 5 : index === 1 ? 6 : index === 2 ? 7 : 4) + (Math.random() - 0.5) * 2),
        visibility: condition === 'Rain' ? parseFloat((5 + Math.random() * 5).toFixed(1)) :
                   condition === 'Thunderstorm' ? parseFloat((3 + Math.random() * 4).toFixed(1)) :
                   parseFloat((10 + (Math.random() - 0.5) * 2).toFixed(1))
      };
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
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
    
    const baseTemp = 22 + (Math.random() - 0.5) * 10;
    const willRain = Math.random() > (i < 2 ? 0.6 : 0.7);
    const isStorm = willRain && Math.random() > 0.7;
    const isHail = isStorm && Math.random() > 0.8;
    
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
      condition: isHail ? 'Hail' : isStorm ? 'Thunderstorm' : willRain ? 
                (Math.random() > 0.7 ? 'Drizzle' : 'Rain') : 
                Math.random() > 0.5 ? 'Partly Cloudy' : 'Sunny',
      concretePouringScore: Math.round(Math.min(100, Math.max(0, pouringScore))),
      uvIndex: Math.round((i === 0 ? 5 : i === 1 ? 6 : i === 2 ? 7 : 4) + (Math.random() - 0.5) * 2),
      visibility: isStorm ? parseFloat((3 + Math.random() * 4).toFixed(1)) :
                 willRain ? parseFloat((5 + Math.random() * 5).toFixed(1)) :
                 parseFloat((10 + (Math.random() - 0.5) * 2).toFixed(1))
    });
  }
  
  return forecasts;
};

const windDirectionToText = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round((degrees % 360) / 22.5) % 16];
};

const getCraneStatus = (weatherData: WeatherData): CraneStatus => {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const windSpeed = weatherData.windSpeed;
  const windGust = weatherData.gustSpeed || weatherData.windSpeed + 5;
  const visibility = weatherData.visibility || 10;
  const temperature = weatherData.temperature;
  const isLightning = weatherData.condition === 'Thunderstorm';
  
  // Enhanced risk assessment
  if (isLightning || windGust > 60 || windSpeed > 50 || visibility < 0.5) {
    return {
      operation: 'emergency',
      message: 'EMERGENCY: All crane operations must cease immediately due to extreme conditions',
      maxLoadCapacity: 0,
      maxHeight: 0,
      safetyFactor: 0,
      windGustWarning: windGust > 40,
      lightningRisk: isLightning,
      temperatureRisk: temperature < -10 || temperature > 40,
      visibilityRisk: visibility < 1,
      riskLevel: 'extreme',
      recommendedActions: [
                'Immediately cease all crane operations',
        'Secure crane booms in parking position',
        'Evacuate all personnel from elevated work platforms',
        'Activate emergency lighting if visibility is low',
        'Monitor weather radar for lightning activity',
        'Do not resume operations until conditions improve for at least 30 minutes'
      ],
      lastUpdated: now
    };
  } else if (windGust > 50 || windSpeed > 40 || visibility < 1 || temperature < -5 || temperature > 35) {
    return {
      operation: 'suspended',
      message: 'All crane operations must be suspended immediately due to dangerous conditions',
      maxLoadCapacity: 0,
      maxHeight: 0,
      safetyFactor: 0,
      windGustWarning: true,
      lightningRisk: false,
      temperatureRisk: temperature < -5 || temperature > 35,
      visibilityRisk: visibility < 1,
      riskLevel: 'high',
      recommendedActions: [
        'Secure all crane booms and equipment immediately',
        'Lower all loads to the ground',
        'Implement emergency shutdown procedures',
        'Monitor conditions continuously until safe',
        'Provide thermal protection for operators if extreme temperatures',
        'Use additional lighting if visibility is reduced',
        'Do not resume operations until conditions improve'
      ],
      lastUpdated: now
    };
  } else if (windGust > 40 || windSpeed > 30 || visibility < 3 || temperature < 0 || temperature > 30) {
    return {
      operation: 'limited',
      message: 'Crane operations must be strictly limited due to adverse conditions',
      maxLoadCapacity: 40,
      maxHeight: 15,
      safetyFactor: 0.6,
      windGustWarning: true,
      lightningRisk: false,
      temperatureRisk: temperature < 0 || temperature > 30,
      visibilityRisk: visibility < 3,
      riskLevel: 'high',
      recommendedActions: [
        'Reduce load capacity to 40% of normal',
        'Limit boom height to 15 meters',
        'Increase safety margins for all lifts',
        'Use tag lines for all loads',
        'Implement additional communication protocols',
        'Provide operator breaks every 30 minutes in extreme temperatures',
        'Use spotter for visibility under 3km'
      ],
      lastUpdated: now
    };
  } else if (windGust > 30 || windSpeed > 20 || visibility < 5) {
    return {
      operation: 'limited',
      message: 'Exercise caution with crane operations due to challenging conditions',
      maxLoadCapacity: 70,
      maxHeight: 30,
      safetyFactor: 0.8,
      windGustWarning: false,
      lightningRisk: false,
      temperatureRisk: false,
      visibilityRisk: visibility < 5,
      riskLevel: 'moderate',
      recommendedActions: [
        'Reduce load capacity to 70% of normal',
        'Limit boom height to 30 meters',
        'Use extra caution with light, bulky loads',
        'Secure all loose materials',
        'Consider postponing non-critical lifts',
        'Monitor wind conditions hourly',
        'Use additional communication for visibility under 5km'
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
      windGustWarning: false,
      lightningRisk: false,
      temperatureRisk: false,
      visibilityRisk: false,
      riskLevel: 'low',
      recommendedActions: [
        'Maintain standard operating procedures',
        'Monitor conditions periodically',
        'Continue regular safety checks',
        'Be prepared to reduce operations if conditions change',
        'Ensure all operators are properly hydrated',
        'Follow standard visibility protocols'
      ],
      lastUpdated: now
    };
  }
};

const getSiteActivityRecommendations = (
  currentData: WeatherData,
  forecast: ForecastData[]
): SiteActivityRecommendation[] => {
  const recommendations: SiteActivityRecommendation[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  const uvIndex = currentData.uvIndex || 0;
  const visibility = currentData.visibility || 10;
  
  // Crane operations recommendation
  const craneStatus = getCraneStatus(currentData);
  recommendations.push({
    activity: 'Crane Operations',
    optimalTime: craneStatus.operation === 'normal' ? 
      'All daylight hours with wind < 20 km/h' : 
      craneStatus.operation === 'limited' ? 
        'Morning hours (lower winds)' : 
        'Not recommended today',
    riskFactors: [
      `Wind speed: ${currentData.windSpeed} km/h`,
      `Gusts up to ${currentData.gustSpeed || currentData.windSpeed + 5} km/h`,
      craneStatus.visibilityRisk ? `Low visibility: ${visibility} km` : '',
      craneStatus.temperatureRisk ? `Extreme temperature: ${currentData.temperature}°C` : '',
      craneStatus.lightningRisk ? 'Lightning risk present' : ''
    ].filter(Boolean),
    equipmentRequirements: [
      'Standard crane equipment',
      craneStatus.operation !== 'normal' ? 'Additional tag lines' : '',
      craneStatus.windGustWarning ? 'Wind monitoring device' : '',
      craneStatus.visibilityRisk ? 'Additional lighting' : '',
      craneStatus.temperatureRisk ? 'Operator climate control' : ''
    ].filter(Boolean),
    crewSizeRecommendation: craneStatus.operation === 'normal' ? 
      'Standard crew' : 'Additional ground crew required',
    safetyLevel: craneStatus.operation === 'normal' ? 'safe' : 
                craneStatus.operation === 'limited' ? 'caution' : 'danger',
    productivityImpact: craneStatus.operation === 'normal' ? 'minimal' : 
                      craneStatus.operation === 'limited' ? 'moderate' : 'significant',
    durationRecommendation: craneStatus.operation === 'normal' ? 
      'Standard shifts' : 'Reduced shift duration recommended'
  });

  // Concrete pouring recommendation
  const todayPouringScore = forecast[0]?.concretePouringScore || 0;
  const tomorrowPouringScore = forecast[1]?.concretePouringScore || 0;
  const bestPouringDay = forecast.reduce((best, day, index) => 
    (day.concretePouringScore || 0) > (best.score || 0) ? 
    {score: day.concretePouringScore, index} : best, {score: 0, index: 0});
  
  recommendations.push({
    activity: 'Concrete Pouring',
    optimalTime: todayPouringScore > 80 ? 
      'Morning hours (6AM-11AM)' : 
      bestPouringDay.score > 70 ? 
        `Best on ${forecast[bestPouringDay.index].date.split(',')[0]}` : 
        'Postpone until conditions improve',
    riskFactors: [
      `Today's score: ${todayPouringScore}/100`,
      `Temperature: ${currentData.temperature}°C`,
      currentData.rainfall > 0 ? `Rainfall: ${currentData.rainfall}mm` : '',
      currentData.humidity > 80 ? `High humidity: ${currentData.humidity}%` : ''
    ].filter(Boolean),
    equipmentRequirements: [
      'Standard concrete equipment',
      todayPouringScore < 80 ? 'Curing blankets' : '',
      todayPouringScore < 80 ? 'Temperature monitoring' : '',
      todayPouringScore < 60 ? 'Weather protection' : ''
    ].filter(Boolean),
    crewSizeRecommendation: 'Standard crew + additional finishers',
    safetyLevel: todayPouringScore > 80 ? 'safe' : 
                todayPouringScore > 60 ? 'caution' : 'danger',
    productivityImpact: todayPouringScore > 80 ? 'minimal' : 
                      todayPouringScore > 60 ? 'moderate' : 'significant',
    durationRecommendation: todayPouringScore > 80 ? 
      'Full day pour possible' : 'Limited pour windows recommended'
  });

  // Roofing work recommendation
  const isGoodRoofingTime = currentData.windSpeed < 20 && 
    currentData.rainfall === 0 && 
    currentHour > 8 && currentHour < 16 &&
    uvIndex < 8;
  const roofingDay = forecast.find(day => 
    day.windSpeed < 20 && day.rainChance < 30 && !['Rain', 'Thunderstorm'].includes(day.condition));
  
  recommendations.push({
    activity: 'Roofing Work',
    optimalTime: isGoodRoofingTime ? 
      'Today until 4 PM' : 
      roofingDay ? 
        `Best on ${roofingDay.date.split(',')[0]}` : 
        'Postpone until better conditions',
    riskFactors: [
      currentData.windSpeed >= 20 ? `Wind speed: ${currentData.windSpeed} km/h` : '',
      currentData.rainfall > 0 ? 'Wet surfaces' : '',
      uvIndex >= 8 ? `High UV index: ${uvIndex}` : '',
      currentHour > 16 ? 'Late in day' : ''
    ].filter(Boolean),
    equipmentRequirements: [
      'Standard fall protection',
      currentData.windSpeed > 15 ? 'Additional tie-offs' : '',
      uvIndex > 6 ? 'UV protective clothing' : '',
      'Roofing materials'
    ].filter(Boolean),
    crewSizeRecommendation: 'Standard crew + safety observer',
    safetyLevel: isGoodRoofingTime ? 'safe' : 
                roofingDay ? 'caution' : 'danger',
    productivityImpact: isGoodRoofingTime ? 'minimal' : 
                      roofingDay ? 'moderate' : 'significant',
    durationRecommendation: 'Morning shifts recommended'
  });

  // Excavation work recommendation
  const isGoodExcavationTime = currentData.rainfall < 5 && 
    forecast[0]?.rainChance < 50 &&
    currentData.temperature > 0;
  const excavationDay = forecast.find(day => 
    day.rainChance < 30 && day.temperature > 0);
  
  recommendations.push({
    activity: 'Excavation Work',
    optimalTime: isGoodExcavationTime ? 
      'All daylight hours' : 
      excavationDay ? 
        `Best on ${excavationDay.date.split(',')[0]}` : 
        'Morning hours only',
    riskFactors: [
      currentData.rainfall >= 5 ? 'Wet conditions' : '',
      forecast[0]?.rainChance >= 50 ? 'Rain expected' : '',
      currentData.temperature <= 0 ? 'Frozen ground' : '',
      'Trench safety concerns'
    ].filter(Boolean),
    equipmentRequirements: [
      'Standard excavation equipment',
      isGoodExcavationTime ? '' : 'Pump for water removal',
      'Trench boxes',
      'Ground temperature monitoring'
    ].filter(Boolean),
    crewSizeRecommendation: 'Standard crew + safety monitor',
    safetyLevel: isGoodExcavationTime ? 'safe' : 
                excavationDay ? 'caution' : 'danger',
    productivityImpact: isGoodExcavationTime ? 'minimal' : 
                      excavationDay ? 'moderate' : 'significant',
    durationRecommendation: 'Daylight hours only'
  });

  // Steel erection recommendation
  const isGoodSteelTime = currentData.windSpeed < 25 && 
    currentData.temperature > 5 && 
    currentData.temperature < 35 &&
    !['Rain', 'Thunderstorm'].includes(currentData.condition);
  const steelDay = forecast.find(day => 
    day.windSpeed < 25 && day.temperature > 5 && day.temperature < 35 && !['Rain', 'Thunderstorm'].includes(day.condition));
  
  recommendations.push({
    activity: 'Steel Erection',
    optimalTime: isGoodSteelTime ? 
      'Morning hours' : 
      steelDay ? 
        `Best on ${steelDay.date.split(',')[0]}` : 
        'Postpone until better conditions',
    riskFactors: [
      currentData.windSpeed >= 25 ? 'High winds' : '',
      currentData.temperature <= 5 ? 'Cold metal' : '',
      currentData.temperature >= 35 ? 'Heat stress risk' : '',
      ['Rain', 'Thunderstorm'].includes(currentData.condition) ? 'Wet conditions' : ''
    ].filter(Boolean),
    equipmentRequirements: [
      'Standard steel erection equipment',
      'Additional fall protection',
      'Tag lines',
      currentData.temperature < 10 ? 'Cold weather gloves' : '',
      currentData.temperature > 30 ? 'Cooling stations' : ''
    ].filter(Boolean),
    crewSizeRecommendation: 'Full crew with additional spotters',
    safetyLevel: isGoodSteelTime ? 'safe' : 
                steelDay ? 'caution' : 'danger',
    productivityImpact: isGoodSteelTime ? 'minimal' : 
                      steelDay ? 'moderate' : 'significant',
    durationRecommendation: 'Short shifts with frequent breaks'
  });

  // Electrical work recommendation
  const isGoodElectricalTime = !['Rain', 'Thunderstorm', 'Drizzle'].includes(currentData.condition) && 
    currentData.humidity < 80;
  const electricalDay = forecast.find(day => 
    !['Rain', 'Thunderstorm', 'Drizzle'].includes(day.condition) && day.humidity < 80);
  
  recommendations.push({
    activity: 'Electrical Work',
    optimalTime: isGoodElectricalTime ? 
      'All daylight hours' : 
      electricalDay ? 
        `Best on ${electricalDay.date.split(',')[0]}` : 
        'Postpone until dry conditions',
    riskFactors: [
      ['Rain', 'Thunderstorm', 'Drizzle'].includes(currentData.condition) ? 'Wet conditions' : '',
      currentData.humidity >= 80 ? `High humidity: ${currentData.humidity}%` : '',
      'Electrical hazard concerns'
    ].filter(Boolean),
    equipmentRequirements: [
      'Standard electrical equipment',
      'Additional GFCI protection',
      'Insulated tools',
      'Dry working platforms'
    ].filter(Boolean),
    crewSizeRecommendation: 'Reduced crew with safety observer',
    safetyLevel: isGoodElectricalTime ? 'safe' : 
                electricalDay ? 'caution' : 'danger',
    productivityImpact: isGoodElectricalTime ? 'minimal' : 
                      electricalDay ? 'moderate' : 'significant',
    durationRecommendation: 'Short shifts with frequent safety checks'
  });

  // Site Safety Monitoring
  const safetyMonitoringNeeds = uvIndex > 6 || currentData.temperature > 30 || 
    currentData.temperature < 0 || ['Thunderstorm', 'Rain'].includes(currentData.condition);
  
  recommendations.push({
    activity: 'Site Safety Monitoring',
    optimalTime: 'Continuous during operations',
    riskFactors: [
      uvIndex > 6 ? `High UV index: ${uvIndex}` : '',
      currentData.temperature > 30 ? `High temperature: ${currentData.temperature}°C` : '',
      currentData.temperature < 0 ? `Low temperature: ${currentData.temperature}°C` : '',
      ['Thunderstorm', 'Rain'].includes(currentData.condition) ? currentData.condition : '',
      visibility < 5 ? `Reduced visibility: ${visibility} km` : ''
    ].filter(Boolean),
    equipmentRequirements: [
      'Additional safety personnel',
      'Weather monitoring equipment',
      uvIndex > 6 ? 'UV monitoring' : '',
      currentData.temperature > 30 ? 'Heat stress monitoring' : '',
      currentData.temperature < 0 ? 'Cold stress monitoring' : '',
      'First aid supplies'
    ].filter(Boolean),
    crewSizeRecommendation: 'Additional safety officers required',
    safetyLevel: safetyMonitoringNeeds ? 'danger' : 'caution',
    productivityImpact: 'minimal',
    durationRecommendation: 'Continuous monitoring'
  });

  return recommendations;
};

const getWindRoseData = (sensorData: WeatherData[]) => {
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
        avgSpeed + 5,
      count: relevantData.length
    };
  });
};

const generateMockSafetyIncidents = (): SafetyIncident[] => {
  const incidentTypes: SafetyIncident['type'][] = [
    'near-miss', 'injury', 'equipment-failure', 'weather-event', 'safety-violation'
  ];
  const severities: SafetyIncident['severity'][] = ['low', 'medium', 'high'];
  
  const incidents: SafetyIncident[] = [];
  const now = new Date();
  
  for (let i = 0; i < 5; i++) {
    const hoursAgo = Math.floor(Math.random() * 48);
    const incidentTime = new Date(now);
    incidentTime.setHours(incidentTime.getHours() - hoursAgo);
    
    const type = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
    
    let description = '';
    let actionTaken = '';
    let location = '';
    
    switch (type) {
      case 'near-miss':
        description = 'Crane load swung dangerously close to workers';
        actionTaken = 'Conducted safety briefing, reviewed load procedures';
        location = 'Northwest corner, Level 3';
        break;
      case 'injury':
        description = 'Worker slipped on wet surface, minor ankle injury';
        actionTaken = 'First aid administered, area marked for improved drainage';
        location = 'East side, ground level';
        break;
      case 'equipment-failure':
        description = 'Excavator hydraulic line failure during operation';
        actionTaken = 'Equipment taken out of service, inspection ordered';
        location = 'Excavation site';
        break;
      case 'weather-event':
        description = 'Sudden wind gust caused unsecured materials to fall';
        actionTaken = 'Implemented weather monitoring protocol';
        location = 'Materials storage area';
        break;
      case 'safety-violation':
        description = 'Worker observed without fall protection on scaffold';
        actionTaken = 'Safety stand-down, retraining scheduled';
        location = 'South facade, Level 5';
        break;
    }
    
    incidents.push({
      type,
      description,
      time: incidentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      severity: severities[Math.floor(Math.random() * severities.length)],
      actionTaken,
      location
    });
  }
  
  return incidents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
};

const generateMockEquipmentStatus = (): EquipmentStatus[] => {
  return [
    {
      type: 'Tower Crane #1',
      status: 'operational',
      lastInspection: '2023-05-15',
      nextInspection: '2023-06-15',
      issues: []
    },
    {
      type: 'Mobile Crane #3',
      status: 'limited',
      lastInspection: '2023-05-10',
      nextInspection: '2023-06-10',
      issues: ['Hydraulic leak detected', 'Needs pump replacement']
    },
    {
      type: 'Excavator #2',
      status: 'out-of-service',
      lastInspection: '2023-04-28',
      nextInspection: '2023-05-28',
      issues: ['Engine failure', 'Undercarriage wear']
    },
    {
      type: 'Concrete Pump',
      status: 'operational',
      lastInspection: '2023-05-12',
      nextInspection: '2023-06-12',
      issues: ['Minor hose wear']
    },
    {
      type: 'Scissor Lift #4',
      status: 'limited',
      lastInspection: '2023-05-08',
      nextInspection: '2023-06-08',
      issues: ['Platform gate latch not functioning']
    }
  ];
};

const OperationsDashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<WeatherData[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [craneStatus, setCraneStatus] = useState<CraneStatus | null>(null);
  const [activityRecommendations, setActivityRecommendations] = useState<SiteActivityRecommendation[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);
  const [locationName, setLocationName] = useState('Loading...');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'crane' | 'site' | 'safety'>('crane');
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStatus[]>([]);

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
        
        // Update crane status based on current conditions
        const status = getCraneStatus(currentData);
        setCraneStatus(status);
        
        // Generate activity recommendations
        const recommendations = getSiteActivityRecommendations(currentData, forecast);
        setActivityRecommendations(recommendations);
        
        // Load mock safety data
        setSafetyIncidents(generateMockSafetyIncidents());
        setEquipmentStatus(generateMockEquipmentStatus());
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
      const status = getCraneStatus(currentData);
      setCraneStatus(status);
      
      const recommendations = getSiteActivityRecommendations(currentData, forecast);
      setActivityRecommendations(recommendations);
      
      // Load mock safety data
      setSafetyIncidents(generateMockSafetyIncidents());
      setEquipmentStatus(generateMockEquipmentStatus());
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

  const downloadCraneReport = () => {
    if (!craneStatus || !sensorData[0]) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Crane Operations Safety Report', 105, 20, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 28, { align: 'center' });
    doc.text(`Location: ${locationName}`, 105, 34, { align: 'center' });

    // Current Status
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Current Status Assessment', 14, 46);
    
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Operation Status: ${craneStatus.operation.toUpperCase()}`, 14, 54);
    doc.text(`Risk Level: ${craneStatus.riskLevel.toUpperCase()}`, 14, 62);
    doc.text(`Message: ${craneStatus.message}`, 14, 70);
    doc.text(`Last Updated: ${craneStatus.lastUpdated}`, 14, 78);
    
    // Operational Limits
    doc.setFontSize(14);
    doc.text('Operational Limits', 14, 90);
    doc.setFontSize(12);
    doc.text(`Max Load Capacity: ${craneStatus.maxLoadCapacity}%`, 14, 98);
    doc.text(`Max Height: ${craneStatus.maxHeight}m`, 14, 106);
    doc.text(`Safety Factor: ${craneStatus.safetyFactor.toFixed(1)}x`, 14, 114);
    
    // Current Conditions
    const currentData = sensorData[0];
    doc.setFontSize(14);
    doc.text('Current Environmental Conditions', 14, 126);
    doc.setFontSize(12);
    doc.text(`Wind Speed: ${currentData.windSpeed} km/h`, 14, 134);
    doc.text(`Gust Speed: ${currentData.gustSpeed || currentData.windSpeed + 5} km/h`, 14, 142);
    doc.text(`Direction: ${windDirectionToText(currentData.windDirection)}`, 14, 150);
    doc.text(`Temperature: ${currentData.temperature}°C`, 14, 158);
    doc.text(`Visibility: ${currentData.visibility || 10} km`, 14, 166);
    doc.text(`Conditions: ${currentData.condition}`, 14, 174);
    
    // Risk Factors
    doc.setFontSize(14);
    doc.text('Identified Risk Factors', 14, 186);
    doc.setFontSize(12);
    if (craneStatus.windGustWarning) doc.text('• High wind gusts present', 14, 194);
    if (craneStatus.lightningRisk) doc.text('• Lightning risk detected', 14, 202);
    if (craneStatus.temperatureRisk) doc.text('• Extreme temperature conditions', 14, 210);
    if (craneStatus.visibilityRisk) doc.text('• Reduced visibility', 14, 218);
    
    // Recommended Actions
    doc.setFontSize(14);
    doc.text('Recommended Safety Actions', 14, 230);
    doc.setFontSize(12);
    craneStatus.recommendedActions.forEach((action, i) => {
      if (i < 8) { // Limit to first 8 actions to fit on page
        doc.text(`• ${action}`, 14, 238 + (i * 8));
      }
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Construction Safety Operations Dashboard - Automated Report', 105, 290, { align: 'center' });

    // Save the PDF
    doc.save(`crane-safety-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const downloadSiteOperationsReport = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Site Operations Safety Report', 105, 20, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 28, { align: 'center' });
    doc.text(`Location: ${locationName}`, 105, 34, { align: 'center' });

    // Current Conditions
    const currentData = sensorData[0];
    if (currentData) {
      doc.setFontSize(14);
      doc.text('Current Environmental Conditions', 14, 46);
      
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text(`Temperature: ${currentData.temperature}°C`, 14, 54);
      doc.text(`Wind: ${currentData.windSpeed} km/h (${windDirectionToText(currentData.windDirection)})`, 14, 62);
      doc.text(`Gusts: ${currentData.gustSpeed || currentData.windSpeed + 5} km/h`, 14, 70);
      doc.text(`Rainfall: ${currentData.rainfall} mm`, 14, 78);
      doc.text(`Humidity: ${currentData.humidity}%`, 14, 86);
      doc.text(`UV Index: ${currentData.uvIndex || 'N/A'}`, 14, 94);
      doc.text(`Visibility: ${currentData.visibility || 10} km`, 14, 102);
      doc.text(`Condition: ${currentData.condition}`, 14, 110);
    }

    // Activity Recommendations
    doc.setFontSize(14);
    doc.text('Recommended Activities & Safety Measures', 14, 122);
    
    doc.setFontSize(12);
    let yPos = 130;
    activityRecommendations.forEach((activity, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont(undefined, 'bold');
      doc.text(`${activity.activity}:`, 14, yPos);
      yPos += 8;
      
      doc.setFont(undefined, 'normal');
      doc.text(`Optimal Time: ${activity.optimalTime}`, 20, yPos);
      yPos += 8;
      
      doc.text(`Safety Level: ${activity.safetyLevel.toUpperCase()}`, 20, yPos);
      yPos += 8;
      
      doc.text(`Productivity Impact: ${activity.productivityImpact.toUpperCase()}`, 20, yPos);
      yPos += 8;
      
      doc.text(`Risk Factors: ${activity.riskFactors.join(', ')}`, 20, yPos);
      yPos += 8;
      
      doc.text(`Equipment Needs: ${activity.equipmentRequirements.join(', ')}`, 20, yPos);
      yPos += 8;
      
      doc.text(`Crew Size: ${activity.crewSizeRecommendation}`, 20, yPos);
      yPos += 8;
      
      if (activity.durationRecommendation) {
        doc.text(`Duration: ${activity.durationRecommendation}`, 20, yPos);
        yPos += 8;
      }
      
      yPos += 4; // Extra space between activities
    });

    // Safety Incidents
    if (safetyIncidents.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Recent Safety Incidents', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      safetyIncidents.slice(0, 3).forEach((incident, i) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text(`${incident.type.replace('-', ' ').toUpperCase()} (${incident.severity})`, 14, yPos);
        yPos += 8;
        
        doc.setFont(undefined, 'normal');
        doc.text(`Time: ${incident.time}`, 20, yPos);
        yPos += 8;
        
        if (incident.location) {
          doc.text(`Location: ${incident.location}`, 20, yPos);
          yPos += 8;
        }
        
        doc.text(`Description: ${incident.description}`, 20, yPos);
        yPos += 8;
        
        doc.text(`Action Taken: ${incident.actionTaken}`, 20, yPos);
        yPos += 12;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Construction Safety Operations Dashboard - Automated Report', 105, 290, { align: 'center' });

    // Save the PDF
    doc.save(`site-safety-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const downloadSafetyReport = () => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Comprehensive Safety Report', 105, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 28, { align: 'center' });
  doc.text(`Location: ${locationName}`, 105, 34, { align: 'center' });

  // Current Conditions
  const currentData = sensorData[0];
  let yPosition = 46; // Initialize yPosition instead of hazardY
  
  if (currentData) {
    doc.setFontSize(14);
    doc.text('Current Hazard Assessment', 14, yPosition);
    yPosition += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    
    // Weather hazards
    doc.text('Weather Hazards:', 14, yPosition);
    yPosition += 8;
    
    let hasHazards = false;
    if (currentData.windSpeed > 30) {
      doc.text(`• High winds (${currentData.windSpeed} km/h)`, 20, yPosition);
      yPosition += 8;
      hasHazards = true;
    }
    if ((currentData.gustSpeed || currentData.windSpeed + 5) > 40) {
      doc.text(`• Dangerous gusts (${currentData.gustSpeed || currentData.windSpeed + 5} km/h)`, 20, yPosition);
      yPosition += 8;
      hasHazards = true;
    }
    if (currentData.rainfall > 5) {
      doc.text(`• Heavy rain (${currentData.rainfall} mm)`, 20, yPosition);
      yPosition += 8;
      hasHazards = true;
    }
    if (currentData.condition === 'Thunderstorm') {
      doc.text('• Lightning risk present', 20, yPosition);
      yPosition += 8;
      hasHazards = true;
    }
    if (currentData.temperature > 32) {
      doc.text(`• Extreme heat (${currentData.temperature}°C)`, 20, yPosition);
      yPosition += 8;
      hasHazards = true;
    }
    if (currentData.temperature < 0) {
      doc.text(`• Freezing conditions (${currentData.temperature}°C)`, 20, yPosition);
      yPosition += 8;
      hasHazards = true;
    }
    if ((currentData.visibility || 10) < 3) {
      doc.text(`• Low visibility (${currentData.visibility || 10} km)`, 20, yPosition);
      yPosition += 8;
      hasHazards = true;
    }
    if ((currentData.uvIndex || 0) > 8) {
      doc.text(`• Extreme UV index (${currentData.uvIndex})`, 20, yPosition);
      yPosition += 8;
      hasHazards = true;
    }
    
    if (!hasHazards) {
      doc.text('• No significant weather hazards detected', 20, yPosition);
      yPosition += 8;
    }
    
    // Crane status
    if (craneStatus) {
      doc.setFontSize(14);
      doc.text('Crane Operations Status', 14, yPosition);
      yPosition += 8;
      
      doc.setFontSize(12);
      doc.text(`Status: ${craneStatus.operation.toUpperCase()}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Risk Level: ${craneStatus.riskLevel.toUpperCase()}`, 20, yPosition);
      yPosition += 16; // Extra space after this section
    }
  }

  // Equipment Status
  if (equipmentStatus.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Equipment Status Overview', 14, yPosition);
    yPosition += 8;
    
    doc.setFontSize(12);
    equipmentStatus.forEach((equip, i) => {
      // Check if we need a new page before each equipment item
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFont(undefined, equip.status === 'out-of-service' ? 'bold' : 'normal');
      doc.text(`${equip.type}: ${equip.status.toUpperCase()}`, 20, yPosition);
      yPosition += 8;
      
      if (equip.issues && equip.issues.length > 0) {
        doc.text(`Issues: ${equip.issues.join(', ')}`, 25, yPosition);
        yPosition += 8;
      }
      
      doc.text(`Last Inspection: ${equip.lastInspection}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Next Inspection: ${equip.nextInspection}`, 20, yPosition);
      yPosition += 12; // Extra space between items
    });
  }

  // Safety Incidents
  if (safetyIncidents.length > 0) {
    // Check if we need a new page
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Recent Safety Incidents', 14, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    safetyIncidents.forEach((incident, i) => {
      // Check if we need a new page before each incident
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFont(undefined, 'bold');
      doc.text(`${incident.type.replace('-', ' ').toUpperCase()} (${incident.severity})`, 20, yPosition);
      yPosition += 8;
      
      doc.setFont(undefined, 'normal');
      doc.text(`Time: ${incident.time}`, 25, yPosition);
      yPosition += 8;
      
      if (incident.location) {
        doc.text(`Location: ${incident.location}`, 25, yPosition);
        yPosition += 8;
      }
      
      doc.text(`Description: ${incident.description}`, 25, yPosition);
      yPosition += 8;
      
      doc.text(`Action Taken: ${incident.actionTaken}`, 25, yPosition);
      yPosition += 12; // Extra space between incidents
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Construction Safety Operations Dashboard - Automated Report', 105, 290, { align: 'center' });

  // Save the PDF
  doc.save(`safety-report-${new Date().toISOString().slice(0, 10)}.pdf`);
};

  const currentConditions = sensorData.length > 0 ? sensorData[0] : null;
  const windRoseData = getWindRoseData(sensorData);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-200 rounded-xl p-6 animate-pulse h-80"></div>
          <div className="bg-gray-200 rounded-xl p-6 animate-pulse h-80"></div>
        </div>
        
        <div className="bg-gray-200 rounded-xl p-6 animate-pulse h-64"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-gray-700 mb-2">Site Operations Dashboard</h1>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Location: {locationName}</span>
            <span className="mx-2">•</span>
            <CalendarClock className="h-4 w-4 mr-1" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            Auto Refresh
          </label>
          
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('crane')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'crane'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <HardHat className="h-4 w-4" />
              Crane Operations
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('site')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'site'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Construction className="h-4 w-4" />
              Site Operations
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
              <ShieldAlert className="h-4 w-4" />
              Safety Overview
            </div>
          </button>
        </nav>
      </div>

      {/* Crane Operations Tab */}
      {selectedTab === 'crane' && craneStatus && (
        <div className="space-y-6">
          {/* Crane Status Card */}
          <div className="rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Crane Operations Status</h2>
              <button
                onClick={downloadCraneReport}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Download Report
              </button>
            </div>
            
            <div className={`p-4 rounded-lg border-l-4 ${
              craneStatus.riskLevel === 'extreme' ? 'border-red-600 bg-red-50' :
              craneStatus.riskLevel === 'high' ? 'border-red-500 bg-red-50' :
              craneStatus.riskLevel === 'moderate' ? 'border-amber-500 bg-amber-50' :
              'border-green-500 bg-green-50'
            }`}>
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${
                  craneStatus.riskLevel === 'extreme' ? 'bg-red-100 text-red-600' :
                  craneStatus.riskLevel === 'high' ? 'bg-red-100 text-red-600' :
                  craneStatus.riskLevel === 'moderate' ? 'bg-amber-100 text-amber-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {craneStatus.riskLevel === 'extreme' ? <Siren className="h-6 w-6" /> :
                   craneStatus.riskLevel === 'high' ? <AlertCircle className="h-6 w-6" /> :
                   craneStatus.riskLevel === 'moderate' ? <AlertTriangle className="h-6 w-6" /> :
                   <HardHat className="h-6 w-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-lg font-bold ${
                      craneStatus.riskLevel === 'extreme' ? 'text-red-800' :
                      craneStatus.riskLevel === 'high' ? 'text-red-800' :
                      craneStatus.riskLevel === 'moderate' ? 'text-amber-800' :
                      'text-green-800'
                    }`}>
                      {craneStatus.operation === 'emergency' ? 'EMERGENCY STOP' :
                       craneStatus.operation === 'suspended' ? 'OPERATIONS SUSPENDED' :
                       craneStatus.operation === 'limited' ? 'LIMITED OPERATIONS' :
                       'NORMAL OPERATIONS'}
                    </h3>
                    <p className="text-xs text-gray-500">Last updated: {craneStatus.lastUpdated}</p>
                  </div>
                  <p className="text-gray-700 mt-1">{craneStatus.message}</p>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h4 className="font-medium text-gray-700 mb-2">Operational Limits</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Load Capacity:</span>
                          <span className="font-medium">{craneStatus.maxLoadCapacity}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Height:</span>
                          <span className="font-medium">{craneStatus.maxHeight}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Safety Factor:</span>
                          <span className="font-medium">{craneStatus.safetyFactor.toFixed(1)}x</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h4 className="font-medium text-gray-700 mb-2">Current Conditions</h4>
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

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h4 className="font-medium text-gray-700 mb-2">Risk Factors</h4>
                      <div className="space-y-2">
                        {craneStatus.windGustWarning && (
                          <div className="flex items-center text-red-600">
                            <Wind className="h-4 w-4 mr-1" />
                            <span>High Wind Gusts</span>
                          </div>
                        )}
                        {craneStatus.lightningRisk && (
                          <div className="flex items-center text-red-600">
                            <CloudLightning className="h-4 w-4 mr-1" />
                            <span>Lightning Risk</span>
                          </div>
                        )}
                        {craneStatus.temperatureRisk && (
                          <div className="flex items-center text-amber-600">
                            {currentConditions && currentConditions.temperature > 30 ? (
                              <ThermometerSun className="h-4 w-4 mr-1" />
                            ) : (
                              <ThermometerSnowflake className="h-4 w-4 mr-1" />
                            )}
                            <span>Extreme Temperature</span>
                          </div>
                        )}
                        {craneStatus.visibilityRisk && (
                          <div className="flex items-center text-amber-600">
                            <Eye className="h-4 w-4 mr-1" />
                            <span>Low Visibility</span>
                          </div>
                        )}
                        {!craneStatus.windGustWarning && !craneStatus.lightningRisk && 
                         !craneStatus.temperatureRisk && !craneStatus.visibilityRisk && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span>No Significant Risks</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Recommended Actions</h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {craneStatus.recommendedActions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wind Analysis */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Wind Analysis</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensorData.slice(0, 12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" />
                    <YAxis label={{ value: 'km/h', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="windSpeed"
                      name="Wind Speed"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="gustSpeed"
                      name="Gust Speed"
                      stroke="#EC4899"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
          </div>

          {/* Safety Thresholds */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Crane Safety Thresholds</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h3 className="font-medium text-green-800">Normal Operations</h3>
                <p className="text-sm text-gray-600 mt-1">Winds below 20 km/h</p>
                <p className="text-sm text-gray-600">Gusts below 30 km/h</p>
                <p className="text-sm text-gray-600">Visibility above 5 km</p>
                <p className="text-sm text-gray-600">Temp: 5°C to 30°C</p>
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    100% Capacity
                  </span>
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                <h3 className="font-medium text-amber-800">Limited Operations</h3>
                <p className="text-sm text-gray-600 mt-1">Winds 20-30 km/h</p>
                <p className="text-sm text-gray-600">Gusts 30-40 km/h</p>
                <p className="text-sm text-gray-600">Visibility 3-5 km</p>
                <p className="text-sm text-gray-600">Temp: 0°C to 35°C</p>
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                    40-70% Capacity
                  </span>
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <h3 className="font-medium text-red-800">Operations Suspended</h3>
                <p className="text-sm text-gray-600 mt-1">Winds above 30 km/h</p>
                <p className="text-sm text-gray-600">Gusts above 40 km/h</p>
                <p className="text-sm text-gray-600">Visibility below 3 km</p>
                <p className="text-sm text-gray-600">Temp: &lt;0°C or &gt;35°C</p>
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    No Operations
                  </span>
                </div>
              </div>
              <div className="p-4 bg-red-100 rounded-lg border-l-4 border-red-700">
                <h3 className="font-medium text-red-900">Emergency Stop</h3>
                <p className="text-sm text-gray-700 mt-1">Winds above 50 km/h</p>
                <p className="text-sm text-gray-700">Gusts above 60 km/h</p>
                <p className="text-sm text-gray-700">Visibility below 0.5 km</p>
                <p className="text-sm text-gray-700">Lightning present</p>
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-red-200 text-red-900 rounded-full">
                    EMERGENCY
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Site Operations Tab */}
      {selectedTab === 'site' && (
        <div className="space-y-6">
          {/* Activity Recommendations */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Activity Recommendations</h2>
              <button
                onClick={downloadSiteOperationsReport}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Download Report
              </button>
            </div>
            <div className="space-y-4">
              {activityRecommendations.map((activity, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  activity.safetyLevel === 'danger' ? 'border-red-300 bg-red-50 hover:border-red-400' :
                  activity.safetyLevel === 'caution' ? 'border-amber-300 bg-amber-50 hover:border-amber-400' :
                  'border-green-300 bg-green-50 hover:border-green-400'
                } transition-colors`}>
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-800">{activity.activity}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.safetyLevel === 'danger' ? 'bg-red-100 text-red-800' :
                      activity.safetyLevel === 'caution' ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {activity.safetyLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Optimal Time</p>
                      <p className="text-sm text-gray-800">{activity.optimalTime}</p>
                      {activity.durationRecommendation && (
                        <>
                          <p className="text-sm font-medium text-gray-600 mt-2">Duration</p>
                          <p className="text-sm text-gray-800">{activity.durationRecommendation}</p>
                        </>
                      )}
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
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Crew Recommendation</p>
                      <p className="text-sm text-gray-800">{activity.crewSizeRecommendation}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Productivity Impact</p>
                      <p className="text-sm text-gray-800 capitalize">{activity.productivityImpact}</p>
                    </div>
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
                <div key={index} className={`text-center p-3 rounded-lg ${
                  day.concretePouringScore > 80 ? 'bg-green-50' :
                  day.concretePouringScore > 60 ? 'bg-amber-50' :
                  'bg-red-50'
                }`}>
                  <p className="font-medium text-gray-700">{day.date.split(',')[0]}</p>
                  <p className="text-xs text-gray-500">{day.date.split(',')[1]}</p>
                  <div className="my-2">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          day.concretePouringScore > 80 ? 'bg-green-500' :
                          day.concretePouringScore > 60 ? 'bg-amber-500' :
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
                    <span className="text-sm font-bold">{day.highTemp}°</span>
                    <span className="text-sm text-gray-500">{day.lowTemp}°</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <p>{day.rainChance}% rain</p>
                    <p>{day.windSpeed} km/h wind</p>
                  </div>
                  <div className="mt-2">
                    {day.concretePouringScore > 80 ? (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Ideal
                      </span>
                    ) : day.concretePouringScore > 60 ? (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                        Good
                      </span>
                    ) : day.concretePouringScore > 40 ? (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Marginal
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-red-200 text-red-900 rounded-full">
                        Poor
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800">Ideal Conditions (80-100)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Temperature between 5°C and 32°C, low rain chance, minimal wind
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Full production capacity recommended
                </p>
              </div>
               <div className="p-3 bg-amber-50 rounded-lg">
  <h3 className="font-medium text-amber-800">Good Conditions (60-80)</h3>
  <p className="text-sm text-gray-600 mt-1">
    Temperature near limits or moderate rain/wind risk
  </p>
  <p className="text-sm text-amber-700 mt-2">
    Reduced production capacity recommended
  </p>
</div>
<div className="p-3 bg-red-50 rounded-lg">
  <h3 className="font-medium text-red-800">Marginal/Poor Conditions (0-60)</h3>
  <p className="text-sm text-gray-600 mt-1">
    Extreme temperatures, high rain chance, or strong winds
  </p>
  <p className="text-sm text-red-700 mt-2">
    Consider postponing or use special measures
  </p>
</div>
</div>
</div>

{/* Environmental Conditions */}
<div className="bg-gray-50 rounded-xl shadow-sm p-6">
  <h2 className="text-lg font-semibold mb-4">Environmental Conditions</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center">
        <Thermometer className="h-5 w-5 text-red-500" />
        <span className="ml-2 text-sm font-medium text-gray-700">Temperature</span>
      </div>
      <p className="mt-2 text-2xl font-bold">
        {currentConditions?.temperature || '--'}°C
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Feels like {currentConditions ? (currentConditions.temperature * 1.1).toFixed(1) : '--'}°C
      </p>
    </div>
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center">
        <Wind className="h-5 w-5 text-blue-500" />
        <span className="ml-2 text-sm font-medium text-gray-700">Wind Speed</span>
      </div>
      <p className="mt-2 text-2xl font-bold">
        {currentConditions?.windSpeed || '--'} km/h
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Gusts to {currentConditions ? (currentConditions.gustSpeed || currentConditions.windSpeed + 5).toFixed(1) : '--'} km/h
      </p>
    </div>
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center">
        <Droplets className="h-5 w-5 text-blue-400" />
        <span className="ml-2 text-sm font-medium text-gray-700">Rainfall</span>
      </div>
      <p className="mt-2 text-2xl font-bold">
        {currentConditions?.rainfall || '0'} mm
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Chance: {forecastData[0]?.rainChance || '--'}% today
      </p>
    </div>
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center">
        <SunDim className="h-5 w-5 text-yellow-500" />
        <span className="ml-2 text-sm font-medium text-gray-700">UV Index</span>
      </div>
      <p className="mt-2 text-2xl font-bold">
        {currentConditions?.uvIndex || '--'}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {currentConditions?.uvIndex ? (
          currentConditions.uvIndex > 8 ? 'Very High' :
          currentConditions.uvIndex > 6 ? 'High' :
          currentConditions.uvIndex > 3 ? 'Moderate' : 'Low'
        ) : '--'}
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
</div>
</div>
)}

{/* Safety Overview Tab */}
{selectedTab === 'safety' && (
<div className="space-y-6">
  {/* Safety Alerts */}
  <div className="rounded-xl shadow-sm p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Safety Alerts</h2>
      <button
        onClick={downloadSafetyReport}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      >
        <Download className="h-4 w-4" />
        Download Report
      </button>
    </div>
    
    <div className="space-y-4">
      {/* Crane Status Alert */}
      {craneStatus && (
        <div className={`p-4 rounded-lg border-l-4 ${
          craneStatus.riskLevel === 'extreme' ? 'border-red-600 bg-red-50' :
          craneStatus.riskLevel === 'high' ? 'border-red-500 bg-red-50' :
          craneStatus.riskLevel === 'moderate' ? 'border-amber-500 bg-amber-50' :
          'border-green-500 bg-green-50'
        }`}>
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-lg ${
              craneStatus.riskLevel === 'extreme' ? 'bg-red-100 text-red-600' :
              craneStatus.riskLevel === 'high' ? 'bg-red-100 text-red-600' :
              craneStatus.riskLevel === 'moderate' ? 'bg-amber-100 text-amber-600' :
              'bg-green-100 text-green-600'
            }`}>
              {craneStatus.riskLevel === 'extreme' ? <Siren className="h-6 w-6" /> :
               craneStatus.riskLevel === 'high' ? <AlertCircle className="h-6 w-6" /> :
               craneStatus.riskLevel === 'moderate' ? <AlertTriangle className="h-6 w-6" /> :
               <CheckCircle className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">
                Crane Operations: {craneStatus.operation.toUpperCase()}
              </h3>
              <p className="text-gray-700 mt-1">{craneStatus.message}</p>
              <div className="mt-3">
                <h4 className="font-medium text-gray-700">Recommended Actions</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 mt-1">
                  {craneStatus.recommendedActions.slice(0, 3).map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather Alerts */}
      {currentConditions && (
        <div className={`p-4 rounded-lg border-l-4 ${
          currentConditions.condition === 'Thunderstorm' ? 'border-red-600 bg-red-50' :
          ['Rain', 'Hail'].includes(currentConditions.condition) ? 'border-amber-500 bg-amber-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-lg ${
              currentConditions.condition === 'Thunderstorm' ? 'bg-red-100 text-red-600' :
              ['Rain', 'Hail'].includes(currentConditions.condition) ? 'bg-amber-100 text-amber-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {currentConditions.condition === 'Thunderstorm' ? <CloudLightning className="h-6 w-6" /> :
               currentConditions.condition === 'Rain' ? <CloudRain className="h-6 w-6" /> :
               currentConditions.condition === 'Hail' ? <CloudRain className="h-6 w-6" /> :
               <Cloud className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">Current Weather: {currentConditions.condition}</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="font-medium">{currentConditions.temperature}°C</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Wind Speed</p>
                  <p className="font-medium">{currentConditions.windSpeed} km/h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rainfall</p>
                  <p className="font-medium">{currentConditions.rainfall} mm</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Visibility</p>
                  <p className="font-medium">{currentConditions.visibility || 10} km</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High Risk Activities */}
      <div className="p-4 rounded-lg border-l-4 border-red-500 bg-red-50">
        <div className="flex items-start space-x-4">
          <div className="p-2 rounded-lg bg-red-100 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">High Risk Activities</h3>
            <div className="mt-2">
              {activityRecommendations
                .filter(a => a.safetyLevel === 'danger')
                .map((activity, i) => (
                  <div key={i} className="mb-2">
                    <p className="font-medium">{activity.activity}</p>
                    <p className="text-sm text-gray-700">{activity.riskFactors.join(', ')}</p>
                  </div>
                ))}
              {activityRecommendations.filter(a => a.safetyLevel === 'danger').length === 0 && (
                <p className="text-gray-700">No high risk activities identified</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Safety Incidents */}
  <div className="bg-gray-50 rounded-xl shadow-sm p-6">
    <h2 className="text-lg font-semibold mb-4">Recent Safety Incidents</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Severity
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action Taken
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {safetyIncidents.map((incident, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                {incident.type.replace('-', ' ')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {incident.time}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  incident.severity === 'high' ? 'bg-red-100 text-red-800' :
                  incident.severity === 'medium' ? 'bg-amber-100 text-amber-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {incident.severity}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {incident.description}
                {incident.location && (
                  <p className="text-xs text-gray-400 mt-1">Location: {incident.location}</p>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {incident.actionTaken}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>

  {/* Equipment Status */}
  <div className="bg-gray-50 rounded-xl shadow-sm p-6">
    <h2 className="text-lg font-semibold mb-4">Equipment Status</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {equipmentStatus.map((equip, index) => (
        <div key={index} className={`p-4 rounded-lg border ${
          equip.status === 'out-of-service' ? 'border-red-300 bg-red-50' :
          equip.status === 'limited' ? 'border-amber-300 bg-amber-50' :
          'border-green-300 bg-green-50'
        }`}>
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-800">{equip.type}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              equip.status === 'out-of-service' ? 'bg-red-100 text-red-800' :
              equip.status === 'limited' ? 'bg-amber-100 text-amber-800' :
              'bg-green-100 text-green-800'
            }`}>
              {equip.status.toUpperCase()}
            </span>
          </div>
          <div className="mt-3">
            <p className="text-sm text-gray-600">Last Inspection: {equip.lastInspection}</p>
            <p className="text-sm text-gray-600">Next Inspection: {equip.nextInspection}</p>
            {equip.issues && equip.issues.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Issues:</p>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  {equip.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Safety Metrics */}
  <div className="bg-gray-50 rounded-xl shadow-sm p-6">
    <h2 className="text-lg font-semibold mb-4">Safety Metrics</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[
            { name: 'High', value: safetyIncidents.filter(i => i.severity === 'high').length },
            { name: 'Medium', value: safetyIncidents.filter(i => i.severity === 'medium').length },
            { name: 'Low', value: safetyIncidents.filter(i => i.severity === 'low').length },
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8">
              {['High', 'Medium', 'Low'].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={
                  entry === 'High' ? '#ef4444' :
                  entry === 'Medium' ? '#f59e0b' :
                  '#10b981'
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-center text-sm text-gray-500">Incidents by Severity (Last 48h)</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="Time" unit="h" />
            <YAxis type="number" dataKey="y" name="Severity" />
            <ZAxis type="number" dataKey="z" range={[60, 400]} name="Type" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Incidents" data={safetyIncidents.map((incident, i) => ({
              x: i,
              y: incident.severity === 'high' ? 3 : incident.severity === 'medium' ? 2 : 1,
              z: 100,
              type: incident.type
            }))} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-center text-sm text-gray-500">Incident Timeline</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[
            { name: 'Operational', value: equipmentStatus.filter(e => e.status === 'operational').length },
            { name: 'Limited', value: equipmentStatus.filter(e => e.status === 'limited').length },
            { name: 'Out of Service', value: equipmentStatus.filter(e => e.status === 'out-of-service').length },
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8">
              {['Operational', 'Limited', 'Out of Service'].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={
                  entry === 'Operational' ? '#10b981' :
                  entry === 'Limited' ? '#f59e0b' :
                  '#ef4444'
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-center text-sm text-gray-500">Equipment Status</p>
      </div>
    </div>
  </div>
</div>
)}

{/* Footer */}
<div className="text-center text-xs text-gray-500 py-6">
  <p>Construction Safety Operations Dashboard v2.0 - Last updated: {new Date().toLocaleDateString()}</p>
  <p className="mt-1">Data refreshes every 15 minutes when auto-refresh is enabled.</p>
</div>
</div>
);
};

export default OperationsDashboard;