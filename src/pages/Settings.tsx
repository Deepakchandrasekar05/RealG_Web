import React from 'react';
import { Bell, Shield, Gauge, Users, Camera, MapPin } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className=" rounded-xl shadow-sm p-6">
        <h2 className="text-3xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-gray-700 mb-2">System Settings</h2>
        
        <div className="space-y-6">
          {/* Alert Thresholds */}
          <div className="border-b pb-6">
            <h3 className="text-md font-medium mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-indigo-600" />
              Alert Thresholds
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature Warning (°C)
                </label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2"
                  defaultValue={30}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Air Quality Index Warning
                </label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2"
                  defaultValue={150}
                />
              </div>
            </div>
          </div>

          {/* Safety Settings */}
          <div className="border-b pb-6">
            <h3 className="text-md font-medium mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-indigo-600" />
              Safety Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="helmet-detection"
                  className="h-4 w-4 text-indigo-600 rounded"
                  defaultChecked
                />
                <label htmlFor="helmet-detection" className="ml-2 text-sm text-gray-700">
                  Enable Helmet Detection
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="restricted-area"
                  className="h-4 w-4 text-indigo-600 rounded"
                  defaultChecked
                />
                <label htmlFor="restricted-area" className="ml-2 text-sm text-gray-700">
                  Restricted Area Alerts
                </label>
              </div>
            </div>
          </div>

          {/* Monitoring Settings */}
          <div className="border-b pb-6">
            <h3 className="text-md font-medium mb-4 flex items-center">
              <Gauge className="h-5 w-5 mr-2 text-indigo-600" />
              Monitoring Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sensor Update Interval (seconds)
                </label>
                <select className="w-full border rounded-lg px-3 py-2">
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Retention Period
                </label>
                <select className="w-full border rounded-lg px-3 py-2">
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </div>
          </div>

          {/* System Components */}
          <div>
            <h3 className="text-md font-medium mb-4">System Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Camera className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium">CCTV System</span>
                </div>
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Operational</span>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium">Location Tracking</span>
                </div>
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Operational</span>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium">Attendance System</span>
                </div>
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;