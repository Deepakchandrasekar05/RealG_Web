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

const CCTVMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const cameras = [1, 2, 3, 4, 5];
  const [violations, setViolations] = useState<Violation[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [roi, setRoi] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const webcamRefs = useRef<(Webcam | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Connect to WebSocket for real-time alerts
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('new_violation', (violation: Violation) => {
      setViolations(prev => [...prev, violation]);
      
      const newAlerts = violation.violations
        .filter(v => roi) // Only show alerts when ROI is set
        .map(v => {
          if (v.class === 'NO-Hardhat') return `Worker without hardhat in restricted zone ${v.zone || 'unknown'}!`;
          if (v.class === 'NO-Safety Vest') return `Worker without safety vest in restricted zone ${v.zone || 'unknown'}!`;
          if (v.class === 'NO-Mask') return `Worker without mask in restricted zone ${v.zone || 'unknown'}!`;
          if (v.class === 'Person') return `Unauthorized person in restricted zone ${v.zone || 'unknown'}!`;
          return `Safety hazard detected in zone ${v.zone || 'unknown'}!`;
        });
      
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [roi]);

  const clearAllCanvases = () => {
    cameras.forEach(cameraId => {
      const canvas = canvasRefs.current[cameraId - 1];
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  };

  // Handle drawing ROI (Region of Interest)
  const handleMouseDown = (cameraId: number, e: React.MouseEvent) => {
    const webcam = webcamRefs.current[cameraId - 1];
    const canvas = canvasRefs.current[cameraId - 1];
    
    if (!webcam || !canvas) return;
    
    const video = webcam.video;
    if (!video) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPoint({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (cameraId: number, e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    
    const canvas = canvasRefs.current[cameraId - 1];
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;
    
    setRoi({
      x: startPoint.x,
      y: startPoint.y,
      width,
      height
    });
    
    drawROI(cameraId, startPoint.x, startPoint.y, width, height);
  };

  const handleMouseUp = (cameraId: number) => {
    setIsDrawing(false);
  };

  const drawROI = (cameraId: number, x: number, y: number, width: number, height: number) => {
    const canvas = canvasRefs.current[cameraId - 1];
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);
    
    ctx.fillStyle = 'red';
    ctx.font = '14px Arial';
    ctx.fillText('Restricted Zone', x + 5, y + 15);
  };

  // Check if detection is within ROI
  const isInROI = (bbox: [number, number, number, number], roi: {x: number, y: number, width: number, height: number}): boolean => {
    if (!roi) return false;
    const [x1, y1, x2, y2] = bbox;
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    
    return centerX >= roi.x && 
           centerX <= roi.x + roi.width && 
           centerY >= roi.y && 
           centerY <= roi.y + roi.height;
  };

  // Draw detections on canvas
  const drawDetections = (cameraId: number, detections: Detection[]) => {
    const canvas = canvasRefs.current[cameraId - 1];
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ROI if it exists
    if (roi) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);
      ctx.fillStyle = 'red';
      ctx.font = '14px Arial';
      ctx.fillText('Restricted Zone', roi.x + 5, roi.y + 15);
    }
    
    // Draw detections within ROI
    detections.forEach(detection => {
      const [x1, y1, x2, y2] = detection.bbox;
      const className = detection.class;
      const confidence = detection.confidence;
      
      if (!isInROI(detection.bbox, roi)) return;
      
      // Set colors based on detection type
      if (className.startsWith('NO-')) {
        ctx.strokeStyle = 'red';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      } else if (className === 'Person') {
        ctx.strokeStyle = 'yellow';
        ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      } else {
        ctx.strokeStyle = 'green';
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
      }
      
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(`${className} ${(confidence * 100).toFixed(0)}%`, x1 + 5, y1 - 5);
    });
  };

  // Simulate receiving detections
  useEffect(() => {
    const interval = setInterval(() => {
      cameras.forEach(cameraId => {
        const mockDetections: Detection[] = [];
        
        // Person detections
        mockDetections.push(
          { class: 'Person', confidence: 0.95, bbox: [300, 120, 350, 220], zone: `Zone ${cameraId}` },
          { class: 'Person', confidence: 0.91, bbox: [450, 150, 500, 250], zone: `Zone ${cameraId}` }
        );
        
        // PPE violations
        mockDetections.push(
          { class: 'NO-Hardhat', confidence: 0.92, bbox: [100, 100, 150, 200], zone: `Zone ${cameraId}` },
          { class: 'NO-Safety Vest', confidence: 0.85, bbox: [200, 150, 250, 250], zone: `Zone ${cameraId}` }
        );
        
        // Other detections
        mockDetections.push(
          { class: 'Equipment', confidence: 0.88, bbox: [150, 300, 200, 350], zone: `Zone ${cameraId}` },
          { class: 'Vehicle', confidence: 0.93, bbox: [250, 280, 320, 350], zone: `Zone ${cameraId}` }
        );
        
        drawDetections(cameraId, mockDetections);
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [roi]);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-gray-700 mb-2">
            AI/ML Powered CCTV Monitoring and Alerts
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Restricted area monitoring with hazard detection
          </p>
        </div>

        {/* Camera Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((cameraId) => (
            <div 
              key={cameraId} 
              className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-900/20 group"
            >
              {/* Camera Feed Container */}
              <div 
                className="relative aspect-video bg-black"
                onMouseDown={handleMouseDown.bind(null, cameraId)}
                onMouseMove={handleMouseMove.bind(null, cameraId)}
                onMouseUp={handleMouseUp.bind(null, cameraId)}
                style={{ cursor: 'crosshair' }}
              >
                <Webcam
                  ref={(el) => webcamRefs.current[cameraId - 1] = el}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }}
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={(el) => canvasRefs.current[cameraId - 1] = el}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  width={640}
                  height={480}
                />
                <div className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded-md flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                  LIVE
                </div>
                <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-2 py-1 rounded-md">
                  Zone Monitoring
                </div>
                <div className="absolute bottom-3 left-3 bg-gray-900/80 text-white text-xs px-2 py-1 rounded-md">
                  Zone {cameraId}
                </div>
                <div className="absolute bottom-3 right-3 bg-gray-900/80 text-white text-xs px-2 py-1 rounded-md">
                  {roi ? 'ROI Active' : 'Draw Restricted Zone'}
                </div>
              </div>

              {/* Camera Info */}
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-gray-800">Camera #{cameraId}</h3>
                  <span className="text-xs text-gray-500">Sector {String.fromCharCode(64 + cameraId)}</span>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate(`/history/${cameraId}`)}
                    className="flex-1 bg-transparent border border-gray-300 hover:border-red-500 text-gray-700 hover:text-red-600 py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-100 text-sm font-medium flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </button>
                  <button
                    onClick={() => navigate(`/camera/${cameraId}`)}
                    className="flex-1 bg-red-600 hover:bg-red-800 hover:shadow-md hover:shadow-red-800/30 text-white py-2 px-3 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center"
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

        {/* Alerts Panel */}
        <div className="mt-8 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Safety Alerts
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map((alert, idx) => (
                <div key={idx} className="p-3 bg-red-100 rounded-lg flex items-start border-l-4 border-red-500">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">{alert}</p>
                    <p className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-gray-100 rounded-lg text-center text-gray-500 text-sm">
                No active alerts. All zones are secure.
              </div>
            )}
          </div>
        </div>

        {/* Monitoring Info */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Zone Monitoring Information
          </h3>
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-700 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              How It Works
            </h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span><strong>Draw Restricted Zones:</strong> Click and drag on any camera feed to mark restricted areas</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span><strong>Person Detection:</strong> People in restricted zones are highlighted in yellow</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span><strong>Safety Violations:</strong> Workers without proper PPE are highlighted in red</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span><strong>Hazard Detection:</strong> Equipment and vehicles in restricted zones are highlighted in green</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span><strong>Real-time Alerts:</strong> Violations generate immediate notifications</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-xs text-gray-500">Total Cameras</p>
            <p className="text-xl font-bold text-gray-800">{cameras.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-xs text-gray-500">Active Alerts</p>
            <p className="text-xl font-bold text-red-500">{alerts.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-xs text-gray-500">Violations Today</p>
            <p className="text-xl font-bold text-yellow-500">{violations.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-xs text-gray-500">System Status</p>
            <p className="text-xl font-bold text-green-500 flex items-center">
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

export default CCTVMonitoring;