import os
import logging
from ultralytics import YOLO

logger = logging.getLogger(__name__)

class CrowdDetector:
    def __init__(self):
        # Using yolov8n (nano) for speed on CPU/edge devices
        logger.info("Loading YOLOv8n model...")
        self.model = YOLO('yolov8n.pt')
        
        # Load configurable thresholds from env
        self.med_thresh = int(os.environ.get('DENSITY_MEDIUM_THRESHOLD', 10))
        self.high_thresh = int(os.environ.get('DENSITY_HIGH_THRESHOLD', 25))
        
    def detect_people(self, frame):
        """
        Runs YOLOv8 on the frame and counts 'person' class instances (class id 0).
        Returns: (people_count, density_level)
        """
        # verbose=False to avoid spamming the console for every frame
        results = self.model(frame, classes=[0], verbose=False)
        
        # results[0].boxes contains the bounding boxes.
        people_count = len(results[0].boxes)
        
        if people_count >= self.high_thresh:
            density_level = 'high'
        elif people_count >= self.med_thresh:
            density_level = 'medium'
        else:
            density_level = 'low'
            
        return people_count, density_level
