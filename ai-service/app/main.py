import os
import time
import signal
import sys
import logging
import socketio
from dotenv import load_dotenv

# Load config from .env
load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s info: %(message)s')
logger = logging.getLogger(__name__)

from camera_source import CameraSource
from crowd_detection import CrowdDetector
from face_matcher import FaceMatcher

NODE_BACKEND_URL = os.environ.get('NODE_BACKEND_URL', 'http://localhost:5000')
ZONE_ID = os.environ.get('ZONE_ID', 'dummy-zone-id')
CAMERA_SOURCE_URL = os.environ.get('CAMERA_SOURCE', '0')
SAMPLING_INTERVAL = float(os.environ.get('SAMPLING_INTERVAL_SECONDS', 2.0))

sio = socketio.Client(reconnection=True, reconnection_attempts=0, reconnection_delay=1, reconnection_delay_max=5)

camera = None
is_running = True
face_matcher = FaceMatcher()

@sio.event
def connect():
    logger.info("Connected to Node.js backend Socket.IO server")
    sio.emit('join:ai-service')

@sio.on('start_matching')
def on_start_matching(data):
    case_id = data.get('caseId')
    ref_image = data.get('referenceImage')
    if case_id and ref_image:
        logger.info(f"Received start_matching for case {case_id}")
        face_matcher.load_case(case_id, ref_image)

@sio.on('stop_matching')
def on_stop_matching(data):
    case_id = data.get('caseId')
    if case_id:
        logger.info(f"Received stop_matching for case {case_id}")
        face_matcher.unload_case(case_id)

@sio.event
def disconnect():
    logger.info("Disconnected from Node.js backend")

def graceful_shutdown(signum, frame):
    global is_running
    logger.info("Received shutdown signal. Commencing resource cleanup...")
    is_running = False
    if camera:
        camera.release()
    if sio.connected:
        sio.disconnect()
    sys.exit(0)

def main():
    global camera
    
    # Catch SIGINT and SIGTERM for clean shutdown
    signal.signal(signal.SIGINT, graceful_shutdown)
    signal.signal(signal.SIGTERM, graceful_shutdown)
    
    # Connect to Node.js Server
    try:
        sio.connect(NODE_BACKEND_URL)
    except Exception as e:
        logger.error(f"Could not connect to backend: {e}")
        # We will proceed anyway; Socket.IO will auto-reconnect in the background.

    # Initialize AI Model
    detector = CrowdDetector()
    
    # Initialize Camera
    camera = CameraSource(CAMERA_SOURCE_URL)
    if not camera.connect():
        sys.exit(1)
        
    logger.info(f"Started crowd monitoring for Zone {ZONE_ID}. Sampling every {SAMPLING_INTERVAL}s.")
    
    while is_running:
        start_time = time.time()
        
        frame = camera.get_frame()
        if frame is not None:
            count, density = detector.detect_people(frame)
            logger.info(f"Zone {ZONE_ID} - Detected: {count} people -> Density: {density}")
            
            if sio.connected:
                payload = {
                    'zoneId': ZONE_ID,
                    'peopleCount': count,
                    'densityLevel': density,
                    # We send ts as ISO format string
                    'ts': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                }
                sio.emit('crowd:update', payload)
            
            # Run Face Matching (only costs CPU if active_cases is not empty)
            matches = face_matcher.detect_faces(frame)
            for case_id in matches:
                if sio.connected:
                    logger.info(f"MATCH FOUND for case {case_id} in Zone {ZONE_ID}!")
                    sio.emit('match_found', {
                        'caseId': case_id,
                        'zoneId': ZONE_ID,
                        'confidence': 95, # face_recognition boolean matches are high confidence
                        'ts': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                    })
        
        # Frame sampling logic: wait for the remaining time in our interval
        elapsed = time.time() - start_time
        sleep_time = max(0, SAMPLING_INTERVAL - elapsed)
        time.sleep(sleep_time)

if __name__ == "__main__":
    main()
