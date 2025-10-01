from flask import Flask, render_template, Response, jsonify, request
try:
    from flask_cors import CORS
    cors_available = True
except ImportError:
    cors_available = False
from ultralytics import YOLO
import cv2
import threading
import time
import os
import base64
import numpy as np
from flask import request, Response

app = Flask(__name__)

# Enable CORS if available
if cors_available:
    CORS(app)
    print("CORS enabled")
else:
    print("CORS not available - install flask-cors for cross-origin support")


camera_lock = threading.Lock()
camera = None
streaming = False


def get_model_path() -> str:
    """Find a YOLO weights file to load."""
    candidate_files = [
        "/Users/amanibobo/Coding/monofaug/backend/pokemodel.pt",
        "yolo11n.pt",
    ]
    for path in candidate_files:
        if os.path.isfile(path):
            return path
    return "yolo11n.pt"


_model = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        weights_path = get_model_path()
        _model = YOLO(weights_path)
    return _model


def open_camera(index: int = 0):
    global camera
    with camera_lock:
        if camera is None or not camera.isOpened():
            camera = cv2.VideoCapture(index)

            camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    return camera


def release_camera():
    global camera
    with camera_lock:
        if camera is not None:
            try:
                camera.release()
            except Exception:
                pass
            camera = None


def generate_frames(confidence: float = 0.4):
    global streaming
    model = get_model()
    cap = open_camera(0)
    if not cap or not cap.isOpened():
        # Yield a single empty frame notice to avoid hanging
        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + b"" + b"\r\n")
        return

    streaming = True
    try:
        while streaming:
            success, frame = cap.read()
            if not success:
                time.sleep(0.05)
                continue

            results = model.predict(source=frame, conf=confidence, verbose=False)

            plotted = results[0].plot()

            ret, buffer = cv2.imencode('.jpg', plotted)
            if not ret:
                continue
            frame_bytes = buffer.tobytes()

            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
    finally:
        streaming = False
        release_camera()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/predict_card', methods=['POST', 'GET', 'OPTIONS'])
def predict_card():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    # Handle GET request for testing
    if request.method == 'GET':
        return jsonify({
            "message": "predict_card endpoint is working! Use POST method with JSON body.",
            "example": {
                "use_camera_frame": True,
                "image": "base64_encoded_image_string"
            }
        })
    data = request.get_json()
    
    # Check if we should use the current camera frame
    if data.get('use_camera_frame'):
        # Use the current camera frame for prediction
        cap = open_camera(0)
        if not cap or not cap.isOpened():
            return jsonify({"detections": []})
        
        success, frame = cap.read()
        if not success:
            return jsonify({"detections": []})
    else:
        # Use the provided image
        image_b64 = data.get("image")
        if not image_b64:
            return jsonify({"detections": []})
        
        img_bytes = base64.b64decode(image_b64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = get_model().predict(source=frame, conf=0.5, verbose=False)
    detections = []
    for box in results[0].boxes:
        detections.append({
            "class": results[0].names[int(box.cls[0])],
            "confidence": float(box.conf[0]),
            "bbox": box.xyxy[0].tolist()
        })

    response = jsonify({"detections": detections})
    
    # Add CORS headers manually if flask-cors not available
    if not cors_available:
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

    
    return response



@app.route('/start', methods=['POST'])
def start_stream():
    global streaming
    if streaming:
        response = jsonify({"ok": True, "message": "Already streaming"})
    else:
        streaming = True
        response = jsonify({"ok": True})
    
    # Add CORS headers manually if flask-cors not available
    if not cors_available:
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    
    return response


@app.route('/stop', methods=['POST'])
def stop_stream():
    global streaming
    streaming = False
    release_camera()
    response = jsonify({"ok": True})
    
    # Add CORS headers manually if flask-cors not available
    if not cors_available:
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    
    return response


if __name__ == '__main__':
    # Ensure templates/static folders are correctly resolved when running directly
    app.run(host='0.0.0.0', port=5000, debug=True)


