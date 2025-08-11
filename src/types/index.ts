import { ReactNode } from 'react';
import {
  Thermometer, Droplets, Wind, AlertTriangle, Sun, 
  CloudRain, Cloud, Umbrella, Car, Sunset, CalendarClock,
  MapPin, Gauge, CloudSun, CloudLightning, Snowflake, Eye,
  Sunrise, Moon, Compass, ThermometerSun, ThermometerSnowflake,
  Waves, RefreshCw, HardHat, Construction, ShieldAlert,
  UserCheck, ClipboardCheck, Clock, SunDim, BarChart2,
  Activity, Anchor, CalendarDays, Lightbulb, AlertCircle,
  ClipboardList, AlertOctagon
} from 'lucide-react';

export type WeatherCondition = 'Sunny' | 'Partly Cloudy' | 'Cloudy' | 'Rain' | 'Thunderstorm' | 'Snow' | 'Fog';

export interface WeatherData {
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

export interface ForecastData {
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

export interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  timestamp: string;
  affectedZone?: string;
  duration?: string;
  actionItems?: string[];
}

export interface Suggestion {
  type: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: 'low' | 'medium' | 'high';
  relatedAlert?: string;
  implementationTime?: string;
}

export interface CraneStatus {
  operation: 'normal' | 'limited' | 'suspended';
  message: string;
  maxLoadCapacity: number;
  maxHeight: number;
  recommendedActions: string[];
  safetyFactor: number;
  windGustWarning?: boolean;
  lastUpdated: string;
}

export interface ConstructionInsight {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  impact: 'positive' | 'neutral' | 'negative';
  trend?: 'improving' | 'deteriorating' | 'stable';
  timeSensitivity?: string;
}

export interface WorkerSafetyStatus {
  heatRisk: 'low' | 'moderate' | 'high' | 'extreme';
  coldRisk: 'low' | 'moderate' | 'high';
  uvRisk: 'low' | 'moderate' | 'high' | 'extreme';
  windRisk: 'low' | 'moderate' | 'high';
  rainRisk: 'low' | 'moderate' | 'high';
  recommendations: string[];
}

export interface SiteActivityRecommendation {
  activity: string;
  optimalTime: string;
  riskFactors: string[];
  equipmentRequirements: string[];
  crewSizeRecommendation: string;
}

// Helper function types
export type WindDirectionToText = (degrees: number) => string;
export type GetConditionIcon = (condition: WeatherCondition, size?: number) => ReactNode;
export type ConvertTemp = (temp: number) => number;