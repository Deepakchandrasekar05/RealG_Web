import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const maxVertices = 4;
const serverUrl = 'http://localhost:5000';
const DETECTION_INTERVAL = 1000;
const VIOLATION_HISTORY_LIMIT = 20;

type Detection = {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
};

type DetectionSummary = {
  persons: number;
  noHardhats: number;
  noMasks: number;
  noVests: number;
  hasMask: number;
  violations: number;
};

type ViolationHistory = {
  timestamp: string;
  violations: Detection[];
  image?: string;
};

const CCTVMonitoring: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastSentTime = useRef<number>(0);

  const [isPaused, setIsPaused] = useState(false);
  const [screenshot, setScreenshot] = useState<string>("");
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const [tempVertices, setTempVertices] = useState<[number, number][]>([]);
  const [redZoneDefined, setRedZoneDefined] = useState(false);

  const [detections, setDetections] = useState<Detection[]>([]);
  const [detectionSummary, setDetectionSummary] = useState<DetectionSummary>({
    persons: 0,
    noHardhats: 0,
    noMasks: 0,
    noVests: 0,
    hasMask: 0,
    violations: 0
  });
  const [violationHistory, setViolationHistory] = useState<ViolationHistory[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [personAlert, setPersonAlert] = useState<{ count: number, visible: boolean }>({ count: 0, visible: false });
  const [violationAlert, setViolationAlert] = useState<{ count: number, visible: boolean }>({ count: 0, visible: false });
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getDevices = async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        // Prefer external cameras by selecting the last device
        setSelectedDeviceId(videoDevices[videoDevices.length - 1].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  };

  const drawRedZone = (
    ctx: CanvasRenderingContext2D,
    vertices: [number, number][],
    tempVertices: [number, number][],
    isDefined: boolean
  ) => {
    ctx.save();
    if (isDefined && vertices.length === maxVertices) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.moveTo(vertices[0][0], vertices[0][1]);
      for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i][0], vertices[i][1]);
      ctx.closePath();
      ctx.fill();
      vertices.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff3333';
        ctx.fill();
      });
    } else if (tempVertices.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2;
      ctx.moveTo(tempVertices[0][0], tempVertices[0][1]);
      for (let i = 1; i < tempVertices.length; i++) ctx.lineTo(tempVertices[i][0], tempVertices[i][1]);
      ctx.stroke();
      tempVertices.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff3333';
        ctx.fill();
      });
    }
    ctx.restore();
  };

  const drawDetections = (ctx: CanvasRenderingContext2D, detections: Detection[]) => {
    ctx.save();
    detections.forEach(det => {
      const [x1, y1, x2, y2] = det.bbox;
      const width = x2 - x1;
      const height = y2 - y1;
      
      let color = '#00FF00';
      if (det.class === 'NO-Hardhat') color = '#FFA500';
      if (det.class === 'NO-Mask') color = '#FFFF00';
      if (det.class === 'NO-Safety Vest') color = '#ff3333';
      if (det.class === 'Mask') color = '#00FFFF';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, width, height);
      
      ctx.fillStyle = color;
      const text = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(x1, y1 - 20, textWidth + 10, 20);
      
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(text, x1 + 5, y1 - 5);
    });
    ctx.restore();
  };

  const cropToRedZone = (imageData: ImageData, vertices: [number, number][]) => {
    if (vertices.length !== 4) return null;
    let minX = Math.min(...vertices.map(v => v[0]));
    let minY = Math.min(...vertices.map(v => v[1]));
    let maxX = Math.max(...vertices.map(v => v[0]));
    let maxY = Math.max(...vertices.map(v => v[1]));
    minX = Math.max(0, Math.floor(minX));
    minY = Math.max(0, Math.floor(minY));
    maxX = Math.min(imageData.width, Math.ceil(maxX));
    maxY = Math.min(imageData.height, Math.ceil(maxY));
    const width = maxX - minX;
    const height = maxY - minY;
    if (width <= 0 || height <= 0) return null;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return null;
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = imageData.width;
    srcCanvas.height = imageData.height;
    const srcCtx = srcCanvas.getContext('2d');
    if (!srcCtx) return null;
    srcCtx.putImageData(imageData, 0, 0);
    offCtx.drawImage(srcCanvas, minX, minY, width, height, 0, 0, width, height);
    return { canvas: offCanvas, offset: { x: minX, y: minY }, width, height };
  };

  useEffect(() => {
    const summary = {
      persons: detections.filter(d => d.class === "Person").length,
      noHardhats: detections.filter(d => d.class === "NO-Hardhat").length,
      noMasks: detections.filter(d => d.class === "NO-Mask").length,
      noVests: detections.filter(d => d.class === "NO-Safety Vest").length,
      hasMask: detections.filter(d => d.class === "Mask").length,
      violations: detections.filter(d => 
        ["NO-Hardhat", "NO-Mask", "NO-Safety Vest"].includes(d.class)
      ).length
    };
    setDetectionSummary(summary);
  }, [detections]);

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const response = await fetch(`${serverUrl}/violations`);
        if (response.ok) {
          const data = await response.json();
          setViolationHistory(data.violations.slice(-VIOLATION_HISTORY_LIMIT));
        }
      } catch (err) {
        console.error("Failed to fetch violations:", err);
      }
    };
    
    fetchViolations();
    const interval = setInterval(fetchViolations, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!hasPermission || isPaused) return;

    const processFrame = async (timestamp: number) => {
      if (!canvasRef.current || !webcamRef.current?.video) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || !video || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }
      
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      drawRedZone(ctx, vertices, tempVertices, redZoneDefined);
      drawDetections(ctx, detections);

      const now = Date.now();
      if (now - lastSentTime.current >= DETECTION_INTERVAL) {
        lastSentTime.current = now;
        
        let sendCanvas = canvas;
        let roiInfo: any = undefined;
        
        if (redZoneDefined && vertices.length === 4) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const cropped = cropToRedZone(imageData, vertices);
          if (cropped) {
            sendCanvas = cropped.canvas;
            roiInfo = {
              originalSize: { width: canvas.width, height: canvas.height },
              roi: vertices,
              offset: cropped.offset,
              width: cropped.width,
              height: cropped.height
            };
          }
        }

        sendCanvas.toBlob(async (blob) => {
          if (!blob) return;
          
          const formData = new FormData();
          formData.append('image', blob, 'frame.jpg');
          if (roiInfo) formData.append('roi', JSON.stringify(roiInfo));
          
          try {
            const response = await fetch(`${serverUrl}/detect`, { 
              method: 'POST', 
              body: formData 
            });
            
            if (!response.ok) {
              setErrorMsg("Detection server error.");
              return;
            }
            
            const result = await response.json();
            if (result.error) {
              setErrorMsg(result.error);
              return;
            }
            
            setErrorMsg("");
            setDetections(result.detections || []);
            
            if (result.violation_count > 0) {
              setViolationAlert({ count: result.violation_count, visible: true });
              if (violationTimeoutRef.current) clearTimeout(violationTimeoutRef.current);
              violationTimeoutRef.current = setTimeout(() => {
                setViolationAlert({ count: 0, visible: false });
              }, 5000);
            }
          } catch (err) {
            setErrorMsg("Failed to fetch detection results.");
          }
        }, 'image/jpeg', 0.7);
      }

      animationRef.current = requestAnimationFrame(processFrame);
    };

    animationRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasPermission, isPaused, vertices, redZoneDefined, selectedDeviceId]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true);
        getDevices();
      })
      .catch(() => alert("Unable to access the camera. Please check your permissions."));
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (redZoneDefined && tempVertices.length === 0) {
      setRedZoneDefined(false);
      setVertices([]);
    }
    if (tempVertices.length < maxVertices) setTempVertices(prev => [...prev, [x, y]]);
    if (tempVertices.length === maxVertices - 1) {
      setVertices([...tempVertices, [x, y]]);
      setRedZoneDefined(true);
      setTempVertices([]);
    }
  };

  const togglePause = () => {
    if (!isPaused) {
      if (webcamRef.current) {
        const shot = webcamRef.current.getScreenshot();
        if (shot) setScreenshot(shot);
      }
      setIsPaused(true);
    } else {
      setIsPaused(false);
      setScreenshot("");
      setTempVertices([]);
    }
  };

  useEffect(() => {
    if (!redZoneDefined) {
      setPersonAlert({ count: 0, visible: false });
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      return;
    }
    const personCount = detections.filter(d => d.class === "Person").length;
    if (personCount > 0) {
      setPersonAlert({ count: personCount, visible: true });
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = setTimeout(() => {
        setPersonAlert({ count: 0, visible: false });
      }, 5000);
    } else {
      if (personAlert.visible && alertTimeoutRef.current == null) {
        alertTimeoutRef.current = setTimeout(() => {
          setPersonAlert({ count: 0, visible: false });
        }, 5000);
      }
    }
    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [detections, redZoneDefined]);

  const violationTrendData = {
    labels: violationHistory.map((_, i) => i + 1),
    datasets: [
      {
        label: 'Safety Violations',
        data: violationHistory.map(v => v.violations.length),
        borderColor: '#ff3333',
        backgroundColor: 'rgba(255, 51, 51, 0.2)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {personAlert.visible && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-8 py-4 rounded-lg shadow-lg font-bold text-lg text-center animate-fade-in">
          {`Person detected in red zone (${personAlert.count})`}
        </div>
      )}

      {violationAlert.visible && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-orange-500 text-white px-8 py-4 rounded-lg shadow-lg font-bold text-lg text-center animate-fade-in">
          {`Safety violation detected! (${violationAlert.count} issues)`}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-gray-700 mb-2">
            AI/ML Powered CCTV Monitoring and Alerts
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Real-time safety compliance monitoring
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="relative rounded-xl overflow-hidden border-4 border-gray-800 shadow-xl">
              {isPaused && screenshot ? (
                <img 
                  src={screenshot} 
                  alt="Paused frame"
                  className="w-full h-64 md:h-96 object-cover bg-black"
                />
              ) : (
                <>
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-64 md:h-96 object-cover bg-black"
                    videoConstraints={{ 
                      width: 720, 
                      height: 400, 
                      deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
                    }}
                  />
                  {devices.length > 1 && (
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      className="absolute bottom-2 left-2 px-3 py-2 bg-gray-700 text-white rounded-md z-10"
                    >
                      {devices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${devices.indexOf(device) + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                style={{ pointerEvents: isPaused ? 'auto' : 'none' }}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
              <div className="flex gap-3">
                <button
                  onClick={() => { setRedZoneDefined(false); setVertices([]); setTempVertices([]); }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Reset Zone
                </button>
                <button
                  onClick={togglePause}
                  className={`px-4 py-2 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all ${
                    isPaused 
                      ? 'bg-gradient-to-r from-green-600 to-green-400' 
                      : 'bg-gradient-to-r from-red-600 to-red-400'
                  }`}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              </div>
              <div className="text-gray-900 font-medium text-sm sm:text-base">
                {redZoneDefined
                  ? `Active monitoring (${detectionSummary.persons} person(s))`
                  : `Draw a Red Zone and Resume to begin monitoring`}
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 text-red-400 bg-gray-800 p-3 rounded-lg font-medium">
                {errorMsg}
              </div>
            )}
            
            {isPaused && (
              <div className="mt-4 bg-gray-800 p-4 rounded-lg text-gray-300 shadow-md">
                <p>Click 4 points to define a Red Zone. Detection will happen only inside this zone after resume.</p>
                <p>Current points: {tempVertices.length} / 4</p>
              </div>
            )}
          </div>
          
          <div className="w-full lg:w-80 xl:w-96 space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-200 mb-4">Safety Status</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                  <span className="text-gray-300">Persons in Zone:</span>
                  <span className={`font-semibold ${
                    detectionSummary.persons > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {detectionSummary.persons}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                  <span className="text-gray-300">Without Helmet:</span>
                  <span className={`font-semibold ${
                    detectionSummary.noHardhats > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {detectionSummary.noHardhats}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                  <span className="text-gray-300">Without Mask:</span>
                  <span className={`font-semibold ${
                    detectionSummary.noMasks > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {detectionSummary.noMasks}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2">
                  <span className="text-gray-300">Without Vest:</span>
                  <span className={`font-semibold ${
                    detectionSummary.noVests > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {detectionSummary.noVests}
                  </span>
                </div>
                
                <div className={`mt-4 p-3 rounded-lg text-center ${
                  detectionSummary.violations > 0 
                    ? 'bg-red-900/30 text-red-400' 
                    : 'bg-green-900/30 text-green-400'
                }`}>
                  <span className="font-bold">
                    {detectionSummary.violations > 0 
                      ? `${detectionSummary.violations} Safety Violations!` 
                      : 'All Safety Protocols Followed'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-200 mb-4">Violation Trend</h3>
              <div className="h-48">
                <Line 
                  data={violationTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: true }
                    },
                    scales: {
                      x: { 
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: 'rgba(255,255,255,0.7)' }
                      },
                      y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: 'rgba(255,255,255,0.7)' }
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-200 mb-4">Recent Violations</h3>
              {violationHistory.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {violationHistory.map((violation, i) => (
                    <div key={i} className="bg-gray-700/50 p-3 rounded-lg">
                      <div className="text-red-400 font-semibold">
                        {new Date(violation.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {violation.violations.map(v => v.class).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-4">
                  No recent safety violations detected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCTVMonitoring;