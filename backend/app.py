import logging
import threading
import queue
import json
import cv2
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from ultralytics import YOLO
from flask_cors import CORS
from flask_socketio import SocketIO, emit

logging.basicConfig(filename='web.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

frame_queue = queue.Queue(maxsize=10)
latest_detections = []
detection_event = threading.Event()
violation_history = []
SAFETY_THRESHOLD = 0.65  # Higher confidence threshold for safety equipment

def load_model():
    global model
    model = YOLO('C:/Users/deepa/Downloads/REALG_ESP (2)/REALG_ESP/project/backend/best_yolo11x.pt')  # Update with your model path
    _ = model(np.zeros((640, 480, 3), dtype=np.uint8))
    logging.info("Model loaded and warmed up")

threading.Thread(target=load_model, daemon=True).start()

@app.route('/status')
def status():
    return jsonify({"ready": "model" in globals()})

@app.route('/violations')
def get_violations():
    return jsonify({
        "total_violations": len(violation_history),
        "violations": violation_history[-50:]  # Return last 50 violations
    })

@app.route('/detect', methods=['POST'])
def detect():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        roi_info = None
        if 'roi' in request.form:
            roi_info = json.loads(request.form['roi'])
        
        mode = request.form.get('mode', 'ppe')
        detections = process_frame(frame, roi_info, mode)
        
        # Track violations based on mode
        current_violations = []
        for d in detections:
            if mode == 'ppe':
                # Only track PPE violations when no ROI is marked
                if not roi_info and d['class'] in ['NO-Hardhat', 'NO-Mask', 'NO-Safety Vest'] and d['confidence'] > SAFETY_THRESHOLD:
                    current_violations.append(d)
            elif mode == 'person' and roi_info:
                # Track PPE violations and persons in ROI
                if d['class'] in ['NO-Hardhat', 'NO-Mask', 'NO-Safety Vest', 'Person'] and d['confidence'] > SAFETY_THRESHOLD:
                    current_violations.append(d)
            elif mode == 'accident' and roi_info:
                # Track all detections in ROI
                if d['confidence'] > SAFETY_THRESHOLD:
                    current_violations.append(d)
        
        if current_violations:
            timestamp = datetime.now().isoformat()
            violation_data = {
                "timestamp": timestamp,
                "violations": current_violations,
                "image": cv2.imencode('.jpg', frame)[1].tobytes().hex(),  # Store frame hex
                "mode": mode
            }
            violation_history.append(violation_data)
            socketio.emit('new_violation', violation_data)
        
        return jsonify({
            'detections': detections,
            'violation_count': len(current_violations)
        })
        
    except Exception as e:
        logging.error(f"Error during object detection: {str(e)}")
        return jsonify({'error': str(e)}), 500

def process_frame(frame, roi_info=None, mode='ppe'):
    if 'model' not in globals():
        return []
    
    try:
        # Only apply ROI if we're not in PPE mode or if we're in PPE mode but no ROI is marked
        if roi_info and 'offset' in roi_info and mode != 'ppe':
            x = int(roi_info['offset']['x'])
            y = int(roi_info['offset']['y'])
            width = int(roi_info['width'])
            height = int(roi_info['height'])
            h, w = frame.shape[:2]
            
            x = max(0, min(x, w-1))
            y = max(0, min(y, h-1))
            width = max(1, min(width, w-x))
            height = max(1, min(height, h-y))
            frame = frame[y:y+height, x:x+width]
            
        results = model(frame)
        detections = []
        
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = box.conf[0].item()
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                
                # Higher confidence threshold for Person detection
                min_conf = SAFETY_THRESHOLD if class_name == 'Person' else 0.5
                
                if conf > min_conf:
                    detections.append({
                        'class': class_name,
                        'confidence': round(conf, 2),
                        'bbox': [x1, y1, x2, y2],
                        'zone': f"Zone {roi_info['zone']}" if roi_info and 'zone' in roi_info else None
                    })
        
        return detections
        
    except Exception as e:
        logging.error(f"Cropping or detection error: {str(e)}")
        return []

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)