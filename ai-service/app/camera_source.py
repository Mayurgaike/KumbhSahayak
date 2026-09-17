import cv2
import logging

logger = logging.getLogger(__name__)

class CameraSource:
    def __init__(self, source_url):
        """
        source_url: can be int (0 for webcam), or str (rtsp URL, or path to MP4)
        """
        self.source_url = source_url
        # If source_url is a digit string, cast to int for OpenCV webcam mapping
        if isinstance(self.source_url, str) and self.source_url.isdigit():
            self.source_url = int(self.source_url)
            
        self.cap = None

    def connect(self):
        logger.info(f"Connecting to camera source: {self.source_url}")
        self.cap = cv2.VideoCapture(self.source_url)
        if not self.cap.isOpened():
            logger.error(f"Failed to open camera source: {self.source_url}")
            return False
        return True

    def get_frame(self):
        if self.cap is None or not self.cap.isOpened():
            return None
        
        ret, frame = self.cap.read()
        if not ret:
            # If it's a video file, it might just be at the end.
            # In a real system, you might loop it or alert. 
            # For RTSP, you might reconnect.
            return None
            
        return frame

    def release(self):
        if self.cap is not None:
            logger.info("Releasing cv2.VideoCapture handle...")
            self.cap.release()
            self.cap = None
