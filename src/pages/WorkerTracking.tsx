import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { io, Socket } from 'socket.io-client';

interface Detection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
  zone?: string;
}

interface Violation {
  timestamp: string;
  violations: Detection[];
  image: string;
}

const WorkerTracking: React.FC = () => {
  const navigate = useNavigate();
  const cameras = [1, 2, 3, 4, 5];
  const [violations, setViolations] = useState<Violation[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const webcamRefs = useRef<(Webcam | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Connect to WebSocket for real-time alerts
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('new_violation', (violation: Violation) => {
      setViolations(prev => [...prev, violation]);
      
      const newAlerts = violation.violations
        .filter(v => ['NO-Hardhat', 'NO-Safety Vest', 'NO-Mask'].includes(v.class))
        .map(v => {
          if (v.class === 'NO-Hardhat') return `Worker without helmet detected in Zone ${v.zone || 'unknown'}!`;
          if (v.class === 'NO-Safety Vest') return `Worker without safety vest detected in Zone ${v.zone || 'unknown'}!`;
          if (v.class === 'NO-Mask') return `Worker without mask detected in Zone ${v.zone || 'unknown'}!`;
          return `Safety violation detected in Zone ${v.zone || 'unknown'}!`;
        });
      
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Draw detections on canvas
  const drawDetections = (cameraId: number, detections: Detection[]) => {
    const canvas = canvasRefs.current[cameraId - 1];
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw PPE violations
    detections.forEach(detection => {
      const [x1, y1, x2, y2] = detection.bbox;
      const className = detection.class;
      const confidence = detection.confidence;
      
      if (['NO-Hardhat', 'NO-Safety Vest', 'NO-Mask'].includes(className)) {
        ctx.strokeStyle = 'red';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        
        const violationType = className.replace('NO-', 'Missing ');
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(`${violationType} ${(confidence * 100).toFixed(0)}%`, x1 + 5, y1 - 5);
      }
    });
  };

  // Simulate receiving detections
  useEffect(() => {
    const interval = setInterval(() => {
      cameras.forEach(cameraId => {
        const mockDetections: Detection[] = [];
        
        // PPE violations
        mockDetections.push(
          { class: 'NO-Hardhat', confidence: 0.92, bbox: [100, 100, 150, 200], zone: `Zone ${cameraId}` },
          { class: 'NO-Safety Vest', confidence: 0.85, bbox: [200, 150, 250, 250], zone: `Zone ${cameraId}` },
          { class: 'NO-Mask', confidence: 0.78, bbox: [350, 180, 400, 280], zone: `Zone ${cameraId}` }
        );
        
        drawDetections(cameraId, mockDetections);
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-gray-700 mb-2">
            AI-Driven PPE Compliance Tracking
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Real-time personal protective equipment compliance monitoring with AI
          </p>
        </div>

        {/* Camera Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((cameraId) => (
            <div 
              key={cameraId} 
              className="bg-gray-100 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-900/20 group"
            >
              {/* Camera Feed Container */}
              <div className="relative aspect-video bg-black">
                <Webcam
                  ref={(el) => webcamRefs.current[cameraId - 1] = el}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded-md flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                  LIVE
                </div>
                <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-2 py-1 rounded-md">
                  PPE Detection
                </div>
                <div className="absolute bottom-3 left-3 bg-gray-900/80 text-white text-xs px-2 py-1 rounded-md">
                  Zone {cameraId}
                </div>
              </div>
              {/* Camera Info */}
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-black">Camera #{cameraId}</h3>
                  <span className="text-xs text-gray-800">Sector {String.fromCharCode(64 + cameraId)}</span>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate(`/history/${cameraId}`)}
                    className="flex-1 bg-transparent border border-gray-600 hover:border-blue-500 text-gray-800 hover:text-white py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-700/50 text-sm font-medium flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </button>
                  <button
                    onClick={() => navigate(`/camera/${cameraId}`)}
                    className="flex-1 bg-red-700 hover:bg-red-800 hover:shadow-red-500/30 text-white py-2 px-3 rounded-lg transition-all duration-200 hover:shadow-md text-sm font-medium flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37a1.724 1.724 0 002.572-1.065c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543.94 3.31-.826 2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Control Panel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-100 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            PPE Violation Alerts
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map((alert, idx) => (
                <div key={idx} className="p-3 bg-red-900/50 rounded-lg flex items-start border-l-4 border-red-500">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-100">{alert}</p>
                    <p className="text-xs text-red-200 opacity-75">{new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-gray-300/50 rounded-lg text-center text-gray-700 text-sm">
                No PPE violations detected. All workers are compliant.
              </div>
            )}
          </div>
        </div>

        {/* PPE Detection Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-bold text-black mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            PPE Detection Information
          </h3>
          <div className="p-4 bg-red-500/30 border border-red-700 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Personal Protective Equipment Detection
            </h4>
            <p className="text-xs text-gray-800 mb-3">
              The system detects workers who are not wearing required safety equipment in real-time:
            </p>
            <ul className="text-xs text-black space-y-2">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-1 mr-2"></span>
                <span><strong>Helmet Detection:</strong> Identifies workers without safety helmets (marked in red)</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-1 mr-2"></span>
                <span><strong>Safety Vest Detection:</strong> Identifies workers without high-visibility vests (marked in red)</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-1 mr-2"></span>
                <span><strong>Mask Detection:</strong> Identifies workers without face masks in required areas (marked in red)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-xs text-gray-400">Total Cameras</p>
            <p className="text-xl font-bold text-black">{cameras.length}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-xs text-gray-400">Active Alerts</p>
            <p className="text-xl font-bold text-red-400">{alerts.length}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-xs text-gray-400">Violations Today</p>
            <p className="text-xl font-bold text-yellow-400">{violations.length}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-xs text-gray-400">System Status</p>
            <p className="text-xl font-bold text-green-400 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Operational
            </p>
          </div>
        </div>
        
        {/* Footer Note */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>Last system update: {new Date().toLocaleString()} | Total violations today: {violations.length}</p>
        </div>
      </div>
    </div>
  );
};

export default WorkerTracking;